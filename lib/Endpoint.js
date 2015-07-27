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
var Tools = require('./Tools.js');

var EventEmitter = require( 'events' ).EventEmitter;
var _ = require('lodash');

/**
 * Generic Endpoint
 *
 * The Endpoint will emit the following events
 * - data: Emitted when data is received.
 * - drain: Emitted when the write buffer becomes empty.
 * - timeout: Emitted if the connection times out from inactivity.
 * - close: Emitted once the connection is fully closed.
 * - error: Emitted when an error occurs.
 * - ready: Emitted when the gateway has created all its endpoints.
 *
 * @class	Endpoint
 * @public
 *
 * @param	{Object}   oOptions		A javascript objects describing the endpoint used by the gateway
 *
 * @return	{Void}
 *
 * @example
 *		new Endpoint( { type: 'net', connectionType: 'listen', host: 'localhost', port: 10001 } );
 *		new Endpoint( { type: 'net', connectionType: 'connect', host: '192.168.0.100', port: 10002 } );
 *		new Endpoint( { type: 'serial', port: '/dev/ttyS0', baudrate: 9600, databits: 8, stopbits: 1, parity: 'none', buffersize: 255 } );
 *		new Endpoint( { type: 'ws', connectionType: 'listen', port: 10003 } );
 *		new Endpoint( { type: 'wss', connectionType: 'listen', port: 10004 } );
 *		new Endpoint( { type: 'ws', connectionType: 'connect', host: '192.168.0.100', port: 10005 } );
 *		new Endpoint( { type: 'wss', connectionType: 'connect', host: '192.168.0.100', port: 10006 } );
 */
class Endpoint extends EventEmitter {

	constructor( oOptions ){
		// Calling super constructor
		super();
		// Default Options
		oOptions = _.extend({
			id: 'DefaultEndpoint',
			type: 'net',
			connectionType: 'listen',
			reconnect: true,
			reconnectionDelay: 10,	//Seconds
			reconnectionAttempts: -1,	//Infinite attempts
			isAncillaEventsHandler: false
		}, oOptions );
		//Default Options by connectionType
		oOptions = _.extend( {
			host: ( oOptions.connectionType === 'connect' ?  'localhost' : Tools.getLocalIPs( 0 ) )
		}, oOptions );
		// Init properties
		this.__oOptions = oOptions;
		this.__oConnectedSockets = [];
		this.__oConnectedSocketsID = {};
		this.__bReady = false;
		this.__iConnectionTimerHandler = null;
		this.__iConnectionAttempsts = 0;
		// Creating Emitter
		this.__createEmitter();
	}

