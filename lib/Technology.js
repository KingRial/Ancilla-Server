"use strict";
/*
 *	Copyright (C) 2014  Riccardo Re <kingrichard1980.gmail.com>
 *	This file is part of "Ancilla Libary".
 *
 *  "Ancilla Libary" is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  "Ancilla Libary" is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with "Ancilla Libary".  If not, see <http://www.gnu.org/licenses/>.
*/
let EventEmitter = require( 'events' ).EventEmitter;
let Path =  require('path');

let Fs = require('fs-extra');
let Bluebird = require('bluebird');
let _ = require('lodash');

//let Logger = require('./Logger.js');
let AncillaEvent = require('./Event.js');
let Tools = require('./Tools.js');
let Constant = require('./Constants.js');

/**
 * A generic class to describe a generic Technology behaviour.
 *
 * @class	Technology
 * @public
 *
 * @param	{Object[]}		oTechnologyOptions		A javascript object of options used to configure the technology behaviour
 *
 * @return	{Void}
 *
 * @example
 *		new Technology( { sID: 'tech-1', sType: 'tech', oEndpoints: {"testTCP":{"type":"client.net","host":"192.168.0.110","port":10001}} );
 *		new Technology( { sID: 'tech-2', sType: 'tech', bUseDB: false, oEndpoints: {"core":{"type":"server.net","host":"localhost","port":10001}} } );
 *		new Technology( { sID: 'tech-3', sType: 'tech', bUseDB: true, oEndpoints: {"testSerial":{"type":"serial","port":"/dev/ttyS0","baudrate":9600,"databits":8,"stopbits":1,"parity":"none","buffersize":255}}} );
 *		new Technology( { sID: 'tech-4', sType: 'tech', bUseDB: true }, oEndpoints: {"testServerWebsokcet":{"type":"server.ws","port":10003}} );
 *		new Technology( { sID: 'tech-5', sType: 'tech', bUseDB: true }, oEndpoints: {"testServerWebsokcetSecure":{"type":"server.wss","port":10003}} );
 *		new Technology( { sID: 'tech-6', sType: 'tech' }, oEndpoints: {"testTCP":{"type":"client.ws","host":"192.168.0.110","port":10004}} );
 *		new Technology( { sID: 'tech-7', sType: 'tech' }, oEndpoints: {"testTCP":{"type":"client.wss","host":"192.168.0.110","port":10005}} );
 */
class Technology extends EventEmitter {
	constructor( oTechnologyOptions ){
		// Calling super constructor
		super();
		this.__oOptionsDefault = {};
		this.__oOptions = {};
		this.__oAncillaEvents = {};
		this.__oDefferedAncillaEvents = {};
		this.__oEndpoints = {};
		this.__oStatus = {};
		// Default Technology Options
		let _oDefaultOptions = {
			// Technology
			sID: 'tech-' + Math.random(),
			sType: 'unknown',
			bUseSwap: true,
			iVersion : 0,
			// Paths
			sCwd: process.cwd(),
			//sAssetsPath: null,
			// DB
			bUseDB: false,
			oDB: null, // TODO: find a better signature to use different DB class handlers
			sDBModelsDir: null,
			sDBMigrationsDir: null,
			sDBHost: null,
			sDBUsername: null,
			sDBPassword: null,
			sDBDialect: 'sqlite',
			sDBPath: './', // DB persistent path should be where the script technology is located ( if using relative path it's relative to sCwd )
			//sDBPathTmp: ( Tools.isOSWin() ? './' : '/tmp/' ), // TODO: DB volatile path should be located on TMP under UNIX or ? under Windows ( if using relative path it's relative to sCwd )
			sDBPathTmp: './',
			// LOG
			sDebugLevel: null,
			bDebugRemote: false,
			iDebugRemotePort: null,
			bSilentLog: false,
			bUseLog: true,
			iLogMaxSize: 500000, // kB
			iLogMaxFiles: 3,
			//sLogPath: ( Tools.isOSWin() ? './' : '/var/log' ),
			sLogPath: './', // Log persistent path should be where the script technology is located ( if using relative path it's relative to sCwd )
			//sLogPathTmp: ( Tools.isOSWin() ? './' : '/tmp/' ), // TODO: Log volatile path should be located on TMP under UNIX or ? under Windows ( if using relative path it's relative to sCwd )
			sLogPathTmp: './',
			oEndpoints: {},
			aEvents: [ 'data', 'datagram', 'ancilla', 'error' ]
		};
		this.config( _oDefaultOptions );
		// Config options
		this.config( oTechnologyOptions );
	}

	config( oOptions ){
		if( _.isObject( oOptions ) ){
			this.__oOptions = _.mergeWith( this.__oOptions, oOptions,
				function( objValue, srcValue ){
					if (_.isArray(objValue)) {
						return objValue.concat(srcValue);
					}
				}
			);
			this.__oOptions = this.__fillConfig( oOptions );
		}
	}

