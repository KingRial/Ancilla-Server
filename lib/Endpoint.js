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

let _ = require( 'lodash' );
let Bluebird = require('bluebird');
let Logger = require('./Logger.js');

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
		oOptions = _.extend({
			id: 'EndpointGeneric',
			sHeader: null,
			bIsAncilla: false,
			oLogger: null
  	}, oOptions );
		let oLogOptions = _.extend({
			sHeader: ( oOptions.sHeader ? oOptions.sHeader + ' ': '' ) + '[ Endpoint: "' + oOptions.id + '" ]'
		});
		this.__oOptions = oOptions;
		// Init logger and extends loggind methods on this class
		let _oLogger = ( oOptions.oLogger ? oOptions.oLogger : new Logger( oLogOptions ) );
		_oLogger.extend( oOptions.id, this, oLogOptions );
		this.__oEndpoint = null;
	}

	ready(){
		return Bluebird.resolve();
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
		//return this.__oOptions.host;
		return this.__oEndpoint.address().host;
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
		//return this.__oOptions.port;
		return this.__oEndpoint.address().port;
	}

	isAncilla(){
		return this.__oOptions.bIsAncilla;
	}

}

module.exports = Endpoint;
