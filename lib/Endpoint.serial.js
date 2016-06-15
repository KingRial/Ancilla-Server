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
      iPort: '/dev/ttyS4',
      iBaudrate: 19200,
      iDataBits: 8,
      iStopBits: 1,
      sParity: 'none',
      bFlowControl: false
  	}, oOptions );
    super( oOptions );
  }

  init(){
    let _oClient = new SerialPort( this.__oOptions.iPort, {
      baudrate: this.__oOptions.iBaudrate,
      dataBits: this.__oOptions.iDataBits,
      stopBits: this.__oOptions.iStopBits,
      parity: this.__oOptions.sParity,
      flowControl: this.__oOptions.bFlowControl
    }, false );
    super.init( _oClient );
  }

  connect(){
    let _Client = this;
    this.__oPromiseReady = new Bluebird(function( fResolve, fReject ){
      _Client.__oEndpoint.on( 'open', function(){
        _Client.silly( 'Client connected' );
        _Client.emit( 'connect' );
        fResolve();
      });
      _Client.__oEndpoint.on('error', function( oError ){
        _Client.__initEventReconnect( oError );
        _Client.emit( 'error', oError );
        fReject( oError );
      });
      _Client.silly( 'Client connecting with following options:', _Client.__oOptions );
      _Client.__oEndpoint.open( function( oError ){
        if( oError ){
          fReject( oError );
        } else {
          fResolve();
        }
      });
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
 * @param	{String}   oOptions
 *
 * @return {Object} returns a successfull promise when write process is successfull
 *
 * @example
 *   Endpoint.__writeOnEndpoint( oBuffer, oOptions );
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
