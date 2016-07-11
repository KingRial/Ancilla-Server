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
let ChildProcess = require('child_process');
let Path = require('path');
let crypto = require('crypto');

let _ = require( 'lodash' );
let Bluebird = require('bluebird');
let OAuth2Server = require('oauth2-server');

let Ancilla = require('../../lib/ancilla.js');
let Technology = Ancilla.Technology;
let Constant = Ancilla.Constant;


/**
 * A generic class to describe the central Ancilla's Core; it's build as a technology
 *
 * @class	Core
 * @public
 *
 * @param	{Object}		oCoreOptions			An object of options for the Core
 *
 * @return	{Void}
 *
 * @example
 *		new Core()
 */

class Core extends Technology {

	constructor( oCoreOptions ){
		// Calling inherited constructor
		super();
		this.config({
			sID: 'Core',
			sType: 'Core',
			bUseDB: true,
			oDB: require( './DB/DB.js' ),
			sDBModelsDir: 'DB/models/breeze',
			iVersion: Constant._ANCILLA_CORE_VERSION,
			oEndpoints: {
				'MQTT-broker': {
					sType: 'server.mqtt',
					fAuthenticate: ( oClient, sUsername, sPassword, fCallback ) => this.__mqttAuthenticate( oClient, sUsername, sPassword, fCallback ),
					/*
		      fAuthorizeSubscribe: function( oClient, sTopic, fCallback ){
console.error( 'fAuthenticate: ', sUsername, sPassword );
		        fCallback( null, true );
		      },
		      fAuthorizePublish: function( oClient, sTopic, oBuffer, fCallback ){
console.error( 'fAuthenticate: ', sUsername, sPassword );
		        fCallback( null, true );
		      },
		      fAuthorizeForward: function( oClient, oBuffer, fCallback ){
console.error( 'fAuthenticate: ', sUsername, sPassword );
		        fCallback( null, true );
		      }
					*/
				},
				'Core': {
					sType: 'client.mqtt',
					oTopics: {
						'api/v1': null  // TODO: should use constants when using an Ancilla's Endpoints with Topics ( will create a method to handle this feature automatically )
					},
					bIsAncilla: true
				},
				'web': {
					sType: 'server.rest',
					bUseCors: true,
					oRoutes: {
						'all': {
							'api/v1/oauth/token': ( oRequest, oResponse, next ) => this.getAuth().grant()( oRequest, oResponse, next )
						},
						'get': {
							'api/v1/breeze/:Metadata': [
								( oRequest, oResponse, next ) => this.getAuth().authorise()( oRequest, oResponse, next ),
								( oRequest, oResponse, next ) => this.getDB().handleBreezeRequestMetadata( oRequest, oResponse, next )
							],
							'api/v1/breeze/:entity': [
								( oRequest, oResponse, next ) => this.getAuth().authorise()( oRequest, oResponse, next ),
								( oRequest, oResponse, next ) => this.getDB().handleBreezeRequestEntity( oRequest, oResponse, next )
							]
						}
					}
				},
				/*
				'ancilla-net': {
					type: 'server.net',
					sHost: Constant._EVENT_CORE_ENDPOINT_NET_HOST,
					iPort: Constant._EVENT_CORE_ENDPOINT_NET_PORT,
					bIsAncilla: true
				}
				*/
				/*
				,
				'ancilla-websocket': {
					id: 'ancilla-websocket',
					type: 'server.ws',
					bIsAncilla: true
				}*/
			}
		});
		this.config( oCoreOptions );
		this.__oProcessePIDs = {};
	}

	/**
	 * Method called to initialize the Core
	 *
	 * @method    ready
	 * @public
	 *
	 * @example
	 *   Core.ready();
	 */
	ready(){
		let _Core = this;
		return super.ready()
			.then ( function(){ // Init Endpoints
				return _Core.__initAuth();
			})
			.catch( function( oError ){
				_Core.error( '[ Error: %s ] Unable to correctly initialize Oauth 2.0.', oError );
			})
			.then( function(){
				_Core.info( 'Starting configured technologies...' );
				// Selecting configured technologies and create a process to execute them
				return _Core.getTechnology({
						where: {
							type: Constant._OBJECT_TYPE_TECHNOLOGY,
							technology: {
								not: [ Constant._TECHNOLOGY_TYPE_CORE, Constant._TECHNOLOGY_TYPE_WEB ]
							},
							isEnabled: true
						}
					})
					.then( function( aTechnologies ){
						if( aTechnologies.length > 0 ){
							let _aPromisesToReturn = [];
							for ( let _oTechnology of aTechnologies ){
								_aPromisesToReturn.push( _Core.startTechnology( _oTechnology ) );
							}
							// Returning promise
							return Bluebird.all( _aPromisesToReturn );
						} else {
							_Core.info( 'No configured technologies to start.' );
						}
						// Returning generic
						return this;
					})
					.catch( function( oError ){
						_Core.error( '[ Error: %j ] Unable to get technologies.', oError );
						process.exit();
					})
				;
			})
		;
	}

