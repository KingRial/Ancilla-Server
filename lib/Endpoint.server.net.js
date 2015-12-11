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

let net = require('net');

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

class EndpointTCPServer extends EndpointServer{

  init(){
    let _Server = this;
    let _oServer = net.createServer( function( oSocket ){
      _Server.debug('Connection: "%s:%s"', oSocket.remoteAddress, oSocket.remotePort );
      if( _Server.hasMaxActiveConnection() ){
        _Server.error( 'Unable to accept socket connection; too many connection active [ limit set to: "%s" ]', this.__oOptions.iMaxAllowedConnections );
        _Server.closeSocket( oSocket );
      } else {
        // Remeber connected socket
        _Server.rememberConnectedSocket( oSocket );
        // Emitting events
        oSocket.on( 'data', function( oBuffer ){
          _Server.debug('Data received from "%s:%s": "%s"', oSocket.remoteAddress, oSocket.remotePort, oBuffer.toString( _Server.__oOptions.sEncoding ) );
          _Server.emit( 'data', oBuffer, _Server.getSocketID( oSocket ) );
        });
        oSocket.on( 'close', function(){
            _Server.debug('Connection closed: "%s:%s" ( ID: %s )', oSocket.remoteAddress, oSocket.remotePort, oSocket._sID );
            _Server.closeSocket( oSocket );
            _Server.emit( 'disconnect', oSocket );
        });
        // Emitting server connect
        _Server.emit( 'connect', oSocket );
      }
    } );
    super.init( _oServer );
  }
}

module.exports = EndpointTCPServer;