	__fillConfig( oNewOptions ){
		let _oOptions = this.getConfig();
		if( oNewOptions.sType || oNewOptions.sID ){
			let _sTechnologyTag = _oOptions.sType + '.' + _oOptions.sID;
			_oOptions = _.extend( _oOptions, {
				sTechnologyTag: _sTechnologyTag,
				sDBName:  _sTechnologyTag + '.sqlite',
				sLogName: _sTechnologyTag + '.log'
			} );
		}
		if( oNewOptions.sAssetsPath ){
			_oOptions.sAssetsPath = ( Path.isAbsolute( oNewOptions.sAssetsPath ) ? oNewOptions.sAssetsPath : Path.join( ( oNewOptions.sCwd ? oNewOptions.sCwd : _oOptions.sCwd ), oNewOptions.sAssetsPath ) );
		}
		return _oOptions;
	}

	getConfig(){
		return this.__oOptions;
	}

	/**
	 * Method called to run the technology
	 *
	 * @method    run
	 * @public
	 *
	 * @param	{Object[]}		oTechnologyOptions		A javascript object of options used to configure the technology behaviour ( if using the same options will overwrite options set during the creation of the class )
	 * @param	{Object}		[oCurrentModule]	The current nodejs caller module ( default: the current module used by the required file )
	 *
	 * @example
	 *   Technology.run();
	 *   Technology.run( { sID: 'tech-1', sType: 'tech', oEndpoints: {"core":{"type":"server.net","host":"localhost","port":10001}} } );
	 */
	run( oTechnologyOptions, oCurrentModule ){
		let _Technology = this;
		// Selecting current module if none specified
		if( !oCurrentModule ){
			oCurrentModule = module;
		}
		this.config({
			sCwd: Path.dirname( oCurrentModule.filename ),
			sAssetsPath: Path.dirname( oCurrentModule.filename ),
		});
		// Configuring technology with custom options ( Command line options will overwrite all other technology options )
		// Reworking assets Path if needed
		this.config( _.merge( oTechnologyOptions, this.__argsToOptions() ) );
		// Process working directory
		if( this.getConfig().sCwd !== process.cwd() ){
			process.chdir( this.getConfig().sCwd );
		}
		// Init Loggers and extending current class with logger methods
		this.__oLogger = ( this.getConfig().oLogger ? this.getConfig().oLogger : require( './Logger.singleton' ) );
		this.__oLogger.extend( this.getConfig().sTechnologyTag, this, {
			sHeader: this.getID(),
			bUseRandomStyle4Header: true,
      sLevel: ( this.getConfig().sDebugLevel ? this.getConfig().sDebugLevel : 'info' ),
			bSilent: this.getConfig().bSilentLog,
			bRemote: this.getConfig().bDebugRemote,
			iRemotePort: this.getConfig().iDebugRemotePort,
			sID: this.getConfig().sTechnologyTag,
      sLogPath: ( this.getConfig().bUseLog ? this.getConfig().sLogPathTmp + this.getConfig().sLogName : null),
      iLogMaxSize: 500000, // kB
			iLogMaxFiles: 3
		} );
		// Setting process events
		process.on('SIGINT', function() {
			_Technology.info('Event SIGINT...' );
			_Technology.onDestroy()
				.then(function(){
					process.exit();
				})
				.catch( function( oError ){
					_Technology.error( 'Unable to correctly complete onDestroy procedure: ', oError );
					process.exit();
				})
			;
		});
		process.on('SIGTERM', function() {
			_Technology.info('Event SIGTERM...' );
			process.exit();
		});
		process.on('SIGHUP', function() {
			_Technology.info(' Event SIGHUP...' );
			process.exit();
		});
		process.on('exit', function( iCode ){
			//TODO: killing process children before exiting current process
			_Technology.info('Closing ( exit code: %s )...', iCode );
		});
		process.on('close', function( iCode ) {
			_Technology.info( 'exited with code "%s" ', process.argv[2], iCode  );
		});
		process.on('uncaughtException', function( oError ){
			_Technology.error('Uncaught Exception: %s...', oError );
		});
		// Adding memwatch if using a log level 'debug' or 'silly'
		/*
		if( oTechnologyOptions.bDebug ){
			_Technology.debug( 'Starting memory watchdog...' );
			let memwatch = require('memwatch-next');
			memwatch.on('leak', function( info ) {
				_Technology.error( 'Memory Leak: ', info );
			});
			memwatch.on('stats', function( stats ) {
				_Technology.debug( 'Memory Stats: ', stats );
			});
		}
		*/
		// Logging CWD
		this.info( 'set working directory to: "%s"...', this.getConfig().sCwd );
		this.info( 'set assets directory to: "%s"...', this.getConfig().sAssetsPath );
		// Starting technology
		this.info( 'Starting technology [ version: "%s" ] ...', this.getConfig().iVersion );
		this.debug( 'Starting technology with following options:\n\t', this.getConfig() );
		return this.ready()
			.then( function(){
				_Technology.onReady();
			})
			.catch( function( oError ){
				_Technology.error( '[ Error: %s ] Unable to complete operations to set technology status to "ready".', oError );
			})
		;
	}

