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
			sEncoding: null,
			iMaxRepeat: -1, // Number of times to repeat
			//iMaxTps //Telgrams per seconds
			aDatagrams: null,
			bIsAncilla: false,
			module: null,
			oLogger: null
  	}, oOptions );
		let oLogOptions = {
			sID: oOptions.id,
			sHeader: ( oOptions.sHeader ? oOptions.sHeader + ' ': '' ) + '[ Endpoint: "' + oOptions.id + '" ]',
		};
		this.__oOptions = oOptions;
		// Init logger and extends loggind methods on this class
		let _oLogger = ( oOptions.oLogger ? oOptions.oLogger : new Logger( oLogOptions ) );
		_oLogger.extend( oOptions.id, this, oLogOptions );
		this.__oEndpoint = null;
		// Handling configured datagrams if present
		let _Endpoint = this;
		this.on( 'data', function( oBuffer ){
			_Endpoint.__checkValidDatagram( oBuffer )
				.then( function( oDatagram ){
					// Handling specific events onReceive if needed
					return oDatagram.onReceive( oBuffer, _Endpoint );
				})
				.then( function( oDatagram, oBuffer ){
					_Endpoint.emit( 'datagram', oDatagram, oBuffer, oDatagram.parse( oBuffer ) );
				})
				.catch( function( oError ){
					_Endpoint.warn( 'Error "%o": Unable to decode a datagram from buffer: "%s"', oError, oBuffer.toString( _Endpoint.__oOptions.sEncoding ) );
// TODO: handle catch situation when the current oBuffer is not a valid datagram ( the current oBuffer should be added to previous oBuffer and checked again )
				})
			;
		});
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
 * @param	{Object}   oData		The buffer to write
 * @param	{String}   oOptions	The options used to write in the endpoint
 *
 * @return {Object} returns a successfull promise when write process is successfull
 *
 * @example
 *   Endpoint.write( oData, oOptions );
 */
	write( oBuffer, oOptions ){
		oOptions = _.extend({
			sSocketID: null,
			sEncoding:  this.__oOptions.sEncoding,
			iAttempt: 1
		}, oOptions );
		let _Endpoint = this;
// TODO: is really needed to check the datagram we want to write ?
		return this.__checkValidDatagram( oBuffer )
			.then(function( oDatagram ){
				_Endpoint.silly( 'Attempt "%s" to write: "%s" on socket ID "%s"...', oOptions.iAttempt, oBuffer.toString('hex'), oOptions.sSocketID );
				let _oPromiseResult = null;
				let _oPromiseWrite = _Endpoint.__writeOnEndpoint( oBuffer, oOptions );
				// Handling wait4response if a valid configured datagram has been received; otherwise no datagrams has been configured
				let _iWait4Response = ( oDatagram ? oDatagram.getWait4Response() : -1 );
				if( _iWait4Response > 0 ){
					let _iHandlerTimeout = null;
					let _fHandlerAnswer = null;
					let _oPromiseToWaitAnswer = new Bluebird( function( fResolve, fReject ){
						_fHandlerAnswer = function( oAnswerDatagram, oAnswerBuffer ){
							if( oAnswerDatagram.checkResponse( oAnswerBuffer, oBuffer ) ){
								clearTimeout( _iHandlerTimeout );
								// Clearing answer handler
								_Endpoint.removeListener( 'datagram', _fHandlerAnswer );
								fResolve();
							} else {
								fReject( new Error( 'Failed response datagram' ) );
							}
						};
// TODO: is it a good idea using these listeners ? there is a limit on them and on heavy traffic this could be a problem
						_Endpoint.on( 'datagram', _fHandlerAnswer );
					});
					let _oPromiseToWaitTimeout = new Bluebird( function( fResolve, fReject ){
						_iHandlerTimeout = setTimeout( function(){
							// Clearing answer handler
							_Endpoint.removeListener( 'datagram', _fHandlerAnswer );
							// Rejecting promise
							fReject( new Error( 'timeout' ) );
						}, _iWait4Response * 1000 );
					});
					// Writing and then waiting for a race between a timeout and the received answer
					_oPromiseResult = Bluebird.all( [ _oPromiseWrite, Bluebird.race( [ _oPromiseToWaitTimeout, _oPromiseToWaitAnswer ] ) ] );
				} else {
					_oPromiseResult = Bluebird.all( [ _oPromiseWrite ] );
				}
				return _oPromiseResult
					.then( function(){
						_Endpoint.silly( 'Attempt "%s" written: "%s" on socket ID "%s"...', oOptions.iAttempt, oBuffer.toString('hex'), oOptions.sSocketID );
					})
					.catch( function( oError ){
						if( oOptions.iAttempt > _Endpoint.__oOptions.iMaxRepeat ){
							oOptions.iAttempt++;
							return _Endpoint.write( oBuffer, oOptions );
						} else {
							_Endpoint.error( '"%s": failed to write "%s" on socket ID "%s" with "%s" attempts...', oError, oBuffer.toString('hex'), oOptions.sSocketID, oOptions.iAttempt );
							return Bluebird.reject( oError );
						}
					})
				;
			})
		;
	}

	/**
	 * Method used to write a buffer on the current endpoint; this method will strongly depends from the endpoint technology
	 *
	 * @method    __writeOnEndpoint
	 * @private
	 *
	 * @return {Object} returns a successfull promise when write process is successfull
	 *
	 * @example
	 *   Endpoint.__writeOnEndpoint();
	 */
	__writeOnEndpoint( oBuffer, oOptions ){
		let _Endpoint = this;
    return new Bluebird(function( fResolve ){
  		_Endpoint.__oEndpoint.write( oBuffer, oOptions, function(){
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
					_Endpoint.warn( 'No configured datagram handle correctly the current buffer: ', oBuffer );
				})
			;
		} else {
			_Endpoint.silly( 'No datagram configured for current endpoint...' );
			return Bluebird.resolve();
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