	__mqttAuthenticate( oClient, sUsername, sPassword, fCallback ){
		let _Core = this;
		let _oAddress = oClient.connection.stream.address();
		if( _oAddress && _oAddress.address === '::ffff:127.0.0.1' ){
			_Core.debug( 'MQTT client "%s" is local; ignoring authentication check...', oClient.id );
			fCallback( null, true );
		} else if( sPassword && sUsername ){ // Grant Type "password"
			_Core.__authDBGetUser(sUsername, sPassword)
				.then(function( oUser ){
					if( oUser ){
						_Core.debug( 'MQTT client "%s"( %s ) is authorized using "password" grant type...', oClient.id, _oAddress.address );
					} else {
						_Core.error( 'MQTT client "%s"( %s ) is NOT authorized using "password" grant type...', oClient.id, _oAddress.address );
					}
					fCallback( null, ( oUser ? true : false ) );
				})
				.catch(function(){
					_Core.error( 'on authorizing MQTT client "%s"( %s ) using "password" grant type', oClient.id, _oAddress.address );
					fCallback( null, false );
				})
			;
		} else if( !sPassword && sUsername ){ // Grant Type "access token"
			let _sAccessToken = sUsername.split(' ')[ 0 ];
			_Core.__authGetAccessToken( _sAccessToken )
				.then(function( oToken ){
					if( oToken ){
						_Core.debug( 'MQTT client "%s"( %s ) is authorized using "access token" grant type...', oClient.id, _oAddress.address );
					} else {
						_Core.error( 'MQTT client "%s"( %s ) is NOT authorized using "accss token" grant type...', oClient.id, _oAddress.address );
					}
					fCallback( null, ( _sAccessToken ? true : false ) );
				})
				.catch(function(){
					_Core.error( 'on authorizing MQTT client "%s"( %s ) using "access token" grant type', oClient.id, _oAddress.address );
					fCallback( null, false );
				})
			;
		} else {
			_Core.error( 'MQTT client "%s"( %s ) is NOT authorized: missing credentials...', oClient.id, _oAddress.address );
			fCallback( null, false );
		}
	}

	getAuth(){
		return this.__oAuth;
	}

	__initAuth(){
    let _Core = this;
    this.__oAuth = OAuth2Server({
      model: {
        getAccessToken: function( sAccessToken, fCallback ){
          _Core.__authGetAccessToken( sAccessToken )
            .then(function( oToken ){
              if( oToken ){
                fCallback( null, {
                  accessToken: oToken.access_token,
                  clientId: oToken.client_id,
                  expires: oToken.expires,
                  userId: oToken.user_id
                });
              } else {
                return fCallback();
              }
            })
            .catch(function(error){
              fCallback( error );
            })
          ;
        },
        getRefreshToken: function( sRefreshToken, fCallback ){
          _Core.__authDBGetRefreshToken( sRefreshToken )
            .then(function( oToken ){
              if( oToken ){
                fCallback( null, {
                  refreshToken: oToken.refresh_token,
                  clientId: oToken.client_id,
                  expires: oToken.expires,
                  userId: oToken.user_id
                });
              } else {
                return fCallback();
              }
            })
            .catch(function(error){
              _Core.error( 'Error %j: Failed to get refresh token: %j', error, sRefreshToken );
              fCallback( error );
            })
          ;
        },
        revokeRefreshToken: function( sRefreshToken, fCallback) {
          _Core.__authDBRevokeRefreshToken( sRefreshToken )
            .then(function(){
              fCallback( null );
            })
            .catch(function(error){
              fCallback( error );
            })
          ;
        },
        getClient: function( sClientID, sClientSecret, fCallback ){
          _Core.__authDBGetClient( sClientID, sClientSecret )
            .then(function( oClient ){
              if( oClient ){
                return fCallback();
              } else {
                fCallback( null, {
                  clientId: oClient.client_id,
                  clientSecret: oClient.client_secret
                } );
              }
            })
            .catch(function(error){
              fCallback( error );
            })
          ;
        },
        getUser: function( sUsername, sPassword, fCallback ){
          _Core.__authDBGetUser( sUsername, sPassword )
            .then(function( oUser ){
              fCallback( null, ( oUser ? oUser.id : false ) );
            })
            .catch(function(error){
              fCallback( error );
            })
          ;
        },
        grantTypeAllowed: function( sClientID, sGrantType, fCallback ){
          _Core.__authIsGrantTypeAllowed( sClientID, sGrantType )
            .then(function( bIsAllowed ){
                fCallback( false, bIsAllowed );
            })
            .catch(function(error){
              fCallback( error );
            })
          ;
        },
        saveAccessToken: function( sAccessToken, sClientID, sExpires, oUser, fCallback ){
          _Core.__authDBSetAccessToken( sAccessToken, sClientID, sExpires, oUser )
            .then(function(){
              fCallback();
            })
            .catch(function(error){
              fCallback( error );
            })
          ;
        },
        saveRefreshToken: function( sRefreshToken, sClientID, sExpires, oUser, fCallback ){
          _Core.__authDBSetRefreshToken( sRefreshToken, sClientID, sExpires, oUser )
            .then(function(){
              fCallback();
            })
            .catch(function(error){
              fCallback( error );
            })
          ;
        }
      },
      grants: [ 'password', 'refresh_token' ],
      accessTokenLifetime: 3600,
      //accessTokenLifetime: 30,
      //refreshTokenLifetime: 60,
      refreshTokenLifetime: 1209600,
      //authCodeLifetime: 30,
      //debug: function( oError ){ _DB.debug( '[ oAuth ] %j', oError ); }
      debug: false
    });
		_Core.getEndpoint('web').getApp().use( this.__oAuth.errorHandler() );
		return Bluebird.resolve();
  }

	__authDBGetUser( sUsername, sPassword ){
		let _Core = this;
		let _sHashedPassword = crypto.createHash('sha1').update( sPassword ).digest('hex');
		return _Core.getDBModel( 'OAUTH_USERS' )
			.findOne({ where: {
				username: sUsername,
				password: _sHashedPassword
			} })
			.then(function( oUser ){
				if( oUser ){
					_Core.debug( 'Successfully get user: "%s"', sUsername );
					return Promise.resolve( oUser );
				} else {
					_Core.error( 'Unable to find user "%s"', sUsername );
					return Promise.reject();
				}
			})
			.catch(function(error){
				_Core.error( 'Error %j: Failed to get user', error );
				return Promise.reject();
			})
		;
	}