	/**
	 * Method called to initialize Ancilla events
	 *
	 * @method    __initAncillaEvents
	 * @private
	 *
	 * @return	{Object}	it returns a promise object succesfull when no errors has been found
	 *
	 * @example
	 *   Technology.__initAncillaEvents();
	 */
	__initAncillaEvents(){
		let _Technology = this;
		// Loading Ancilla events
		let _aPromisesToLoad = [];
		let _sAssetsPath = _Technology.getConfig().sAssetsPath;
		let _sEventsPath = Path.join( _sAssetsPath, 'Events' );
		_Technology.debug( 'Looking for Ancilla events on "%s"...', _sEventsPath );
		if( Fs.existsSync( _sEventsPath ) ){
			_Technology.info( 'Loading Ancilla events...' );
			Fs
				.readdirSync( _sEventsPath )
				.filter( function( sFile ){
					return ( sFile.indexOf( '.' ) !== 0);
				})
				.forEach( function( sFile ){
					_aPromisesToLoad.push( _Technology.__loadAncillaEvent( Path.join( _sEventsPath, sFile ) ) );
				})
			;
		} else {
			_Technology.debug( 'No Ancilla events to load...' );
			_aPromisesToLoad.push( Bluebird.resolve() );
		}
		return Bluebird.all( _aPromisesToLoad );
	}

	/**
	 * Method called to register events to the current technology
	 *
	 * @method    __registerEvents
	 * @private
	 *
	 * @return	{Object}	it returns a promise object succesfull when no errors has been found
	 *
	 * @example
	 *   Technology.__registerEvents();
	 */
	__registerEvents(){
		let _Technology = this;
		//let _aEvents = [ 'data', 'datagram', 'ancilla', 'error' ];
		let _aEvents = this.getConfig().aEvents || [];
		_aEvents.forEach( function( sEvent ){
			_Technology.debug( 'listening on event "%s"...', sEvent );
			_Technology.on( sEvent, ( ...Args ) => _Technology.__onEvent( sEvent, ...Args ) );
		});
		return Bluebird.resolve();
	}

	__onEvent( sEvent ){
		let _aEventTokens = sEvent.split( ' ' );
		_aEventTokens.unshift( 'on' );
		_aEventTokens.forEach(function( sEventToken, iIndex ){
			if( iIndex!== 0 ){
				_aEventTokens[ iIndex ] = sEventToken.charAt(0).toUpperCase() + sEventToken.slice(1);
			}
		});
		let _sHandlerEventFunction = _aEventTokens.join('');
		// Getting all arguments except for the first
		let _aArgs = Array.prototype.slice.call( arguments, 1 );
		//Transforming Args if needed
		switch( sEvent ){
			case 'ancilla':
				let _oBuffer = _aArgs[ 0 ];
				let _aAncillaEvents = this.__parseAncillaEvents( _oBuffer );
				// Handling Ancilla events
				for( let _oAncillaEvent of _aAncillaEvents ){
					let _aCurrentArgs = _aArgs.slice( 0 );
					_aCurrentArgs[ 0 ] = _oAncillaEvent;
					// If the event doesn't declare a target, than if must be triggered for the current technology; otherwise we must check if we are the correct target for the event
					if( _oAncillaEvent.isTarget( this.getID() ) ){
						// Clearing deferred ancilla request if it's an answer for a stored request
						this.__clearDeferredAncillaRequest( _oAncillaEvent, true );
						if( this[ _sHandlerEventFunction ] ){
							this.debug( 'calling Ancilla Event handler ( "%s" ) with "%s" parameters...', _sHandlerEventFunction, _aCurrentArgs.length );
							this[ _sHandlerEventFunction ].apply( this, _aCurrentArgs );
						} else {
							this.error( 'received event "%s" but missing method "%s" to handle event...', sEvent, _sHandlerEventFunction );
						}
					} else {
						this.debug( 'Ignoring ancilla event: ', _oAncillaEvent );
					}
				}
			break;
			default:
				// Calling event handler
				// this.debug( 'calling event "%s" handler ( "%s" ) with "%s" parameters...', sEvent, _sHandlerEventFunction, _aArgs.length );
				if( this[ _sHandlerEventFunction ] ){
					this[ _sHandlerEventFunction ].apply( this, _aArgs );
				} else {
					this.debug( 'received event "%s" but missing method "%s" to handle event...', sEvent, _sHandlerEventFunction );
				}
			break;
		}
	}

	/**
	 * Method called to get the Sequelize DB's handler
	 *
	 * @method    getDB
	 * @public
	 *
	 * @return    {Object}		It returns the Sequelize DB's handler
	 *
	 * @example
	 *   Technology.getDB();
	 */
	getDB(){
		return this.__oDB;
	}

	/**
	 * Method called to get the Sequelize DB's table model handler
	 *
	 * @method    getDBModel
	 * @public
	 *
	 * @return    {Object}		It returns the Sequelize DB's table model handler
	 *
	 * @example
	 *   Technology.getDBModel( 'OBJECT' );
	 */
	getDBModel( sTable ){
		return this.getDB().getModel( sTable );
	}

	DBTransaction( fFunction ){
		return this.getDB().transaction( fFunction );
	}

	/**
	 * Method called to get the DB's relative path to the persistent memory
	 *
	 * @method    __DBgetRelativePersistantPath
	 * @private
	 *
	 * @return    {String}	sPath			It returns the relative path for the current DB
	 *
	 * @example
	 *   Technology.__DBgetRelativePersistantPath();
	 */
	__DBgetRelativePersistantPath(){
		return Path.join( this.getConfig().sDBPath, this.getConfig().sDBName );
	}

