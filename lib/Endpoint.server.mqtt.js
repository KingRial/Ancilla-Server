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

let _ = require('lodash');
let mosca  = require('mosca');
let Bluebird = require('bluebird');

let EndpointServer = require( './Endpoint.server.js' );

/**
 * Class describing a TCP server
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

class EndpointBrokerMQTT extends EndpointServer {

  constructor( oOptions ){
    oOptions = _.extend({
      sID: 'Endpoint MQTT Broker',
      sHost: '127.0.0.1',
      bUseWS: false,
      iPort: 1883,
      sSSLCert: null,
      sSSLKey: null,
      sSSLCA: null,
      bFilterEchoes: true // A client which publish a message on a subscribed topic won't receive an echo of the same message
      /*,
      // http://www.hivemq.com/blog/mqtt-security-fundamentals-oauth-2-0-mqtt
      fAuthenticate: function( oClient, sUsername, sPassword, fCallback ){
        fCallback( null, true );
      },
      fAuthorizeSubscribe: function( oClient, sTopic, fCallback ){
        fCallback( null, true );
      },
      fAuthorizePublish: function( oClient, sTopic, oBuffer, fCallback ){
        fCallback( null, true );
      },
      fAuthorizeForward: function( oClient, oBuffer, fCallback ){
        fCallback( null, true );
      }
      */
  	}, oOptions );
    super( oOptions );
    this.__oForwardMessage={};
  }

  init(){
    let _Endpoint = this;
    // http://www.mosca.io/docs/lib/server.js.html
    let _oMoscaOptions = {
      interfaces: [
        { type: 'mqtt', port: this.__oOptions.iPort },
// TODO: handle multiple interfaces ( MQTT and MQTTS together )
        //{ type: 'mqtts', port: 8883 }
      ],
      logger: {
        name: this.getID(),
        level: 'error'
      }
 //*     - `*`, additional properties are passed as options to `tls.createServer` (see https://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener)
 //*  - `stats`, publish the stats every 10s (default false).
 //*  - `publishNewClient`, publish message to topic "$SYS/{broker-id}/new/clients" when new client connects.
 //*  - `publishClientDisconnect`, publish message to topic "$SYS/{broker-id}/disconnect/clients" when a client disconnects.
 //*  - `publishSubscriptions`, publish message to topic "$SYS/{broker-id}/new/(un)subscribes" when a client subscribes/unsubscribes.
    };
    // MQTTS/MQTTWSS https://github.com/mcollina/mosca/wiki/TLS-SSL-Configuration
    if( this.__oOptions.sSSLKey && this.__oOptions.sSSLCert ){
      _oMoscaOptions.interfaces[ 0 ].type = 'mqtts';
      _oMoscaOptions.interfaces[ 0 ].credentials = {
        keyPath: this.__oOptions.sSSLKey,
        certPath: this.__oOptions.sSSLCert,
        caPaths: this.__oOptions.sSSLCA || []
      };
      //MQTTWSS
      if( this.__oOptions.bUseWS ){
        _oMoscaOptions.interfaces[ 0 ].https = {
          port: ( this.__oOptions.iPort + 1 ),
          bundle: true
        };
      }
    } else if( this.__oOptions.bUseWS ){
      _oMoscaOptions.interfaces[ 0 ].http = {
        port: ( this.__oOptions.iPort + 1 ),
        bundle: true
      };
    }
    // TODO: using only "_oMoscaOptions" won't allow to use correctly WS/WSS sockets; try to understand why
    // let _oServer = new mosca.Server( _oMoscaOptions );
    let _oServer = new mosca.Server( _oMoscaOptions.interfaces[ 0 ] );
    _oServer.authenticate = this.__oOptions.fAuthenticate || _oServer.authenticate;
    _oServer.authorizeSubscribe = this.__oOptions.fAuthorizeSubscribe || _oServer.authorizeSubscribe;
    //_oServer.authorizePublish = this.__oOptions.fAuthorizePublish || _oServer.authorizePublish;
    _oServer.authorizePublish = function( oClient, sTopic, oBuffer, fCallback ){
      _Endpoint.__oForwardMessage[ sTopic ] = _Endpoint.__oForwardMessage[ sTopic ] || {};
      _Endpoint.__oForwardMessage[ sTopic ][ oClient.id ] = oBuffer;
      let _fCustomHandler = _Endpoint.getConfig().fAuthorizePublish || function( oClient, sTopic, oBuffer, fCallback ){ fCallback( null, true ); };
      _fCustomHandler( oClient, sTopic, oBuffer, fCallback );
    };
    //_oServer.authorizeForward = this.__oOptions.fAuthorizeForward || _oServer.authorizeForward;
    _oServer.authorizeForward = function( oClient, oPacket, fCallback ){
      let _fCustomHandler = _Endpoint.getConfig().fAuthorizeForward || function( oClient, oBuffer, fCallback ){ fCallback( null, true ); };
      if( _Endpoint.getConfig().bFilterEchoes ){
        let _oTopic = _Endpoint.__oForwardMessage[ oPacket.topic ];
        let _oLastBuffer = ( _oTopic ? _oTopic[ oClient.id ] : null );
        if( _oLastBuffer && _oLastBuffer.equals( oPacket.payload ) ){
          delete _Endpoint.__oForwardMessage[ oPacket.topic ][ oClient.id ];
          if( _.isEmpty( _oTopic ) ){
            delete _Endpoint.__oForwardMessage[ oPacket.topic ];
          }
          fCallback( null, false );
          return;
        }
      }
      _fCustomHandler( oClient, oPacket, fCallback );
    };
    _oServer.on('clientConnected', function( oClient ){
      _Endpoint.debug('Client "%s" successfully connected ', oClient.id );
      _Endpoint.rememberConnectedSocket( oClient );
    });
    _oServer.on('clientDisconnected', function( oClient ){
      _Endpoint.debug('Client "%s" successfully disconnected ', oClient.id );
      _Endpoint.forgetConnectedSocket( oClient );
    });
    _oServer.on('subscribed', function( sTopic, oClient ) {
    _Endpoint.debug('Client "%s" subscribed to "%s"', oClient.id, sTopic );
    });
    _oServer.on('unsubscribed', function( sTopic, oClient ) {
      _Endpoint.debug('Client "%s" UNsubscribed from "%s"', oClient.id, sTopic );
    });
    _oServer.on('published', function( oPacket, oClient ) {
      if( oClient ){
        _Endpoint.debug('Client "%s" published on topic "%s": "%s"', oClient.id, oPacket.topic, oPacket.payload );
        _Endpoint.emit( 'data', new Buffer( oPacket.payload ), oClient.id );
        // Since on MQTT you always work on topics, using topic ID instead of Client/Socket ID
        //_Endpoint.emit( 'data', new Buffer( oPacket.payload ), oPacket.topic );
      }
    });
    super.init( _oServer );
  }

  listen( iPort ){
    let _Server = this;
    iPort = iPort || this.getPort();
    this.__oPromiseReady = new Bluebird(function( fResolve ){
      _Server.__oEndpoint.on( 'ready', function(){
        _Server.debug( 'listening on port: "%s"', iPort );
        _Server.emit( 'listening', iPort );
        fResolve();
      });
    });
    return this.__oPromiseReady;
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

}

module.exports = EndpointBrokerMQTT;
