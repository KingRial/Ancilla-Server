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

let util = require('util');

let Bluebird = require('bluebird');
let winston = require('winston');
let _ = require( 'lodash' );
let chalk = require('chalk');

let Logger = require('../Logger.js');

/**
 * A generic class used to extend winston's transports used by Ancilla
 *
 * @class	LoggerTransportRemoter
 * @public
 *
 * @return	{Void}
 *
 * @example
 *		new LoggerTransportRemoter();
 */
class LoggerTransportRemoter extends winston.transports.Console {

  constructor( oOptions ){
    super( oOptions );
    oOptions = _.extend({
      sName: 'remotertransport',
      sLevel: 'info',
      bSilent: false,
      bColorize: true,
      bPrettyPrint: true,
      bTimestamp: true,
      // Using a new silent logger for current endpoint
      oLogger: new Logger()
    }, oOptions );
    this.__oOptions = {};
    this.name = oOptions.sName;
    this.level = oOptions.sLevel || 'info';
    this.silent = oOptions.bSilent;
    this.colorize = oOptions.bColorize;
    this.prettyPrint = oOptions.bPrettyPrint;
    this.timestamp = oOptions.bTimestamp;
    this.__aArchives = [];
    this.config( oOptions );
  }

  getID(){
    return this.name;
  }

  config( oOptions ){
    this.__oOptions = _.extend( this.__oOptions, oOptions );
  }

  getConfig(){
    return this.__oOptions;
  }

  log( level, msg, meta, callback ){
    let _oLog = {
      level: level,
      message: ( _.isEmpty( meta ) ? this.__removeChalkStyles( msg ) : util.format( this.__removeChalkStyles( msg ), meta ) ),
      createdAt: new Date().toISOString()
    };
    this.__aArchives.push( _oLog );
    if( this.__aArchives.length > 500 ){
      this.__aArchives.splice( 0, this.__aArchives.length - 500 );
    }
    this.__log( _oLog );
    callback(null, true);
  }

  __log(){
    // Nothing to do
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

  ready(){
    if( this.__oEndpoint ){
      return this.__oEndpoint.ready();
    } else {
      return Bluebird.resolve();
    }
  }

  destroy(){
    if( this.__oEndpoint ){
      return this.__oEndpoint.onDestroy();
    } else {
      return Bluebird.resolve();
    }
  }
}

module.exports = LoggerTransportRemoter;