	__authDBGetClient( sClientID, sClientSecret ){
		let _Core = this;
		let _sHashedSecret = crypto.createHash('sha1').update( sClientSecret ).digest('hex');
		return _Core.getDBModel( 'OAUTH_CLIENTS' )
			.findOne({ where: {
				client_id: sClientID
			} })
			.then(function( oClient ){
				if( !oClient || ( sClientSecret !== null && oClient.client_secret !== _sHashedSecret ) ){
					_Core.error( 'Unable to find client with ID "%j": ', sClientID, ( !oClient ? 'client doesn\'t exists' : 'wrong secret used' ) );
					return Promise.reject();
				} else {
					_Core.debug( 'Successfully get client: "%s"', oClient.client_id );
					return Promise.resolve( oClient );
				}
			})
			.catch(function(error){
				_Core.error( 'Error %j: Failed to get client', error );
				return Promise.reject();
			})
		;
	}

	__authIsGrantTypeAllowed( sClientID, sGrantType ){
		let _Core = this;
		return _Core.getDBModel( 'OAUTH_CLIENTS' )
			.findOne({ where: {
				client_id: sClientID
			} })
			.then(function( oClient ){
					let _aAllowedGrants = JSON.parse( oClient.grant_types ) || [];
					let _bGrant = ( _aAllowedGrants.indexOf( sGrantType ) !== -1 ? true : false );
					if( !_bGrant ){
						_Core.error( 'Client ID "%s" has no rights to use the following gran type: "%s"; allowded grant types are: "%s"', sClientID, sGrantType, _aAllowedGrants );
					}
					return Promise.resolve( _bGrant );
			})
			.catch(function(error){
				_Core.error( 'Error %j: Failed to get gran type for specific client', error );
				return Promise.reject();
			})
		;
	}

	__authDBGetAccessToken( sAccessToken ){
		let _Core = this;
		return _Core.getDBModel( 'OAUTH_ACCESS_TOKENS' )
			.findOne({ where: {
				access_token: sAccessToken
			} })
			.then(function( oToken ){
				if( oToken ){
					_Core.debug( 'Successfully get access token: %j', sAccessToken );
					return Promise.resolve( oToken );
				} else {
					_Core.error( 'Unable to find access token "%j": ', sAccessToken );
					return Promise.reject();
				}
			})
			.catch(function(error){
				_Core.error( 'Error %j: Failed to get access token: %j', error, sAccessToken );
			})
		;
	}

	__authDBSetAccessToken( sAccessToken, sClientID, sExpires, oUser ){
		let _Core = this;
		// Sometime oUser is not an object... don't ask me why!
		let _iUserID = ( typeof oUser === 'object' ? oUser.id : oUser );
		_Core.getDBModel( 'OAUTH_ACCESS_TOKENS' )
			.create({
				access_token: sAccessToken,
				client_id: sClientID,
				user_id: _iUserID,
				expires: sExpires,
			})
			.then(function(){
				_Core.debug( 'Successfully saved access token "%s" for client ID "%s" and user ID "%s"', sAccessToken, sClientID, _iUserID );
				Promise.resolve();
			})
			.catch(function(error){
				_Core.error( 'Error %s: failed to save access token', error );
				Promise.reject();
			})
		;
	}

	__authDBGetRefreshToken( sRefreshToken ){
		let _Core = this;
		return _Core.getDBModel( 'OAUTH_REFRESH_TOKENS' )
			.findOne({ where: {
				refresh_token: sRefreshToken
			} })
			.then(function( oToken ){
				if( oToken ){
					_Core.debug( 'Successfully get refresh token: %j', sRefreshToken );
					return Promise.resolve( oToken );
				} else {
					_Core.error( 'Unable to find refresh token "%j": ', sRefreshToken );
					return Promise.reject();
				}
			})
			.catch(function(error){
				_Core.error( 'Error %j: Failed to get refresh token: %j', error, sRefreshToken );
			})
		;
	}

	__authDBSetRefreshToken( sRefreshToken, sClientID, sExpires, oUser ){
		let _Core = this;
		// Sometime oUser is not an object... don't ask me why!
		let _iUserID = ( typeof oUser === 'object' ? oUser.id : oUser );
		return _Core.getDBModel( 'OAUTH_REFRESH_TOKENS' )
			.create({
				refresh_token: sRefreshToken,
				client_id: sClientID,
				user_id: _iUserID,
				expires: sExpires,
			})
			.then(function(){
				_Core.debug( 'Successfully saved refresh token "%s" for client ID "%s" and user ID "%s"', sRefreshToken, sClientID, _iUserID );
				return Promise.resolve();
			})
			.catch(function(error){
				_Core.error( 'Error %s: failed to save refresh token', error );
				return Promise.reject();
			})
		;
	}

	__authDBRevokeRefreshToken( sRefreshToken ){
		let _Core = this;
		return _Core.getDBModel( 'OAUTH_REFRESH_TOKENS' )
			.destroy({
				where: {
					refresh_token: sRefreshToken
				}
			})
			.then(function(){
				return Promise.resolve();
			})
			.catch(function(error){
				_Core.error( 'Error %j: Failed to revoke refresh token: %j', error, sRefreshToken );
				return Promise.reject();
			})
		;
	}

	/**
	* Method called to collect the connected socket looking for all the available endpoints
	*
	* @method    getConnectedSocket
	* @public
	*
	* @param	{String}	sID												The socket ID
	* @param	{Boolean}	[bGetSocketFromWebsocket]		Get the real socket from websocket socket ( lol! by default: false )
	*
	* @example
	*   Core.getConnectedSocket( sID );
	*/
	/*
	getConnectedSocket( sID, bGetSocketFromWebsocket ){
	//TODO: improve this
		let _oSocket = null;
		let _aEndpoints = this.getGateway().getEndpoints();
		for( let _oEndpoint of _aEndpoints ){
			_oSocket = _oEndpoint.getConnectedSocket( sID );
			if( _oSocket ){
				_oSocket = ( bGetSocketFromWebsocket && _oSocket._socket ? _oSocket._socket : _oSocket ); // Handling websockets custom environment
				break;
			}
		}
		return _oSocket;
	}
	*/