	/**
	 * Method used to create the Endpoint's emitter
	 *
	 * @method    __createEmitter
	 * @private
	 *
	 *
	 * @return    {Object}	The endpoint's emitter
	 *
	 * @example
	 *   Endpoint.__createEmitter();
	 */
	__createEmitter(){
		var _oGatewayEndpoint = this;
		var Emitter = null;
		if( !this.getEmitter() ){
			switch( this.getConnectionType() ){
				case 'serial':
					Emitter = require( './Endpoint.serial.js' );
				break;
				case 'wss':
				case 'ws':
					Emitter = require( './Endpoint.websocket.js' );
				break;
				case 'web':
					Emitter = require( './Endpoint.web.js' );
				break;
				case 'net':
					Emitter = require( './Endpoint.net.js' );
				break;
				default:
					Tools.error( '[ Endpoint ( ID: %s ) ] Error: unable to determine endpoint type from "%s"', _oGatewayEndpoint.getID(), this.getConnectionType() );
				break;
			}
			if( Emitter ){ //if Class exists
				this.__iConnectionAttempsts++;
				Tools.debug( '[ Endpoint ( ID: %s ) ] Creating Emitter from options: "%j" ( Attempt number: "%s" )', _oGatewayEndpoint.getID(), this.__oOptions, this.__iConnectionAttempsts );
				var _oEmitter = new Emitter( this.__oOptions );
				//Generic events
				_oEmitter.on( 'listening', function() {
					Tools.debug('[ Endpoint ( ID: %s ) ] is ready...', _oGatewayEndpoint.getID() );
					_oGatewayEndpoint.__bReady = true;
					_oGatewayEndpoint.emit( 'ready' );
				});
				_oEmitter.on( 'connect', function() {
					Tools.debug('[ Endpoint ( ID: %s ) ] connection estabilished with "%s:%s"...', _oGatewayEndpoint.getID(), _oGatewayEndpoint.getHost(), _oGatewayEndpoint.getPort() );
					_oGatewayEndpoint.__bReady = true;
					_oGatewayEndpoint.emit( 'connect' );
					_oGatewayEndpoint.emit( 'ready' );
				});
				_oEmitter.on('data', function( oData, iSocketIndex ) {
					Tools.debug('[ Endpoint ( ID: %s ) ] Data received from socket with index "%s": "%s"...', _oGatewayEndpoint.getID(), iSocketIndex, oData.toString('hex') );
					_oGatewayEndpoint.emit('data', oData, iSocketIndex );
				});
				_oEmitter.on('drain', function( oData ) {
					Tools.debug('[ Endpoint ( ID: %s ) ] Data drained: "%s"...', _oGatewayEndpoint.getID(), oData.toString('hex') );
					_oGatewayEndpoint.emit('drain', oData );
				});
				_oEmitter.on('timeout', function() {
					Tools.debug( '[ Endpoint ( ID: %s ) ] Timeout', _oGatewayEndpoint.getID() );
					_oGatewayEndpoint.emit('timeout' );
				});
				_oEmitter.on('close', function( iSocketIndex ) {
					Tools.debug( '[ Endpoint ( ID: %s ) ] Socket "%j" closed', _oGatewayEndpoint.getID(), iSocketIndex );
					_oGatewayEndpoint.emit('close', iSocketIndex, this );
				});
				_oEmitter.on('error', function( oError ) {
					if( oError.code === 'ECONNREFUSED' || oError.code === 'ETIMEDOUT' ){
						// Checking if endpoint can be reconnected
						var _bCanReconnect = _oGatewayEndpoint.__canReconnect();
						if( _bCanReconnect ){
							Tools.info( '[ Endpoint ( ID: "%s" ) ] Re-connection attempt number:"%s" in "%s" seconds.', _oGatewayEndpoint.getID(), ( _oGatewayEndpoint.__iConnectionAttempsts + 1 ) , _oGatewayEndpoint.__oOptions.reconnectionDelay );
							// Calling __createEmitter after a specific delay
							clearTimeout( _oGatewayEndpoint.__iConnectionTimerHandler );
							_oGatewayEndpoint.__iConnectionTimerHandler = setTimeout(  Tools.proxy( _oGatewayEndpoint.__createEmitter, _oGatewayEndpoint ), ( _oGatewayEndpoint.__oOptions.reconnectionDelay * 1000 ) );
						} else {
							Tools.info( '[ Endpoint ( ID: "%s" ) ] failed all allowed attempts to reconect. %s', _oGatewayEndpoint.getID(), oError );
						}

					} else {
						Tools.error( '[ Endpoint ( ID: "%s" ) ] %s', _oGatewayEndpoint.getID(), oError );
					}
					_oGatewayEndpoint.emit('error', oError );
				});
				//Specific connection type events
				switch( this.getType() ){
					case 'listen':
						//Listen Events
						_oEmitter.on('connection', function( oSocket ) {
							var _oSocket = ( oSocket._socket ? oSocket._socket : oSocket ); // Transforming for websockets custom environment
							Tools.debug('[ Endpoint ( ID: %s ) ] connection received from "%s:%s"...', _oGatewayEndpoint.getID(), _oSocket.remoteAddress, _oSocket.remotePort );
							var _iSocketIndex = _oGatewayEndpoint.getConnectedSockets().length;
							_oGatewayEndpoint.__addToConnectedSockets( oSocket );
							// Socket Event: data
							oSocket.on('data', function( oData ) {  // client writes message
								Tools.debug('[ Endpoint ( ID: %s ) ] Data received: "%s" from connected client "%s:%s"...', _oGatewayEndpoint.getID(), oData.toString('hex'), _oSocket.remoteAddress, _oSocket.remotePort );
								_oEmitter.emit( 'data', oData, _iSocketIndex );
							});
							// Socket Event: message ( same behaviour has socket event: data )
							oSocket.on( 'message', function( oData ) {  // client writes message
								Tools.debug('[ Endpoint ( ID: %s ) ] Data received: "%s" from connected client "%s:%s"...', _oGatewayEndpoint.getID(), oData.toString('hex'), _oSocket.remoteAddress, _oSocket.remotePort );
								_oEmitter.emit( 'data', oData, _iSocketIndex );
							});
							// Socket Event: drain
							oSocket.on('drain', function( oData ) {  // client writes message and leave empty place
								Tools.debug('[ Endpoint ( ID: %s ) ] Data drained: "%s" from connected client "%s:%s"...', _oGatewayEndpoint.getID(), oData.toString('hex'), _oSocket.remoteAddress, _oSocket.remotePort );
								_oEmitter.emit( 'drain', oData );
							});
							// Socket Event: end
							oSocket.on('end', function() { // client disconnects
								Tools.debug('[ Endpoint ( ID: %s ) ] Socket "%s" ( "%s:%s" ) has been disconnected...', _oGatewayEndpoint.getID(), _iSocketIndex, _oSocket.remoteAddres, _oSocket.remotePort );
								_oEmitter.emit( 'close', _iSocketIndex );
								_oGatewayEndpoint.__removeFromConnectedSockets( _iSocketIndex );
							});
							// Socket Event: close
							oSocket.on('close', function() { // client disconnects
								Tools.debug('[ Endpoint ( ID: %s ) ] Socket "%s" ( "%s:%s" ) has been disconnected...', _oGatewayEndpoint.getID(), _iSocketIndex, _oSocket.remoteAddres, _oSocket.remotePort );
								_oEmitter.emit( 'close', _iSocketIndex );
								_oGatewayEndpoint.__removeFromConnectedSockets( _iSocketIndex );
							});
							_oGatewayEndpoint.emit( 'connection', oSocket );
						});
					break;
					default:
						//Nothing to do
					break;
				}
				//Remembering emitter
				this.setEmitter( _oEmitter );
			} else {
				Tools.error( '[ Endpoint ( ID: %s ) ] missing class emitter for connection type "%s"...', _oGatewayEndpoint.getID(), this.getConnectionType()  );
			}
		} else {
			// Recreating Emitter
			delete this._oEmitter;
			this.__createEmitter();
		}
	}

