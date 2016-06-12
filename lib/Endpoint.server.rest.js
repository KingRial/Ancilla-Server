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
let Express = require( 'express' );
let Compress = require('compression');
let BodyParser = require('body-parser');
let Cors = require('cors');

let Constant = require('./Constants.js');
let EndpointServer = require('./Endpoint.server.js');
let EventEmitter = require( 'events' ).EventEmitter;

/**
 * Class describing a REST server
 *
 * @class    RESTserver
 * @public
 *
 * @param	{Object}  oOptions The object describing the REST server
 *
 * @return	{Void}
 *
 * @example
 *   new RESTserver();
 */

class RESTserver extends EndpointServer {
  constructor( oOptions ){
    oOptions = _.extend({
      id: 'Endpoint REST Server',
      iPort: Constant._PORT_HTTP,
      bUseCors: false,
      bUseSSL: false,
      sSSLCert: null,
      sSSLKey: null
    }, oOptions );
    oOptions = _.extend({
      iPort: ( oOptions.bUseSSL ? Constant._PORT_HTTPS : Constant._PORT_HTTP ),
    }, oOptions );

    super( oOptions );
  }

  init(){
    let _Endpoint = this;
    let _oEndpoint = new EventEmitter();
    this.__oApp = Express();
    //_oApp.use(logger('dev'));
    this.__oApp.use( Compress() );
    this.__oApp.use( BodyParser.urlencoded( { extended: true } ) );
    this.__oApp.use( BodyParser.json() );
    //_oApp.use( Express.static( __dirname + '/../client' ) );
    this.__oApp.use( function( error, oRequest, oResponse, fNext ){
      if( error ){
        _Endpoint.error( '[ Express ] Error: %j', error );
      }
      fNext( error );
    });
    // Enbale CORS
    if( this.__oOptions.bUseCors ){
      this.__oApp.use( Cors() );
    }
    // Init routes
    let _oRoutes = this.__oOptions.oRoutes;
    for( let _sRouteType in _oRoutes ){
      if( _oRoutes.hasOwnProperty( _sRouteType ) ){
        let _oRoutesByType = _oRoutes[ _sRouteType ];
        for( let _sRoute in _oRoutesByType ){
          if( _oRoutesByType.hasOwnProperty( _sRoute ) ){
            _Endpoint.debug( 'Init REST route "%s", type "%s"...', _sRoute, _sRouteType );
            let _aRoutesHandlers = _oRoutesByType[ _sRoute ];
            _aRoutesHandlers = ( Array.isArray( _aRoutesHandlers ) ? _aRoutesHandlers : [ _aRoutesHandlers ]);
            let _aArgs = [ _sRoute ].concat( _aRoutesHandlers );
            this.__oApp[ _sRouteType ].apply( this.__oApp, _aArgs );
            //this.__oApp[ _sRouteType ]( _sRoute, _fRouteHanlder );
          }
        }
      }
    }
    super.init( _oEndpoint );
  }

  listen( iPort ){
    iPort = iPort || this.__oOptions.iPort;
    // Listening
    if( this.__oOptions.bUseSSL && this.__oOptions.sSSLCert && this.__oOptions.sSSLKey ){ // HTTPS
      let fs = require('fs');
      let HTTPS = require('https');
      HTTPS.createServer({
        key: fs.readFileSync( this.__oOptions.sSSLKey ),
        cert: fs.readFileSync( this.__oOptions.sSSLCert )
      }, this.__oApp ).listen( iPort );
      this.info( 'REST Server listening on port: %s using HTTPS protocol...', iPort );
    } else { // HTTP
      this.__oApp.listen( this.__oOptions.iPort );
      this.info( 'REST Server listening on port: %s using HTTP protocol...', iPort );
    }
    return Promise.resolve();
  }

  getApp(){
    return this.__oApp;
  }

}

module.exports = RESTserver;
