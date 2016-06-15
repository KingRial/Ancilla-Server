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

class EndpointServerMQTT extends EndpointServer {

  constructor( oOptions ){
    oOptions = _.extend({
      port: 1883
      /*,
      // http://www.hivemq.com/blog/mqtt-security-fundamentals-oauth-2-0-mqtt
      authenticate: function( oClient, sUsername, sPassword, fCallback ){
        fCallback( null, true );
      },
      authorizeSubscribe: function( oClient, sTopic, fCallback ){
        fCallback( null, true );
      },
      authorizePublish: function( oClient, sTopic, oBuffer, fCallback ){
        fCallback( null, true );
      },
      authorizeForward: function( oClient, oBuffer, fCallback ){
        fCallback( null, true );
      }
      */
  	}, oOptions );
    super( oOptions );
  }

  init(){
    let _Endpoint = this;
    // http://www.mosca.io/docs/lib/server.js.html
    let _oServer = new mosca.Server({
      //`host`, the IP address of the server (see http://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback).
      port: this.__oOptions.port
 //*  - `credentials`, credentials for secure connection, includes two properties:
 //*     - `keyPath`, the path to the key
 //*     - `certPath`, the path to the certificate
 //*     - `*`, additional properties are passed as options to `tls.createServer` (see https://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener)
 //*  - `stats`, publish the stats every 10s (default false).
 //*  - `publishNewClient`, publish message to topic "$SYS/{broker-id}/new/clients" when new client connects.
 //*  - `publishClientDisconnect`, publish message to topic "$SYS/{broker-id}/disconnect/clients" when a client disconnects.
 //*  - `publishSubscriptions`, publish message to topic "$SYS/{broker-id}/new/(un)subscribes" when a client subscribes/unsubscribes.
    });
    _oServer.authenticate = this.__oOptions.authenticate || _oServer.authenticate;
    _oServer.authorizeSubscribe = this.__oOptions.authorizeSubscribe || _oServer.authorizeSubscribe;
    _oServer.authorizePublish = this.__oOptions.authorizePublish || _oServer.authorizePublish;
    _oServer.authorizeForward = this.__oOptions.authorizeForward || _oServer.authorizeForward;
    _oServer.on('clientConnected', function( oClient ){
      _Endpoint.debug('Client "%s" successfully connected ', oClient.id );
    });
    _oServer.on('clientDisconnected', function( oClient ){
      _Endpoint.debug('Client "%s" successfully disconnected ', oClient.id );
    });
    _oServer.on('subscribed', function( sTopic, oClient ) {
    _Endpoint.debug('Client "%s" subscribed to "%s"', oClient.id, sTopic );
    });
    _oServer.on('unsubscribed', function( sTopic, oClient ) {
      _Endpoint.debug('Client "%s" UNsubscribed from "%s"', oClient.id, sTopic );
    });
    _oServer.on('published', function( oPacket, oClient ) {
      if( oClient ){
        _Endpoint.debug('Client "%s" published "%s"', oClient.id, oPacket.payload );
      }
    });
    super.init( _oServer );
  }

  listen( iPort ){
    let _Server = this;
    this.__oPromiseReady = new Bluebird(function( fResolve ){
      _Server.__oEndpoint.on( 'ready', function(){
        _Server.silly( 'listening on port: "%s"', iPort );
        _Server.emit( 'listening', iPort );
        fResolve();
      });
    });
    return this.__oPromiseReady;
  }

}

module.exports = EndpointServerMQTT;
