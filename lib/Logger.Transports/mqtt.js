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

let path = require('path');

let _ = require( 'lodash' );
let LoggerTransportRemoter = require('./remoter.js');
let Endpoint = require( '../Endpoint.client.mqtt.js' );
let Constant = require('../Constants.js');

let Logger = require('../Logger.js');

/**
 * A class which describes a Winston's Websocket trasnport
 * It will open the port ( 3000 by default ); opening the URL http://URL:3000 will show a web page connecting to the transport and showint the logs
 *
 * @class	LoggerTransportWS
 * @public
 *
 * @param	{Object}		oOptions		A javascript object of options used to configure the transport
 *
 * @return	{Void}
 *
 * @example
 *		new LoggerTransportWS();
 */
class LoggerTransportMQTT extends LoggerTransportRemoter {
  constructor( oOptions ){
    oOptions = _.extend({
      sName: 'mqtttransport'
    }, oOptions );
    super( oOptions );
    let _oDefaultOptions = {
      sID: 'Debug-Remoter-MQTT',
      oTopics: {}
    };
    _oDefaultOptions.oTopics[ Constant._API_CORE_TOPIC_LOGS ] = null;
    this.__oEndpoint = new Endpoint( _.extend( _oDefaultOptions, this.getConfig() ) );
  }

  __log( oLog ){
    if( this.__oEndpoint ){
      this.__oEndpoint.write( JSON.stringify( [ oLog ] ) );
    }
  }
}

module.exports = LoggerTransportMQTT;
