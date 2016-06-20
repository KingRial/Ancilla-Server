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
      sURL: 'mqtt://127.0.0.1',
      sUsername: null,
      sPassword: null,
      //sAccessToken: null,
      //sRefreshToken: null,
      oTopics: {}
  	}, oOptions );
    super( oOptions );
  }

  init(){
    let _Endpoint = this;
    let _oClient  = MQTT.connect( this.__oOptions.sURL, {
      reconnectPeriod: ( this.__oOptions.reconnectionDelay * 1000 ),
      username: this.__oOptions.sUsername,
      password: this.__oOptions.sPassword
    } );
    _oClient.on('message', function ( sTopic, oBuffer ) {
      _Endpoint.silly( 'Received message event from Topic "%s" with message "%s"', sTopic, oBuffer.toString() );
      _Endpoint.emit( 'data', oBuffer, sTopic );
      let _fTopicHandler = _Endpoint.__oOptions.oTopics[ sTopic ];
      if( _fTopicHandler ){
        _fTopicHandler( oBuffer );
      }
    });
    super.init( _oClient );
  }

  connect(){
    let _Endpoint = this;
    _Endpoint.debug( 'Connecting to MQTT Broker "%s"...', this.__oOptions.sURL );
    this.__oPromiseReady = new Bluebird(function( fResolveReady, fRejectReady ){
      _Endpoint.__oEndpoint.on('connect', function(){
        _Endpoint.debug( 'Connected to MQTT Broker' );
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
      _Endpoint.__oEndpoint.on('offline', function(){
        // Faking timeout error
        let _oError = new Error( 'MQTT connection offline' );
        _oError.code='ETIMEDOUT';
        // Closing connection
        _Endpoint.__oEndpoint.end();
        // Executing reconnect
        _Endpoint.__oEndpoint.emit( 'error', _oError );
      });
      _Endpoint.__oEndpoint.on('error', function( oError ){
        _Endpoint.__initEventReconnect( oError );
        _Endpoint.emit( 'error', oError );
        fRejectReady( oError );
      });
    });
    return this.__oPromiseReady;
  }

  publish( sTopic, oBuffer, oOptions ){
    oOptions = _.extend({
      sTopic: sTopic
  	}, oOptions );
    return this.write( oBuffer, oOptions );
  }

  subscribe( sTopic ){
    let _Endpoint = this;
    _Endpoint.debug( 'Subscribing on Topic "%s"...', sTopic );
    return new Bluebird( function( fResolveConnect ){
      _Endpoint.__oEndpoint.subscribe( sTopic, function(){
        _Endpoint.debug( 'Subscribed on Topic "%s"', sTopic );
        fResolveConnect();
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
    let _aPublishPromises = [];
    if( oOptions.sTopic ){
      _aPublishPromises.push( new Bluebird( function( fResolve ){
        _Client.__oEndpoint.publish( oOptions.sTopic, oBuffer, function(){
          _Client.debug( 'Publish "%s" on Topic "%s"', oBuffer.toString(), oOptions.sTopic );
          fResolve();
        } );
      }) );
    } else {
      _aTopics.forEach(function( sTopic ){
        _aPublishPromises.push( new Bluebird( function( fResolve ){
          _Client.__oEndpoint.publish( sTopic, oBuffer, function(){
            _Client.debug( 'Publish "%s" on Topic "%s"', oBuffer.toString(), sTopic );
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
}

module.exports = EndpointClientMQTT;
