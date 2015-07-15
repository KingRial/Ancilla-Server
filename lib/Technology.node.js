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

var Gateway = require('./Gateway.node.js');
var DB = require('./DB.node.js');
var Event = require('./Event.node.js');
var Tools = require('./Tools.node.js');
var Constant = require('./Constants.node.js');

var winston = require('winston');

var EventEmitter = require( 'events' ).EventEmitter;
var Fs = require('fs-extra');
var Path =  require('path');
var Promise = require('bluebird');

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
 *		new Technology( { sID: 'tech-1', sType: 'tech', aEndpoints: [{ type: 'listen', connectionType: 'net', host: 'localhost', port: 10001 }] } );
 *		new Technology( { sID: 'tech-2', sType: 'tech', bUseDB: false, aEndpoints: [{ type: 'connect', connectionType: 'net', host: '192.168.0.100', port: 10002 }] } );
 *		new Technology( { sID: 'tech-3', sType: 'tech', bUseDB: true, aEndpoints: [{ type: 'listen', connectionType: 'serial', port: '/dev/ttyS0', baudrate: 9600, databits: 8, stopbits: 1, parity: 'none', buffersize: 255 }] } );
 *		new Technology( { sID: 'tech-4', sType: 'tech', bUseDB: true }, aEndpoints: [{ type: 'listen', connectionType: 'ws', port: 10003 }] );
 *		new Technology( { sID: 'tech-5', sType: 'tech', bUseDB: true }, aEndpoints: [{ type: 'listen', connectionType: 'wss', port: 10004 }] );
 *		new Technology( { sID: 'tech-6', sType: 'tech' }, aEndpoints: [{ type: 'connect', connectionType: 'ws', host: '192.168.0.100', port: 10005 }] );
 *		new Technology( { sID: 'tech-7', sType: 'tech' }, aEndpoints: [{ type: 'connect', connectionType: 'wss', host: '192.168.0.100', port: 10006 }] );
 */
var Technology=function( oTechnologyOptions ){
	this.__oOptions = Tools.extend({}, oTechnologyOptions );
	this.__aAncillaEvents = {};
	this.__oDefferedAncillaEvents = {};
	this.__oStatus = {
		bGatewayReady: false,
		bIsIntroduced: false
	};
	Technology.super_.call( this );
}
Tools.inherits( Technology, EventEmitter );

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
 *   Technology.run( { sID: 'tech-1', sType: 'tech', aEndpoints: [{ type: 'listen', connectionType: 'net', host: 'localhost', port: 10001 }] } );
 */
