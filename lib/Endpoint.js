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
			sEncoding: null,
			iMaxRepeat: -1, // Number of times to repeat
			//iMaxTps //Telgrams per seconds
			aDatagrams: null,
			bIsAncilla: false,
			module: null,
			oLogger: null
  	}, oOptions );
		oOptions.sHeader = ( oOptions.sHeader ? oOptions.sHeader + ' ': '' ) + '[ Endpoint: "' + oOptions.id + '" ]';
		this.__oOptions = oOptions;
		// Init logger and extends loggind methods on this class
		let oLogOptions = {
			sID: 'Endpoint-' + this.__oOptions.id,
			sHeader: this.__oOptions.sHeader,
		};
		let _oLogger = ( oOptions.oLogger ? oOptions.oLogger : new Logger( oLogOptions ) );
		_oLogger.extend( oLogOptions.sID, this, oLogOptions );
		this.__oEndpoint = null;
		// Init Datagrams rules
		this.__initDatagrams();
		// Handling configured datagrams if present
		let _Endpoint = this;
		this.on( 'data', function( oBuffer ){
			_Endpoint.__checkValidDatagram( oBuffer )
				.then( function( oDatagram ){
					// Handling specific events onReceive if needed
					return oDatagram.onReceive( oBuffer )
						.then(function(){
							_Endpoint.emit( 'datagram', oDatagram, oBuffer, oDatagram.parse( oBuffer ) );
						})
					;
				})
				.catch( function( oError ){
					_Endpoint.warn( 'Error "%s": Unable to decode a datagram from buffer: "%s"', oError, oBuffer.toString( _Endpoint.__oOptions.sEncoding ) );
// TODO: handle catch situation when the current oBuffer is not a valid datagram ( the current oBuffer should be added to previous oBuffer and checked again to find an acceptable datagram or trashed away )
				})
			;
		});
	}

	__initDatagrams(){
		let _aDatagrams = this.__oOptions.aDatagrams;
		if( _aDatagrams ){
			for( let _iIndex=0; _iIndex<_aDatagrams.length; _iIndex++ ){
				let datagram = _aDatagrams[ _iIndex ];
// TODO: should accept a constructor, a singleton or an object filled by options
				if( typeof datagram === 'function' ){
					_aDatagrams[ _iIndex ] = new datagram({
						oEndpoint: this,
						sHeader: this.__oOptions.sHeader,
						oLogger: this.__oOptions.oLogger
					});
				} else if( typeof datagram !== 'object' ){
					this.error( 'Datagram with index "%s" is not a correct Datagrams class/instance.', _iIndex );
				}
			}
		}
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

/**
 * Method used to write a buffer on the current endpoint
 *
 * @method    write
 * @public
 *
 * @param	{Object}   oBuffer		The buffer to write
 * @param	{String}   oOptions	The options used to write in the endpoint
 *
 * @return {Object} returns a successfull promise when write process is successfull
 *
 * @example
 *   Endpoint.write( oBuffer, oOptions );
 */
	write( oBuffer, oOptions ){
		oOptions = _.extend({
			sSocketID: null,
			sEncoding:  this.__oOptions.sEncoding,
			iAttempt: 1
		}, oOptions );
		let _Endpoint = this;
// TODO: check this promise chain
		//return new Bluebird( function( fResolve, fReject ){
				return _Endpoint.__checkValidDatagram( oBuffer )
					.then( function( oDatagram ){
						if( oOptions.sSocketID ){
							_Endpoint.silly( 'Attempt "%s" to write datagram "%s": "%s" on socket ID "%s"...', oOptions.iAttempt, oDatagram.getID(), oBuffer.toString('hex'), oOptions.sSocketID );
						} else {
							_Endpoint.silly( 'Attempt "%s" to write datagram "%s": "%s""...', oOptions.iAttempt, oDatagram.getID(), oBuffer.toString('hex') );
						}
						// Handling specific events onSend if needed
						return oDatagram.onSend( oBuffer )
							.then(function(){
								if( oOptions.sSocketID ){
									_Endpoint.silly( 'Attempt "%s" written datagram "%s": "%s" on socket ID "%s"...', oOptions.iAttempt, oDatagram.getID(), oBuffer.toString('hex'), oOptions.sSocketID );
								} else {
									_Endpoint.silly( 'Attempt "%s" written datagram "%s": "%s"...', oOptions.iAttempt, oDatagram.getID(), oBuffer.toString('hex') );
								}
							})
							.catch(function( oError ){
								if( oOptions.sSocketID ){
									_Endpoint.error( '"%s": failed to write datagram "%s" ( %s ) on socket ID "%s" with "%s" attempts...', oError, oDatagram.getID(), oBuffer.toString('hex'), oOptions.sSocketID, oOptions.iAttempt );
								} else {
									_Endpoint.error( '"%s": failed to write datagram "%s" ( %s ) with "%s" attempts...', oError, oDatagram.getID(), oBuffer.toString('hex'), oOptions.iAttempt );
								}
								return Bluebird.reject( oError );
							})
						;
					})
					.catch( function(){
						// This is not a known datagram
						if( oOptions.sSocketID ){
							_Endpoint.silly( 'Attempt "%s" to write: "%s" on socket ID "%s"...', oOptions.iAttempt, oBuffer.toString('hex'), oOptions.sSocketID );
						} else {
							_Endpoint.silly( 'Attempt "%s" to write: "%s""...', oOptions.iAttempt, oBuffer.toString('hex') );
						}
						// Writing unknown buffer to endpoint
						return _Endpoint.__writeOnEndpoint( oBuffer, oOptions );
					})
			//;
			//})
			.catch( function( oError ){
				// If write operations fails, checking the attempts still needed by the endpoint
				if( oOptions.iAttempt > _Endpoint.__oOptions.iMaxRepeat ){ // Repeating writing operation
					oOptions.iAttempt++;
					return _Endpoint.write( oBuffer, oOptions );
				} else { // Write operation failed
					if( oOptions.sSocketID ){
						_Endpoint.error( '"%s": failed to write "%s" on socket ID "%s" with "%s" attempts...', oError, oBuffer.toString('hex'), oOptions.sSocketID, oOptions.iAttempt );
					} else {
						_Endpoint.error( '"%s": failed to write "%s" with "%s" attempts...', oError, oBuffer.toString('hex'), oOptions.iAttempt );
					}
					return Bluebird.reject( oError );
				}
			})
		;
	}

	/**
	 * Method used to write a buffer on the current endpoint; this method will strongly depends from the endpoint technology
	 *
	 * @method    __writeOnEndpoint
	 * @private
	 *
	 * @param	{Object}   oBuffer		The buffer to write
	 * @param	{String}   oOptions	The options used to write in the endpoint
	 *
	 * @return {Object} returns a successfull promise when write process is successfull
	 *
	 * @example
	 *   Endpoint.__writeOnEndpoint();
	 */
	__writeOnEndpoint( oBuffer, oOptions ){
		let _Endpoint = this;
    return new Bluebird(function( fResolve ){
  		_Endpoint.__oEndpoint.write( oBuffer, oOptions.sEncoding, function(){
        fResolve();
      } );
    });
	}

	__checkValidDatagram( oBuffer ){
		let _Endpoint = this;
		let _aDatagrams = this.__oOptions.aDatagrams;
		if( _aDatagrams ){
			let _aPromises = [];
			for( let _iIndex=0; _iIndex<_aDatagrams.length; _iIndex++ ){
				let _oDatagram = _aDatagrams[ _iIndex ];
				_aPromises.push( _oDatagram.is( oBuffer ) );
			}
			return Bluebird
				.some( _aPromises, 1 )
				.spread( function( oDatagram ){
					_Endpoint.silly( 'Found valid datagram "%s": "%s"', oDatagram.getID(), oBuffer.toString( _Endpoint.__oOptions.sEncoding ) );
					// Transforming array result into single datagram result
					return Bluebird.resolve( oDatagram );
				})
				.catch( function(){
					_Endpoint.warn( 'No configured datagram to handle correctly the current buffer: ', oBuffer );
					return Bluebird.reject( new Error( 'No configured datagram to handle correctly the current buffer' ) );
				})
			;
		} else {
			_Endpoint.silly( 'No datagram configured for current endpoint...' );
			return Bluebird.reject( new Error( 'No datagram configured for current endpoint' ) );
		}
	}

	getDatagram( sID ){
		let _aDatagrams = this.__oOptions.aDatagrams;
		for( let _iIndex=0; _iIndex<_aDatagrams.length; _iIndex++ ){
			let _oDatagram = _aDatagrams[ _iIndex ];
			if( _oDatagram.getID() === sID ){
				return _oDatagram;
			}
		}
	}
}

module.exports = Endpoint;
