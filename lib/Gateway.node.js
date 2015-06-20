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
var GatewayEndpoint = require('./Gateway.endpoint.node.js');
var Tools = require('./Tools.node.js');

var EventEmitter = require( 'events' ).EventEmitter;

/**
 * Generic Gateway used by to open a channel between different endpoints
 *
 * The Gateway will emit the following events
 * - data: Emitted when data is received.
 * - drain: Emitted when the write buffer becomes empty.
 * - timeout: Emitted if the connection times out from inactivity.
 * - close: Emitted once the connection is fully closed.
 * - error: Emitted when an error occurs.
 * - ready: Emitted when the gateway has created all its endpoints.
 *
 * @class	Gateway
 * @public
 *
 * @param	{Object[]}   aEndpointsOptions		An array of javascript objects describing the endpoints used by the gateway
 *
 * @return	{Void}
 *
 * @example
 *		new Gateway([{ type: 'net', connectionType: 'listen', host: 'localhost', port: 10001 }]);
 *		new Gateway([{ type: 'net', connectionType: 'connect', host: '192.168.0.100', port: 10002 }]);
 *		new Gateway([{ type: 'serial', port: '/dev/ttyS0', baudrate: 9600, databits: 8, stopbits: 1, parity: 'none', buffersize: 255 }]);
 *		new Gateway([{ type: 'ws', connectionType: 'listen', port: 10003 }]);
 *		new Gateway([{ type: 'wss', connectionType: 'listen', port: 10004 }]);
 *		new Gateway([{ type: 'ws', connectionType: 'connect', host: '192.168.0.100', port: 10005 }]);
 *		new Gateway([{ type: 'wss', connectionType: 'connect', host: '192.168.0.100', port: 10006 }]);
 */
var Gateway=function( aEndpointsOptions, oGatewayOptions ){
	// Call the super constructor.
  EventEmitter.call( this );
	// Init Options
	aEndpointsOptions = aEndpointsOptions || [];
	// Init properties
	this._aGWEndpoints = {};
  this.__oOptions = oGatewayOptions;
	// Creating Endpoints
	var _oGateway = this;
	for( var _iIndex in aEndpointsOptions ){
		var _oCurrentGWEndpointOptions = Tools.extend( {
			id: 'DefaultEndpoint_' + _iIndex
		}, aEndpointsOptions[ _iIndex ] );
		this.addEndpoint( _oCurrentGWEndpointOptions );
	}
}
Tools.inherits( Gateway, EventEmitter );

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
 *   Gateway.write( 0, oData );
 */
Gateway.prototype.write = function( sGWEndpointID, oData, sEncoding, fCallback ){
	if( this._aGWEndpoints[ sGWEndpointID ] ){
		this._aGWEndpoints[ sGWEndpointID ].write( oData, sEncoding, fCallback );
	} else {
		Tools.error( '[ Gateway ] Unable to write on endpoint: "%s": missing endpoint...', sGWEndpointID );
	}
}

/**
 * Method used to add a new endpoint to the current Gateway
 *
 * @method    addEndpoint
 * @public
 *
 * @param     {Object}		oEndpointOptions	The options used to configure the new endpoint
 *
 * @return    {Object}		oEndpoint			It returns the added new endpoint
 *
 * @example
 *   Gateway.write( 0, oData );
 */