	/**
	* Method called to set ad ID to a connected socket
	*
	* @method    setConnectedSocketID
	* @public
	*
	* @param	{Object}	oGateway							The current gateway
	* @param	{Object}	oGatewayEndpoint			The current gateway Endpoint
	* @param	{Number}	iSocketIndex					The current socket index
	* @param	{String}	sConnectedSocketID		The socket ID to set
	*
	* @example
	*   Core.setConnectedSocketID( oGateway, oGatewayEndpoint, iSocketIndex, sConnectedSocketID );
	*/
	/*
	setConnectedSocketID( oGateway, oGatewayEndpoint, iSocketIndex, sConnectedSocketID ){
		this.getGateway( oGateway.getID() ).getEndpoints( oGatewayEndpoint.getID() ).setConnectedSocketID( iSocketIndex, sConnectedSocketID );
	}
	*/

	getObject( oWhere ){
		return this.getDBModel( 'OBJECT' ).findAll( oWhere );
	}

	/**
	* Method called to get a technology joined with the correct technology object type
	*
	* @method    getTechnology
	* @public
	*
	* @param	{Object}	[ options ]			The technology ID or the where clause; if missing all technology object's will be loaded
	*
	* @return	{Object}	The technology object joined with the correct technology object type
	*
	* @example
	*   Core.getTechnology();
	*		Core.getTechnology( sTechnologyID );
	*		Core.getTechnology( { where: { isEnabled: 1 } } );
	*/
	getTechnology( options ){
		let _oWhere = {
			where: {
				type: Constant._OBJECT_TYPE_TECHNOLOGY
			}
		};
		// Extending where clause if technology's ID is set as parameter ( Lookins a name or a JSON field in the option column )
		_oWhere = _.extend( _oWhere, ( options ?
			( _.isString( options ) ?
				{
					where: {
						$or: [{ name: options }, {options: { $like: '%"sID":"' + options + '"%' } }]
					}
				} : options
			) : {} )
		);
		return this.getObject( _oWhere );
	}

	getTechnologyType( oWhere ){
		return this.getDBModel( 'TECHNOLOGY_TYPE' ).findAll( oWhere );
	}

	__getTechnologyPID( sTechnologyID ){
		return this.__oProcessePIDs[ sTechnologyID ];
	}

	__setTechnologyPID( sTechnologyID, iPID ){
		this.__oProcessePIDs[ sTechnologyID ] = iPID;
	}

	__deleteTechnologyPID( sTechnologyID ){
		delete this.__oProcessePIDs[ sTechnologyID ];
	}

	/**
	* Method called to start a specific technology and link it to the Core
	*
	* @method    startTechnology
	* @public
	*
	* @param	{String|Object}	technology				The Technology's ID or An object describing the technology; if using the simple ID the method will seek datas on DB
	* @param	{Object}	[ oTechnologyType ]			An object describing the technology type; if not used the method will seek datas on DB
	*
	* @return    {Object}	this method will return a promise
	*
	* @example
	*   Core.startTechnology( 'Example-1' );
	*   Core.startTechnology( { technology: 'Example', path: 'integrations/Example/Technology.Example.node.js', language:'nodejs', options: { oEndpoints: {"Endpoint-1":{"type":"client.net","host":"192.168.0.110","port":10001},"Endpoint-2":{"type":"server.net","host":"localhost","port":10002}} } );
	*/
	startTechnology( technology, oTechnologyType ){
		let _Core = this;
		let _oTechnology = null;
		// Collecting technology data if needed
		return ( ( !technology || _.isString( technology ) ) ? _Core.getTechnology( technology ) : Bluebird.resolve( technology ) )
			.then( function( aTechnologyResults ){
				if( _.isEmpty( aTechnologyResults ) ){
					_Core.error( 'Unknown technology: "%s"', technology );
					//return Bluebird.reject( 'Unknown technology: "' + technology + '"' );
					return Bluebird.reject( Constant._ERROR_TECHNOLOGY_UNKNOWN );
				} else if( aTechnologyResults.length > 1 ){
					_Core.error( 'Too many technology: "%s"', technology );
					//return Bluebird.reject( 'Too many technologies: "' + technology + '"' );
					return Bluebird.reject( Constant._ERROR_TECHNOLOGY_TOO_MANY );
				}
				_oTechnology = aTechnologyResults[ 0 ];
				// Collecting technology type data if needed
				return ( !oTechnologyType ? _Core.getTechnologyType({ where: { type: _oTechnology.technology } }) : Bluebird.resolve( oTechnologyType ) );
			} )
			.then( function( aTechnologyTypes ){
				if( _.isEmpty( aTechnologyTypes ) ){
					_Core.error( 'Unknown technology type: "%s"', _oTechnology.technology );
					//return Bluebird.reject( 'Unknown technology type: "%s"', _oTechnology.technology );
					return Bluebird.reject( Constant._ERROR_TECHNOLOGY_TYPE_UNKNOWN );
				} else if( aTechnologyTypes.length > 1 ){
					_Core.error( 'Too many technology type: "%s"', _oTechnology.technology );
					//return Bluebird.reject( 'Too many technology types: "' + _oTechnology.technology + '"' );
					return Bluebird.reject( Constant._ERROR_TECHNOLOGY_TYPE_TOO_MANY );
				}
				let _oTechnologyType = aTechnologyTypes[ 0 ];
				if( _.isEmpty( _oTechnologyType ) ){
					 _Core.error( 'Unknown technology type: "%s"', technology );
				} else {
					_Core.info( 'Starting technology "%s" ( %s ) using "%s"...', _oTechnology.name, technology, _oTechnologyType.language );
					//let _sTechonlogyPathFile = Path.basename( _oTechnologyType.path );
					let _sTechonlogyPathDir = Path.dirname( _oTechnologyType.path );
					let _oArgs = _.extend( {
						sID: _oTechnology.name,
					  sCwd: _sTechonlogyPathDir,
						oEndpoints: {}
					}, JSON.parse( _oTechnology.options ) );
					// Building Args to start process
					if( !_Core.__getTechnologyPID( _oArgs.sID ) ){
			      let _oCoreEndpoint = _Core.getEndpoints( 'Core' );
						let _sCoreEndpointID = _oCoreEndpoint.getID();
						if( _oArgs.oEndpoints[ _sCoreEndpointID ] ){
							_Core.warn( 'Endpoint to "Ancilla Core" has already been configured on technology "%s"...',_oArgs.sID );
						} else {
				      _oArgs.oEndpoints[ _sCoreEndpointID ] = {
				        sID: _sCoreEndpointID,
				        sType: 'client.mqtt',
				        sHost: _oCoreEndpoint.getHost(),
				        iPort: _oCoreEndpoint.getPort(),
				        bIsAncilla: true
				      };
						}
						// Creating new Process by technology ( if the current script type is supported )
						switch( _oTechnologyType.language ){
						  case 'nodejs':
						    // Init Args for spawning child process
						    let _aArgs = [ '--harmony', _oTechnologyType.path ];
								for( let _sField in _oArgs ){
									if( _oArgs.hasOwnProperty( _sField ) ){
										let _value = _oArgs[ _sField ];
										if( _value ){
							        _aArgs.push( '--' + _sField );
							        if( _value !== true ){
							          _aArgs.push( ( typeof _value === 'string' ? _value : JSON.stringify( _value ) ) );
							        }
							      }
									}
						    }
						    // Spawning process
								_Core.debug( 'Launching node process with following command:\nnode %s', _aArgs.join(' ') );
						    let _oProcess = ChildProcess.spawn( 'node', _aArgs );
// TODO: should handle errors on starting process
						    // Pi@ping process stdout/stderror to Core stdout/stderror
						    _oProcess.stdout.pipe( process.stdout );
						    _oProcess.stderr.pipe( process.stderr );
								// Remembering child process
								_Core.__setTechnologyPID( _oArgs.sID, _oProcess.pid );
						  break;
						  default:
						    _Core.error( 'Unknown technology script type: "%s"; unable to start technology.', _oTechnologyType.language );
						  break;
						}
					} else {
						_Core.error( 'Technology already spawned: "%s"', _oArgs.sID );
					}
				}
			})
			.catch( function( oError ){
				_Core.error( '[ Error: %s ] Unable to get technology.', oError );
				return Bluebird.reject( oError );
			})
		;
	}