	/**
	 * Method called to get the DB's relative path to the volatile memory
	 *
	 * @method    __DBgetRelativePath
	 * @private
	 *
	 * @return    {String}	sPath			It returns the relative path for the current DB
	 *
	 * @example
	 *   Technology.__DBgetRelativePath();
	 */
	__DBgetRelativePath (){
		return Path.join( this.getConfig().sDBPathTmp, this.getConfig().sDBName );
	}

	/**
	 * Method used to swap the DB file from a source path to a destination path
	 *
	 * @method    __swapDB
	 * @private
	 *
	 * @param     {String}			sSourcePath							DB source Path
	 * @param     {String}			sDestinationPath					DB destination Path
	 *
	 * @return    {Object}			It returns a promise successfull when no problem has been met
	 *
	 * @example
	 *   Technology.__swapDB( sSourcePath, sDestinationPath );
	 */
	__swapDB( sSourcePath, sDestinationPath ){
		let _oTechnology = this;
	// TODO: setting timers to handle swap DB http://nodejs.org/api/timers.html
		return new Bluebird( function( fResolve, fReject ){
			if( sSourcePath !== sDestinationPath ){
				Fs.exists( sSourcePath, function( bExists ){
					if( bExists ){
						Fs.copy( sSourcePath, sDestinationPath, function( oError ){
							if( oError ){
								_oTechnology.error( 'Error "%s": Swapped DB failed from "%s" to "%s"...', oError, sSourcePath, sDestinationPath );
								fReject( oError );
							} else {
								_oTechnology.info( 'Swapped DB from "%s" to "%s"...', sSourcePath, sDestinationPath );
								fResolve();
							}
						});
					} else {
						_oTechnology.info( 'SwapDB operation unable to complete: missing source: "%s"...', sSourcePath );
						fResolve();
					}
				});
			} else {
				_oTechnology.info( 'Swap DB operation not necessary. Destination and Source are the same path: "%s"...', sSourcePath );
				fResolve();
			}
		});
	}

	/**
	 * Method called to initialize DB
	 *
	 * @method    __initDB
	 * @private
	 *
	 * @return	{Object}	it returns a promise object succesfull when no errors has been found
	 *
	 * @example
	 *   Technology.__initDB();
	 */
	__initDB(){
		let _Technology = this;
		return new Bluebird( function( fResolve, fReject ){
			if( _Technology.__oOptions.bUseDB ){
				_Technology.__swapDB( _Technology.__DBgetRelativePersistantPath(), _Technology.__DBgetRelativePath() )
				.then( function(){
					let _oDBOptions ={
						sDB: _Technology.__oOptions.sTechnologyTag,
						sHost: _Technology.__oOptions.sDBHost,
						sUsername: _Technology.__oOptions.sDBUsername,
						sPassword: _Technology.__oOptions.sDBPassword,
						sDialect: _Technology.__oOptions.sDBDialect,
						sStoragePath: _Technology.__DBgetRelativePath(),
						sModelsDir: Path.join( _Technology.__oOptions.sAssetsPath, ( _Technology.__oOptions.sDBModelsDir ? _Technology.__oOptions.sDBModelsDir : 'DB/models/' ) ),
						sMigrationsDir: Path.join( _Technology.__oOptions.sAssetsPath, ( _Technology.__oOptions.sDBMigrationsDir ? _Technology.__oOptions.sDBMigrationsDir : '/DB/migrations/' ) ),
					};
					_Technology.info( 'Using DB "%s" with the following options:\n\t ', _oDBOptions.sDB, _oDBOptions );
					let DB = ( _Technology.__oOptions.oDB ? _Technology.__oOptions.oDB : require( './DB.js' ) );
					_Technology.__oDB = new DB( _oDBOptions );
					_Technology.__oDB.open()
					  .then( function( aExecutedMigrations ){
							let _aExecutedMigrationsFiles = [];
							for( let oExecutedMigration of aExecutedMigrations ){
								_aExecutedMigrationsFiles.push( oExecutedMigration.file );
							}
							_Technology.info( ( _aExecutedMigrationsFiles.length > 0 ) ? 'completed following migrations for DB "%s":' : 'no migrations required for DB "%s"', _Technology.__oOptions.sTechnologyTag, _aExecutedMigrationsFiles );
							fResolve();
					  })
						.catch( function( oError ){
							_Technology.error( '[ Error: %j ] Unable to open DB', oError );
							fReject( oError );
						})
					;
				});
			} else {
				_Technology.debug( 'DB not used' );
				fResolve();
			}
		});
	}

