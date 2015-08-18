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
/**
 * A generic class to describe the central Ancilla's DB manager.
 * The class is built on:
 * "sequelize": http://docs.sequelizejs.com/en/latest/
 * "umzug": https://github.com/sequelize/umzug
 * "breeze": http://www.getbreezenow.com/
 *
 * @class	DB
 * @public
 *
 * @param	{Object}		oOptions			An object of options for the DB
 *
 * @return	{Void}
 *
 * @example
 *		new DB()
 */
var Logger = require('./Logger.js');

var Express = require('express');
var Umzug = require('umzug');
var Bluebird = require('bluebird');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');

class DB {
	constructor( oOptions ){
		//Default DB Options
		oOptions = _.extend({
			sDB: 'database',
			sHost: null,
			sUsername: null,
			sPassword: null,
			sDialect: 'sqlite',
			sStoragePath: 'database.sqlite',
			sModelsDir: 'DB/models/sequelize',
			sMigrationsDir: 'DB/migrations',
			bUseBreeze: false,
			sBreezeRequestPath: '/breeze/',
			iBreezePort: 3000,
			oLogger: null
		}, oOptions );
		// Init logger and extends loggind methods on this class
		var _oLogger = ( oOptions.oLogger ? oOptions.oLogger : new Logger() );
		_oLogger.extend( this );
		//
		this.__oOptions = oOptions;
		this._oSequelize = null;
		var _DB = this;
		if( this.__oOptions.bUseBreeze ){ // Breeze - Sequelize ( http://breeze.github.io/doc-node-sequelize/class-descriptions.html )
			var BreezeSequelize = require('breeze-sequelize');
			var SequelizeManager = BreezeSequelize.SequelizeManager;
			// Init Sequelize Manager
			this._oSequelizeManager = new SequelizeManager({
					database: this.__oOptions.sDB,
					username: this.__oOptions.sUsername,
					password: this.__oOptions.sPassword,
					host: this.__oOptions.sHost,
				},{
					logging: function( sLog ){ _DB.debug( '[ DB ] ' + sLog ); },
					dialect: this.__oOptions.sDialect,
					storage: this.__oOptions.sStoragePath
				}
			);
			// Init Sequelize
			this._oSequelize = this._oSequelizeManager.sequelize;
			// Init Metadata store
			var _oMetadataStore = new BreezeSequelize.breeze.MetadataStore();
			// Init DB's models by collecting metadata
			var _aPromises = [];
			fs
				.readdirSync( this.__oOptions.sModelsDir )
				.filter( function( sFile ){
					return ( sFile.indexOf( '.' ) !== 0);
				})
				.forEach( function( sFile ){
					var _sPath = path.join( _DB.__oOptions.sModelsDir, sFile );
					var _fImport = require( _sPath );
					// Adding entity to metadata store
					_aPromises.push ( _fImport( BreezeSequelize.breeze, _oMetadataStore ) );
				});
			Bluebird.all( _aPromises )
				.then( function(){
					// setting entity type for resource name
					var _aTypes = _oMetadataStore.getEntityTypes();
	        _aTypes.forEach( function ( oType ){
	            if( oType instanceof BreezeSequelize.breeze.EntityType ){
									_oMetadataStore.setEntityTypeForResourceName( oType.shortName, oType.shortName );
	            }
	        });
					// Importing Metadata to create DB's models
					_DB._oSequelizeManager.importMetadata( _oMetadataStore );
				})
				.catch( function( oError ){
					_DB.error( '[ Error: %s ] unable to correctly load DB\'s models.', oError );
				})
			;
		} else { // Sequelize
			var Sequelize = require('sequelize');
			this._oSequelize = new Sequelize( this.__oOptions.sDB, this.__oOptions.sUsername , this.__oOptions.sPassword, {
				logging: function( sLog ){ _DB.debug( '[ DB ] ' + sLog ); },
				dialect: this.__oOptions.sDialect,
				storage: this.__oOptions.sStoragePath
			});
			// Init DB's models
			fs
				.readdirSync( this.__oOptions.sModelsDir )
				.filter( function( sFile ){
					return ( sFile.indexOf( '.' ) !== 0);
				})
				.forEach( function( sFile ){
					_DB._oSequelize.import( path.join( this.__oOptions.sModelsDir, sFile ) );
				});
		}
		// Umzug
		this._oUmzug = new Umzug({
			storage: 'sequelize',
			storageOptions: {
					sequelize: _DB._oSequelize,
			},
			logging: function( sLog ){ _DB.debug( '[ DB ] ' + sLog ); },
			migrations: {
				params: [ _DB._oSequelize.getQueryInterface(), _DB._oSequelize.constructor, function(){ throw new Error('Migration tried to use old style "done" callback. Please upgrade to "umzug" and return a promise instead.'); }],
				path: this.__oOptions.sMigrationsDir,
				pattern: /\.js$/
			}
		});
		this._bOpened = false;
	}

