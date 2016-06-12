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

let _ = require( 'lodash' );
let Bluebird = require('bluebird');

let Logger = require('./Logger.js');

/**
 * Generic Datagram class
 *
 * @class	Datagram
 * @public
 *
 * @param	{Object}   oOptions		A javascript objects describing the datagram used by the gateway
 *
 * @return	{Void}
 *
 * @example
 *		new Datagram( { sID: 'init', request: /007E............../i, response: /007E01(FF|00)..../i } );
 */
class Datagram {

	constructor( oOptions ){
		this.__oOptions = _.extend({
			sID: 'DatagramGeneric',
			sEncoding: 'utf8',
      request: null,
      response: null,
      iWait4ACKOnRequest: ( oOptions.request ? 5 : -1 ), // Seconds
// TODO: handle correctly the ACK procedure on receiving response
			iWait4ACKOnResponse: -1,
			//iWait4ACKOnResponse: ( oOptions.response ? 5 : -1 ), // Seconds
			onReceive: null,
			oEndpoint: null,
			sHeader: null,
			oLogger: null
  	}, oOptions );
		// Init logger and extends loggind methods on this class
		let oLogOptions = {
			sID: 'Datagram-' + this.__oOptions.sID,
			sHeader: ( this.__oOptions.sHeader ? this.__oOptions.sHeader + ' ': '' ) + '[ Datagram: "' + this.__oOptions.sID + '" ]',
		};
		let _oLogger = ( oOptions.oLogger ? oOptions.oLogger : require( './Logger.singleton' ) );
		_oLogger.extend( oLogOptions.sID, this, oLogOptions );
	}

/**
 * Method used to get the current datagram's ID
 *
 * @method    getID
 * @public
 *
 * @return    {String}			It returns the unique datagram's string ID
 *
 * @example
 *   Datagram.getID();
 */
  getID(){
    return this.__oOptions.sID;
  }
/**
 * Method used to get the current datagram's Endpoint
 *
 * @method    getEndpoint
 * @public
 *
 * @return    {String}			It returns the unique datagram's string ID
 *
 * @example
 *   Datagram.getEndpoint();
 */
  getEndpoint(){
    return this.__oOptions.oEndpoint;
  }

/**
 * Method used to create a buffer describing the current datagram
 *
 * @method    build
 * @public
 *
 * @param     {Object/String/Integer}	...	parameters are variable and are heavily dependant for the used technology
 *
 * @return    {oObject}	it returns the buffer describing current datagram
 *
 * @example
 *   Datagram.build( ... );
 */
 	build(){
		// This is just an example; each technology should build a specific buffer from the given parameters
		return new Buffer('', 'hex');
	}
/**
 * Method used to parse a buffer describing the current datagram type
 *
 * @method    parse
 * @public
 *
 * @param     {Object/String/Integer}	...	parameters are variable and are heavily dependant for the used technology
 *
 * @return    {Object/String/Integer}	... heavily dependant for the used technology
 *
 * @example
 *   Datagram.parse( ... );
 */
 	parse( oBuffer ){
		// This is just an example; each technology should build a specific buffer from the given parameters
		return oBuffer;
	}
/**
 * Method used to get if a datagram is an aswer for the current one
 *
 * @method    isAnswerOf
 * @public
 *
 * @param     {Object}	oRequestBuffer	The answer buffer to check
 * @param     {Object}	oResponseBuffer	The answer buffer to check
 *
 * @return    {Boolean}	True if it's an answer of the current buffer/datagram
 *
 * @example
 *   Datagram.checkAnswer( oDatagram );
 */
  checkResponse( oResponseBuffer, oRequestBuffer ){
// TODO: worst check ever made ;)
		let _Datagram = this;
		return _Datagram.isResponse( oResponseBuffer )
			.then( function(){
				return _Datagram.isRequest( oRequestBuffer );
			} )
			.then( function(){
				_Datagram.silly( '%s is a response for %s', oResponseBuffer.toString( _Datagram.__oOptions.sEncoding ), oRequestBuffer.toString( _Datagram.__oOptions.sEncoding ) );
			})
			.catch( function(){
				_Datagram.silly( '%s is NOT a response for %s', oResponseBuffer.toString( _Datagram.__oOptions.sEncoding ), oRequestBuffer.toString( _Datagram.__oOptions.sEncoding ) );
			})
		;
  }

/**
 * Method used to compare a buffer with the current Datagram
 *
 * @method    is
 * @public
 *
 * @param     {Object}	oBuffer	The buffer to check
 *
 * @return    {Object}	A successfull promise if the compare is successfull
 *
 * @example
 *   Datagram.is( oBuffer );
 */
  is( oBuffer ){
		let _Datagram = this;
		return Bluebird.some( [ this.isRequest( oBuffer ), this.isResponse( oBuffer ) ], 1 )
			.spread( function(){
				return Bluebird.resolve( _Datagram );
			})
		;
  }

/**
 * Method used to compare a buffer with the current Datagram and decides it's a request
 *
 * @method    is
 * @public
 *
 * @param     {Object}	oBuffer	The buffer to check
 *
 * @return    {Object}	A successfull promise if the compare is successfull
 *
 * @example
 *   Datagram.isRequest( oBuffer );
 */
	isRequest( oBuffer ){
		let _Datagram = this;
    return new Bluebird(function( fResolve, fReject ){
      let _sBuffer = oBuffer.toString( _Datagram.__oOptions.sEncoding );
      let _request = _Datagram.__oOptions.request;
      if( _request && _request instanceof RegExp && _request.test( _sBuffer ) ){
        fResolve( _Datagram );
      }
      // Not request nor response
      fReject();
    });
	}

/**
 * Method used to compare a buffer with the current Datagram and decides it's a response
 *
 * @method    is
 * @public
 *
 * @param     {Object}	oBuffer	The buffer to check
 *
 * @return    {Object}	A successfull promise if the compare is successfull
 *
 * @example
 *   Datagram.isResponse( oBuffer );
 */
	isResponse( oBuffer ){
		let _Datagram = this;
		return new Bluebird(function( fResolve, fReject ){
			let _sBuffer = oBuffer.toString( _Datagram.__oOptions.sEncoding );
			let _response = _Datagram.__oOptions.response;
			if( _response && _response instanceof RegExp && _response.test( _sBuffer ) ){
				fResolve( _Datagram );
			}
			// Not request nor response
			fReject();
		});
	}