	__initEndpoints( oEndpoints ){
		let _Technology = this;
		this.debug( 'Initializing Endpoints:', oEndpoints );
		return new Bluebird( function( fResolve, fReject ){
			if( oEndpoints ){
				let _aPromises = [];
				for( let _sEndpoint in oEndpoints ){
					if( oEndpoints.hasOwnProperty( _sEndpoint ) ){
						if( _Technology.__oEndpoints.hasOwnProperty( _sEndpoint ) ){
							fReject( Constant._ERROR_TECHNOLOGY_ENDPOINT_ALREADY_PRESENT );
						} else {
							let _oEndpointData = oEndpoints[ _sEndpoint ];
							_oEndpointData = _.extend({
								sID: _sEndpoint,
								sHeader: _Technology.getID()
							}, _oEndpointData );
							// Loading library and istantiating Endpoint
							let _Endpoint = null;
							if( _oEndpointData.module ){
								_Endpoint = _oEndpointData.module;
							} else {
								try {
									_Endpoint = require( './Endpoint.' + _oEndpointData.sType + '.js' );
								} catch( e ) {
									_Technology.error( 'Unable to load Endpoint\'s module library for "%s (%s)"\nPlease use a standard Endpoint\'s module library or use the Endpoint\'s paramater "module" to use a custom module', _oEndpointData.sID, _oEndpointData.sType );
									fReject( e );
								}
							}
							let _oEndpoint = new _Endpoint( _oEndpointData );
							_Technology.__initEndpoint( _oEndpoint, _oEndpointData );
							_aPromises.push( _oEndpoint.ready() );
						}
					}
				}
				Bluebird.all( _aPromises )
					.then( function(){
						fResolve();
					})
					.catch( function( oError ){
						fReject( oError );
					})
				;
			} else {
				_Technology.info('No endpoint configured.');
				fResolve();
			}
		} );
	}

	__initEndpoint( oEndpoint ){
		let _Technology = this;
		oEndpoint.on('error', function( oError ){
			_Technology.emit( 'error', oError, oEndpoint );
		});
		oEndpoint.on('data', function( oBuffer, sSocketID ) {
			if( oEndpoint.isAncilla() ){
				_Technology.emit( 'ancilla', oBuffer, oEndpoint, sSocketID );
			} else {
				_Technology.emit( 'data', oBuffer, oEndpoint, sSocketID );
			}
		});
		oEndpoint.on('datagram', function( oDatagram, oBuffer, oParsedBuffer, sSocketID ) {
			_Technology.emit( 'datagram', oDatagram, oParsedBuffer, oBuffer, oEndpoint, sSocketID );
		});
		this.__oEndpoints[ oEndpoint.getID() ] = oEndpoint;
	}

	/**
	 * Method used to get the current technology ID
	 *
	 * @method    getID
	 * @public
	 *
	 * @return    {String}			It returns the unique technology's string ID
	 *
	 * @example
	 *   Technology.getID();
	 */
	getID(){
		return this.getConfig().sID;
	}

	/**
	 * Method used to get the current technology ID
	 *
	 * @method    getType
	 * @public
	 *
	 * @return    {String}			It returns the technology's type
	 *
	 * @example
	 *   Technology.getType();
	 */
	getType(){
		return this.getConfig().sType;
	}

	/**
	 * Method called to complete ready operations over the technology and let the "ready" event to be emitted
	 *
	 * @method    ready
	 * @public
	 *
	 * @return    {Object}			It returns a successfully promise when the technology is ready and the "ready" event must be emitted
	 *
	 * @example
	 *   Technology.ready();
	 */
	ready(){
		let _Technology = this;
		return this.__initAncillaEvents() // Init Ancilla Events
			.then( function(){
				return _Technology.__registerEvents();
			} )
			.catch( function( oError ){
				_Technology.error( '[ Error: %s ] Unable to correctly load Ancilla events.', oError );
			})
			.then( function(){ // Init DB
				return _Technology.__initDB();
			} )
			.catch( function( oError ){
				_Technology.error( '[ Error: %s ] Unable to correctly init DB.', oError );
			})
			.then ( function(){ // Init Endpoints
				return _Technology.__initEndpoints( _Technology.getConfig().oEndpoints );
			})
			.catch( function( oError ){
				_Technology.error( '[ Error: %s ] Unable to correctly initialize Endpoints.', oError );
			})
		;
	}

	/**
	 * Method called to understand if the technology is ready to process
	 *
	 * @method    isReady
	 * @public
	 *
	 * @example
	 *   Technology.isReady();
	 */
	isReady(){
		return this.__oStatus.bIsReady;
	}

	/**
	 * Method called when the technology is ready to process
	 *
	 * @method    onReady
	 * @public
	 *
	 * @example
	 *   Technology.onReady();
	 */
	onReady(){
		this.info( 'Technology is ready...' );
		this.__oStatus.bIsReady = true;
	}

	/**
	 * Method called when the technology is ready to process
	 *
	 * @method    onError
	 * @public
	 *
	 * @example
	 *   Technology.onError();
	 */
	onError( oError ){
		this.error( '[ Error: "%s" ] Technology fired an error event...', oError );
	}

	/**
	 * Method used to get all the endpoints added to the current technology; if ID is used as an argument only the specific endpoint pointed by the ID will be returned
	 *
	 * @method    getEndpoints
	 * @public
	 *
	 * @param     {String}			[sID]								If used, it will return only the endpoint with such ID
	 *
	 * @return    {Object[]/Object}	oEndpoints/oEndpoint			It returns a list of endpoints or the endpoint with the passed ID
	 *
	 * @example
	 *   Technology.getEndpoints();
	 *   Technology.getEndpoints( 'Core' );
	 */
	getEndpoints( sID ){
		return ( sID ? this.__oEndpoints[ sID ] : this.__oEndpoints );
	}

