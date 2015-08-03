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
//var Constant = require('./Constants.js');

var Express = require('express');
var Umzug = require('umzug');
var Bluebird = require('bluebird');
var Tools = require('./Tools.js');

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
			fLogging: false
		}, oOptions );
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
					logging: this.__oOptions.fLogging,
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
				logging: this.__oOptions.fLogging,
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
			logging: this.__oOptions.fLogging,
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
					// Enable CORS
					oResponse.header('Access-Control-Allow-Origin', '*');
    			//oResponse.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    			//oResponse.header('Access-Control-Allow-Headers', 'Content-Type');
					oResponse.setHeader( 'Content-Type:', 'application/json' );
					oResponse.send( _DB._oSequelizeManager.metadataStore.exportMetadata() );
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
					oResponse.header('Access-Control-Allow-Origin', '*');
					//oResponse.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
					//oResponse.header('Access-Control-Allow-Headers', 'Content-Type');
					oResponse.setHeader( 'Content-Type:', 'application/json' );
					oResponse.send( results );
      	})
				.catch( next )
			;
			/*
			oResponse.header('Access-Control-Allow-Origin', '*');
			oResponse.setHeader( 'Content-Type:', 'application/json' );
			oResponse.send( '{"hello":"world"}' );
			*/
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

	/*
	DB.prototype.close = function(){
		if( this._bOpened ){
			//this._oDB.removeAllListeners('profile');
			Tools.debug('[ DB: "%s" ] Closing DB...', this.getDBPath() );
			this.getDBManager().close(function( oError ){
				if( oError ){
					Tools.error('[ DB: "%s" ] Failed to close DB: "%s"...', this.getDBPath() );
				}
			});
			this._bOpened = false;
		}
	}


	DB.prototype.__queries = function( aQueries, fCallback, oOptions ){
		//Default DB Options
		oOptions = _.extend({
			bUseTransaction: false
		}, oOptions );
		var _oDB = this;
		var _iResult = 0;
		var _iCounterQueriesDone = 0;
		var _aQueries = [];
		// Converting all queries to string queries
		for( var _iIndex in aQueries ){
			var _Query = aQueries[ _iIndex ];
			//_aQueries.push( ( typeof _Query == 'string' ? _Query : _Query.toParam() ) );
			_aQueries.push( ( typeof _Query == 'string' ? _Query : _Query.toString() ) );
		}
		this.open();
		var _aClonedQueries = _aQueries.slice( 0 );
		this.getDBManager().serialize( function(){
			if( oOptions.bUseTransaction ){
				//_aQueries.unshift( 'BEGIN TRANSACTION;' );
				Tools.debug('[ DB: "%s" ] Using transaction for the following queries...', _oDB.getDBPath() );
				_oDB.getDBManager().run( 'BEGIN TRANSACTION;' );
			}
			for( var _iIndex in _aQueries ){
				var _sQuery = _aQueries[ _iIndex ];
				Tools.debug('[ DB: "%s" ] Executing query: "%s"...', _oDB.getDBPath(), _sQuery );
				// Getting Query type
				var _sOperation = _sQuery.split(' ')[ 0 ].toUpperCase();
				switch( _sOperation ){
					case 'CREATE':
					case 'INSERT':
				  case 'DELETE':
					case 'UPDATE':
					case 'BEGIN':
					case 'END':
					case 'COMMIT':
					case 'ROLLBACK':
						_oDB.getDBManager().run( _sQuery, Tools.proxy( _oDB.__queriesCallback, _oDB, fCallback, oOptions, _aClonedQueries, _iCounterQueriesDone ) );
					break;
					case 'SELECT':
						_oDB.getDBManager().all( _sQuery, Tools.proxy( _oDB.__queriesCallback, _oDB, fCallback, oOptions, _aClonedQueries, _iCounterQueriesDone ) );
					break;
					default:
						Tools.error('[ DB: "%s" ] Unsupported operation: "%s"...', _oDB.getDBPath(), _sOperation );
					break;
				}
			}
		} );
	}

	DB.prototype.__queriesCallback=function( fCallback, oOptions, aQueries, iCounterQueriesDone, oError, oRows ){
		var _iResult = 0;
		var _oError = oError;
		var _oDB = this;
		var _sCurrentQuery = aQueries.shift(); //Since all the queries are serialized we are assuming they are executed in order
		if( oOptions.bUseTransaction ){
			if( oError ){
				_oDB.getDBManager().run( 'ROLLBACK;', function( oError ){
					if( oError ){
						Tools.error('[ DB: "%s" ] Fatal error: unable to rollback transaction...', _oDB.getDBManager().filename );
					} else {
						Tools.error('[ DB: "%s" ] Failed query: "%s" with error ( %s ): "%s". Rollbacking transaction...', _oDB.getDBManager().filename, _sCurrentQuery, _oError.errno, _oError );
						if( oOptions.bCloseDB ){
							_oDB.close();
						}
						fCallback( _iResult, oRows, ( aQueries.length == 0 ? aQueries[ 0 ] : aQueries ) );
					}
				});
			} else if( aQueries.length == 0 ){ // If it's the last query of the serialization
				_oDB.getDBManager().run( 'COMMIT;', function( oError ){
					if( oError ){
						Tools.error('[ DB: "%s" ] Fatal error: unable to commit transaction...', _oDB.getDBManager().filename );
					} else {
						Tools.debug('[ DB: "%s" ] Committed transaction...', _oDB.getDBManager().filename );
						if( oOptions.bCloseDB ){
							_oDB.close();
						}
						fCallback( _iResult, oRows, ( aQueries.length == 0 ? aQueries[ 0 ] : aQueries ) );
					}
				});
			}
		} else {
			if( oError ){
				Tools.error('[ DB: "%s" ] Failed query: "%s" with error ( %s ): "%s"...', _oDB.getDBManager().filename, _sCurrentQuery, oError.errno, oError );
				_iResult = oError.errno;
			}
			if( aQueries.length == 0 ){ // If it's the last query of the serialization
				Tools.debug('[ DB: "%s" ] Completed queries serialization...', _oDB.getDBManager().filename );
				if( oOptions.bCloseDB ){
					_oDB.close();
				}
				fCallback( _iResult, oRows, ( aQueries.length == 0 ? aQueries[ 0 ] : aQueries ) );
			}
		}
	}

	DB.prototype.query = function( SQLquery, fCallback, oOptions ){
		//Default DB Options
		oOptions = _.extend({
			bCloseDB: false,
			bUseTransaction: false
		}, oOptions );
		// Converting to array
		if( !Tools.isArray( SQLquery ) ){
			SQLquery = [ SQLquery ];
		}
		this.__queries( SQLquery, fCallback, oOptions );
	}

	DB.prototype.getDBManager=function(){
		return this._oDB;
	}

	DB.prototype.getDBPath = function(){
		return this.getDBManager().filename;
	}
	*/
	/**
	* Function used to parse a value which should be used inside an SQL query and sanitize it
	*
	* @method    __parseValue
	* @private
	*
	* @return    {Other/String} it returns the parsed string or the same value; for example "Hello W'orld" becames "Hello W''orld"
	*
	* @example
	*   DB.__parseValue( "Hello W'orld" );
	*/
	/*
	DB.prototype.__parseValue = function( value ){
		if( Tools.isString( value ) ){
			value = "'" + value.replace(/'/g, '\'\'') + "'";
		} else if( Tools.isArray( value ) ){
			var _bIsString = Tools.isString( value[ 0 ] );
			value = '( ' + ( _bIsString ? "'" : '' ) +  value.join( ( _bIsString ? "'" : '' ) + ',' + ( _bIsString ? "'" : '' ) ) + ( _bIsString ? "'" : '' ) + ' )';
		}
		//return JSON.stringify( value );
		return value;
	}
	*/
	/**
	* Function used to build a query string from specific datas
	*
	* @method    builder
	* @public
	*
	* @return   {Object}		Builder query ( see: http://hiddentao.github.io/squel/ )
	*
	* @example
	* DB.builder().select().from('OBJECT');
	*/
	/*
	DB.prototype.builder = function(){
		return Squel;
	}
	*/
	/**
	* Function used to build a query string from specific datas
	*
	* @method    expr
	* @public
	*
	* @return   {Object}		expression query ( see: http://hiddentao.github.io/squel/ )
	*
	* @example
	* DB.expr().and('ID=1');
	*/
	/*
	DB.prototype.expr = function(){
		return Squel.expr();
	}
	*/
	/**
	 * Method called to get table's rows from DB
	 *
	 * @method    selectTableRows
	 * @public
	 *
	 * @param			{String}	sTable		DB's table name
	 * @param			{String/Object}	SQLExpr		string SQL expression or object SQL expression ( see DB "buildQuery" method description )
	 *
	 * @return    {Object}	this method will return a promise; the promise will fail on error, otherwise it will be successfull and the first parameter will be the collected ROWs
	 *
	 * @example
	 *   DB.selectTableRows( sTable, SQLExpr );
	 */
	/*
	DB.prototype.selectTableRows = function( sTable, SQLExpr ){
		var _oDB = this;
		if( !SQLExpr ){
			SQLExpr = _oDB.expr();
		}
		var _oQuery = _oDB.builder()
			.select()
			.from( sTable )
			.where( SQLExpr )
		;
		return new Promise( function( fResolve, fReject ){
			_oDB.query( _oQuery,
				function( iError, oRows, sQuery ){
					if( iError != Constant._NO_ERROR ){
						fReject( iError );
					} else {
						fResolve( oRows );
					}
				}
			);
		});
	}
	*/
	/**
	 * Method called to update table's fields by IDs from DB
	 *
	 * @method    updateTableRows
	 * @public
	 *
	 * @param			{String}	sTable		DB's table name
	 * @param			{Number/Array}	ids		An object's ID or an array of object's IDs
	 * @param			{Object}	oFieldsAndValues		An object instance linking a value to its field
	 * @param			{String/Object}	SQLExpr		string SQL expression or object SQL expression ( see DB "buildQuery" method description )
	 *
	 * @return    {Object}	this method will return a promise; the promise will fail on error, otherwise it will be successfull
	 *
	 * @example
	 *   DB.updateTableRows( 'OBJECT', 100, {name: 'Hello World'}, SQLExpr );
	 *   DB.updateTableRows( 'OBJECT', [ 100, 101, 102 ], {name: 'Hello World', value: 0}, SQLExpr );
	 */
	/*
	DB.prototype.updateTableRows = function( sTable, oFieldsAndValues, SQLExpr ){
		var _oDB = this;
		if( !SQLExpr ){
			SQLExpr = _oDB.expr();
		}
		var _oQuery = _oDB.builder()
			.update()
			.table( sTable )
			.setFields( oFieldsAndValues )
			.where( SQLExpr )
		;
		return new Promise( function( fResolve, fReject ){
			// Query
			_oDB.query( _oQuery,
				function( iError ){
					if( iError != Constant._NO_ERROR ){
						fReject( iError );
					} else {
						fResolve();
					}
				}
			);
		});
	};
	*/
	/**
	 * Method called to insert table's rows into DB
	 *
	 * @method    insertTableRows
	 * @public
	 *
	 * @param			{String}	sTable		DB's table name
	 * @param			{Object/Object[]}	Rows		An object instance describing a single row or an array of object instances describing the single rows
	 *
	 * @return    {Object}	this method will return a promise; the promise will fail on error, otherwise it will be successfull
	 *
	 * @example
	 *   DB.insertTableRows( 'OBJECT', 100, {name: 'Hello World'}, SQLExpr );
	 *   DB.insertTableRows( 'OBJECT', [ 100, 101, 102 ], {name: 'Hello World', value: 0}, SQLExpr );
	 */
	/*
	DB.prototype.insertTableRows = function( sTable, Rows ){
		var _oDB = this;
		var _aRows = null;
		if( Tools.isArray( Rows ) ){
			_aRows = Rows;
		} else {
			_aRows = [ Rows ];
		}
		var _oQuery = _oDB.builder()
			.insert()
			.into( sTable )
			.setFieldsRows( _aRows )
		;
		return new Promise( function( fResolve, fReject ){
			// Query
			_oDB.query( _oQuery,
				function( iError ){
					if( iError != Constant._NO_ERROR ){
						fReject( iError );
					} else {
						fResolve();
					}
				}
			);
		});
	};
	*/
	/**
	 * Method called to delete table's rows from DB
	 *
	 * @method    deleteTableRows
	 * @public
	 *
	 * @param			{String}	sTable		DB's table name
	 * @param			{String/Object}	SQLExpr		string SQL expression or object SQL expression ( see DB "buildQuery" method description )
	 *
	 * @return    {Object}	this method will return a promise; the promise will fail on error, otherwise it will be successfull and the first parameter will be the collected ROWs
	 *
	 * @example
	 *   DB.deleteTableRows( sTable, SQLExpr );
	 */
	/*
	DB.prototype.deleteTableRows = function( sTable, SQLExpr ){
		var _oDB = this;
		if( !SQLExpr ){
			SQLExpr = _oDB.expr();
		}
		var _oQuery = _oDB.builder()
			.delete()
			.from( sTable )
			.where( SQLExpr )
		;
		return new Promise( function( fResolve, fReject ){
			_oDB.query( _oQuery,
				function( iError, oRows, sQuery ){
					if( iError != Constant._NO_ERROR ){
						fReject( iError );
					} else {
						fResolve( oRows );
					}
				}
			);
		});
	}
	*/

	error(){
		// TODO: use a decent unique logger
		Tools.error.apply( Tools, Array.prototype.slice.call( arguments ) );
	}
}

module.exports = DB;