	onSend( oBuffer ){
		let _iWait4ACK = -1;
		let _Datagram = this;
		return this.isRequest( oBuffer )
			.then( function(){
				_iWait4ACK = _Datagram.__oOptions.iWait4ACKOnRequest;
				return Bluebird.resolve();
			})
			.catch( function(){
				_iWait4ACK = _Datagram.__oOptions.iWait4ACKOnResponse;
				return Bluebird.resolve();
			})
			.then( function(){
				let _oEndpoint = _Datagram.getEndpoint();
				if( _oEndpoint ){
					let _oPromiseResult = null;
					let _oPromiseWrite = _oEndpoint.__writeOnEndpoint( oBuffer, {
						sEncoding: _Datagram.__oOptions.sEncoding
					} );
					if( _iWait4ACK > 0 ){
						let _iHandlerTimeout = null;
						let _fHandlerAnswer = null;
						let _oPromiseToWait4ACK = new Bluebird( function( fResolve, fReject ){
							_fHandlerAnswer = function( oAnswerDatagram, oAnswerBuffer ){
								oAnswerDatagram.checkResponse( oAnswerBuffer, oBuffer )
									.then( function(){
										_Datagram.silly( 'Datagram "%s" received answer before ACK\'s timeout...', oBuffer.toString( _Datagram.__oOptions.sEncoding ) );
										clearTimeout( _iHandlerTimeout );
										// Clearing answer handler
										_oEndpoint.removeListener( 'datagram', _fHandlerAnswer );
										fResolve();
									} )
									.catch( function(){
										fReject( new Error( 'Failed response datagram' ) );
									} )
								;
							};
// TODO: is it a good idea using these listeners ? there is a limit on them and on heavy traffic this could be a problem
							_oEndpoint.on( 'datagram', _fHandlerAnswer );
						});
						let _oPromiseToWaitTimeout = new Bluebird( function( fResolve, fReject ){
							_iHandlerTimeout = setTimeout( function(){
								// Clearing answer handler
								_oEndpoint.removeListener( 'datagram', _fHandlerAnswer );
								// Rejecting promise
								fReject( new Error( 'timeout' ) );
							}, _iWait4ACK * 1000 );
						});
						// Writing and then waiting for a race between a timeout and the received answer
						_oPromiseResult = Bluebird.all( [ _oPromiseWrite, Bluebird.race( [ _oPromiseToWaitTimeout, _oPromiseToWait4ACK ] ) ] );
					} else {
						_oPromiseResult = Bluebird.all( [ _oPromiseWrite ] );
					}
					return _oPromiseResult;
				} else {
					return Bluebird.reject( new Error( 'Endpoint not configured on datagram' ) );
				}
			})
		;
	}
/**
 * Method called when the datagram has been received
 *
 * @method    onReceive
 * @public
 *
 * @param     {Object}	oBuffer	The buffer to check
 *
 * @return    {Object}	A successfull promise if the operation is successfull
 *
 * @example
 *   Datagram.onReceive( oBuffer );
 */
	onReceive(){
		return ( this.__oOptions.onReceive ? this.__oOptions.onReceive() : Bluebird.resolve() );
	}
}

module.exports = Datagram;
