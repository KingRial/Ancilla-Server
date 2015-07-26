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
//Network Emitter
var Express = require('express');
//var breezeSequelize = require('breeze-sequelize');
//var SequelizeManager = breezeSequelize.SequelizeManager;
//var SequelizeQuery = breezeSequelize.SequelizeQuery;
//var SequelizeSaveHandler = breezeSequelize.SequelizeSaveHandler;
//var breeze = breezeSequelize.breeze;

var Fs = require('fs');
var _ = require('lodash');

class EmitterWeb {
	constructor( oOptions ){
		//Default Options
		oOptions = _.extend( {
			sWWW: null,
			iHTTPPort: 80,
			bUseSSL: false,
			iHTTPsPort: 443,
			sSSLKey: null,
			sSSLCert: null,
			//bUseBreeze: false,
			//sBreezeRequestPath: '/breeze/',
			//iBreezePort: 3000
		}, oOptions );
		var _oApp = Express();
		// WWW
		if( oOptions.sWWW ){
	    _oApp.use( Express.static( oOptions.sWWW ) );
			// HTTP or HTTPs
			if( !bUseSSL ){
				var Htpp = require('http');
				Htpp.createServer( _oApp ).listen( oOptions.iHTTPPort );
			} else {
				var Htpps = require('https');
				Htpps.createServer( {
					key: Fs.readFileSync( oOptions.sSSLKey ),
			  	cert: Fs.readFileSync( oOptions.sSSLCert )
				}, _oApp ).listen( oOptions.iHTTPsPort );
			}
		}
		/*
		// Breeze
		if( oOptions.bUseBreeze ){
			// https://github.com/Breeze/breeze.js.samples/blob/master/node/todo-angular/server/routes.js
			// Sequelize manager da DB in qualche modo
	    _oApp.get( oOptions.sBreezeRequestPath + 'Metadata', function ( oRequest, oResponse, next ) {
	        try {
	            var metadata = readMetadata();
	            oResponse.send( metadata );
	        } catch(e){
	            next(e);
	        }
	    });
	    _oApp.get( oOptions.sBreezeRequestPath + ':entity', function ( oRequest, oResponse, next ) {
	        var _oResourceName = oRequest.params.entity;
	        var _oEntityQuery = EntityQuery.fromUrl( oRequest.url, _oResourceName );
					fExecuteEntityQuery( _oEntityQuery, null, oResponse, next );
	    });
	    _oApp.post( oOptions.sBreezeRequestPath + 'SaveChanges', function( oRequest, oResponse, next) {
	        var saveHandler = new SequelizeSaveHandler( _oSequelizeManager, oRequest );
	        saveHandler.save().then( function(r) {
	            returnResults( r, oResponse);
	        }).catch(function(e) {
	            next(e);
	        });
	    });
			/*
	    _oApp.post( oOptions.sBreezeRequestPath + 'purge', function(req, res, next){
						function purge() {
			        var Todos =_sequelizeManager.models.Todos;
			        //must pass options.where to destroy (when using Sequelize v2.0.4)
			        var options = {
			            where: true
			        };
			        return Todos.destroy(options);
			    }
	        purge().then(function(){
	           res.send('purged');
	        });
	    });
	    _oApp.post( oOptions.sBreezeRequestPath + 'reset', function(req, res, next){
	        purge().then(seed).then(function(){
	            res.send('reset');
	        });
	    });
			*/
	// TODO: HTTPS requests
	    // Start listening for HTTP requests
	    _oApp.listen( oOptions.iBreezePort );
		}
		return _oApp;
	}
}

/*
function fBreezeReturnResults( results, oResponse ){
	oResponse.setHeader( 'Content-Type:', 'application/json' );
	oResponse.send( results );
}

function fExecuteEntityQuery( oEntityQuery, fReturnResults , oResponse, next ) {
		var _fReturnResults = fBreezeReturnResults || fReturnResults;
		var _oQuery = new SequelizeQuery( _oSequelizeManager, oEntityQuery );
			_oQuery.execute().then( function ( results ){
					_fReturnResults( results, oResponse );
			})
			.catch( next )
		;
}
*/

module.exports = EmitterWeb;