	/**
	 * Method used to return the Endpoint's emitter
	 *
	 * @method    getEmitter
	 * @public
	 *
	 *
	 * @return    {Object}	The endpoint's emitter
	 *
	 * @example
	 *   Endpoint.getEmitter();
	 */
	getEmitter(){
		return this._oEmitter;
	}
	/**
	 * Method used to return if the Endpoint is ready
	 *
	 * @method    isReady
	 * @public
	 *
	 *
	 * @return    {Boolean}	The endpoint's ready state
	 *
	 * @example
	 *   Endpoint.isReady();
	 */
	isReady(){
		return this.__bReady;
	}
	/**
	 * Method used to get the current endpoint ID
	 *
	 * @method    getID
	 * @public
	 *
	 * @return    {String}	sID			It returns the unique endpoint's string ID
	 *
	 * @example
	 *   Endpoint.getID();
	 */
	getID(){
		return this.__oOptions.id;
	}
	/**
	 * Method used to return if the endpoint's connection type ( "listen" or "connect" )
	 *
	 * @method    getConnectionType
	 * @public
	 *
	 *
	 * @return    {String}	The endpoint's connection type ( "listen" or "connect" )
	 *
	 * @example
	 *   Endpoint.getConnectionType();
	 */
	getConnectionType(){
		return this.__oOptions.connectionType;
	}
	/**
	 * Method used to return if the endpoint's type ( "net", "serial", "ws" or "wss" )
	 *
	 * @method    getType
	 * @public
	 *
	 *
	 * @return    {String}	The endpoint's type ( "net", "serial", "ws" or "wss" )
	 *
	 * @example
	 *   Endpoint.getType();
	 */
	getType(){
		return this.__oOptions.type;
	}
	/**
	 * Method used to return if the endpoint's host
	 *
	 * @method    getHost
	 * @public
	 *
	 *
	 * @return    {String}	The endpoint's host
	 *
	 * @example
	 *   Endpoint.getHost();
	 */
	getHost(){
		return this.__oOptions.host;
	}
	/**
	 * Method used to return if the endpoint's port
	 *
	 * @method    getPort
	 * @public
	 *
	 *
	 * @return    {String}	The endpoint's port
	 *
	 * @example
	 *   Endpoint.getPort();
	 */
	getPort(){
		return this.__oOptions.port;
	}
	/**
	 * Method used to return the  connected sockets to the Endpoint
	 *
	 * @method    getConnectedSockets
	 * @public
	 *
	 * @param     {Integer}		[iIndex] If used, it will return only the scoket with such index
	 *
	 * @return    {Object[]}	An array of sockets connect to the Endpoint
	 *
	 * @example
	 *   Endpoint.getConnectedSockets();
	 */
	getConnectedSockets( iIndex ){
		if( typeof iIndex === 'undefined' ){
			return this.__oConnectedSockets;
		} else {
			return this.__oConnectedSockets[ iIndex ];
		}
	}
	/**
	 * Method used to set a specific ID to a connected socket
	 *
	 * @method    setConnectedSocketID
	 * @public
	 *
	 * @param     {sID}				sID				The socket ID to set
	 * @param     {Number}		iIndex		The socket index to which set the ID
	 *
	 * @return    {Void}
	 *
	 * @example
	 *   Endpoint.setConnectedSocketID( 'socketOne' );
	 */
	setConnectedSocketID( iIndex, sID ){
		var _sCurrentID = this.__oConnectedSocketsID[ sID ];
		if( !_sCurrentID ){
			Tools.debug( '[ Endpoint ( ID: "%s" ) ] connected socket with index: "%s" is now known as "%s"... ', this.getID(), iIndex, sID );
			this.__oConnectedSocketsID[ sID ] = iIndex;
		} else {
			Tools.error( '[ Endpoint ( ID: "%s" ) ] already known a connected socket with index: "%s" as "%s"; ignoring operation set ID "%s"... ', this.getID(), iIndex, _sCurrentID, sID );
		}
	}
	/**
	 * Method used to return the connected socket from it's ID or it's Index
	 *
	 * @method    getConnectedSocket
	 * @public
	 *
	 * @param     {Number/String}		indexOrID		connected socket ID or index
	 *
	 * @return    {Object}	The selected connected socket to the Endpoint
	 *
	 * @example
	 *   Endpoint.getConnectedSocket( 'socketOne' );
	*   Endpoint.getConnectedSocket( 1 );
	 */
	getConnectedSocket( indexOrID ){
		var _oSocket = null;
		switch( typeof indexOrID ){
			case 'string': // It's an ID
					var _iIndex = this.__oConnectedSocketsID[ indexOrID ];
					if( typeof _iIndex !== 'undefined' ){
						_oSocket = this.getConnectedSockets( _iIndex );
					}
				break;
			case 'number': // It's an index!
				_oSocket = this.getConnectedSockets( indexOrID );
				break;
			default: // It's nothing I care! ;)
				break;
		}
		return _oSocket;
	}
	/**
	 * Method used to add a socket to the connected socket list
	 *
	 * @method    __addToConnectedSockets
	 * @private
	 *
	 * @param	{Object}   oSocket		The connected socket to add to the list
	 *
	 * @example
	 *   Endpoint.__addToConnectedSockets( oSocket );
	 */
	__addToConnectedSockets( oSocket ){
		this.getConnectedSockets().push( oSocket );
	}
	/**
	 * Method used to remove a socket from the connected socket list
	 *
	 * @method    __removeFromConnectedSockets
	 * @private
	 *
	 * @param	{Object}   oSocket		The socket to remove from the list
	 *
	 * @example
	 *   Endpoint.__removeFromConnectedSockets( oSocket );
	 */
	__removeFromConnectedSockets( iSocketIndex ){
		// Clearing matrix of sockets by ID
		for( var _sID in this.__oConnectedSocketsID ){
			if( this.__oConnectedSocketsID[ _sID ] === iSocketIndex ){
				delete this.__oConnectedSocketsID[ _sID ];
			}
		}
		// Clearing matrix of sockets by index
		delete this.__oConnectedSockets[ iSocketIndex ];
	}
	/**
	 * Method used to set the emitter to use in the current endpoint
	 *
	 * @method    setEmitter
	 * @public
	 *
	 * @param	{Object}   oEmitter		The emitter to use in the current endpoint
	 *
	 * @example
	 *   Endpoint.setEmitter( oEmitter );
	 */
	setEmitter( oEmitter ){
		this._oEmitter = oEmitter;
	}
	/**
	 * Method used to write a buffer on the current endpoint
	 *
	 * @method    write
	 * @public
	 *
	 * @param	{Object}   oData		The buffer to write
	 * @param	{String}   sEncoding	The encoding type
	 * @param	{Function}   fCallback	The callback function to call when write operation has been completed
	 *
	 * @example
	 *   Endpoint.write( oData, sEncoding, fCallback );
	 */
	write( oData, sEncoding, fCallback ){
		switch( this.getType() ){
			case 'connect':
				Tools.debug( '[ Endpoint ( ID: "%s" ) ] writing: "%s"... ', this.getID(), oData.toString('hex') );
				this.getEmitter().write( oData, sEncoding, fCallback );
			break;
			case 'listen':
				var _aConnectedSockets = this.getConnectedSockets();
				for( let _oConnectedSocket of _aConnectedSockets ){
					Tools.debug( '[ Endpoint ( ID: "%s" ) ] Writing on connected socket: "%s:%s"', this.getID(), _oConnectedSocket.remoteAddress, _oConnectedSocket.remotePort );
					_oConnectedSocket.write( oData, sEncoding, fCallback );
				}
			break;
		}
	}
	/**
	 * Method used to decide if and endpoint can reconnect on 'ECONNREFUSED' or 'ETIMEDOUT' error
	 *
	 * @method    __canReconnect
	 * @private
	 *
	 * @example
	 *   Endpoint.__canReconnect();
	 */
	__canReconnect(){
		var _bResult = this.__oOptions.reconnect;
		if( _bResult ){
			Tools.debug( '[ Endpoint ( ID: "%s" ) ] Re-connection enabled.', this.getID() );
			// Checking # of Re-connection attempts
			if( this.__oOptions.reconnectionAttempts > 0 ){
				_bResult = ( this.__oOptions.reconnectionAttempts < this.__iConnectionAttempsts ? true : false );
			} else {
				_bResult = true;
				Tools.debug( '[ Endpoint ( ID: "%s" ) ] can be re-connected without limits in the attempts.', this.getID() );
			}
		} else {
			Tools.debug( '[ Endpoint ( ID: "%s" ) ] Re-connection disabled.', this.getID() );
		}
		return _bResult;
	}
	/**
	 * Method used to decide if and endpoint is meant to handle Ancilla events or Data events
	 *
	 * @method    __isAncillaEventsHandler
	 * @private
	 *
	 * @example
	 *   Endpoint.__isAncillaEventsHandler();
	 */
	__isAncillaEventsHandler(){
		return this.__oOptions.isAncillaEventsHandler;
	}

}

module.exports = Endpoint;