	/**
	* Method called to stop a specific technology and unlink it from the Core
	*
	* @method    stopTechnology
	* @public
	*
	* @param	{Object}	sTechnologyID							Technology's ID
	*
	* @example
	*   Core.stopTechnology( 'Example-1' );
	*/
	stopTechnology( sTechnologyID ){
	  let _Technology = this;
	  return this.getTechnology( sTechnologyID ).stop()
	    .then( function(){
	      _Technology.__deleteTechnologyPID( sTechnologyID );
	    })
	  ;
	}

	/**
	* Method called to get a technology
	*
	* @method    __getTechnology
	* @private
	*
	* @param	{String}	sTechnologyID				The technology ID
	* @param	{Boolean}	bCreateOnMissing		flag to create technology when missing ( by default: false )
	*
	* @return    {Object}	this method will return a promise; the promise will fail on error, otherwise it will be successfull and the first parameter will be the ROW's technology
	*
	* @example
	*   Core.__getTechnology( sTechnologyID );
	*/
	/*
	Core.prototype.__getTechnology = function( sTechnologyID, bCreateOnMissing ){
		let _Core = this;
		return new Promise( function( fResolve, fReject ){
			_Core.__selectTableRows( 'OBJECT', _Core.__DBget().expr()
					.and( 'NAME = ?', sTechnologyID )
					.and( 'TYPE = ?', Constant._OBJECT_TYPE_TECHNOLOGY )
				)
				.then( function( oRows ){
					if( oRows.length > 1 ){
						_Core.error('multiple technologies with same ID: "%s"', sTechnologyID );
						fReject( Constant._ERROR_TECHNOLOGY_ALREADY_PRESENT );
					} else {
						// if not technology found and a technology creation is requested...
						if( oRows.length == 0 && bCreateOnMissing ){
	// TODO: fill web technologies with all the correct datas
							_Core.__insertTableRows( 'OBJECT', {
									NAME: sTechnologyID,
									TYPE: Constant._OBJECT_TYPE_TECHNOLOGY,
									TECHNOLOGY: Constant._TECHNOLOGY_TYPE_WEB
									//OPTIONS: '{"aArguments":[[{"id":"web","type":"connect","connectionType":"ws","host":,"port":10003}]]}'
								})
								.then( function(){
									return _Core.__getTechnology( sTechnologyID );
								})
								.catch( function( oError ){
									fReject( oError );
								})
							;
						} else {
							fResolve( oRows[ 0 ] );
						}
					}
				} )
				.catch( function(){
					_Core.error('unable to get technology "%s"', sTechnologyID );
					fReject( Constant._ERROR_TECHNOLOGY_UNKNOWN );
				} )
			;
		});
	}
	*/
	/**
	* Method called to get the user used by a particular technology
	*
	* @method    __technologyGetUser
	* @private
	*
	* @param	{String}	sTechnologyID				The technology ID
	*
	* @return    {Object}	this method will return a promise; the promise will fail on error, otherwise it will be successfull and the first parameter will be the ROW's user
	*
	* @example
	*   Core.__technologyGetUser( sTechnologyID );
	*/
	/*
	Core.prototype.__technologyGetUser = function( sTechnologyID ){
		let _Core = this;
		return new Promise( function( fResolve, fReject ){
			_Core.__technologyGetUserID( sTechnologyID )
				.then( function( iUserID ){
					_Core.__selectTableRows( 'OBJECT', _Core.__DBget().expr()
							.and( 'ID = ?', iUserID )
							.and( 'TYPE = ?', Constant._OBJECT_TYPE_USER )
						)
						.then(function( oRows ){
								fResolve( ( oRows ? oRows[ 0 ] : null ) );
						} )
						.catch( function( iError ){
							_Core.error( '[ Error "%j" ] Unable to get user row data for technology "%s"', iError, sTechnologyID );
							fReject( iError );
						})
				} )
			;
		});
	}
	*/
	/**
	* Method called to get the user used by a particular technology
	*
	* @method    __technologyGetUserID
	* @private
	*
	* @param	{String}	sTechnologyID				The technology ID
	*
	* @return    {Object}	this method will return a promise; the promise will fail on error, otherwise it will be successfull and the first parameter will be the user ID
	*
	* @example
	*   Core.__technologyGetUserID( sTechnologyID );
	*/
	/*
	Core.prototype.__technologyGetUserID = function( sTechnologyID ){
		let _Core = this;
		return new Promise( function( fResolve, fReject ){
			let _oSocket = _Core.getConnectedSocket( sTechnologyID, true );
			let _oAddress = _oSocket.address(); // {"address":"127.0.0.1","family":"IPv4","port":10080}
			let _oDB = _Core.__DBget();
			_oDB.query( _oDB.builder()
				.select()
				.from( 'OBJECT' )
				.join( 'RELATION', null, "OBJECT.ID = RELATION.CHILD_ID" )	// Technology is a child of USER object
				.where( _oDB.expr()
					.and( "OBJECT.NAME = ?", sTechnologyID )
					.and( 'OBJECT.TYPE = ?', Constant._OBJECT_TYPE_TECHNOLOGY )
					.and( 'RELATION.TYPE = ?', Constant._RELATION_TYPE_LOGGEDAS )
					.and( 'RELATION.EVENT = ?', _oAddress.address + ':' + _oAddress.port )
				),
				function( iError, oRows, sQuery ){
					if( iError != Constant._NO_ERROR ){
						fReject( iError );
					} else {
						if( oRows.length > 1){
							_Core.error('found more than a single user logged as "%s"', sTechnologyID);
							fReject( Constant._ERROR_FAILED_LOGIN );
						} else {
							fResolve( ( oRows[ 0 ] ? oRows[ 0 ][ 'PARENT_ID' ] : null ) );
						}
					}
				}
			);
		});
	};
	*/
	/**
	* Method called to set a technology logged as a user
	*
	* @method    __technologyLogIn
	* @private
	*
	* @param	{String}	sTechnologyID				The technology ID
	* @param	{Number}	iUserID							The User ID
	*
	* @return    {Object}	this method will return a promise; the promise will fail on error, otherwise it will be successfull
	*
	* @example
	*   Core.__technologyLogIn( sTechnologyID, iUserID );
	*/
	/*
	Core.prototype.__technologyLogIn = function( sTechnologyID, iUserID ){
		let _Core = this;
		return new Promise( function( fResolve, fReject ){
				_Core.__getTechnology( sTechnologyID )
					.then( function( oRowTechnology ){
						if( !oRowTechnology ){
							fReject( Constant._ERROR_TECHNOLOGY_UNKNOWN );
						} else {
							let _oSocket = _Core.getConnectedSocket( sTechnologyID, true );
							let _oAddress = _oSocket.address(); // {"address":"127.0.0.1","family":"IPv4","port":10080}
							_Core.__insertTableRows( 'RELATION', {
									PARENT_ID: iUserID,
									CHILD_ID: oRowTechnology[ 'ID' ],
									TYPE: Constant._RELATION_TYPE_LOGGEDAS,
									EVENT: _oAddress.address + ':' + _oAddress.port
								})
								.then( function(){
									fResolve();
								})
								.catch( function( oError ){
									fReject( oError );
								})
							;
						}
					})
					.catch(function( oError ){
						fReject( oError );
					})
				;
			})
			.catch(function( iError ){
				_Core.error( '[ Error "%j" ] unable to login technology "%s" to user ID "%s"', iError, sTechnologyID, iUserID );
			})
		;
	}
	*/
	/**
	* Method called to log out a technology
	*
	* @method    __technologyLogOut
	* @private
	*
	* @param	{String}	sTechnologyID				The technology ID
	*
	* @return    {Object}	this method will return a promise; the promise will fail on error, otherwise it will be successfull
	*
	* @example
	*   Core.__technologyLogOut( sTechnologyID, iUserID );
	*/
	/*
	Core.prototype.__technologyLogOut = function( sTechnologyID ){
		let _Core = this;
		return _Core.__getTechnology( sTechnologyID )
			.then(function( oRowTechnology ){
				return new Promise( function( fResolve, fReject ){
					if( !oRowTechnology ){
						fReject( Constant._ERROR_TECHNOLOGY_UNKNOWN );
					} else {
						let _oDB = _Core.__DBget();
						_oDB.query( _oDB.builder()
							.delete()
							.from( 'RELATION' )
							.where( _oDB.expr()
								.and( "TYPE = ?", Constant._RELATION_TYPE_LOGGEDAS )
								.and( "CHILD_ID = ? ", oRowTechnology[ 'ID' ] )
							),
							function( iError, oRows, sQuery ){
								if( iError != Constant._NO_ERROR ){
									fReject( iError );
								} else {
									fResolve();
								}
							}
						);
					}
				});
			})
			.catch(function( iError ){
				_Core.error( '[ Error "%j" ] unable to logout technology "%s"', iError, sTechnologyID );
			})
		;
	}
	*/
	/**
	* Method called to see if the technology is logged
	*
	* @method    __technologyIsLogged
	* @private
	*
	* @param	{String}	sTechnologyID				The technology ID
	*
	* @return    {Object}	this method will return a promise; the promise will fail on error, otherwise it will be successfull and the first parameter will be the logged status
	*
	* @example
	*   Core.__technologyIsLogged( sTechnologyID );
	*/
	/*
	Core.prototype.__technologyIsLogged = function( sTechnologyID ){
		let _Core = this;
		return new Promise( function( fResolve, fReject ){
			let _bIsLogged = false;
			_Core.__technologyGetUserID( sTechnologyID )
				.then(function( iUserID ){
					_bIsLogged = ( iUserID ? true : false );
					_Core.debug( 'technology "%s" %s logged', ( _bIsLogged ? 'is' : 'is NOT') );
					fResolve( _bIsLogged );
				})
				.catch(function( oError ){
					fReject( oError );
				})
			;
		});
	}
	*/