Gateway.prototype.addEndpoint = function( oEndpointOptions ){
	var _oGateway = this;
	var _oGWEndpoint = new GatewayEndpoint( oEndpointOptions );
	if( !_oGWEndpoint ){
		Tools.error( '[ Gateway ] Unable to create Gateway endpoint with the following options: %s', aEndpointsOptions );
	} else {
		// Handling ready event
		_oGWEndpoint.on( 'ready', function() {
			var _aEndpoints = _oGateway.getEndpoints();
			var _bReady = true;
			for( var _iIndex in _aEndpoints ){
				var _oEndpoint = _aEndpoints[ _iIndex ];
				var _bEndpointReady = _oEndpoint.isReady();
				if( _bEndpointReady ){
					_bReady = _bReady && _bEndpointReady;
				} else {
					_bReady = false;
					break;
				}
			}
			if( _bReady ){
				Tools.debug('[ Gateway ] is ready...' );
				_oGateway.emit( 'ready' );
			}
		});
/**
* Event emitted by the gateway when data is received
*
* @method    data
* @public
*
* @param     {Object}		oData				The data buffer ( http://nodejs.org/api/buffer.html ) received
* @param     {Object}		oGWEndpoint			The endpoint which received the data
*
* @return    {Void}
*
* @example
*   Gateway.on( 'data', function( oData, oGWEndpoint ) { ... } );
*/
		_oGWEndpoint.on('data', function( oData, iSocketIndex ) {
			Tools.debug('[ Gateway ][ Endpoint ( ID: %s ) ] Data received: "%s"...', this.getID(), oData.toString('hex') );
			_oGateway.emit( 'data', oData, this, iSocketIndex );
		});
/**
* Event emitted when the write buffer becomes empty
*
* @method    drain
* @public
*
* @param     {Object}		oData				The data buffer ( http://nodejs.org/api/buffer.html ) received
* @param     {Object}		oGWEndpoint			The endpoint which received the data
*
* @return    {Void}
*
* @example
*   Gateway.on( 'drain', function( oData, oGWEndpoint ) { ... } );
*/
		_oGWEndpoint.on('drain', function( oData ) {
			Tools.debug('[ Gateway ][ Endpoint ( ID: %s ) ] Data drained: "%s"...', this.getID(), oData.toString('hex') );
			_oGateway.emit( 'drain', oData, this );
		});
/**
* Event emitted if the connection times out from inactivity
*
* @method    timeout
* @public
*
* @param     {Object}		oGWEndpoint			The endpoint which emitted the timeout event
*
* @return    {Void}
*
* @example
*   Gateway.on( 'timeout', function( oGWEndpoint ) { ... } );
*/
		_oGWEndpoint.on('timeout', function() {
			//Tools.debug('[ Gateway ][ Endpoint ( ID: %s ) ] Timedout...', oGWEndpoint.getID() );
			_oGateway.emit( 'timeout', this );
		});
/**
* Event emitted once the connection is fully closed
*
* @method    close
* @public
*
* @param     {Object}		oGWEndpoint			The closed endpoint
*
* @return    {Void}
*
* @example
*   Gateway.on( 'close', function( oData, oGWEndpoint ) { ... } );
*/
		_oGWEndpoint.on('close', function( iSocketIndex, oEndpoint ) {
			Tools.debug('[ Gateway ][ Endpoint ( ID: %s ) ] Socket "%s" closed...', this.getID(), iSocketIndex );
			_oGateway.emit( 'close', iSocketIndex, oEndpoint, this );
		});
/**
* Event emitted when an error occurs
*
* @method    error
* @public
*
* @param     {Object}		oError				The error fired
* @param     {Object}		oGWEndpoint			The endpoint which generated the error
*
* @return    {Void}
*
* @example
*   Gateway.on( 'error', function( oError, oGWEndpoint ) { ... } );
*/
		_oGWEndpoint.on('error', function( oError ) {
			Tools.debug('[ Gateway ][ Endpoint ( ID: %s ) ] %s...', this.getID(), oError );
			_oGateway.emit( 'error', oError, this );
		});
/**
* Event emitted when connection has been estabilished
*
* @method    connection
* @public
*
* @param     {Object}		oSocket				The connected socket
* @param     {Object}		oGWEndpoint			The endpoint which generated the connection
*
* @return    {Void}
*
* @example
*   Gateway.on( 'connection', function( oSocket, oGWEndpoint ) { ... } );
*/
		_oGWEndpoint.on('connection', function( oSocket ) {
			Tools.debug('[ Gateway ][ Endpoint ( ID: %s ) ] connection received from %s:%s...', this.getID(), oSocket.remoteAddress, oSocket.remotePort );
			_oGateway.emit( 'connection', oSocket, this );
		});
/**
* Event emitted when connection has been estabilished
*
* @method    connect
* @public
*
* @param     {Object}		oSocket				The connected socket
* @param     {Object}		oGWEndpoint			The endpoint which generated the connect event
*
* @return    {Void}
*
* @example
*   Gateway.on( 'connect', function( oSocket, oGWEndpoint ) { ... } );
*/
		_oGWEndpoint.on('connect', function() {
			Tools.debug('[ Gateway ][ Endpoint ( ID: %s ) ] connected estabilished with %s:%s...', this.getID(), this.getHost(), this.getPort() );
			_oGateway.emit( 'connect', this );
		});
	}
	// Adding Gateway Endpoint to internal array
	if( !this._aGWEndpoints[ _oGWEndpoint.getID() ] ){
		this._aGWEndpoints[ _oGWEndpoint.getID() ] = _oGWEndpoint;
	} else {
		Tools.error( '[ Gateway ] Unable to add Gateway endpoint; ID: "%s" already used', _oGWEndpoint.getID() );
	}
	return _oGWEndpoint;
}

/**
 * Method used to get all the endpoints added to the current gateway; if ID is used as an argument only the specific endpoint pointed by the ID will be returned
 *
 * @method    getEndpoints
 * @public
 *
 * @param     {String}			sID								If used, it will return only the endpoint with such ID
 *
 * @return    {Array[]/Object}	aEndpoints/oEndpoint			It returns array of endpoints or the endpoint with the passed ID
 *
 * @example
 *   Gateway.getEndpoints();
 *   Gateway.getEndpoints( 'core' );
 */
Gateway.prototype.getEndpoints = function( sID ){
	if( typeof sID == 'undefined' ){
		return this._aGWEndpoints;
	} else {
		return this._aGWEndpoints[ sID ];
	}
}

/**
 * Method used to get the current technology ID
 *
 * @method    getID
 * @public
 *
 * @return    {String}	sID			It returns the unique technology's string ID
 *
 * @example
 *   Technology.getID();
 */
 Gateway.prototype.getID=function(){
	return this.__oOptions.sID;
}

module.exports = Gateway;