	/**
	* Function used to open DB, starting migrations and breeze service if needed
	*
	* @method    open
	* @public
	*
	* @return    {Object} it returns a promise successfull if no error has been met
	*
	* @example
	*   DB.open();
	*/
	open(){
		// Opening DB and starting migrations if needed
		var _DB = this;
		var _oPromiseToReturn = null;
		if( !this._bOpened ){
			_oPromiseToReturn = this._oUmzug.up()
				.then( function( aExecutedMigrations ){
					_DB._bOpened = true;
					// Enabling breeze service if needed
					if( _DB.__oOptions.bUseBreeze ){
						_DB.__startBreezeService();
					}
					return Promise.resolve( aExecutedMigrations );
				})
				.catch(function( oError ){
					return Promise.reject( oError );
				});
		} else {
			_oPromiseToReturn = Promise.reject();
		}
		return _oPromiseToReturn;
	}

	/**
	* Function used to start breeze's web services on configured port if breeze has been enabled
	*
	* @method    __startBreezeService
	* @private
	*
	* @return    {Void}
	*
	* @example
	*   DB.__startBreezeService();
	*/
	__startBreezeService(){
		var BreezeSequelize = require('breeze-sequelize');
		var Breeze = BreezeSequelize.breeze;
		var _DB = this;
		var _oApp = Express();
		var Compress     = require('compression');
		var BodyParser   = require('body-parser');
		//_oApp.use(logger('dev'));
		_oApp.use( Compress() );
		_oApp.use( BodyParser.urlencoded( { extended: true } ) );
		_oApp.use( BodyParser.json() );
		//_oApp.use( Express.static( __dirname + '/../client' ) );
		// Init Breeze routes
		_oApp.get( path.posix.join( this.__oOptions.sBreezeRequestPath, 'Metadata' ), function ( oRequest, oResponse, next ){
				try {
					_DB.__answerBreezeRequest( oResponse, _DB._oSequelizeManager.metadataStore.exportMetadata() );
				} catch( e ){
					next( e );
				}
    });
		_oApp.get( path.posix.join( this.__oOptions.sBreezeRequestPath, ':entity' ), function( oRequest, oResponse, next ){
			var _sResourceName = oRequest.params.entity;
			var _oEntityQuery = Breeze.EntityQuery.fromUrl( oRequest.originalUrl, _sResourceName );
			var _oQuery = new BreezeSequelize.SequelizeQuery( _DB._oSequelizeManager, _oEntityQuery );
			_oQuery.execute().then( function( results ){
					// Enable CORS
					_DB.__answerBreezeRequest( oResponse, results);
      	})
				.catch( next )
			;
    });
/*
    _oApp.post( path.posix.join( this.__oOptions.sBreezeRequestPath, 'Save' ).replace(/[\\$'"]/g, "\\$&"), function ( req, res, next ) {
console.error( 'TODO: save' );
        var saveHandler = new SequelizeSaveHandler(_sequelizeManager, req);
        saveHandler.save().then(function(r) {
            returnResults(r, res);
        }).catch(function(e) {
            next(e);
        });
    });
    _oApp.post( path.posix.join( this.__oOptions.sBreezeRequestPath, 'Purge' ).replace(/[\\$'"]/g, "\\$&"), function( req, res, next ){
console.error( 'TODO: purge' );
        purge().then(function(){
           res.send('purged');
        });
    });
    _oApp.post( path.posix.join( this.__oOptions.sBreezeRequestPath, 'Reset' ).replace(/[\\$'"]/g, "\\$&"), function( req, res, next ){
console.error( 'TODO: reset' );
        purge().then(seed).then(function(){
            res.send('reset');
        });
    });
*/
		// Listening on breeze port
		_oApp.listen( this.__oOptions.iBreezePort );
	}

	__answerBreezeRequest( oResponse, results ){
		// Enable CORS
		oResponse.header('Access-Control-Allow-Origin', '*');
		//oResponse.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
		//oResponse.header('Access-Control-Allow-Headers', 'Content-Type');
		// Answering
		oResponse.setHeader( 'Content-Type:', 'application/json' );
		oResponse.send( results );
	}

	/**
	* Function used to get the model of a defined table
	*
	* @method    getModel
	* @private
	*
	* @param	{String}	Table's name
	*
	* @return    {Object} the model of the defined table
	*
	* @example
	*   DB.open();
	*/
	getModel( sTable ){
		return this._oSequelize.models[ sTable ];
	}
}

module.exports = DB;
