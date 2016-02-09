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
let fs = require('fs');
let path = require('path');

let Umzug = require('umzug');
let Bluebird = require('bluebird');
let _ = require('lodash');

let Logger = require('./Logger.js');

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
			oLogger: null
		}, oOptions );
		// Init logger and extends loggind methods on this class
		let oLogOptions = _.extend({
			sHeader: '[ ' + oOptions.sDB + ' ]'
		});
		let _oLogger = ( oOptions.oLogger ? oOptions.oLogger : new Logger( oLogOptions ) );
		_oLogger.extend( oOptions.sDB, this, oLogOptions );
		//
		this.__oOptions = oOptions;
		this._oSequelize = null;
		this._bOpened = false;
	}

	init(){
		return Bluebird.all( [ this.__initEnvSequelize(), this.__initEnvUmzug() ] );
	}

	__initEnvSequelize(){
		let _DB = this;
		// Init Sequelize
		let Sequelize = require('sequelize');
		this._oSequelize = new Sequelize( this.__oOptions.sDB, this.__oOptions.sUsername , this.__oOptions.sPassword, {
			logging: function( log ){ _DB.debug( '[ Sequelize ] ', log ); },
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
		return Bluebird.resolve();
	}

	__initEnvUmzug(){
		let _DB = this;
		this._oUmzug = new Umzug({
			storage: 'sequelize',
			storageOptions: {
					sequelize: _DB._oSequelize,
			},
			logging: function( sLog ){ _DB.debug( '[ Umzug ] ' +  sLog ); },
			migrations: {
				params: [ _DB._oSequelize.getQueryInterface(), _DB._oSequelize.constructor, function(){ throw new Error('Migration tried to use old style "done" callback. Please upgrade to "umzug" and return a promise instead.'); }],
				path: this.__oOptions.sMigrationsDir,
				pattern: /\.js$/
			}
		});
		return Bluebird.resolve();
	}

	/**
	* Function used to open DB, starting migrations and breeze service if needed
	*
	* @method    open
	* @public
	*
	* @return    {Object} it returns a promise successfull if no error has been met, with an array of executed migrations as paramater
	*
	* @example
	*   DB.open();
	*/
	open(){
		// Opening DB and starting migrations if needed
		let _DB = this;
		let _oPromiseToReturn = null;
		if( !this._bOpened ){
			_oPromiseToReturn = _DB.init()
				.then(function(){
					return _DB._oUmzug.up()
						.then( function( aExecutedMigrations ){
							_DB._bOpened = true;
							return Bluebird.resolve( aExecutedMigrations );
						})
					;
				})
			;
		} else {
			_oPromiseToReturn = Promise.reject( new Error( 'already opened' ) );
		}
		return _oPromiseToReturn;
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
	*   DB.getModel();
	*/
	getModel( sTable ){
		return this._oSequelize.models[ sTable ];
	}
}

module.exports = DB;
