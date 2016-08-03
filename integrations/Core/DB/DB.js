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
let fs = require('fs');
let path = require('path');

let _ = require('lodash');
let Bluebird = require('bluebird');
let BreezeSequelize = require('breeze-sequelize');
let Breeze = BreezeSequelize.breeze;

let Ancilla = require('../../../lib/ancilla.js');
let DB = Ancilla.DB;
let Constant = Ancilla.Constant;

class DBCore extends DB {
  constructor( oOptions ){
		//Default DB Options
		oOptions = _.extend({
      sModelsDir: 'DB/models/sequelize',
			sBreezeRequestPath: '/breeze/',
			iBreezePort: Constant._PORT_HTTP
		}, oOptions );
    super( oOptions );
	}

  init(){
    // Overwriting super "init" method
    let _DB = this;
    return _DB.__initEnvBreeze()
      .then( function(){
        return _DB.__initEnvUmzug();
      })
    ;
  }

  open(){
    //let _DB = this;
    return super.open()
      .then(function( aExecutedMigrations ){
        //return _DB.__startBreezeService()
          //.then(function(){
            return Bluebird.resolve( aExecutedMigrations );
          //})
        //;
      })
    ;
  }

  __initEnvBreeze(){
    // Breeze - Sequelize ( http://breeze.github.io/doc-node-sequelize/class-descriptions.html )
    let _DB = this;
		let SequelizeManager = BreezeSequelize.SequelizeManager;
		// Init Sequelize Manager
		this._oSequelizeManager = new SequelizeManager({
				database: this.__oOptions.sDB,
				username: this.__oOptions.sUsername,
				password: this.__oOptions.sPassword,
				host: this.__oOptions.sHost,
			},{
				logging: function( log ){ _DB.debug( '[ Sequelize Manager ] %j', log ); },
				dialect: this.__oOptions.sDialect,
				storage: this.__oOptions.sStoragePath
			}
		);
		// Init Sequelize
		this._oSequelize = this._oSequelizeManager.sequelize;
		// Init Metadata store
		let _oMetadataStore = new BreezeSequelize.breeze.MetadataStore();
		// Init DB's models by collecting metadata
		let _aPromises = [];
		fs
			.readdirSync( this.__oOptions.sModelsDir )
			.filter( function( sFile ){
				return ( sFile.indexOf( '.' ) !== 0);
			})
			.forEach( function( sFile ){
				let _sPath = path.join( _DB.__oOptions.sModelsDir, sFile );
				let _fImport = require( _sPath );
				// Adding entity to metadata store
				_aPromises.push ( _fImport( BreezeSequelize.breeze, _oMetadataStore ) );
			});
		return Bluebird.all( _aPromises )
			.then( function(){
				// Setting entity type for resource name
				let _aTypes = _oMetadataStore.getEntityTypes();
        _aTypes.forEach( function ( oType ){
            if( oType instanceof BreezeSequelize.breeze.EntityType ){
								_oMetadataStore.setEntityTypeForResourceName( oType.shortName, oType.shortName );
            }
        });
				// Importing Metadata to create DB's models
				_DB._oSequelizeManager.importMetadata( _oMetadataStore );
        // Returning a resolve
        return Bluebird.resolve();
			})
			.catch( function( oError ){
				_DB.error( '[ Error: %s ] unable to correctly load DB\'s models.', oError );
			})
		;
  }

  handleBreezeRequestMetadata( oRequest, oResponse, next ){
    let _DB = this;
    try {
      let _sMetadata = _DB._oSequelizeManager.metadataStore.exportMetadata();
      // Clearing metadata from sensible tables
      let _oMetadata = JSON.parse( _sMetadata );
      let _aNewStructuralType = [];
      for( let _iIndex=0; _iIndex < _oMetadata.structuralTypes.length; _iIndex++ ){
        var _oTable = _oMetadata.structuralTypes[ _iIndex ];
        if( _DB.__isSensibleTable( _oTable.shortName ) ){
          // Removing from metadata
          delete _oMetadata.resourceEntityTypeMap[ _oTable.shortName ];
        } else {
          // Allowed table metadata
          _aNewStructuralType.push( _oTable );
        }
      }
      // Setting new filtered structural type
      _oMetadata.structuralTypes = _aNewStructuralType;
      // Preparing answer
      _sMetadata = JSON.stringify( _oMetadata );
      // Answering
      _DB.silly( 'Answering Metadata: %s', _sMetadata );
      _DB.__answerBreezeRequest( oResponse, _sMetadata );
    } catch( e ){
      _DB.error( 'Failed to share Metada: %s', e );
      next( e );
    }
  }

  handleBreezeRequestEntity( oRequest, oResponse, next ){
    let _DB = this;
    let _sResourceName = oRequest.params.entity;
    // Filtering request to sensible Data
    if( _DB.__isSensibleTable( _sResourceName ) ){
      _DB.error( 'A request is trying to access a sensible table "%s": ', _sResourceName );
      next();
    } else {
      let _sQueryURL = oRequest.originalUrl;
      // Filtering by DEFAULT behaviour ( You cannot access invisible and protected items )
      let _oEntityQuery = Breeze.EntityQuery.fromUrl( _sQueryURL, _sResourceName )
        .where({
          'or':[
            { 'isProtected': { '!=': 1 } },
            {
              'isProtected': 1,
              'isVisible': 1
            }
          ]
        })
      ;
//TODO:
console.error( 'TODO: USER Permissions Check on GET query' );
      let _oQuery = new BreezeSequelize.SequelizeQuery( _DB._oSequelizeManager, _oEntityQuery );
      _oQuery.execute()
        .then( function( results ){
          _DB.__answerBreezeRequest( oResponse, results);
        })
        .catch( function(e){
          _DB.error( 'Failed to handle breeze request entity "%s": %s', _sQueryURL, e );
          next( e );
        })
      ;
    }
  }

	__answerBreezeRequest( oResponse, results ){
		// Answering
		oResponse.set( 'Content-Type', 'application/json' );
		oResponse.send( results );
	}

  __isSensibleTable( sTableName ){
    let _bSensible = false;
    switch( sTableName ){
      case 'OAUTH_USERS':
      case 'OAUTH_CLIENTS':
      case 'OAUTH_REFRESH_TOKENS':
      case 'OAUTH_ACCESS_TOKENS':
        _bSensible = true;
      break;
      default:
        _bSensible = false;
      break;
    }
    return _bSensible;
  }
}
module.exports = DBCore;