Technology.prototype.run = function( oTechnologyOptions, oCurrentModule ){
	var _Technology = this;
	// Selecting current module if none specified
	if( !oCurrentModule ){
		oCurrentModule = module;
	}
	// Init options overwriting previous options passed ar argument of the created class
	oTechnologyOptions = Tools.extend( this.__oOptions, oTechnologyOptions );
	// Default Technology Options
	oTechnologyOptions = Tools.extend({
		// Technology
		sID: 'tech-' + Math.random(),
		sType: 'unknown',
		bUseSwap: true,
		sCwd: Path.dirname( oCurrentModule.filename ),
		sAssetsPath: Path.dirname( oCurrentModule.filename ),
		iVersion : 0,
		bDebug: false,
		// DB
		bUseDB: true,
		sDBHost: null,
		sDBUsername: null,
		sDBPassword: null,
		sDBDialect: 'sqlite',
		sDBPath: './', // DB persistent path should be where the script technology is located ( if using relative path it's relative to sCwd )
		//sDBPathTmp: ( Tools.isOSWin() ? './' : '/tmp/' ), // TODO: DB volatile path should be located on TMP under UNIX or ? under Windows ( if using relative path it's relative to sCwd )
		sDBPathTmp: './',
		// LOG
		bUseLog: true,
		iLogMaxSize: 500000, // kB
		iLogMaxFiles: 3,
		//sLogPath: ( Tools.isOSWin() ? './' : '/var/log' ),
		sLogPath: './', // Log persistent path should be where the script technology is located ( if using relative path it's relative to sCwd )
		//sLogPathTmp: ( Tools.isOSWin() ? './' : '/tmp/' ), // TODO: Log volatile path should be located on TMP under UNIX or ? under Windows ( if using relative path it's relative to sCwd )
		sLogPathTmp: './',
		// Others
		aLogStyle: Tools.__styleTerminalGetRandom() // Chalk Log style array [ Modifier, Colour, Background ]
	}, oTechnologyOptions );
	// Other options dependant from sType initialization
	var _sTechnologyTag = oTechnologyOptions.sType + '.' + oTechnologyOptions.sID
	oTechnologyOptions = Tools.extend({
		sTechnologyTag: _sTechnologyTag,
		sDBName:  _sTechnologyTag + '.sqlite',
		sLogName: _sTechnologyTag + '.log'
	}, oTechnologyOptions );
	// Reworking assets Path if needed
	oTechnologyOptions.sAssetsPath = ( Path.isAbsolute( oTechnologyOptions.sAssetsPath ) ? oTechnologyOptions.sAssetsPath : Path.join( oTechnologyOptions.sCwd, oTechnologyOptions.sAssetsPath ) );
	// Remembering computed technology's options
	this.__oOptions = Tools.extend( {}, oTechnologyOptions );
	// Process working directory
	if( oTechnologyOptions.sCwd != process.cwd() ){
		process.chdir( oTechnologyOptions.sCwd );
	}
	// Init Loggers
	var _oLogOptions = {
		console: {// TODO: use this console instead of custom logger for console outputs ?
			level: 'debug',
			timestamp: true,
			silent: true // Disabled until we start to use this logged instead of custom logger from Tools class
		}
	};
	if( this.__oOptions.bUseLog ){
		_oLogOptions.file = {
			timestamp: true,
			filename: this.__oOptions.sLogPathTmp + this.__oOptions.sLogName,
			maxsize: this.__oOptions.iLogMaxSize, // 500 kB
			maxFiles: this.__oOptions.iLogMaxFiles,
			json: false,
			tailable: true,
			zippedArchive: true,
			exitOnError: false
    };
	}
	winston.loggers.add('log-rotation', _oLogOptions );
	if( _oLogOptions.file ){
		this.info( 'Logging technology on: "%s"...', _oLogOptions.file.filename );
	}
	// Setting process events
	process.on('SIGINT', function() {
		_Technology.info('Event SIGINT...' );
		process.exit();
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
	// Init debug
	Tools.setDebug( oTechnologyOptions.bDebug );
	// Logging CWD
	this.info( 'set working directory to: "%s"...', oTechnologyOptions.sCwd );
	this.info( 'set assets directory to: "%s"...', oTechnologyOptions.sAssetsPath );
	// Starting technology
	this.info( 'Starting technology [ version: "%s" ] ...', this.__oOptions.iVersion );
	this.debug( 'Starting technology with following options:\n\t%j', oTechnologyOptions );
	this.__initAncillaEvents()
		.then( function(){
// TODO: change following methods to return promises to build the chain of events
			_Technology.__registerEvents( Tools.proxy(
				_Technology.__initDB, _Technology, Tools.proxy(
					_Technology.__initGWs, _Technology, _Technology.__oOptions.aEndpoints
					)
				)
			);
		})
		.catch( function( oError ){
			_Technology.error( '[ Error: %s ] Unable to correctly load Ancilla events.', oError );
		})
	;
}

/**
 * Method called to initialize Ancilla events
 *
 * @method    __initAncillaEvents
 * @private
 *
 * @param	{Object}	it returns a promise object succesfull when no errors has been found
 *
 * @example
 *   Technology.__initAncillaEvents();
 */
Technology.prototype.__initAncillaEvents = function(){
	var _Technology = this;
	// Loading Ancilla events
	var _aPromisesToLoad = [];
	var _sEventsPath = Path.join( _Technology.__oOptions.sAssetsPath, 'Events/' );
	_Technology.info( 'Loading Ancilla events...' );
	var _aFiles = Fs
		.readdirSync( _sEventsPath )
		.filter( function( sFile ){
			return ( sFile.indexOf( '.' ) !== 0);
		})
		.forEach( function( sFile ){
			_aPromisesToLoad.push( _Technology.__loadAncillaEvent( Path.join( _sEventsPath, sFile ) ) );
		})
	;
	return Promise.all( _aPromisesToLoad );
}

/**
 * Method called to register events to the current technology
 *
 * @method    __registerEvents
 * @private
 *
 * @param	{Function}	fCallback		The callback function to call when evetns has been registered
 *
 * @example
 *   Technology.__registerEvents( fCallback );
 */
Technology.prototype.__registerEvents = function( fCallback ){
	var _aEvents = [ 'gatewayReady', 'ready', 'data', 'ancilla' ];
	for( var _iIndex in _aEvents ){
		var _sEvent = _aEvents[ _iIndex ];
		this.debug( 'listening on event "%s"...', _sEvent );
		this.on( _sEvent, Tools.proxy( this.__onEvent, this, _sEvent ) );
	}
	if( fCallback ){
		fCallback();
	}
}
Technology.prototype.__onEvent = function( sEvent ){
	var _sHandlerEventFunction = 'on' + sEvent.charAt(0).toUpperCase() + sEvent.slice(1);
	// Getting all arguments except for the first
	var _aArgs = Array.prototype.slice.call( arguments, 1 );
	//Transforming Args if needed
	switch( sEvent ){
		case 'ancilla':
			// Checking the presence of multiple Ancilla Events on the same buffer ( which is the first argument after the argument's changes done before )
			var _oBuffer = _aArgs[ 0 ];
			var _oRegEx = new RegExp( '}{', 'g' );
			var _sBuffer = _oBuffer.toString();
			var _aMatches = [];
			var _oMatches = null;
			var _aAncillaEvents = [];
			while ( ( _oMatches = _oRegEx.exec( _sBuffer )) ) {
				_aMatches.push( _oMatches.index );
			}
			// Assuming the last correct match is always the end of the buffer
			_aMatches.push( _sBuffer.length );
			// Found multiple Ancilla Events on the same buffer
			for( var _iIndex in _aMatches ){
				var _iStart = ( _iIndex == 0 ? null : _aMatches[ _iIndex - 1 ] + 1 );
				var _iEnd = ( _iIndex == _sBuffer.length ? null : _aMatches[ _iIndex ] + 1 );
				var _oSingleAncillaEvent = _oBuffer.slice( _iStart, _iEnd ); // Adding +1 to index to get also the last character '}' of the JSON string
				_aAncillaEvents.push( _oSingleAncillaEvent );
			}
			// Handling Ancilla events
			for( var _iIndex in _aAncillaEvents ){
				var _oCurrentBuffer = _aAncillaEvents[ _iIndex ];
				var _aCurrentArgs = _aArgs.slice( 0 );
				try {
					// Transforming JSON string to Javascript Object
					var _oAncillaEvent = new Event( JSON.parse( _oCurrentBuffer ) );
					_aCurrentArgs[ 0 ] = _oAncillaEvent;
					// Clearing deferred ancilla request if it's an answer for a stored request
					this.__clearDeferredAncillaRequest( _oAncillaEvent, true );
					this.debug( 'calling Ancilla Event handler ( "%s" ) with "%s" parameters...', _sHandlerEventFunction, _aCurrentArgs.length );
					if( this[ _sHandlerEventFunction ] ){
						this[ _sHandlerEventFunction ].apply( this, _aCurrentArgs );
					} else {
						this.error( 'received event "%s" but missing method "%s" to handle event...', sEvent, _sHandlerEventFunction );
					}
				} catch( _oError ){
					this.error( '( Error: "%s" ) Unable to convert Ancilla event: "%s"', _oError, _oCurrentBuffer.toString() );
					_aArgs[ 0 ] = {};
				}
			}
		break;
		default:
			// Calling event handler
			this.debug( 'calling event "%s" handler ( "%s" ) with "%s" parameters...', sEvent, _sHandlerEventFunction, _aArgs.length );
			if( this[ _sHandlerEventFunction ] ){
				this[ _sHandlerEventFunction ].apply( this, _aArgs );
			} else {
				this.error( 'received event "%s" but missing method "%s" to handle event...', sEvent, _sHandlerEventFunction );
			}
		break;
	}
}

/**
 * Method called to get the Sequelize DB's table model handler
 *
 * @method    getDBModel
 * @private
 *
 * @return    {Object}		It returns the Sequelize DB's table model handler
 *
 * @example
 *   Technology.getDBModel( 'OBJECT' );
 */
Technology.prototype.getDBModel = function( sTable ){
	return this._oDB.getModel( sTable );
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
Technology.prototype.__DBgetRelativePersistantPath = function(){
	return Path.join( this.__oOptions.sDBPath, this.__oOptions.sDBName );
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
Technology.prototype.__DBgetRelativePath = function(){
	return Path.join( this.__oOptions.sDBPathTmp, this.__oOptions.sDBName );
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
Technology.prototype.__swapDB = function( sSourcePath, sDestinationPath ){
	var _oTechnology = this;
// TODO: setting timers to handle swap DB http://nodejs.org/api/timers.html
	return new Promise( function( fResolve, fReject ){
		if( sSourcePath != sDestinationPath ){
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
 * @param	{Function}	fCallback		The callback function to call when the initialize DB operation is completed
 *
 * @example
 *   Technology.__initDB( fCallback );
 */
Technology.prototype.__initDB = function( fCallback ){
	var _Technology = this;
	if( _Technology.__oOptions.bUseDB ){
		this.__swapDB( this.__DBgetRelativePersistantPath(), this.__DBgetRelativePath() )
		.then( function(){
			var _oDBOptions ={
				sDB: _Technology.__oOptions.sTechnologyTag,
				sHost: _Technology.__oOptions.sDBHost,
				sUsername: _Technology.__oOptions.sDBUsername,
				sPassword: _Technology.__oOptions.sDBPassword,
				sDialect: _Technology.__oOptions.sDBDialect,
				sStoragePath: _Technology.__DBgetRelativePath(),
				sModelsDir: Path.join( _Technology.__oOptions.sAssetsPath, 'DB/models/' ),
				sMigrationsDir: Path.join( _Technology.__oOptions.sAssetsPath, '/DB/migrations/' ),
				fLogging: function( sLog ){ _Technology.debug( '[ DB: "%s" ] ' + sLog, _Technology.__oOptions.sTechnologyTag ); }
			};
			_Technology.info( 'Using DB "%s" with the following options:\n\t%j ', _oDBOptions.sDB, _oDBOptions );
			_Technology._oDB = new DB( _oDBOptions );
			_Technology._oDB.open()
			  .then( function( aExecutedMigrations ){
					var _aExecutedMigrationsFiles = [];
					for( var _iIndex in aExecutedMigrations ){
						_aExecutedMigrationsFiles.push( aExecutedMigrations[ _iIndex ].file );
					}
					_Technology.info( 'completed following migrations for DB "%s": %j', _Technology.__oOptions.sTechnologyTag, _aExecutedMigrationsFiles );
					if( fCallback ){
						fCallback();
					}
			  })
				.catch( function( oError ){
					_Technology.error( '[ Error: %j ] Unable to open DB', oError );
				})
			;
		});
	} else {
		this.debug( 'DB not used' );
		if( fCallback ){
			fCallback();
		}
	}
}

/**
 * Method called to initialize linked gateway object
 *
 * @method    __initGWs
 * @private
 *
 * @param	{Object[]}   aGatewaysOptions		An array of javascript objects describing the endpoints used by the gateway
 *
 * @example
 *   Technology.__initGWs( aGatewaysOptions );
 */
Technology.prototype.__initGWs = function( aGatewaysOptions ){
	var _Technology = this;
	this.debug( 'Initializing Gateways: %j', aGatewaysOptions );
//TODO: in the future a technology could have multiple gateway
	if( aGatewaysOptions ){
		_Technology._oGateway = new Gateway( aGatewaysOptions, {
			sID: _Technology.getID() + '-gateway'
		} );
		// Event 'error'
		_Technology._oGateway.on('error', function( oError, oGWEndpoint ) {
			_Technology.error('[ Gateway Endpoint ( ID: "%s" ) ] %s on "[ %s:%s ] %s:%s"...', oGWEndpoint.getID(), oError, oGWEndpoint.getType(), oGWEndpoint.getConnectionType(), oGWEndpoint.getHost(), oGWEndpoint.getPort() );
			_Technology.emit( 'error', oError, oGWEndpoint )
		});
		// Event 'data' and Event 'ancilla'
		_Technology._oGateway.on('data', function( oData, oGWEndpoint, iSocketIndex ) {
			_Technology.debug('[ Gateway Endpoint ( ID: "%s" ) ] data received from socket "%s": %s...', oGWEndpoint.getID(), iSocketIndex, oData.toString() );
			if( oGWEndpoint.__isAncillaEventsHandler() ){
				_Technology.emit( 'ancilla', oData, this, oGWEndpoint, iSocketIndex );
			} else {
				_Technology.emit( 'data', oData, this, oGWEndpoint, iSocketIndex );
			}
		});
		// Other unimportant events
		_Technology._oGateway.on('connection', function( oSocket, oGWEndpoint ) {
			var _sID = oGWEndpoint.getID();
			_Technology.debug('[ Gateway Endpoint ( ID: "%s" ) ] connection received from %s:%s...', _sID, oSocket.remoteAddress, oSocket.remotePort );
		});
		_Technology._oGateway.on('connect', function( oGWEndpoint ) {
			var _sID = oGWEndpoint.getID();
			_Technology.info('[ Technology ( ID: "%s" ) ][ Gateway Endpoint ( ID: "%s" ) ] connection estabilished with %s:%s...', _sID, oGWEndpoint.getHost(), oGWEndpoint.getPort() );
			var _oCoreEnpoint = _Technology.getCoreEndpoint();
			if( _sID == _oCoreEnpoint.getID() ){
				_Technology.trigger( {sType: Constant._EVENT_TYPE_INTRODUCE })
					.then( function(){ // Success
						_Technology.__oStatus.bIsIntroduced = true;
						if( _Technology.__isReady() ){
							_Technology.emit( 'ready' );
						}
					},
					function(){ //Failure
	// TODO: the failure in introducing itself shoudl restart another attempt after some time!
						_Technology.info('failed to introduce...' );
					})
				;
			}
		});
		/*
		_Technology._oGateway.on('close', function( iSocketIndex, oEndpoint, oGWEndpoint ) {
			_Technology.info('[ Gateway Endpoint ( ID: "%s" ) ] connection closed from socket "%s"...', oGWEndpoint.getID(), iSocketIndex );
			_Technology.emit( 'gatewayClose', iSocketIndex, oEndpoint, oGWEndpoint, this );
		});
		*/
		// Event 'ready' ( When the gateway is ready triggering event "ready" on technology )
		_Technology._oGateway.on( 'ready', function(){
			_Technology.__oStatus.bGatewayReady = true;
			if( _Technology.__isReady() ){
				_Technology.emit( 'ready' );
			} else {
				_Technology.emit( 'gatewayReady' );
			}
		});
	} else {
		_Technology.info('No endpoint configured.');
		_Technology.emit( 'ready' );
	}
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
Technology.prototype.getID=function(){
	return this.__oOptions.sID;
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
Technology.prototype.getType=function(){
	return this.__oOptions.sType;
}

/**
 * Method called when the technology is ready to process
 *
 * @method		onGatewayReady
 * @public
 *
 * @example
 *   Technology.onGatewayReady();
 */
Technology.prototype.onGatewayReady = function(){
	this.info( 'Technology gateway is ready...' );
}

/**
 * Method called to check if the technology is in ready state
 *
 * @method    __isReady
 * @private
 *
 * @example
 *   Technology.__isReady();
 */
Technology.prototype.__isReady = function(){
	return (  this.__oStatus.bIsIntroduced && this.__oStatus.bGatewayReady );
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
Technology.prototype.onReady = function(){
	this.info( 'Technology is ready...' );
}

/**
 * Method called to returned the Gateway linked to current technology
 *
 * @method    getGateway
 * @public
 *
 * @return    {Object}	oGateway			It returns the linked Gateway object
 *
 * @example
 *   Technology.getGateway();
 */
Technology.prototype.getGateway = function(){
	return this._oGateway;
}

/**
 * Method used to get all the endpoints added to the current technology; if ID is used as an argument only the specific endpoint pointed by the ID will be returned
 *
 * @method    getEndpoints
 * @public
 *
 * @param     {String}			sID								If used, it will return only the endpoint with such ID
 *
 * @return    {Array[]/Object}	aEndpoints/oEndpoint			It returns array of endpoints or the endpoint with the passed ID
 *
 * @example
 *   Technology.getEndpoints();
 *   Technology.getEndpoints( 'Core' );
 */
Technology.prototype.getEndpoints = function( sID ){
	return this.getGateway().getEndpoints( sID );
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
Technology.prototype.getCoreEndpoint = function(){
	return this.getGateway().getEndpoints( 'Core' );
}

/**
 * Method used to write a buffer to an endpoint specified by its ID
 *
 * @method    write
 * @public
 *
 * @param     {Integer}		sGWEndpointID	The endpoint's ID used to write
 * @param     {Object}		oData			The data buffer ( http://nodejs.org/api/buffer.html ) to write
 * @param     {String}		[sEncoding]		The data encoding type used to write
 * @param     {Function}    [fCallback]		The callback function to call after the write operation is completed
 *
 * @return    {Void}
 *
 * @example
 *   Technology.write( 'Core', oData, 'utf8' );
 */
Technology.prototype.write = function( sGWEndpointID, oData, sEncoding, fCallback ){
	this.getGateway().write( sGWEndpointID, oData, sEncoding, fCallback );
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
Technology.prototype.trigger = function( oEventOptions ){
	oEventOptions = Tools.extend({
		sFromID: this.getID()
	}, oEventOptions );
	var _Technology = this;
	var _oTimeoutHandler = null;
	var _oPromiseReturn = null;
	var _oAncillaEvent = new Event( oEventOptions );
	this.debug( 'sending to "%s" Ancilla event "%j"...', _oAncillaEvent.getTo(), _oAncillaEvent );
	if( _oAncillaEvent.needsAnswer() ){
		var _oPromiseWait4Answer = new Promise( function( fResolve, fReject ){
				// Storing Resolve function waiting for answer
				_Technology.__addDeferredAncillaRequest( _oAncillaEvent, fResolve );
			} )
			.then( function(){
					// Clearing Timeout
					clearTimeout( _oTimeoutHandler );
				}
			);
		// Promise to wait Timeout ( this promise will fail as soon as )
		var _oPromiseToWaitTimeout = new Promise( function( fResolve, fReject ){
			_oTimeoutHandler = setTimeout( function(){
				_Technology.error( 'Trigger event "%s" with ID: "%s "has not received a response in "%s" seconds.', _oAncillaEvent.getType(), _oAncillaEvent.getID(), _oAncillaEvent.getTimeout()/1000 );
				// Clearing sotred deferred ancilla request
				_Technology.__clearDeferredAncillaRequest( _oAncillaEvent, false );
				// Rejecting promise
				fReject( new Error('timeout'), _oAncillaEvent );
			}, _oAncillaEvent.getTimeout() );
		});
		// Promise Race
		_oPromiseReturn = Promise.race( [ _oPromiseWait4Answer, _oPromiseToWaitTimeout ] );
	} else {
		// this is a fake promise because we don't need to wait for an answer
		_oPromiseReturn = new Promise( function( fResolve, fReject ){
			// Sending event
			fResolve();
		});
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
Technology.prototype.__addDeferredAncillaRequest = function( oAncillaEvent, fResolveCallback, fCallback ){
	this.__oDefferedAncillaEvents[ oAncillaEvent.getID() ] = fResolveCallback;
	if( fCallback ){
		fCallback();
	}
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
Technology.prototype.__clearDeferredAncillaRequest = function( oAncillaEvent, bSuccess ){
	if( oAncillaEvent.needsAnswer() ){
		var _iAncillaEventID = oAncillaEvent.getID();
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
Technology.prototype.triggerAnswerTo = function( oAncillaEventRequest ){
	// Removing rist argument, sending the other arguments to Ancilla event method
	var _aArgs = Array.prototype.slice.call( arguments, 1 );
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
Technology.prototype.__loadAncillaEvent = function( sPath ){
	var _Technology = this;
	return new Promise( function( fResolve, fReject ){
		var _sAncillaEvent = Path.basename( sPath );
		try {
    	var _oDefine = require( sPath );
			var _sAncillaEvent = ( _oDefine ? _oDefine.name : null );
			var _fAncillaEvent = ( _oDefine ? _oDefine.event : null );
			if( _sAncillaEvent && _fAncillaEvent ){
				if( !_Technology.__aAncillaEvents[ _sAncillaEvent ] ){
	    		_Technology.__aAncillaEvents[ _sAncillaEvent ] = _fAncillaEvent;
				}
			} else {
				throw new Error( 'wrong Ancilla Event library' );
			}
			// Returning imported Ancilla Event
			_Technology.debug( 'Loaded Ancilla event "%s"', _sAncillaEvent );
		  fResolve( _Technology.__aAncillaEvents[ _sAncillaEvent ] );
		} catch( oError ){
				_Technology.error( '[ Error "%s" ] error on loading Ancilla event "%s" (%s)', oError, _sAncillaEvent, sPath );
				fReject( Constant._ERROR_EVENT_FAILED_TO_LOAD );
		}
	});
}

Technology.prototype.__logParseArguments = function( args ){
	var _aArgs = Array.prototype.slice.call( args );
	var _aTerminalStyle = this.__oOptions.aLogStyle;
	// Adding schema
	_aArgs[ 0 ] = '[ ' + Tools.__styleTerminalMessage( 'Technology "%s"', _aTerminalStyle ) + ' ] ' + _aArgs[ 0 ];
	// Adding value schema
	_aArgs.splice( 1, 0, this.getID() );
	return _aArgs;
}

Technology.prototype.info = function(){
	// Adding technology header to current info
	var _aArguments = this.__logParseArguments( arguments );
	Tools.info.apply( Tools, _aArguments );
	// Using default arguments intead of the one with technology header
	var _oLogRotation = winston.loggers.get('log-rotation');
	if( _oLogRotation ){
		_oLogRotation.info.apply( _oLogRotation, arguments );
	}
}
Technology.prototype.debug = function(){
	// Adding technology header to current info
	var _aArguments = this.__logParseArguments( arguments );
	Tools.debug.apply( Tools, _aArguments );
	var _oLogRotation = winston.loggers.get('log-rotation');
	// Using default arguments instead of the one with technology header and adding 'debug' parameter
	var _oLogRotation = winston.loggers.get('log-rotation');
	if( _oLogRotation ){
		var _aArgs = Array.prototype.slice.call( arguments );
		_aArgs.unshift( 'debug' );
		_oLogRotation.log.apply( _oLogRotation, _aArgs );
	}
}
Technology.prototype.warn = function(){
	// Adding technology header to current info
	var _aArguments = this.__logParseArguments( arguments );
	Tools.error.apply( Tools, _aArguments );
	// Using default arguments instead of the one with technology header and adding 'debug' parameter
	var _oLogRotation = winston.loggers.get('log-rotation');
	if( _oLogRotation ){
		_oLogRotation.error.apply( _oLogRotation, arguments );
	}
}
Technology.prototype.error = function(){
	// Adding technology header to current info
	var _aArguments = this.__logParseArguments( arguments );
	Tools.error.apply( Tools, _aArguments );
	// Using default arguments instead of the one with technology header and adding 'debug' parameter
	var _oLogRotation = winston.loggers.get('log-rotation');
	if( _oLogRotation ){
		_oLogRotation.error.apply( _oLogRotation, arguments );
	}
}

Technology.prototype.export = function ( oCurrentModule, oOptions ) {
		if( require.main === oCurrentModule ){
				// Arguments
				var _oArgs = Tools.processArgs( process.argv.slice( 2 ) );
				var _sProcessName = Path.basename( oCurrentModule.filename );
				oOptions = Tools.extend({
					sCwd: Path.dirname( oCurrentModule.filename ),
					bDebug: ( false || _oArgs.debug )
				}, _oArgs );
				return this.run( oOptions, oCurrentModule );
		} else {
				return this.constructor;
		}
};
module.exports = Technology;
