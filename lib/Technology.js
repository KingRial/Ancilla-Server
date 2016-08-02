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
let AncillaEventHandler = require('./EventHandler.js');
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
			sDebugRemote: null,
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
			bConnectToCore: false
		};
		this.config( _oDefaultOptions );
		// Config options
		this.config( oTechnologyOptions );
	}

	config( oOptions ){
		if( _.isObject( oOptions ) ){
			this.__oOptions = _.merge( this.__oOptions, oOptions );
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
		// Reworking assets Path if needed
		this.config({
			sCwd: Path.dirname( oCurrentModule.filename ),
			sAssetsPath: Path.dirname( oCurrentModule.filename ),
		});
		// Collecting configuration from configuration file "config.json"
		let _oTechnologyConfigurationFile = null;
		let _sTechnologyConfigurationFile = Path.join( this.getConfig().sAssetsPath, 'config.json' );
		try {
    	_oTechnologyConfigurationFile = require( _sTechnologyConfigurationFile );
		} catch( error ){
		    _oTechnologyConfigurationFile = null;
		}
		// Collecting configuration from cmd line
		let _oTechnologyConfigurationCmdLine = this.__argsToOptions();
		// Configuring technology with custom options ( Command line options will overwrite all other technology options )
		this.config( _.merge( {}, _oTechnologyConfigurationFile, oTechnologyOptions, _oTechnologyConfigurationCmdLine ) );
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
			sRemote: this.getConfig().sDebugRemote,
			iRemotePort: this.getConfig().iDebugRemotePort,
			sID: this.getConfig().sTechnologyTag,
      sLogPath: ( this.getConfig().bUseLog ? this.getConfig().sLogPathTmp + this.getConfig().sLogName : null),
      iLogMaxSize: 500000, // kB
			iLogMaxFiles: 3
		} );
		this.silly( 'Configuration from "run" method: ', oTechnologyOptions );
		this.silly( 'Configuration from "%s": ', _sTechnologyConfigurationFile, ( _.isEmpty( _oTechnologyConfigurationFile ) ? 'empty or missing configuration file' : _oTechnologyConfigurationFile ) );
		this.silly( 'Configuration from CMD line: ', _oTechnologyConfigurationCmdLine );
		// Setting process events
		process.on('SIGINT', function() {
			_Technology.debug('Event SIGINT; stopping Technology...' );
			_Technology.stop();
		});
		process.on('SIGTERM', function() {
			_Technology.info('Event SIGTERM; stopping Technology...' );
			_Technology.stop();
		});
		process.on('SIGHUP', function() {
			_Technology.info(' Event SIGHUP; stopping Technology..' );
			_Technology.stop();
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
		// Loading default Ancilla events
		return _Technology.__loadAncillaEvents( Path.join( __dirname, 'Events' ) )
			.then( function(){
				// Loading Ancilla events from assets
				return _Technology.__loadAncillaEvents( Path.join( _Technology.getConfig().sAssetsPath, 'Events' ) );
			})
		;
	}

	__onEvent( sEvent ){
		let _sHandlerEventFunction = Tools.getEventHandlerFunctionName( sEvent );
		// Getting all arguments except for the first ( which is the event string; the correct list is: sEvent, oEndpoint, ...Args )
		let _aArgs = Array.prototype.slice.call( arguments, 1 );
		//Transforming Args if needed
		switch( sEvent ){
			case 'ancilla':
				let _oBuffer = _aArgs[ 1 ];
				let _aAncillaEvents = this.__parseAncillaEvents( _oBuffer );
				// Handling Ancilla events
				for( let _oAncillaEvent of _aAncillaEvents ){
					let _aCurrentArgs = _aArgs.slice( 0 );
					// Reworking buffer to Ancilla Event
					_aCurrentArgs[ 1 ] = _oAncillaEvent;
					if( this[ _sHandlerEventFunction ] ){
						this.silly( 'calling Ancilla Event handler ( "%s" ) with "%s" parameters...', _sHandlerEventFunction, _aCurrentArgs.length );
						this[ _sHandlerEventFunction ].apply( this, _aCurrentArgs );
					} else {
						this.error( 'received event "%s" but missing method "%s" to handle event...', sEvent, _sHandlerEventFunction );
					}
				}
			break;
			default:
				// Calling event handler
				if( this[ _sHandlerEventFunction ] ){
					this.debug( 'calling event "%s" handler ( "%s" ) with "%s" parameters...', sEvent, _sHandlerEventFunction, _aArgs.length );
					this[ _sHandlerEventFunction ].apply( this, _aArgs );
				} else {
					this.silly( 'received event "%s" but missing method "%s" to handle event...', sEvent, _sHandlerEventFunction );
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
			// Adding client to Core endpoint if needed
			if( _Technology.getConfig().bConnectToCore ){
				_Technology.info( 'Adding endpoint to communicate with "Ancilla Core"...' );
				let _sCoreEndpointID = 'Core';
				if( oEndpoints[ _sCoreEndpointID ] ){
					_Technology.warn( 'Endpoint to "Ancilla Core" has already been configured on technology...');
				} else {
					oEndpoints[ _sCoreEndpointID ] = {
						sType: 'client.mqtt',
						//sHost: _oCoreEndpoint.getHost(),
						//iPort: _oCoreEndpoint.getPort(),
						oTopics: {
							'api/v1': null  // TODO: should use constants when using an Ancilla's Endpoints with Topics ( will create a method to handle this feature automatically )
						},
						bIsAncilla: true
					};
				}
			}
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
							_aPromises.push( _Technology.__initEndpoint( _oEndpointData ) );
						}
					}
				}
				Bluebird.all( _aPromises )
					.then( function(){
						_Technology.info('All endpoints are initialized.');
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

	__initEndpoint( oEndpointData ){
		let _Technology = this;
		let oEndpoint = null;
		// Loading library and istantiating Endpoint
		return new Bluebird( function( fResolve, fReject ){
			_Technology.debug( 'Initializing endpoint "%s" ... ', oEndpointData.sID );
			let _Endpoint = null;
			if( oEndpointData.module ){
				_Endpoint = oEndpointData.module;
			} else {
				try {
					_Endpoint = require( './Endpoint.' + oEndpointData.sType + '.js' );
				} catch( e ) {
					_Technology.error( 'Unable to load Endpoint\'s module library for "%s (%s)"\nPlease use a standard Endpoint\'s module library or use the Endpoint\'s paramater "module" to use a custom module', oEndpointData.sID, oEndpointData.sType );
					fReject( e );
				}
			}
			oEndpoint = new _Endpoint( oEndpointData );
			// Linking technology to endpoint's offered events
			let _aOfferedEvents = oEndpoint.getEvents();
			_aOfferedEvents.forEach( function( sEvent ){
				// Transforming "data" events to "ancilla" events if eneded
				_Technology.debug( 'Listening endpoint "%s" event "%s"...', oEndpoint.getID(), sEvent );
				switch( sEvent ){
					case 'error': // Different signature for error events
						oEndpoint.on( sEvent, function( error ){
							// Handling event
							_Technology.__onEvent( sEvent, error, oEndpoint );
							// Emitting event for technology manager
							_Technology.emit( sEvent, error, oEndpoint );
						});
					break;
					default:
						oEndpoint.on( sEvent, function( ...Args ){
							let _sEvent = ( sEvent === 'data' && oEndpoint.isAncilla() ? 'ancilla' : sEvent );
							// Handling event
							_Technology.__onEvent( _sEvent, oEndpoint, ...Args );
							// Emitting event for technology manager
							_Technology.emit( _sEvent, oEndpoint, ...Args );
						});
					break;
				}
			});
			_Technology.__oEndpoints[ oEndpoint.getID() ] = oEndpoint;
			_Technology.debug( 'Initialized endpoint "%s"', oEndpoint.getID() );
			fResolve();
		})
			.then( function(){
				return oEndpoint.ready();
			})
		;
	}

	getEvents(){
		let _oEndpoints = this.getEndpoints();
		let _aEvents = [];
		for( let _sEndpoint in _oEndpoints ){
			if( _oEndpoints.hasOwnProperty( _sEndpoint ) ){
				let _oEndpoint = _oEndpoints[ _sEndpoint ];
				_aEvents = _.merge( _aEvents, _oEndpoint.getEvents() );
			}
		}
		return _.uniq( _aEvents );
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
	 * @param			{Object}  [oOptions]	The options to use with socket's write method
	 *
	 * @return    {Object} returns a successfull promise when write process is successfull
	 *
	 * @example
	 *   Technology.write( 'Core', oBuffer, oOptions );
	 *   Technology.write( 'Core', oBuffer, oOptions );
	 */
	write( sEndpointID, oBuffer, oOptions ){
		let _oEndpoint = this.getEndpoint( sEndpointID );
		return _oEndpoint.write( oBuffer, oOptions );
	}

	/**
	 * Method used to send Ancilla event request
	 *
	 * @method    trigger
	 * @public
	 *
	 * @param     {Object}		oEvent			The Ancilla event
	 * @param     {Object}    [oOptions]		The options to use with the Core endpoint's write method
	 *
	 * @return    {Object}	this method will return a promise; the promise will fail on timeout ( if the event requires an answer ), otherwise it will be successfull
	 *
	 * @example
	 *   Technology.trigger( oEvent );
	 */
	trigger( oEventOptions, oOptions ){
		oEventOptions = _.extend({
			sFromID: this.getID(),
			sToID: ( this.getCoreEndpoint() ? this.getCoreEndpoint().getID() : null )
		}, oEventOptions );
		oOptions = _.extend({
			sTopic: Constant._API_CORE_TOPIC,
			sEncoding: 'utf8'
		}, oOptions );
		let _Technology = this;
		let _iTimeoutHandler = null;
		let _oPromiseReturn = null;
		let _oAncillaEvent = new AncillaEvent( oEventOptions );
		this.debug( 'sending to "%s" Ancilla event "%s" %s...', _oAncillaEvent.getTo(), _oAncillaEvent.toString(), ( _oAncillaEvent.needsAnswer() ? 'and REQUIRING an answer' : '' ) );
		if( _oAncillaEvent.needsAnswer() ){
			let _oPromiseWait4Answer = new Bluebird( function( fResolve, fReject ){
					// Storing Resolve function waiting for answer
					_Technology.__addDeferredAncillaRequest( _oAncillaEvent, fResolve, fReject );
				} )
				.then( function(){
					// Clearing Timeout
					clearTimeout( _iTimeoutHandler );
					return Bluebird.resolve();
				})
				.catch( function( oError ){
					// Clearing Timeout
					clearTimeout( _iTimeoutHandler );
					return Bluebird.reject( oError );
				})
			;
			// Promise to wait Timeout ( this promise will fail as soon as )
			let _oPromiseToWaitTimeout = new Bluebird( function( fResolve, fReject ){
				_iTimeoutHandler = setTimeout( function(){
					_Technology.error( 'Trigger event "%s" with ID: "%s" has not received a response in "%s" seconds.', _oAncillaEvent.getType(), _oAncillaEvent.getID(), _oAncillaEvent.getTimeout()/1000 );
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
		this.write( ( this.getCoreEndpoint() ? this.getCoreEndpoint().getID() : ( _oAncillaEvent.isAnswer() ? _oAncillaEvent.getFrom() : _oAncillaEvent.getTo() ) ), _oAncillaEvent, oOptions );
		// Returning Promise
		return _oPromiseReturn;
	}

	/**
	 * Method used to send Ancilla event "offer"
	 *
	 * @method    offer
	 * @public
	 *
	 * @param     {Object}		oObjToOffer			The Ancilla Object to offer
	 * @param     {Object}    [aRelationsWith]
	 * @param     {Object}    [oTriggerOptions] trigger options
	 *
	 * @return    {Object}	this method will return a promise
	 *
	 * @example
	 *   Technology.offer( oObjToOffer );
	 *   Technology.offer( oObjToOffer, aRelationsWith );
	 */
	offer( oObjToOffer, aRelationsWith, oTriggerOptions ){
		oTriggerOptions = _.extend({
			sType: 'offer',
			bNeedsAnswer: false,
			oObj: oObjToOffer,
			aRelationsWith: aRelationsWith
		}, oTriggerOptions );
		return this.trigger( oTriggerOptions );
	}

	/**
	* Method used to add Ancilla deferred Promise's resolve function wating for answers
	*
	* @method    __addDeferredAncillaRequest
	* @public
	*
	* @param     {ID}					oAncillaEvent				The Ancilla event
	* @param     {Function}   fResolve		The promise's resolve function to call when the answer arrives
	* @param     {Function}   fReject		The promise's reject function to call when the answer arrives
	*
	* @example
	*   Technology.__addDeferredAncillaRequest( _oAncillaEvent.getID(), fResolve );
	*/
	__addDeferredAncillaRequest( oAncillaEvent, fResolve, fReject ){
		let _iAncillaEventID = oAncillaEvent.getID();
		this.silly( 'remebering deferred ancilla request "%s" which will require an answer...', _iAncillaEventID );
		this.__oDefferedAncillaEvents[ _iAncillaEventID ] = {
			fResolve: fResolve,
			fReject: fReject
		};
	}

	/**
	* Method used to free a deferred Ancilla request stored previously when the answer arrives or an error occurs: the resolve function is called
	*
	* @method    __clearDeferredAncillaRequest
	* @public
	*
	* @param     {ID}					oAncillaEvent				The Ancilla event
	* @param     {Function}   bHandlePromiseAnswer	True to handle answer's promise reject/resolve
	*
	* @example
	*   Technology.__clearDeferredAncillaRequest( _oAncillaEvent.getID(), false );
	*/
	__clearDeferredAncillaRequest( oAncillaEvent, bHandlePromiseAnswer ){
		let _iAncillaEventID = oAncillaEvent.getID();
		if( this.__oDefferedAncillaEvents[ _iAncillaEventID ] ){
			if( bHandlePromiseAnswer ){ // If successfull calling resolve function
				if( oAncillaEvent.isAnswerSuccessfull() ){
					this.debug( 'answer "%s" is successfull', _iAncillaEventID );
					this.__oDefferedAncillaEvents[ _iAncillaEventID ].fResolve();
				} else {
					this.debug( 'answer "%s" is unsuccessfull', _iAncillaEventID );
					this.__oDefferedAncillaEvents[ _iAncillaEventID ].fReject( oAncillaEvent.getAnswerResult() );
				}
			}
			// Clearing stored deferred ancilla event
			delete this.__oDefferedAncillaEvents[ _iAncillaEventID ];
			this.silly( 'cleared deferred ancilla request "%s"', _iAncillaEventID );
		} else {
			this.warn( 'Unable to clear deferred ancilla request "%s"', _iAncillaEventID );
		}
	}
	/**
	 * Method called to load an Ancilla events from a directory
	 *
	 * @method    __loadAncillaEvents
	 * @private
	 *
	 * @param			{String}	sPath		Path to the Ancilla Event's directory to load
	 *
	 * @return    {Object}	it returns a Promise
	 *
	 * @example
	 *   Technology.__loadAncillaEvents( sPath );
	 */
	__loadAncillaEvents( sPath ){
		let _Technology = this;
		let _aPromisesToLoad = [];
		_Technology.debug( 'Looking for Ancilla events on "%s"...', sPath );
		if( Fs.existsSync( sPath ) ){
			_Technology.info( 'Loading Ancilla events...' );
			Fs
				.readdirSync( sPath )
				.filter( function( sFile ){
					return ( sFile.indexOf( '.' ) !== 0);
				})
				.forEach( function( sFile ){
					_aPromisesToLoad.push( _Technology.__loadAncillaEvent( Path.join( sPath, sFile ) ) );
				})
			;
		} else {
			_Technology.debug( 'No Ancilla events to load...' );
			_aPromisesToLoad.push( Bluebird.resolve() );
		}
		return Bluebird.all( _aPromisesToLoad );
	}

	/**
	 * Method called to load an Ancilla event
	 *
	 * @method    __loadAncillaEvent
	 * @private
	 *
	 * @param			{String}	sPath		Path to the Ancilla Event to load
	 *
	 * @return    {Object}	it returns a promise with the ancilla event handler as argument
	 *
	 * @example
	 *   Technology.__loadAncillaEvent( sPath );
	 */
	__loadAncillaEvent( sPath ){
		let _Technology = this;
		return new Bluebird( function( fResolve, fReject ){
			let _sAncillaEvent = Path.basename( sPath, Path.extname( sPath ) );
			try {
	    	let _CustomAncillaEventHandler = require( sPath );
				let _oAncillaEventHandler = new _CustomAncillaEventHandler({
					sID: _sAncillaEvent
				});
				if( _oAncillaEventHandler instanceof AncillaEventHandler ){
					_Technology.__setAncillaEventHandler( _oAncillaEventHandler );
				} else {
					throw new Error( 'wrong Ancilla Event library' );
				}
				// Returning imported Ancilla Event
				_Technology.debug( 'Loaded Ancilla event "%s"', _sAncillaEvent );
			  fResolve( _oAncillaEventHandler );
			} catch( oError ){
					_Technology.error( '[ Error "%s" ] error on loading Ancilla event "%s" (%s)', oError, _sAncillaEvent, sPath );
					fReject( Constant._ERROR_EVENT_FAILED_TO_LOAD );
			}
		});
	}

	/**
	 * Method called to set an Ancilla event handler
	 *
	 * @method    __setAncillaEventHandler
	 * @private
	 *
	 * @param			{Object}	oAncillaEventHandler		Ancilla event handler
	 *
	 * @return    {Void}
	 *
	 * @example
	 *   Technology.__setAncillaEventHandler( sEventType );
	 */
	__setAncillaEventHandler( oAncillaEventHandler ){
		let _sID = oAncillaEventHandler.getID();
		/*
		if( _sID ){
			this.warn( 'multiple instances of event handler "%s"; overwriting it...', _sID );
		}
		*/
		this.__oAncillaEvents[ _sID ] = oAncillaEventHandler;
	}

	/**
	 * Method called to get an Ancilla event handler
	 *
	 * @method    __getAncillaEventHandler
	 * @private
	 *
	 * @param			{String}	sEventType		Ancilla event's type
	 *
	 * @return    {Object}	the Ancilla event handler
	 *
	 * @example
	 *   Technology.__getAncillaEventHandler( sEventType );
	 */
	__getAncillaEventHandler( sEventType ){
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
	* @param	{Object}	oEndpoint		The Endpoint which generated the Ancilla event
	* @param	{Object}	oEvent		The Ancilla event
	*
	* @example
	*   Technology.onAncilla( oEvent );
	*/
	onAncilla( oEndpoint, oEvent, sSocketID, aPromisesToHandle ){
		this.debug( 'Received from endpoint "%s" and socket "%s" Ancilla Event: "%s"',  oEndpoint.getID(), sSocketID, oEvent.toString() );
		//let _sTechnologyID = oEvent.getFrom();
		let _sEventType = oEvent.getType();
		//let _bCheckIfLogged = true;
		let _aPromisesToHandle = ( Array.isArray( aPromisesToHandle ) ? aPromisesToHandle : [] );
		let _sTechnologyID = this.getID();
		// Handling Ancilla Event Requests sent to the core and preparing answer if needed
		if( !oEvent.isSource( _sTechnologyID ) && oEvent.isTarget( _sTechnologyID ) ){
			this.debug( 'Received Ancilla Event ( %s ) "%s" reached destination, handling request...',  ( oEvent.isRequest() ? 'request' : 'answer' ), oEvent.getID() );
			let _Technology = this;
			// Main promise
			if( oEvent.isRequest() ){
				_aPromisesToHandle.push(
					new Bluebird( function( fResolve, fReject ){
						// Choosing the ancilla event type handler
						let _oAncillaEventHandler = _Technology.__getAncillaEventHandler( _sEventType );
						if( _oAncillaEventHandler ){
							let _oResult = _oAncillaEventHandler.handle( _Technology, oEvent );
							// Adding automatic answer if needed
							if( oEvent.needsAnswer() ){
								if( typeof _oResult === 'object' && _oResult.then ){
									_oResult
										.then( function( answer ){
					            _Technology.trigger( oEvent.toAnswer( Constant._NO_ERROR, ( answer ? { answer: answer } : null ) ) );
					          })
					          .catch( function( error ){
					            _Technology.trigger( oEvent.toAnswer( error ) );
					          })
					        ;
								} else {
									_Technology.warn('Ancilla Event Handler "%s" method "handle" doesn\'t return a promise; unable to add an automatic answer to current request; please correct the method or handle answer programmatically ', oEvent.getID() );
								}
								return _oResult;
							}
						} else {
							_Technology.error( 'Unknown Ancilla Event: "%s"; there is no handler to handle the request...', oEvent.getType() );
							fReject( Constant._ERROR_EVENT_UNKNOWN );
						}
					})
				);
			} else {
				this.__clearDeferredAncillaRequest( oEvent, true );
			}
			// Main Promises handler
			Bluebird.all( _aPromisesToHandle )
				.catch( function( iError ){
					_Technology.error( '[ Error "%s" ] on Ancilla Event: "%s"; ignoring %s...', iError, oEvent.getType(), ( oEvent.isRequest() ? 'request' : 'answer' ) );
				})
			;
		} else if( !oEvent.isSource( _sTechnologyID ) && !oEvent.isTarget( _sTechnologyID ) ) {
			this.debug( 'Received Ancilla Event "%s" is not for current technology ( event source: "%s" event target: "%s" ), trying to dispatch it somewhere else...', oEvent.getID(), oEvent.getFrom(), oEvent.getTo() );
			this.__onAncillaDispatch( oEvent );
		} else {
			this.debug( 'Received Ancilla Event "%s" is fired by current technology ( event source: "%s" ); ignoring it...', oEvent.getID(), oEvent.getFrom() );
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
		let _sTargetID = oEvent.getTo();
		let _oEndpoint = this.getEndpoint( _sTargetID );
		if( _oEndpoint ){
			this.debug( 'Dispatching event to "%s"...', _sTargetID );
			this.write( _sTargetID, oEvent );
		} else {
			this.error( 'Unable to dispatch event to "%s"', _sTargetID );
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

	getProcessArgs(){
		return Tools.processArgs( process.argv.slice( 2 ) );
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
		let _oArgs = this.getProcessArgs();
		//let _sProcessName = Path.basename( oCurrentModule.filename );
		let oOptions = _.extend({
			bConnectToCore: _oArgs.core,
			sDebugLevel: ( ( _oArgs.debug || _oArgs[ 'remote-debug' ] ) ? ( ( !_oArgs.debug || _.isBoolean( _oArgs.debug ) ) ? 'debug' : _oArgs.debug ) : null ),
			sDebugRemote: ( _oArgs[ 'remote-debug' ] ? ( _.isBoolean( _oArgs[ 'remote-debug' ] ) ? 'mqtt' : _oArgs[ 'remote-debug' ] ) : null ),
			iDebugRemotePort: ( _oArgs[ 'remote-debug' ] ? ( _.isBoolean( _oArgs[ 'remote-debug' ] ) ? 3000 : ( _.isNumber( _oArgs[ 'remote-debug' ] ) ? _oArgs[ 'remote-debug' ] : 3000 ) ) : 3000 )
		}, _oArgs );
		return oOptions;
	}

	/**
	* Method called to stop technology
	*
	* @method    stop
	* @public
	*
	* @return	{Object}	The promise successull when the technology is correctly stopped
	*
	* @example
	*   Technology.stop();
	*/
	stop(){
		let _Technology = this;
		return _Technology.onDestroy()
			.then(function(){
				_Technology.info( 'Technology stopped correctly' );
				process.exit();
			})
			.catch( function( oError ){
				_Technology.error( 'Unable to correctly stop the technology: ', oError );
				process.exit();
			})
		;
	}

	onDestroy(){
		let _oEndpoints = this.getEndpoints();
		let _aDestroyPromises = [ Bluebird.resolve() ];
		for( let _sEndpoint in _oEndpoints ){
			if( _oEndpoints.hasOwnProperty( _sEndpoint ) ){
				let _oEndpoint = _oEndpoints[ _sEndpoint ];
				_aDestroyPromises.push( _oEndpoint.onDestroy() );
			}
		}
		return Bluebird.all( _aDestroyPromises );
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
