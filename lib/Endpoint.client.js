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

let Endpoint = require('./Endpoint.js');

/**
 * Class describing a generic client socket
 * Events fired:
 *    Socket Events: close connect data drain end error lookup timeout
 *
 * @class    EndpointClient
 * @public
 *
 * @param	{Object}  oOptions The object describing the client socket
 *
 * @return	{Void}
 *
 * @example
 *   new TCPServer();
 */

class EndpointClient extends Endpoint{

  constructor( oOptions ){
    super( oOptions );
    oOptions = _.extend({
			id: 'EndpointClient',
      host: 'localhost',
      port: 0,
      path: null,
      autoconnect: true,
			reconnect: true,
			reconnectionDelay: 10,	//Seconds
			reconnectionAttempts: -1	//Infinite attempts
  	}, oOptions );
		// Init properties
		this.__oOptions = oOptions;
    this.__iConnectionTimerHandler = null;
		this.__iConnectionAttempts = 0;
    // Init server
    this.__oEndpoint = null;
    this.init();
    // Connecting if needed
    if( this.__oOptions.autoconnect ){
      this.connect()
        .catch(function(){
          // Nothing to do ( the error will be fired by 'error' event )
        });
    }
  }

  ready(){
    return ( this.__oOptions.autoconnect  ? this.__oPromiseReady : Bluebird.resolve() );
  }

  init( oClient ){
    let _Client = this;
    this.__oEndpoint = oClient;
    if( this.__oEndpoint ){
      this.__oEndpoint.on('close', function(){
        _Client.silly( 'Closing client', _Client.__oEndpoint.address() );
        _Client.emit( 'close' );
      });
      this.__oEndpoint.on('data', function( oBuffer ){
        _Client.silly( 'Client received data "%s"', oBuffer.toString( _Client.__oOptions.sEncoding ) );
        _Client.emit( 'data', oBuffer );
      });
      this.__oEndpoint.on('drain', function(){
        _Client.silly( 'Client drain event' );
        _Client.emit( 'drain' );
      });
      this.__oEndpoint.on('end', function(){
        _Client.silly( 'Client end event' );
        _Client.emit( 'end' );
      });
      this.__oEndpoint.on('lookup', function(){
        _Client.silly( 'Client lookup event' );
        _Client.emit( 'lookup' );
      });
      this.__oEndpoint.on('timeout', function(){
        _Client.silly( 'Client timeout event' );
        _Client.emit( 'timeout' );
      });
    } else {
      this.error( 'Unable to initialize client; missing client instance' );
    }
  }

  connect(){
    let _Client = this;
    this.__oPromiseReady = new Bluebird(function( fResolve, fReject ){
      _Client.__oEndpoint.on( 'connect', function(){
        _Client.silly( 'Client connected' );
        _Client.emit( 'connect' );
        fResolve();
      });
      _Client.__oEndpoint.on('error', function( oError ){
        _Client.__initEventReconnect( oError );
        _Client.emit( 'error', oError );
        fReject( oError );
      });
      // Connecting socket
      let _oConnectOptions = ( _Client.__oOptions.path ? {
        path: _Client.__oOptions.path,
      } : {
        host: _Client.__oOptions.host,
        port: _Client.__oOptions.port
      } );
      _Client.silly( 'Client connecting with following options:', _oConnectOptions );
      _Client.__oEndpoint.connect( _oConnectOptions );
    });
    return this.__oPromiseReady;
  }

  __initEventReconnect( oError ){
    let _Client = this;
    if( oError.code === 'ECONNREFUSED' || oError.code === 'ETIMEDOUT' ){
      // Checking if endpoint can be reconnected
      if( _Client.__canReconnect() ){
        _Client.info( 'Re-connection attempt number:"%s" in "%s" seconds.', ( _Client.__iConnectionAttempsts + 1 ) , _Client.__oOptions.reconnectionDelay );
        // Calling connect after a specific delay
        clearTimeout( _Client.__iConnectionTimerHandler );
        _Client.__iConnectionTimerHandler = setTimeout(function(){
          _Client.connect();
        }, ( _Client.__oOptions.reconnectionDelay * 1000 ) );
      } else {
        _Client.info( 'Failed all allowed attempts to reconnect: "%s"', oError );
      }
    } else {
      _Client.error( 'Error on client: %s', oError );
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
		let _bResult = this.__oOptions.reconnect;
		if( _bResult ){
			this.silly( 'Re-connection enabled.' );
			// Checking # of Re-connection attempts
			if( this.__oOptions.reconnectionAttempts > 0 ){
				_bResult = ( this.__oOptions.reconnectionAttempts < this.__iConnectionAttempsts ? true : false );
			} else {
				_bResult = true;
				this.silly( 'can be re-connected without limits in the attempts.' );
			}
		} else {
			this.silly( 'Re-connection disabled.' );
		}
		return _bResult;
	}
}

module.exports = EndpointClient;