	/**
	 * Method used to get the specific endpoint pointed by the ID
	 *
	 * @method    getEndpoints
	 * @public
	 *
	 * @param     {String}			sID								It will return only the endpoint with such ID
	 *
	 * @return    {Object}	oEndpoint			It returns the endpoint with the passed ID
	 *
	 * @example
	 *   Technology.getEndpoint( 'Core' );
	 */
	getEndpoint( sID ){
		return this.__oEndpoints[ sID ];
	}

	/**
	 * Method used to get the endpoint to the Ancilla Core
	 *
	 * @method    getCoreEndpoint
	 * @public
	 *
	 * @return    {Object}	oEndpoint			It returns the endpoint to the Ancilla Core
	 *
	 * @example
	 *   Technology.getCoreEndpoint();
	 */
	getCoreEndpoint(){
		return this.getEndpoint( 'Core' );
	}

	/**
	 * Method used to write a buffer to an endpoint specified by its ID
	 *
	 * @method    write
	 * @public
	 *
	 * @param     {Integer}	sEndpointID	The endpoint's ID used to write
	 * @param     {Object}	oBuffer			The data buffer ( http://nodejs.org/api/buffer.html ) to write
	 * @param			{String}  [sSocketID]	The connected socket ID to write in ( if null it will write on ALL connected sockets )
	 * @param     {String}	[sEncoding]	The data encoding type used to write
	 *
	 * @return    {Object} returns a successfull promise when write process is successfull
	 *
	 * @example
	 *   Technology.write( 'Core', oBuffer, sSocketID, 'utf8' );
	 *   Technology.write( 'Core', oBuffer, 'utf8' );
	 */
	write( sEndpointID, oBuffer, arg1, arg2 ){
		let _oEndpoint = this.getEndpoint( sEndpointID );
		return _oEndpoint.write( oBuffer, arg1, arg2 );
	}

	/**
	 * Method used send Ancilla event request
	 *
	 * @method    trigger
	 * @public
	 *
	 * @param     {Object}		oEvent			The Ancilla event
	 * @param     {Function}    [fCallback]		The callback function to call after the trigger operation is completed
	 *
	 * @return    {Object}	this method will return a promise; the promise will fail on timeout ( if the event requires an answer ), otherwise it will be successfull
	 *
	 * @example
	 *   Technology.trigger( oEvent );
	 */
	trigger( oEventOptions ){
		oEventOptions = _.extend({
			sFromID: this.getID()
		}, oEventOptions );
		let _Technology = this;
		let _oTimeoutHandler = null;
		let _oPromiseReturn = null;
		let _oAncillaEvent = new AncillaEvent( oEventOptions );
		this.debug( 'sending to "%s" Ancilla event "%j"...', _oAncillaEvent.getTo(), _oAncillaEvent );
		if( _oAncillaEvent.needsAnswer() ){
			let _oPromiseWait4Answer = new Bluebird( function( fResolve, fReject ){
					// Storing Resolve function waiting for answer
					_Technology.__addDeferredAncillaRequest( _oAncillaEvent, fResolve, fReject );
				} )
				.then( function(){
						// Clearing Timeout
						clearTimeout( _oTimeoutHandler );
					}
				);
			// Promise to wait Timeout ( this promise will fail as soon as )
			let _oPromiseToWaitTimeout = new Bluebird( function( fResolve, fReject ){
				_oTimeoutHandler = setTimeout( function(){
					_Technology.error( 'Trigger event "%s" with ID: "%s "has not received a response in "%s" seconds.', _oAncillaEvent.getType(), _oAncillaEvent.getID(), _oAncillaEvent.getTimeout()/1000 );
					// Clearing sotred deferred ancilla request
					_Technology.__clearDeferredAncillaRequest( _oAncillaEvent, false );
					// Rejecting promise
					fReject( new Error('timeout'), _oAncillaEvent );
				}, _oAncillaEvent.getTimeout() );
			});
			// Promise Race
			_oPromiseReturn = Bluebird.race( [ _oPromiseWait4Answer, _oPromiseToWaitTimeout ] );
		} else {
			// this is a fake promise because we don't need to wait for an answer
			_oPromiseReturn = Bluebird.resolve();
		}
		this.write( _oAncillaEvent.getTo(), _oAncillaEvent.toString(), 'utf8' );
		// Returning Promise
		return _oPromiseReturn;
	}

	/**
	* Method used to add Ancilla deferred Promise's resolve function wating for answers
	*
	* @method    __addDeferredAncillaRequest
	* @public
	*
	* @param     {ID}					oAncillaEvent				The Ancilla event
	* @param     {Function}   fResolveCallback		The promise's resolve function to call when the answer arrives
	*
	* @example
	*   Technology.__addDeferredAncillaRequest( _oAncillaEvent.getID(), fResolve );
	*/
	//__addDeferredAncillaRequest( oAncillaEvent, fResolveCallback, fRejectCallback ){
	__addDeferredAncillaRequest( oAncillaEvent, fResolveCallback ){
		this.__oDefferedAncillaEvents[ oAncillaEvent.getID() ] = fResolveCallback;
	}

