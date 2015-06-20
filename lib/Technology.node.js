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

var EventEmitter = require( 'events' ).EventEmitter;
var Fs = require('fs-extra');
var Path =  require('path');
var Promise = require('bluebird');

/**
 * A generic class to describe a generic Technology behaviour
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
	// Default Technology Options
	oTechnologyOptions = Tools.extend({
		sID: 'tech-' + Math.random(),
		sType: 'unknown',
		sDBPath: '.', // TODO: process.cwd(), // DB persistent path should be where the script technology is located
		sDBPathTmp: ( Tools.isOSWin() ? '.' : '/tmp' ), // TODO: DB volatile path should be located on TMP under UNIX or ? under Windows
		bUseDB: true,
		iVersion : 0,
		bDebug: false,
		aLogStyle: Tools.__styleTerminalGetRandom() // Chalk Log style array [ Modifier, Colour, Background ]
	}, oTechnologyOptions );
	// Other options dependant from sType initialization
	oTechnologyOptions = Tools.extend({
		sDBName: oTechnologyOptions.sType + '.' + oTechnologyOptions.sID + '.sqlite',
		//sUpdatePath: process.cwd(), // Update file should be where the script technology is located
		sUpdatePath: '.',
		sUpdateName: oTechnologyOptions.sType + '.update.sql'
	}, oTechnologyOptions );
	// Init variables
	this.__oOptions = oTechnologyOptions;
	this.debug( 'Starting technology with following options:\n\t%j\n', oTechnologyOptions );
	this.__oDefferedAncillaEvents = {};
	this.__oStatus = {
		bGatewayReady: false,
		bIsIntroduced: false
	};
	this.__sDBVersion = null;
	this.info( 'Starting technology [ version: "%s" ] ...', this.__oOptions.iVersion );
	if( oTechnologyOptions.bUseDB ){
		this.__registerEvents(
			Tools.proxy( this.__swapDB, this, this.__DBgetRelativePersistantPath(), this.__DBgetRelativePath(), Tools.proxy(
				this.__DBinit, this, Tools.proxy(
					this.__initGWs, this, this.__oOptions.aEndpoints
					)
				)
			)
		);
	} else {
		this.debug( 'DB not needed' );
		this.__registerEvents( Tools.proxy( this.__initGWs, this, this.__oOptions.aEndpoints ) );
	}
}
Tools.inherits( Technology, EventEmitter );

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
			this.debug( '[ Technology "%s" ] calling event "%s" handler ( "%s" ) with "%s" parameters...', sEvent, _sHandlerEventFunction, _aArgs.length );
			if( this[ _sHandlerEventFunction ] ){
				this[ _sHandlerEventFunction ].apply( this, _aArgs );
			} else {
				this.error( 'received event "%s" but missing method "%s" to handle event...', sEvent, _sHandlerEventFunction );
			}
		break;
	}
}

/**
 * Method called to initialize DB
 *
 * @method    __DBinit
 * @private
 *
 * @param	{Function}	fCallback		The callback function to call when the initialize DB operation is completed
 *
 * @example
 *   Technology.__DBinit( fCallback );
 */
Technology.prototype.__DBinit = function( fCallback ){
	var _Technology = this;
	this.debug( 'Checking DB "%s" ( Path: "%s" )', _Technology.__oOptions.sDBName, _Technology.__DBgetRelativePath() );
	_Technology._oDB = new DB( _Technology.__DBgetRelativePath() );
	var _oDB = _Technology._oDB;
	_oDB.query( [
		"CREATE TABLE IF NOT EXISTS __DBSTATUS ( ID INTEGER PRIMARY KEY AUTOINCREMENT, KEY STRING UNIQUE, VALUE STRING );",
		"SELECT VALUE FROM __DBSTATUS WHERE KEY='version';"
		], function( iError, oRows, sQuery ){
			if( iError == 0 ){
				_Technology.__sDBVersion = ( oRows && oRows.length != 0 ? oRows[ 0 ].VALUE : '0.0.0' );
				_Technology.debug( 'DB Version: %s', _Technology.__sDBVersion );
				// Checking configured Path
				var _sUpdateFilePath = _Technology.__UpdateGetRelativePath();
				Fs.exists( _sUpdateFilePath, function( bExists ){
					if( bExists ){
						// Update DB if needed
						_Technology.__DBReadUpdateFile( _sUpdateFilePath, fCallback );
					} else {
						_Technology.info( 'No queries found on "%s" to update technology\'s DB...', _Technology.__UpdateGetRelativePath() );
						if( fCallback ){
							fCallback();
						}
					}
				});
			} else {
				_Technology.error( 'Failed to initialize DB' );
			}
	} );
}
/**
 * Method called to read SQL queries from a file to update the DB
 *
 * @method    __DBReadUpdateFile
 * @private
 *
 * @param	{String}	sUpdateFilePath		The oath for SQL file to read
 * @param	{Function}	fCallback			The callback function to call when the DB update is completed
 *
 * @example
 *   Technology.__DBReadUpdateFile();
 */
Technology.prototype.__DBReadUpdateFile = function( sUpdateFilePath, fCallback ){
	var _Technology = this;
	Fs.readFile( sUpdateFilePath, 'utf8', function ( oError, oData ){
		if( oError ){
			_Technology.error( 'Unable to read update file "%s"...', sUpdateFilePath );
		} else {
			_Technology.__DBupdate( oData, fCallback );
		}
	});
}
/**
 * Method called to get the SQL DB's handler
 *
 * @method    __DBget
 * @private
 *
 * @return    {Object}	oDB			It returns the SQL DB's handler
 *
 * @example
 *   Technology.__DBget();
 */
