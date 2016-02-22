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
let crypto = require('crypto');

let _ = require('lodash');
let Bluebird = require('bluebird');
let Cors = require('cors');

let Ancilla = require('../../../lib/ancilla.js');
let DB = Ancilla.DB;
let Constant = Ancilla.Constant;

class DBCore extends DB {
  constructor( oOptions ){
		//Default DB Options
		oOptions = _.extend({
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
    let _DB = this;
    return super.open()
      .then(function( aExecutedMigrations ){
        return _DB.__startBreezeService()
          .then(function(){
            return Bluebird.resolve( aExecutedMigrations );
          })
        ;
      })
    ;
  }

  __initEnvBreeze(){
    // Breeze - Sequelize ( http://breeze.github.io/doc-node-sequelize/class-descriptions.html )
    let _DB = this;
		let BreezeSequelize = require('breeze-sequelize');
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
				// setting entity type for resource name
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
    let BreezeSequelize = require('breeze-sequelize');
    let Breeze = BreezeSequelize.breeze;
    let _DB = this;
    let Express = require('express');
    let OAuth2Server = require('oauth2-server');
    let _oApp = Express();
    let Compress     = require('compression');
    let BodyParser   = require('body-parser');
		//_oApp.use(logger('dev'));
		_oApp.use( Compress() );
		_oApp.use( BodyParser.urlencoded( { extended: true } ) );
		_oApp.use( BodyParser.json() );
		//_oApp.use( Express.static( __dirname + '/../client' ) );
    _oApp.use( function( error, oRequest, oResponse, fNext ){
      if( error ){
        _DB.error( '[ Express ] Error: %j', error );
      }
      fNext( error );
    });
    // Enbale CORS
    _oApp.use( Cors() );
    /*
    _oApp.use( function( oRequest, oResponse, fNext ){
      oResponse.header('Access-Control-Allow-Origin', '*');
      //oResponse.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
      oResponse.header( 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept' );
      fNext();
    });
    */
		// oAuth 2.0
		_oApp.oauth = OAuth2Server({
		  model: {
				getAccessToken: function( sAccessToken, fCallback ){
					_DB.getModel( 'OAUTH_ACCESS_TOKENS' )
						.findOne({ where: {
							access_token: sAccessToken
						} })
						.then(function( oToken ){
              if( oToken ){
                _DB.debug( '[ oAuth2 ] Successfully get access token: %j', sAccessToken );
  				      fCallback( null, {
  				        accessToken: oToken.access_token,
  				        clientId: oToken.client_id,
  				        expires: oToken.expires,
  				        userId: oToken.user_id
  				      });
              } else {
                _DB.error( '[ oAuth2 ] Unable to find access token "%j": ', sAccessToken );
								return fCallback();
              }
						})
						.catch(function(error){
              _DB.error( '[ oAuth2 ] Error %j: Failed to get access token: %j', error, sAccessToken );
							fCallback( error );
						})
					;
				},
				getRefreshToken: function( sRefreshToken, fCallback ){
					_DB.getModel( 'OAUTH_REFRESH_TOKENS' )
						.findOne({ where: {
							refresh_token: sRefreshToken
						} })
						.then(function( oToken ){
              if( oToken ){
                _DB.debug( '[ oAuth2 ] Successfully get refresh token: %j', sRefreshToken );
                fCallback( null, {
                  refreshToken: oToken.refresh_token,
                  clientId: oToken.client_id,
                  expires: oToken.expires,
                  userId: oToken.user_id
                });
              } else {
                _DB.error( '[ oAuth2 ] Unable to find refresh token "%j": ', sRefreshToken );
                return fCallback();
              }
						})
						.catch(function(error){
              _DB.error( '[ oAuth2 ] Error %j: Failed to get refresh token: %j', error, sRefreshToken );
							fCallback( error );
						})
					;
				},
        revokeRefreshToken: function( sRefreshToken, fCallback) {
          _DB.getModel( 'OAUTH_REFRESH_TOKENS' )
            .destroy({
              where: {
                refresh_token: sRefreshToken
              }
            })
            .then(function(){
              _DB.debug( '[ oAuth2 ] Successfully revoke refresh token: %j', sRefreshToken );
              fCallback( null );
            })
            .catch(function(error){
              _DB.error( '[ oAuth2 ] Error %j: Failed to revoke refresh token: %j', error, sRefreshToken );
              fCallback( error );
            })
          ;
          //dal.doDelete(OAuthRefreshTokenTable, { refreshToken: { S: bearerToken }}, callback);
        },
				getClient: function( sClientID, sClientSecret, fCallback ){
          let _sHashedSecret = crypto.createHash('sha1').update( sClientSecret ).digest('hex');
					_DB.getModel( 'OAUTH_CLIENTS' )
						.findOne({ where: {
							client_id: sClientID
						} })
						.then(function( oClient ){
      				if( !oClient || ( sClientSecret !== null && oClient.client_secret !== _sHashedSecret ) ){
                _DB.error( '[ oAuth2 ] Unable to find client with ID "%j": ', sClientID, ( !oClient ? 'client doesn\'t exists' : 'wrong secret used' ) );
								return fCallback();
							} else {
                _DB.debug( '[ oAuth2 ] Successfully get client: "%s"', oClient.client_id );
								fCallback( null, {
					        clientId: oClient.client_id,
					        clientSecret: oClient.client_secret
					      } );
							}
						})
						.catch(function(error){
              _DB.error( '[ oAuth2 ] Error %j: Failed to get client', error );
							fCallback( error );
						})
					;
				},
        getUser: function( sUsername, sPassword, fCallback ){
					let _sHashedPassword = crypto.createHash('sha1').update( sPassword ).digest('hex');
					_DB.getModel( 'OAUTH_USERS' )
						.findOne({ where: {
							username: sUsername,
							password: _sHashedPassword
						} })
						.then(function( oUser ){
              if( oUser ){
                _DB.debug( '[ oAuth2 ] Successfully get user: "%s"', sUsername );
              } else {
                _DB.error( '[ oAuth2 ] Unable to find user "%s"', sUsername );
              }
							fCallback( null, ( oUser ? oUser.id : false ) );
						})
						.catch(function(error){
              _DB.error( '[ oAuth2 ] Error %j: Failed to get user', error );
							fCallback( error );
						})
					;
				},
				grantTypeAllowed: function( sClientID, sGrantType, fCallback ){
          _DB.getModel( 'OAUTH_CLIENTS' )
						.findOne({ where: {
							client_id: sClientID
						} })
						.then(function( oClient ){
                let _aAllowedGrants = JSON.parse( oClient.grant_types ) || [];
                let _bGrant = ( _aAllowedGrants.indexOf( sGrantType ) !== -1 ? true : false );
                if( !_bGrant ){
                  _DB.error( '[ oAuth2 ] Client ID "%s" has no rights to use the following gran type: "%s"; allowded grant types are: "%s"', sClientID, sGrantType, _aAllowedGrants );
                }
                fCallback( false, _bGrant );
            })
            .catch(function(error){
              _DB.error( '[ oAuth2 ] Error %j: Failed to get gran type for specific client', error );
							fCallback( error );
						})
          ;
				},
				saveAccessToken: function( sAccessToken, sClientID, sExpires, oUser, fCallback ){
          // Sometime oUser is not an object... don't ask me why!
          let _iUserID = ( typeof oUser === 'object' ? oUser.id : oUser );
					_DB.getModel( 'OAUTH_ACCESS_TOKENS' )
						.create({
							access_token: sAccessToken,
							client_id: sClientID,
							user_id: _iUserID,
							expires: sExpires,
						})
						.then(function(){
              _DB.debug( '[ oAuth2 ] Successfully saved access token "%s" for client ID "%s" and user ID "%s"', sAccessToken, sClientID, _iUserID );
							fCallback();
						})
						.catch(function(error){
              _DB.error( '[ oAuth2 ] Error %s: failed to save access token', error );
							fCallback( error );
						})
					;
				},
				saveRefreshToken: function( sRefreshToken, sClientID, sExpires, oUser, fCallback ){
          // Sometime oUser is not an object... don't ask me why!
          let _iUserID = ( typeof oUser === 'object' ? oUser.id : oUser );
					_DB.getModel( 'OAUTH_REFRESH_TOKENS' )
						.create({
							refresh_token: sRefreshToken,
							client_id: sClientID,
							user_id: _iUserID,
							expires: sExpires,
						})
						.then(function(){
              _DB.debug( '[ oAuth2 ] Successfully saved refresh token "%s" for client ID "%s" and user ID "%s"', sRefreshToken, sClientID, _iUserID );
							fCallback();
						})
						.catch(function(error){
              _DB.error( '[ oAuth2 ] Error %s: failed to save refresh token', error );
							fCallback( error );
						})
					;

				}
			},
		  grants: [ 'password', 'refresh_token' ],
      //accessTokenLifetime: 3600,
      accessTokenLifetime: 30,
      refreshTokenLifetime: 60,
      //refreshTokenLifetime: 1209600,
      //authCodeLifetime: 30,
		  //debug: function( oError ){ _DB.debug( '[ oAuth ] %j', oError ); }
      debug: false
		});
		_oApp.all( '/oauth/token', _oApp.oauth.grant() );
		_oApp.use( _oApp.oauth.errorHandler() );
		// Init Breeze routes
		_oApp.get( path.posix.join( _DB.__oOptions.sBreezeRequestPath, 'Metadata' ), _oApp.oauth.authorise(), function ( oRequest, oResponse, next ){
				try {
          let _sMetadata = _DB._oSequelizeManager.metadataStore.exportMetadata();
          // Clearing metadata from sensible tables
          let _oMetadata = JSON.parse( _sMetadata );
          let _aNewStrucutralType = [];
          for( let _iIndex=0; _iIndex < _oMetadata.structuralTypes.length; _iIndex++ ){
            var _oTable = _oMetadata.structuralTypes[ _iIndex ];
            switch( _oTable.shortName ){
              case 'OAUTH_USERS':
              case 'OAUTH_CLIENTS':
              case 'OAUTH_REFRESH_TOKENS':
              case 'OAUTH_ACCESS_TOKENS':
                // Removing from metadata
                delete _oMetadata.resourceEntityTypeMap[ _oTable.shortName ];
              break;
              default:
                // Allowrd table metadata
                _aNewStrucutralType.push( _oTable );
              break;
            }
          }
          // Setting new filtered structural type
          _oMetadata.structuralTypes = _aNewStrucutralType;
          // Preparing answer
          _sMetadata = JSON.stringify( _oMetadata );
          // Answering
					_DB.__answerBreezeRequest( oResponse, _sMetadata );
				} catch( e ){
					next( e );
				}
    });
		_oApp.get( path.posix.join( _DB.__oOptions.sBreezeRequestPath, ':entity' ), _oApp.oauth.authorise(), function( oRequest, oResponse, next ){
			let _sResourceName = oRequest.params.entity;
console.error( 'TODO: original URL', oRequest.originalUrl );
			let _oEntityQuery = Breeze.EntityQuery.fromUrl( oRequest.originalUrl, _sResourceName );
			let _oQuery = new BreezeSequelize.SequelizeQuery( _DB._oSequelizeManager, _oEntityQuery );
console.error( 'DB -> Called :entity' );
console.error( 'TODO: Filtering sensible tables' );
console.error( 'TODO: Permissions Check' );
			_oQuery.execute().then( function( results ){
					_DB.__answerBreezeRequest( oResponse, results);
      	})
				.catch( next )
			;
    });
/*
    _oApp.post( path.posix.join( _DB.__oOptions.sBreezeRequestPath, 'Save' ).replace(/[\\$'"]/g, "\\$&"), function ( req, res, next ) {
console.error( 'TODO: save' );
        let saveHandler = new SequelizeSaveHandler(_sequelizeManager, req);
        saveHandler.save().then(function(r) {
            returnResults(r, res);
        }).catch(function(e) {
            next(e);
        });
    });
    _oApp.post( path.posix.join( _DB.__oOptions.sBreezeRequestPath, 'Purge' ).replace(/[\\$'"]/g, "\\$&"), function( req, res, next ){
console.error( 'TODO: purge' );
        purge().then(function(){
           res.send('purged');
        });
    });
    _oApp.post( path.posix.join( _DB.__oOptions.sBreezeRequestPath, 'Reset' ).replace(/[\\$'"]/g, "\\$&"), function( req, res, next ){
console.error( 'TODO: reset' );
        purge().then(seed).then(function(){
            res.send('reset');
        });
    });
*/
    // Adding Ancilla operations by HTTP/HTTPS protocol
    _oApp.get( '/ancilla/:operation', _oApp.oauth.authorise(), function( oRequest, oResponse ){
      switch( oRequest.params.operation ){
        case 'rules':
          let _oRulesOfEngamenet = {
            iVersion: Constant._ANCILLA_CORE_VERSION
          };
          oResponse.send( JSON.stringify( _oRulesOfEngamenet ) );
        break;
        default:
          oResponse.status(404).end();
        break;
      }
    });
		// Listening on breeze port
		_oApp.listen( _DB.__oOptions.iBreezePort );
    _DB.info( 'Breeze listening on port: %s...', _DB.__oOptions.iBreezePort );
    return Bluebird.resolve();
	}

	__answerBreezeRequest( oResponse, results ){
		// Answering
		oResponse.setHeader( 'Content-Type:', 'application/json' );
		oResponse.send( results );
	}
}
module.exports = DBCore;
