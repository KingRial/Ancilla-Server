"use strict";

let _ = require( 'lodash' );
let SerialPort = require( 'serialport' ).SerialPort;
let Bluebird = require('bluebird');

let EndpointClient = require( './Endpoint.client.js' );

/**
 * Class describing a Serial endpoint
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

class EndpointSerial extends EndpointClient{

  constructor( oOptions ){
    oOptions = _.extend({
      port: '/dev/ttyS4',
      baudrate: 19200,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      flowControl: false
  	}, oOptions );
    super( oOptions );
  }

  init(){
    let _oClient = new SerialPort( this.__oOptions.port, {
      baudrate: this.__oOptions.baudrate,
      dataBits: this.__oOptions.dataBits,
      stopBits: this.__oOptions.stopBits,
      parity: this.__oOptions.parity,
      flowControl: this.__oOptions.flowControl
    });
    super.init( _oClient );
  }

  connect(){
    let _Client = this;
    this.__oPromiseReady = new Bluebird(function( fResolve, fReject ){
      _Client.__oEndpoint.on( 'open', function(){
        _Client.debug( 'Client connected' );
        _Client.emit( 'connect' );
        fResolve();
      });
      _Client.__oEndpoint.on('error', function( oError ){
        _Client.__initEventReconnect( oError );
        _Client.emit( 'error', oError );
        fReject( oError );
      });
      _Client.debug( 'Client connecting with following options:', _Client.__oOptions );
      _Client.__oEndpoint.open();
    });
    return this.__oPromiseReady;
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
  __writeOnEndpoint( oBuffer ){
    let _Client = this;
    return new Bluebird(function( fResolve, fReject ){
      _Client.__oEndpoint.write( oBuffer, function( error, results ){
        if( error ){
          fReject( error );
        } else {
          fResolve( results );
        }
      });
    });
  }
}

module.exports = EndpointSerial;