	/**
	* Method used to free a deferred Ancilla request stored previously when the answer arrives or an error occurs: the resolve function is called
	*
	* @method    __clearDeferredAncillaRequest
	* @public
	*
	* @param     {ID}					oAncillaEvent				The Ancilla event
	* @param     {Function}   bSuccess						True if it's a success
	*
	* @example
	*   Technology.__clearDeferredAncillaRequest( _oAncillaEvent.getID(), false );
	*/
	__clearDeferredAncillaRequest( oAncillaEvent, bSuccess ){
		if( oAncillaEvent.needsAnswer() ){
			let _iAncillaEventID = oAncillaEvent.getID();
			if( this.__oDefferedAncillaEvents[ _iAncillaEventID ] ){
				if( bSuccess ){ // If successfull calling resolve function
					this.__oDefferedAncillaEvents[ _iAncillaEventID ]();
				}
				// Clearing stored deferred ancilla event
				delete this.__oDefferedAncillaEvents[ _iAncillaEventID ];
			}
		}
	}

	/**
	* Method used send Ancilla event asnwer to a specific Ancilla event requests
	*
	* @method    triggerAnswer
	* @public
	*
	* @param     {Object}			oEvent							The Ancilla event request to asnwer to
	* @param     {Object}			[bResult]						The result operation
	* @param     {Object}			[oAdditionalData]		The additional data to add to the answer
	*
	* @return    {Object}	this method will return a promise; the promise will fail on error, otherwise it will be successfull
	*
	* @example
	*   Technology.triggerAnswer( oEvent );
	*   Technology.triggerAnswer( oEvent, Constant._NO_ERROR );
	*   Technology.triggerAnswer( oEvent, oAdditionalData );
	*   Technology.triggerAnswer( oEvent, Constant._NO_ERROR, oAdditionalData );
	*/
	triggerAnswerTo( oAncillaEventRequest ){
		// Removing rist argument, sending the other arguments to Ancilla event method
		let _aArgs = Array.prototype.slice.call( arguments, 1 );
		oAncillaEventRequest.setToAnswer.apply( this, _aArgs );
		// Sending event
		this.write( oAncillaEventRequest.getTo(), oAncillaEventRequest.toString(), 'utf8' );
	}

	/**
	 * Method called to load an Ancilla event
	 *
	 * @method    __loadAncillaEvent
	 * @private
	 *
	 * @param			{String}	sPath		Path to the Ancilla Event to load
	 *
	 * @return    {Object}	loaded Ancilla event
	 *
	 * @example
	 *   Technology.__loadAncillaEvent( sPath );
	 */
	__loadAncillaEvent( sPath ){
		let _Technology = this;
		return new Bluebird( function( fResolve, fReject ){
			let _sAncillaEvent = Path.basename( sPath );
			try {
	    	let _oDefine = require( sPath );
				_sAncillaEvent = ( _oDefine ? _oDefine.name : null );
				let _fAncillaEvent = ( _oDefine ? _oDefine.event : null );
				if( _sAncillaEvent && _fAncillaEvent ){
					if( !_Technology.__oAncillaEvents[ _sAncillaEvent ] ){
		    		_Technology.__oAncillaEvents[ _sAncillaEvent ] = _fAncillaEvent;
					}
				} else {
					throw new Error( 'wrong Ancilla Event library' );
				}
				// Returning imported Ancilla Event
				_Technology.debug( 'Loaded Ancilla event "%s"', _sAncillaEvent );
			  fResolve( _Technology.__oAncillaEvents[ _sAncillaEvent ] );
			} catch( oError ){
					_Technology.error( '[ Error "%s" ] error on loading Ancilla event "%s" (%s)', oError, _sAncillaEvent, sPath );
					fReject( Constant._ERROR_EVENT_FAILED_TO_LOAD );
			}
		});
	}

	/**
	 * Method called to get an Ancilla event
	 *
	 * @method    getAncillaEvent
	 * @private
	 *
	 * @param			{String}	sEventType		Ancilla event's type
	 *
	 * @return    {Function}	the Ancilla event
	 *
	 * @example
	 *   Technology.getAncillaEvent( sEventType );
	 */
	getAncillaEvent( sEventType ){
		return this.__oAncillaEvents[ sEventType ];
	}

	__parseAncillaEvents( oBuffer ){
		// Assuming the buffer will contain a single valid JSON describing an Ancilla Event ( in the future will be reintroduced old code to handle different sitautions )
		let _sBuffer = oBuffer.toString();
		this.debug( 'Parsing ancilla event "%s"...', _sBuffer );
		let _aAncillaEvents = [];
		try {
			_aAncillaEvents.push( new AncillaEvent( JSON.parse( _sBuffer ) ) );
		} catch( _oError ){
			this.error( '( Error: "%s" ) Unable to convert Ancilla event: "%s"', _oError, _sBuffer );
		}
		return _aAncillaEvents;
	}

