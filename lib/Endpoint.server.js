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
let Bluebird = require('bluebird');
let ShortID = require('shortid');

let Tools = require('./Tools.js');
let Endpoint = require('./Endpoint.js');

/**
 * Class describing a generic server
 * Events fired:
 *    Socket Events: connect, disconnect, data
 *    Server Events: listening, close, error
 *
 * @class    EndpointServer
 * @public
 *
 * @param	{Object}  oOptions The object describing the TCP server
 *
 * @return	{Void}
 *
 * @example
 *   new TCPServer();
 */

class EndpointServer extends Endpoint{

  constructor( oOptions ){
    super( oOptions );
    oOptions = _.extend({
			id: 'Endpoint Server',
      host: Tools.getLocalIPs( 0 ),
      port: 0,
      maxconnections: -1,
      autolisten: true,
  	}, oOptions );
		// Init properties
		this.__oOptions = oOptions;
    this._oConnectedSockets = {};
    this._iConnectedSockets = 0;
    // Init server
    this.__oEndpoint = null;
    this.init();
    // Connecting if needed
    if( this.__oOptions.autolisten ){
      this.listen().catch(function(){
        // Nothing to do ( the error will be fired by 'error' event )
      });
    }
  }

  init( oServer ){
    let _Server = this;
    this.__oEndpoint = oServer;
    if( this.__oEndpoint ){
      this.__oEndpoint.on('close', function(){
        _Server.debug( 'Closing server "%s:%s"', _Server.__oEndpoint.address().address, _Server.__oEndpoint.address().port );
        _Server.emit( 'close' );
      });
      this.__oEndpoint.on('error', function( oError ){
        _Server.error( 'Error on server "%s:%s": %s', _Server.__oEndpoint.address().address, _Server.__oEndpoint.address().port, oError );
        _Server.emit( 'error', oError );
      });
    } else {
      this.error( 'Unable to initialize server; missing server instance' );
    }
  }

  hasMaxActiveConnection(){
    return ( this.__oOptions.maxconnections > 0 ? ( this._iConnectedSockets < this.__oOptions.maxconnections ? false : true ) : false );
  }

  listen( iPort ){
    let _Server = this;
    this.__oPromiseReady = new Bluebird(function( fResolve ){
      _Server.__oEndpoint.on( 'listening', function(){
        let _iPort = _Server.__oEndpoint.address().port;
        _Server.debug( 'listening on port: "%s"', _iPort );
        _Server.emit( 'listening', _iPort );
        fResolve();
      });
      _Server.__oEndpoint.listen( ( iPort ? iPort: _Server.__oOptions.port ) );
    });
    return this.__oPromiseReady;
  }

  ready(){
		return this.__oPromiseReady;
	}

  getConnectedSocket( sID ){
    return ( this._oConnectedSockets[ sID ] ? this._oConnectedSockets[ sID ] : null );
  }

  getConnectedSockets(){
    return this._oConnectedSockets;
  }

  closeConnectedSocket( sID ){
    let _oSocket = this.getConnectedSocket( sID );
    if( _oSocket ){
      this.debug( 'Forcing close connection on socket "%s:%s" ( ID: %s )', _oSocket.address().address, _oSocket.address().port, sID );
      this.closeSocket( _oSocket );
    } else {
      this.error( 'Unable to close connection on socket ( ID: %s ); this ID is not connected!', sID );
    }
  }

  rememberConnectedSocket( oSocket ){
    oSocket.__sID = ShortID.generate();
    // Remembering connected socket
    this._oConnectedSockets[ oSocket.__sID ] = oSocket;
    this._iConnectedSockets++;
  }

/**
 * Method used to close a connected socket
 *
 * @method    closeSocket
 * @public
 *
 * @param	{Object}   oSocket		The connected socket to close
 *
 * @return {Void}
 *
 * @example
 *   Endpoint.close();
 */
  closeSocket( oSocket ){
    let _sID = oSocket.__sID;
    if( _sID && this._oConnectedSockets[ _sID ] ){
      delete this._oConnectedSockets[ _sID ];
      this._iConnectedSockets--;
    }
    oSocket.destroy();
  }

/**
 * Method used to close the server
 *
 * @method    close
 * @public
 *
 * @return {Object} returns a successfull promise when process is successfull
 *
 * @example
 *   Endpoint.close();
 */
  close(){
    let _Server = this;
    let _aPromises = [];
    // Closing server
    _aPromises.push( new Bluebird(function( fResolve ){
      _Server.debug( 'Closing server' );
      this._Server.close( function(){ fResolve(); });
    }) );
    // Closing all connected sockets
    _aPromises.push( new Bluebird(function( fResolve ){
      for( let _sID in this._oConnectedSockets ){
        if( this._oConnectedSockets.hasOwnProperty( _sID ) ){
          _Server.closeConnectedSocket( _sID );
        }
      }
      fResolve();
    }) );
    return Bluebird.all( _aPromises ).then( function(){
      _Server.debug('Server closed');
    });
  }

/**
 * Method used to write a buffer on the current endpoint; this method will strongly depends from the endpoint technology
 *
 * @method    __writeOnEndpoint
 * @private
 *
 * @param	{Object}   oBuffer		The buffer to write
 * @param	{String}   sEncoding	The encoding type
 * @param	{String}   sSocketID	The connected socket ID to write in ( if null it will write on ALL connected sockets )
 *
 * @return {Object} returns a successfull promise when write process is successfull
 *
 * @example
 *   Endpoint.__writeOnEndpoint( oBuffer, sEncoding, sSocketID );
 */
	__writeOnEndpoint( oBuffer, sEncoding, sSocketID ){
    let _aWritePromises = [];
    let _oSocketsToWriteIn = {};
    if( sSocketID ){ // Writing to specific socket
      _oSocketsToWriteIn[ sSocketID ] = this.getConnectedSocket( sSocketID );
    } else { // Writing to all connected sockets
  		_oSocketsToWriteIn = this.getConnectedSockets();
    }
    // Writing
    for( let _sConnectedSocketID in _oSocketsToWriteIn ){
      if( _oSocketsToWriteIn.hasOwnProperty( _sConnectedSocketID ) ){
        let _oSocketToWriteIn = _oSocketsToWriteIn[ _sConnectedSocketID ];
         this.silly( 'Writing on connected socket "%s:%s" ( %s ): "%s"', _oSocketToWriteIn.remoteAddress, _oSocketToWriteIn.remotePort, _oSocketToWriteIn.__sID, oBuffer.toString('hex') );
         _aWritePromises.push( this.__writeSocket( _oSocketToWriteIn, oBuffer, sEncoding ) );
      }
    }
    return Bluebird.all( _aWritePromises );
	}

/**
 * Method used to write a buffer on a specific connected scoket
 *
 * @method    __writeSocket
 * @private
 *
 * @param	{Object}   oSocket	The connected socket
 * @param	{Object}   oBuffer		The buffer to write
 * @param	{String}   sEncoding	The encoding type
 *
 * @return {Object} returns a successfull promise when write process is successfull
 *
 * @example
 *   Endpoint.__writeSocket( oSocket, oBuffer, sEncoding );
 */
  __writeSocket( oSocket, oBuffer, sEncoding ){
    let _Server = this;
    return new Bluebird(function( fResolve ){
     oSocket.write( oBuffer, sEncoding, function(){
        _Server.silly( 'written on connected socket "%s:%s" ( %s ): "%s"... ', oSocket.remoteAddress, oSocket.remotePort, oSocket.__sID, oBuffer.toString('hex') );
        fResolve();
      } );
    });
  }
}

module.exports = EndpointServer;