	/**
	 * Method called to load object's surrounding from DB by ID
	 *
	 * @method    __loadObjectByID
	 * @private
	 *
	 * @param			{Number/Array}	ids		An object's ID or an array of object's IDs
	 *
	 * @return    {Object}	this method will return a promise; the promise will fail on error, otherwise it will be successfull and the first parameter will be a matrix data with the objects/widgets/relations loaded
	 *
	 * @example
	 *   Core.__loadObjectByID( ids );
	 */
	/*
	Core.prototype.__loadObjectByID = function( ids ){
		//TODO: checking if current user has rights to access the object/relations and filter them
		//TODO: caching results somehow ?
		// Transforming ids into array if needed
		let _aIDs = null;
		if( Tools.isArray( ids ) ){
			_aIDs = ids;
		} else {
			_aIDs = [ ids ];
		}
		let _Core = this;
		let _oResult = {
			aLoadedSurroundings: _aIDs
		};
		let _oDB = _Core.__DBget();
		return new Promise( function( fResolve, fReject ){
			// Collecting RELATION datas
			// Checking if we have at least one ID to obtain
			if( _aIDs.length == 0 ){
				// Returning resolved Promise with empty Rows
				fResolve( [] );
				return this;
			}
			return _Core.__selectTableRows( 'RELATION', _oDB.expr()
					.or( 'PARENT_ID IN ?', _aIDs )
					.or( 'CHILD_ID IN ?', _aIDs )
				)
				// Collecting OBJECT datas from Parent ID/Child ID relations
				.then( function( oRows ){
					// Saving collected relations data to result
					_oResult.aRelations = oRows;
					// Getting all ID's objects which must be loaded and add them to the current IDs if needed ( current IDs could be objects without relations )
					let _aIDsToSeach = _aIDs.slice();
					for( let _iIndex in oRows ){
						let _oCurrentRow = oRows[ _iIndex ];
						let _iParentID = _oCurrentRow[ 'PARENT_ID' ];
						let _iChildID = _oCurrentRow[ 'CHILD_ID' ];
						if( _aIDsToSeach.indexOf( _iParentID )==-1 ){
							_aIDsToSeach.push( _iParentID );
						}
						if( _aIDsToSeach.indexOf( _iChildID )==-1 ){
							_aIDsToSeach.push( _iChildID );
						}
					}
					// Checking if we have at least one ID to obtain
					if( _aIDsToSeach.length == 0 ){
						// Returning resolved Promise with empty Rows
						return Bluebird.resolve( [] );
					} else {
						// Collecting OBJECT datas
						return _Core.__selectTableRows( 'OBJECT', _oDB.expr()
							.and( 'ID IN ?', _aIDsToSeach )
						);
					}
				})
				.then( function( oRows ){
					// Saving collected objects data to result
					_oResult.aObjs = oRows;
					// Getting all ID's widgets which must be loaded
					let _aIDs = [];
					for( let _iIndex in oRows ){
						let _oCurrentRow = oRows[ _iIndex ];
						if( _aIDs.indexOf( _oCurrentRow[ 'WIDGET_ID' ] )==-1 ){
							_aIDs.push( _oCurrentRow[ 'WIDGET_ID' ] );
						}
					}
					// Checking if we have at least one ID to obtain
					if( _aIDs.length == 0 ){
						// Returning resolved Promise with empty Rows
						return Bluebird.resolve( [] );
					} else {
						// Collecting WIDGET datas
						return _Core.__selectTableRows( 'WIDGET', _oDB.expr()
							.and( 'ID IN ?', _aIDs )
						);
					}
				})
				.then( function( oRows ){
					// Saving collected widgets data to result
					_oResult.oWidgets = oRows;
					// Resolving Main Promise
					fResolve( _oResult );
				})
				.catch( function( iError ){
					_Core.error( '[ Error "%s" ] while loading object from IDs: %j', iError, ids );
					// Resolving main promise with error
					fReject( iError );
				})
			;
		});
	}
	*/
	/**
	 * Method called to load object's surrounding from DB by object type
	 *
	 * @method    __loadObjectByType
	 * @private
	 *
	 * @param			{String/Array}	types		An object's type or an array of object's types
	 *
	 * @return    {Object}	this method will return a promise; the promise will fail on error, otherwise it will be successfull and the first parameter will be a matrix data with the objects/widgets/relations loaded
	 *
	 * @example
	 *   Core.__loadObjectByType( types );
	 */
	/*
	Core.prototype.__loadObjectByType = function( types ){
		// Transforming into array if needed
		let _aTypes = null;
		if( Tools.isArray( types ) ){
			_aTypes = types;
		} else {
			_aTypes = [ types ];
		}
		let _Core = this;
		let _oDB = _Core.__DBget();
		return _Core.__selectTableRows( 'OBJECT', _oDB.expr()
				.or( 'TYPE IN ?', _aTypes )
			)
			.then( function( oRows ){
				// Getting all ID's objects which must be loaded
				let _aIDs = [];
				for( let _iIndex in oRows ){
					let _oCurrentRow = oRows[ _iIndex ];
					_aIDs.push( _oCurrentRow[ 'ID' ] );
				}
				// Checking if we have at least one ID to obtain
				if( _aIDs.length == 0 ){
					// Returning resolved Promise with empty Rows
					return Bluebird.resolve( [] );
				} else {
					// Collecting OBJECT datas
					return _Core.__loadObjectByID( _aIDs );
				}
			})
			.catch( function( iError ){
				_Core.error( '[ Error "%s" ] while loading object from Types: %j', iError, types );
				// Resolving main promise with error
				fReject( iError );
			})
		;
	}
	*/
	/**
	 * Method called to get default filter for collecting datas from the DB
	 *
	 * @method    __getDefaultDBFilters
	 * @private
	 *
	 * @param			{String/Object}	SQLExpr		string SQL expression or object SQL expression ( see DB "buildQuery" method description )
	 *
	 * @return    {Object}	the expression object for the default filter
	 *
	 * @example
	 *   Core.__getDefaultDBFilters( SQLExpr );
	 */
	/*
	Core.prototype.__getDefaultDBFilters = function( SQLExpr ){
		// Init variable if missing
		if( !SQLExpr ){
			SQLExpr = _oDB.expr();
		} else if( typeof SQLExpr=='string' ){ // Transforming string to SQL expression object
			SQLExpr = _oDB.expr()
			.and( '( ' + SQLExpr + ' )' );
		}
		return SQLExpr
			.and_begin()
				// Listing all unprotected objects
				.and( 'IS_PROTECTED != 1' )
				// Listing only visible protected objects
				.or_begin()
					.and( 'IS_PROTECTED = 1' )
					.and( 'IS_VISIBLE = 1 ')
				.end()
			.end()
		;
	}
	*/
	/**
	 * Method called to get table's rows from DB
	 *
	 * @method    __selectTableRows
	 * @private
	 *
	 * @param			{String}	sTable		DB's table name
	 * @param			{String/Object}	SQLExpr		string SQL expression or object SQL expression ( see DB "buildQuery" method description )
	 * @param			{Boolean}	bUseDefaultFilter		tells to add default DB filter ( by default: false )
	 *
	 * @return    {Object}	this method will return a promise; the promise will fail on error, otherwise it will be successfull and the first parameter will be the collected ROWs
	 *
	 * @example
	 *   Core.__selectTableRows( sTable, SQLExpr );
	 */
	/*
	Core.prototype.__selectTableRows = function( sTable, SQLExpr, bUseDefaultFilter ){
		let _oDB = this.__DBget();
		// Adding default DB filter if needed
		if( bUseDefaultFilter ){
			if( !SQLExpr ){
				SQLExpr = _oDB.expr();
			}
			SQLExpr = this.__getDefaultDBFilters( SQLExpr );
		}
		return _oDB.selectTableRows( sTable, SQLExpr );
	}
	*/
	/**
	 * Method called to update table's fields by IDs from DB
	 *
	 * @method    __updateTableRows
	 * @private
	 *
	 * @param			{String}	sTable		DB's table name
	 * @param			{Number/Array}	ids		An object's ID or an array of object's IDs
	 * @param			{Object}	oFieldsAndValues		An object instance linking a value to its field
	 * @param			{String/Object}	SQLExpr		string SQL expression or object SQL expression ( see DB "buildQuery" method description )
	 * @param			{Boolean}	bUseDefaultFilter		tells to add default DB filter ( by default: false )
	 *
	 * @return    {Object}	this method will return a promise; the promise will fail on error, otherwise it will be successfull
	 *
	 * @example
	 *   Core.__updateTableRows( 'OBJECT', 100, {name: 'Hello World'}, SQLExpr );
	 *   Core.__updateTableRows( 'OBJECT', [ 100, 101, 102 ], {name: 'Hello World', value: 0}, SQLExpr );
	 */
	/*
	Core.prototype.__updateTableRows = function( sTable, oFieldsAndValues, SQLExpr, bUseDefaultFilter ){
		let _oDB = this.__DBget();
		// Adding default DB filter if needed
		if( bUseDefaultFilter ){
			if( !SQLExpr ){
				SQLExpr = _oDB.expr();
			}
			SQLExpr = this.__getDefaultDBFilters( SQLExpr );
		}
		// Updating table rows
		return _oDB.updateTableRows( sTable, oFieldsAndValues, SQLExpr );
	};
	*/
	/**
	 * Method called to insert table's rows into DB
	 *
	 * @method    __insertTableRows
	 * @private
	 *
	 * @param			{String}	sTable		DB's table name
	 * @param			{Object/Object[]}	Rows		An object instance describing a single row or an array of object instances describing the single rows
	 *
	 * @return    {Object}	this method will return a promise; the promise will fail on error, otherwise it will be successfull
	 *
	 * @example
	 *   Core.__insertTableRows( 'OBJECT', { id: 100, name: 'Hello World', value: 0 } );
	 *   Core.__insertTableRows( 'OBJECT', [ { id: 100, name: 'Hello World', value: 0 }, { id: 101, name: 'Hello World 1', value: 1 } ] );
	 */
	/*
	Core.prototype.__insertTableRows = function( sTable, Rows ){
		let _oDB = this.__DBget();
		return _oDB.insertTableRows( sTable, Rows );
	};
	*/
	/**
	 * Method called to delete table's rows from DB
	 *
	 * @method    __deleteTableRows
	 * @private
	 *
	 * @param			{String}	sTable		DB's table name
	 * @param			{String/Object}	SQLExpr		string SQL expression or object SQL expression ( see DB "buildQuery" method description )
	 * @param			{Boolean}	bUseDefaultFilter		tells to add default DB filter ( by default: false )
	 *
	 * @return    {Object}	this method will return a promise; the promise will fail on error, otherwise it will be successfull
	 *
	 * @example
	 *   Core.__selectTableRows( sTable, SQLExpr );
	 */
	/*
	Core.prototype.__deleteTableRows = function( sTable, SQLExpr, bUseDefaultFilter ){
		let _oDB = this.__DBget();
		// Adding default DB filter if needed
		if( bUseDefaultFilter ){
			if( !SQLExpr ){
				SQLExpr = _oDB.expr();
			}
			SQLExpr = this.__getDefaultDBFilters( SQLExpr );
		}
		return _oDB.deleteTableRows( sTable, SQLExpr );
	}
	*/
}

module.exports = new Core().export( module );