Technology.prototype.__DBget = function( sQueries ){
	return this._oDB;
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
	return this.__oOptions.sDBPath + '/' + this.__oOptions.sDBName;
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
	return this.__oOptions.sDBPathTmp + '/' + this.__oOptions.sDBName;
}
/**
 * Method called to update the DB
 *
 * @method    __DBupdate
 * @private
 *
 * @param	{String}	sData			The string with all the SQL entries ( custom entries, used as SQL comments, will determine the string's portions to use to update the current DB with the current version )
 * @param	{Function}	fCallback		The callback function to call when the DB update is completed
 *
 * @example
 *   Technology.__DBupdate( sData, fCallback );
 */
Technology.prototype.__DBupdate = function( sData, fCallback ){
	var _Technology = this;
	var _aData = sData.split( new RegExp( '(--{{ UPDATE: )(\\d\\.\\d\\.\\d)( to )(\\d\\.\\d\\.\\d)( }})', 'gm' ) );
	var _iOffset = 0;
	var _bFoundCurrentVersion = false;
	var _aBufferUpdate = new Array();
	var _sStartVersion = this.__sDBVersion;
	var _sEndVersion = null;
	while( typeof _aData[ _iOffset + 2 ] != 'undefined' ){
		var _sCurrentStartVersion = _aData[ ( _iOffset + 2 ) ];
		var _sCurrentEndVersion = _aData[ ( _iOffset + 4 ) ];
		_sEndVersion = _sCurrentEndVersion;
		var _sCurrentQuery = _aData[ ( _iOffset + 6 ) ];
		if( this.__sDBVersion == _sStartVersion ){
			_bFoundCurrentVersion = true;
		}
		if( _bFoundCurrentVersion ){
			_aBufferUpdate = _aBufferUpdate.concat( _sCurrentQuery.split( '\n' ) );
		}
		_iOffset = _iOffset + 6;
	}
	if( _sStartVersion!=_sEndVersion ){
		_aBufferUpdate.push( "INSERT OR REPLACE INTO __DBSTATUS ( 'KEY' , 'VALUE' ) VALUES ( 'version', '" + _sEndVersion + "' );" );
		//Cleaning empty lines
		_aBufferUpdate = _aBufferUpdate.filter( function( sLine ){ return ( sLine && sLine.trim().substring( 0, 2 )!='--' ) } );
		this.info( 'Updating DB from version "%s" to version "%s"', _sStartVersion, _sEndVersion );
		this.__DBget().query( _aBufferUpdate, function( iError, oRows, sQuery ){
			if( iError == 0 ){
				_Technology.info( 'DB updated successfully to version "%s"', _sEndVersion );
				if( fCallback ){
					fCallback();
				}
			} else {
				_Technology.error( 'Error ( %s ): unable to update DB to version "%s"; technology won\'t be started.', _Technology.getID(), iError, _sEndVersion );
			}
		}, {
			bUseTransaction: true,
			bCloseDB: true,
		});
	} else {
		this.info( 'DB Already updated to latest version: "%s"', _sStartVersion );
		if( fCallback ){
			fCallback();
		}
	}
}

/**
 * Method used to swap the DB file from a source path to a destination path
 *
 * @method    __swapDB
 * @private
 *
 * @param     {String}			sSourcePath							DB source Path
 * @param     {String}			sDestinationPath					DB destination Path
 * @param     {Function}		fCallback							Callback function to call when swap operation is completed
 *
 * @example
 *   Technology.__swapDB( sSourcePath, sDestinationPath );
 */
Technology.prototype.__swapDB = function( sSourcePath, sDestinationPath, fCallback ){
	var _oTechnology = this;
	if( sSourcePath != sDestinationPath ){
		Fs.exists( sSourcePath, function( bExists ){
			if( bExists ){
				Fs.copy( sSourcePath, sDestinationPath, function( oError ){
					if( oError ){
						_oTechnology.error( 'Error "%s": Swapped DB failed from "%s" to "%s"...', oError, sSourcePath, sDestinationPath );
					} else {
						_oTechnology.info( 'Swapped DB from "%s" to "%s"...', sSourcePath, sDestinationPath );
					}
					if( fCallback ){
						fCallback();
					}
				});
			} else {
				_oTechnology.info( 'SwapDB operation unable to complete: missing source: "%s"...', sSourcePath );
				if( fCallback ){
					fCallback();
				}
			}
		});
	} else {
		this.info( 'Swap DB operation not necessary. Destination and Source are the same path: "%s"...', sSourcePath );
		if( fCallback ){
			fCallback();
		}
	}
}

/**
 * Method called to get the relative path to the DB Update file
 *
 * @method    __UpdateGetRelativePath
 * @private
 *
 * @return    {String}	sPath			It returns the relative path for the current DB Update file
 *
 * @example
 *   Technology.__UpdateGetRelativePath();
 */
Technology.prototype.__UpdateGetRelativePath = function(){
	return this.__oOptions.sUpdatePath + '/' + this.__oOptions.sUpdateName;
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
	var _aArguments = this.__logParseArguments( arguments );
	Tools.info.apply( Tools, _aArguments );
}
Technology.prototype.debug = function(){
	var _aArguments = this.__logParseArguments( arguments );
	Tools.debug.apply( Tools, _aArguments );
}
Technology.prototype.error = function(){
	var _aArguments = this.__logParseArguments( arguments );
	Tools.error.apply( Tools, _aArguments );
}

module.exports = Technology;