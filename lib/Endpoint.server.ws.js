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
let express = require('express');
let http = require('http');
let SocketIO = require('socket.io');
let Bluebird = require('bluebird');

let EndpointServer = require( './Endpoint.server.js' );


/**
 * Class describing a Websocket server
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
 *   new WSServer();
 */

class WSServer extends EndpointServer{

  constructor( oOptions ){
    oOptions = _.extend({
      iPort: 8888,
      sWsPath: '.',
      bHTTPs: false,
      sWWW: null,
      sEncoding: 'utf8',
    }, oOptions );
    super( oOptions );
  }

  init(){
    let _Server = this;
    let _oExpress = express();
    let _oServer = http.Server( _oExpress );
    let _oWebSocket = SocketIO( _oServer );
    // Serving static WWW with express if enabled
    if( this.__oOptions.sWWW ){
      _Server.debug('Serving static content from: "%s" on port "%s"', this.__oOptions.sWWW, this.__oOptions.iPort );
      _oExpress.use( express.static( this.__oOptions.sWWW ) );
    }
    // Listening
    _oServer.listen( this.__oOptions.iPort );
    // Adding events
    _Server.debug('Serving websocket on port "%s" and path "%s"', this.__oOptions.iPort, this.__oOptions.sWsPath );
    _oWebSocket
      .of( this.__oOptions.sWsPath )
      .on('connection', function( oSocket ){
        let _oConnectedAddress = oSocket.request.connection;
        _Server.debug('Connection: "%s:%s" ( ID: %s ) ', _oConnectedAddress.remoteAddress , _oConnectedAddress.remotePort, oSocket.id );
        if( _Server.hasMaxActiveConnection() ){
          _Server.error( 'Unable to accept socket connection; too many connection active [ limit set to: "%s" ]', this.__oOptions.iMaxAllowedConnections );
          _Server.closeSocket( oSocket );
        } else {
          // Remeber connected socket
          _Server.rememberConnectedSocket( oSocket );
          // Emitting events
          oSocket.on( 'message', function( oBuffer ){
            _Server.debug('Data received from "%s": "%s"', oSocket.remoteAddress, oBuffer.toString( _Server.__oOptions.sEncoding ) );
            _Server.emit( 'data', oBuffer, _Server.getSocketID( oSocket ) );
          });
          oSocket.on( 'disconnect', function(){
              _Server.debug('Connection closed: "%s:%s" ( ID: %s )', _oConnectedAddress.remoteAddress, _oConnectedAddress.remotePort, oSocket.id );
              _Server.closeSocket( oSocket );
              _Server.emit( 'disconnect', oSocket );
          });
          // Emitting server connect
          _Server.emit( 'connect', oSocket );
        }
      })
    ;
    super.init( _oServer );
  }

/**
 * Method used to write a buffer on the current endpoint
 *
 * @method    write
 * @public
 *
 * @param	{String}   sMessage		The string to write
 * @param	{String}   oOptions	The options used to write in the endpoint
 *
 * @return {Object} returns a successfull promise when write process is successfull
 *
 * @example
 *   Endpoint.write( sMessage, oOptions );
 */
  write( sMessage, oOptions  ){
    oOptions = _.extend({
			sEvent: 'message'
		}, oOptions );
    super.write( sMessage, oOptions );
  }

/**
 * Method used to write a buffer on a specific connected scoket
 *
 * @method    __writeSocket
 * @private
 *
 * @param	{Object}   oSocket	The connected socket
 * @param	{String}   sMessage		The message
 * @param	{String}   oOptions
 *
 * @return {Object} returns a successfull promise when write process is successfull
 *
 * @example
 *   Endpoint.__writeSocket( oSocket, oBuffer, sEncoding );
 */
  __writeSocket( oSocket, sMessage, oOptions ){
    return new Bluebird(function( fResolve ){
      oSocket.emit( oOptions.sEvent, sMessage );
      fResolve();
    });
  }
}

module.exports = WSServer;