	/**
	* Method called when event "Ancilla" is fired, to handle it
	*
	* @method    onAncilla
	* @public
	*
	* @param	{Object}	oEvent		The Ancilla event
	*
	* @example
	*   Technology.onAncilla( oEvent );
	*/
	onAncilla( oEvent, oEndpoint, sSocketID, aPromisesToHandle ){
		this.debug( 'Received from endpoind "%s" and socket "%s" Ancilla Event: ',  oEndpoint.getID(), sSocketID, oEvent );
		//let _sTechnologyID = oEvent.getFrom();
		let _sEventType = oEvent.getType();
		//let _bCheckIfLogged = true;
		let _aPromisesToHandle = ( Array.isArray( aPromisesToHandle ) ? aPromisesToHandle : [] );
		// Handling Ancilla Event Requests sent to the core and preparing answer if needed
		if( oEvent.isTarget( this.getID() ) && oEvent.isRequest() ){
			let _Technology = this;
			// Main promise
			_aPromisesToHandle.push(
				new Bluebird( function( fResolve, fReject ){
					// Choosing the ancilla event type handler
					let _fAncillaEvent = _Technology.getAncillaEvent( _sEventType );
					if( typeof _fAncillaEvent === 'function' ){
						return _fAncillaEvent( _Technology, oEvent );
					} else {
						_Technology.error( 'Unknown Ancilla Event: "%s"', oEvent.getType() );
						fReject( Constant._ERROR_EVENT_UNKNOWN );
					}
				})
			);
			// Main Promises handler
			Bluebird.all( _aPromisesToHandle )
				.then( function( aArguments ){ // the "All" will return an array of arguments; since the Main promise is the first promise, the first argument of the array will be the returned Event
					let _oEvent = aArguments[ 0 ];
					_Technology.__onAncillaDispatch( _oEvent );
				})
				.catch( function( iError ){
					_Technology.error( '[ Error "%s" ] on Ancilla Event: "%s"; ignoring request without answering...', iError, oEvent.getType() );
				})
			;
		} else {
			this.__onAncillaDispatch( oEvent );
		}
	}

	/**
	* Method called to dispatch an Ancilla event
	*
	* @method    __onAncillaDispatch
	* @private
	*
	* @param	{Object}	oEvent		The Ancilla event
	*
	* @example
	*   Technology.__onAncillaDispatch( oEvent );
	*/
	__onAncillaDispatch( oEvent ){
		// Dispatching event ( if needed )
		let _sTo = oEvent.getTo();
		let _oConnectedSocket = this.getConnectedSocket( _sTo );
		if( _sTo !== this.getID() ){
			this.debug( 'Dispatching Ancilla Event: "%s" [ %j ] to "%s"...', oEvent.getType(), oEvent, _sTo );
			if( _oConnectedSocket ){
				if( _oConnectedSocket.write ){
					_oConnectedSocket.write( oEvent.toString() );
				} else if( _oConnectedSocket.send ){
					_oConnectedSocket.send( oEvent.toString() );
				}
			} else {
				this.error( 'Unable to dispath Ancilla Event: "%s" [ %j ]; unknown destination...', oEvent.getType(), oEvent );
			}
		} else {
			this.debug( 'Ancilla Event: "%s" [ %j ] reached its destination.', oEvent.getType(), oEvent );
		}
	}

	/**
	 * Method called to display current memory consumption
	 *
	 * @method    checkMemoryUsage
	 * @public
	 *
	 * @return    {Void}
	 *
	 * @example
	 *   Technology.checkMemoryUsage();
	 */
	checkMemoryUsage(){
		let _oMemory = process.memoryUsage();
		this.debug( 'Memory consumption: RSS %s MB Heap Total: %s MB Heap used: %s MB...', ( _oMemory.rss / 1000000 ).toFixed(2), ( _oMemory.heapTotal / 1000000 ).toFixed(2) , ( _oMemory.heapUsed / 1000000 ).toFixed(2) );
	}

	/**
	* Method called to transform args to technology's options
	*
	* @method    __argsToOptions
	* @private
	*
	* @return	{Object}	The parsed technology's options
	*
	* @example
	*   Technology.__argsToOptions();
	*/
	__argsToOptions() {
		// Arguments
		let _oArgs = Tools.processArgs( process.argv.slice( 2 ) );
		//let _sProcessName = Path.basename( oCurrentModule.filename );
		let oOptions = _.extend({
			sDebugLevel: ( ( _oArgs.debug || _oArgs[ 'remote-debug' ] ) ? ( ( !_oArgs.debug || _.isBoolean( _oArgs.debug ) ) ? 'debug' : _oArgs.debug ) : null ),
			bDebugRemote: ( false || ( _oArgs[ 'remote-debug' ] ) ),
			iDebugRemotePort: ( _oArgs[ 'remote-debug' ] ? ( _.isBoolean( _oArgs[ 'remote-debug' ] ) ? 3000 : ( _.isNumber( _oArgs[ 'remote-debug' ] ) ? _oArgs[ 'remote-debug' ] : 3000 ) ) : 3000 )
		}, _oArgs );
		return oOptions;
	}

	onDestroy(){
		return Bluebird.resolve();
	}

	export( oCurrentModule ) {
			if( require.main === oCurrentModule ){
					// Arguments
					return this.run( this.__argsToOptions(), oCurrentModule );
			} else {
					return this.constructor;
			}
	}
}

module.exports = Technology;
