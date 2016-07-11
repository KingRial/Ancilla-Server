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
let MQTT    = require('mqtt');

let EndpointClient = require( './Endpoint.client.js' );

/**
 * Class describing a TCP client
 * Events fired:
 *    Socket Events: connect, disconnect, data
 *    Server Events: listening, close, error
 *
 * @class    TCPServer
 * @public
 *
 * @param	{Object}  oOptions The object describing the TCP server
 *
 * @return	{Void}
 *
 * @example
 *   new TCPServer();
 */

//TODO: handle reconnect and max retries ( https://github.com/mqttjs/MQTT.js#connect )

class EndpointClientMQTT extends EndpointClient {

  constructor( oOptions ){
    oOptions = _.extend({
      sID: 'Endpoint MQTT Client',
      sProtocol: 'mqtt',
      sHost: '127.0.0.1',
      iPort: 1883,
      sUsername: null,
      sPassword: null,
      reconnectionDelay: 1,
      //sAccessToken: null,
      //sRefreshToken: null,
      oTopics: {} // Each topic can be assigned with an handler ( or null ); the handler must be a promise and can return a different buffer
  	}, oOptions );
    super( oOptions );
  }

  init(){
    let _Endpoint = this;
    let _oClient  = MQTT.connect( this.getURL(), {
      //clientId //TODO: could use client ID from tech + endpoint ID
      reconnectPeriod: ( this.__oOptions.reconnectionDelay * 1000 ),
      username: this.__oOptions.sUsername,
      password: this.__oOptions.sPassword,
      rejectUnauthorized: false // Needed to ignore errors on connecting on MQTT's server with self-signed CA
    } );
    _oClient.on('packetsend', function( oPacket ){
      _Endpoint.silly( 'Sent packet:', oPacket );
    });
    _oClient.on('packetreceive', function( oPacket ){
      _Endpoint.silly( 'Received Packet: ', oPacket );
    });
    _oClient.on('offline', function (){
      _Endpoint.silly( 'Client gone offline...' );
    });
    _oClient.on('message', function ( sTopic, oBuffer ) {
      _Endpoint.debug( 'Received message event from Topic "%s" with message "%s"', sTopic, oBuffer.toString() );
      let _fTopicHandler = _Endpoint.__oOptions.oTopics[ sTopic ];
      let _oPromise = Promise.resolve();
      if( _fTopicHandler ){
        if( _fTopicHandler.then ){
          _oPromise = _fTopicHandler( oBuffer );
        } else {
          _Endpoint.error( 'Handler for topic "%s" must be a promise...', sTopic );
          _oPromise = Promise.reject();
        }
      }
      _oPromise.then(function( oBufferFromHandler ){
        _Endpoint.emit( 'data', ( oBufferFromHandler ? oBufferFromHandler : oBuffer ), sTopic );
      });
    });
    super.init( _oClient );
  }

  connect(){
    let _Endpoint = this;
    _Endpoint.info( 'Connecting to MQTT Broker "%s"...', _Endpoint.getURL() );
    this.__oPromiseReady = new Bluebird(function( fResolveReady, fRejectReady ){
      _Endpoint.__oEndpoint.on('connect', function(){
        _Endpoint.info( 'Connected to MQTT Broker "%s"', _Endpoint.getURL() );
        let _aConnectPromises = [];
        var _aTopics = _Endpoint.getTopics();
        _aTopics.forEach(function( sTopic ){
          _aConnectPromises.push( _Endpoint.subscribe( sTopic ) );
        });
        Bluebird.all( _aConnectPromises )
          .then( function(){
            fResolveReady();
          })
          .catch( function( oError ){
            fRejectReady( oError );
          })
        ;
      });
      _Endpoint.__oEndpoint.on( 'reconnect', function(){
        _Endpoint.warn( 'Trying to reconnect to MQTT Broker "%s"...', _Endpoint.getURL() );
      });
      _Endpoint.__oEndpoint.on('error', function( oError ){
        _Endpoint.__oEndpoint.end();
        _Endpoint.__initEventReconnect( oError );
        _Endpoint.emit( 'error', oError );
        fRejectReady( oError );
      });
    });
    return this.__oPromiseReady;
  }

  publish( sTopicOrBuffer, oBufferOrOptions, oOptions ){
    let _sTopic = sTopicOrBuffer;
    let _oBuffer = oBufferOrOptions;
    let _oOptions = oOptions;
    if( typeof sTopicOrBuffer !== 'string' ){
      _sTopic = null;
      _oBuffer = sTopicOrBuffer;
      _oOptions = oBufferOrOptions;
    }
    //
    _oOptions = _.extend({
      sTopic: _sTopic
    }, _oOptions );
    this.silly( 'Publishing "%s" on Topic "%s"...', _oBuffer.toString(), ( _oOptions.sTopic ? _oOptions.sTopic : 'all subscribed topics' ) );
    return this.write( _oBuffer, _oOptions );
  }

  subscribe( sTopic ){
    let _Endpoint = this;
    _Endpoint.debug( 'Subscribing on Topic "%s"...', sTopic );
    return new Bluebird( function( fResolveSubscribe ){
      _Endpoint.__oEndpoint.subscribe( sTopic, function(){
        _Endpoint.debug( 'Subscribed on Topic "%s"', sTopic );
        fResolveSubscribe();
      } );
    });
  }

  /**
   * Method used to write a buffer on the current endpoint; this method will strongly depends from the endpoint technology
   *
   * @method    __writeOnEndpoint
   * @private
   *
   * @param	{Object}   oBuffer		The buffer to write
   * @param	{String}   oOptions
   *
   * @return {Object} returns a successfull promise when write process is successfull
   *
   * @example
   *   Endpoint.__writeOnEndpoint( oBuffer, oOptions );
   */
  __writeOnEndpoint( oBuffer, oOptions ){
    let _Client = this;
    var _aTopics = this.getTopics();
    let _aPublishPromises = [ Bluebird.resolve() ];
    if( oOptions.sTopic ){
      _aPublishPromises.push( new Bluebird( function( fResolve ){
        // You can plublish only strings!!!
        _Client.__oEndpoint.publish( oOptions.sTopic, oBuffer.toString(), function(){
          _Client.debug( 'Published "%s" on Topic "%s"', oBuffer.toString(), oOptions.sTopic );
          fResolve();
        } );
      }) );
    } else {
      _aTopics.forEach(function( sTopic ){
        _aPublishPromises.push( new Bluebird( function( fResolve ){
          // You can plublish only strings!!!
          _Client.__oEndpoint.publish( sTopic, oBuffer.toString(), function(){
            _Client.debug( 'Published "%s" on Topic "%s"', oBuffer.toString(), sTopic );
            fResolve();
          } );
        }) );
      });
    }
    return Bluebird.all( _aPublishPromises );
  }

  getTopics(){
    var _aTopics = [];
    for( let _sTopic in this.__oOptions.oTopics ){
      if( this.__oOptions.oTopics.hasOwnProperty( _sTopic ) ){
        _aTopics.push( _sTopic );
      }
    }
    return _aTopics;
  }

  getProtocol(){
    return this.__oOptions.sProtocol;
  }

  getHost(){
    return this.__oOptions.sHost;
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
		return this.__oOptions.iPort;
	}

  getURL(){
    return this.getProtocol() + '://' + this.getHost() + ':' + this.getPort();
  }
}

module.exports = EndpointClientMQTT;
