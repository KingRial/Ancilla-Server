"use strict";

let path = require('path');
let util = require('util');

let _ = require( 'lodash' );
let chalk = require('chalk');
let winston = require('winston');
let Endpoint = require( '../Endpoint.server.ws.js' );

//class LoggerTransportWS extends winston.Transport{
class LoggerTransportWS extends  winston.transports.Console {
  constructor( oOptions ){
    super( oOptions );
    oOptions = oOptions || {};
    this.name = 'wstransport';
    this.level = oOptions.level || 'info';
    this._aArchives = [];
    this.__oEndpoint = new Endpoint( _.extend({
      id: 'Debug-Remoter',
      port: 3000,
      sWsPath: '/logs',
      sWWW: path.join( __dirname , 'ws' ),
      oLogger: oOptions.oLogger || null
    }, oOptions ) );
    let _Transport = this;
    this.__oEndpoint.on('connect', function(){
      _Transport.__oEndpoint.write( JSON.stringify( _Transport._aArchives ), {
        sEvent: 'log'
      } );
    });
  }
  log( level, msg, meta, callback ){
    let _oLog = {
      level: level,
      message: ( _.isEmpty( meta ) ? this.__removeChalkStyles( msg ) : util.format( this.__removeChalkStyles( msg ), meta ) ),
      createdAt: new Date().toISOString()
    };
    this._aArchives.push( _oLog );
    if( this._aArchives.length > 500 ){
      this._aArchives.splice( 0, this.archive.length - 500 );
    }
    this.__oEndpoint.write( JSON.stringify( [ _oLog ] ), {
      sEvent: 'log'
    } );
    callback(null, true);
  }
// TODO: should be handled diffrenlty
  __removeChalkStyles( sMsg ){
    for( let _sColor in chalk.styles ){
      if( chalk.styles.hasOwnProperty( _sColor ) ){
        let _oStyle = chalk.styles[ _sColor ];
        sMsg = sMsg.replace( _oStyle.open, '' );
        sMsg = sMsg.replace( _oStyle.close, '' );
      }
    }
    return sMsg;
  }
}

module.exports = LoggerTransportWS;
