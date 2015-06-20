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
//var Ancilla = require('ancilla');
var Technology = require('./Technology.node.js');
var Event = require('./Event.node.js');
var Tools = require('./Tools.node.js');
var Constant = require('./Constants.node.js');
var Promise = require('bluebird');

var ChildProcess = require('child_process');
var Path = require('path');

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
var Core =  function( oCoreOptions ){
	oCoreOptions = Tools.extend({
		sID: 'Core',
		sType: 'Core',
		iVersion: Constant._ANCILLA_CORE_VERSION,
		aEndpoints: [{
				id: 'Core',
				type: 'listen',
				connectionType: 'net',
				host: 'localhost',
				port: '10000',
				isAncillaEventsHandler: true
			}, {
				id: 'web',
				type: 'listen',
				connectionType: 'ws',
				isAncillaEventsHandler: true
			}]
	}, oCoreOptions );
	// Calling inherited constructor
	Core.super_.call( this, oCoreOptions );
}

Tools.inherits( Core, Technology );

/**
 * Method called when event "Gateway Ready" is fired, to initialize the Core
 *
 * @method    onGatewayReady
 * @public
 *
 * @example
 *   Core.onGatewayReady();
 */
Core.prototype.onGatewayReady = function(){
	var _Core = this;
	this.info( 'is ready to process...' );
// TODO: setting timers to handle swap DB http://nodejs.org/api/timers.html
	// Selecting technology's type
	_Core.__selectTableRows( 'TECHNOLOGY_TYPE' )
		.then( function( oRows ){
			var _oDB = _Core.__DBget();
			var _oTechnologyTypes = {};
			for ( var _iIndex in oRows ){
				var _oCurrentRow = oRows[ _iIndex ];
				_oTechnologyTypes[ _oCurrentRow[ 'NAME' ] ] = oRows[ _iIndex ];
			}
			// Selecting configured technologies and create a process to execute them
			_Core.__selectTableRows( 'OBJECT', _oDB.expr()
					.and( "TYPE='TECHNOLOGY'" )
					.and( "TECHNOLOGY NOT IN ?", [ Constant._TECHNOLOGY_TYPE_CORE, Constant._TECHNOLOGY_TYPE_WEB ] )
					.and( "IS_ENABLED=1" )
				)
				.then( function( oRows ){
					if( oRows.length > 0 ){
						for ( var _iIndex in oRows ){
							var _oCurrentRow = oRows[ _iIndex ];
							var _sTechnologyName = _oCurrentRow[ 'NAME' ];
							var _sTechnologyType = _oCurrentRow[ 'TECHNOLOGY' ];
							var _sTechnologyClassName = _oTechnologyTypes[ _sTechnologyType ][ 'CLASSNAME' ];
							var _sTechnologyPath = _oTechnologyTypes[ _sTechnologyType ][ 'PATH' ];
							var _sTechnologyScriptType = _oTechnologyTypes[ _sTechnologyType ][ 'TYPE' ];
							//_sTechnologyPath = ( Tools.isAbsolutePath( _sTechnologyPath ) ? _sTechnologyPath : Path.normalize( process.cwd() + '/' + _sTechnologyPath ) );
							var _sTechonlogyPathFile = Path.basename( _sTechnologyPath );
							var _sTechonlogyPathDir = Path.dirname( _sTechnologyPath );
							// Getting Technology Arguments and adding the link with the current Core technology as first endpoint
							var _oTechnologyOptions = JSON.parse( _oCurrentRow[ 'OPTIONS' ] );
							var _aTechnologyGatewayOptions = _oTechnologyOptions.aArguments[ 0 ];
							var _oCoreEndpoint = _Core.getEndpoints( 'Core' );
							_aTechnologyGatewayOptions.unshift({
								id: _oCoreEndpoint.getID(),
								type: 'connect',
								connectionType: _oCoreEndpoint.getConnectionType(),
								host: _oCoreEndpoint.getHost(),
								port: _oCoreEndpoint.getPort(),
								isAncillaEventsHandler: true
							});
							var _sTechnologyArguments = JSON.stringify( _oTechnologyOptions.aArguments );
							// Checking supported technology script type
							switch( _sTechnologyScriptType ){
								case 'nodejs':
									_Core.info( 'Starting technology "%s" ( type: "%s", File: "%s", cwd: "%s" ).', _sTechnologyName, _sTechnologyType, _sTechonlogyPathFile, _sTechonlogyPathDir );
								break;
								default:
									_Core.error( 'Unable to start technology "%s" ( type: "%s", File: "%s", cwd: "%s" ). Script type "%s" is not supported by Core.', _sTechnologyName, _sTechnologyType, _sTechonlogyPathFile, _sTechonlogyPathDir, _sTechnologyScriptType );
								break;
							}
							// Creating new Process by technology ( if the current script type is supported )
							switch( _sTechnologyScriptType ){
								case 'nodejs':
									// Building arguments to spawn process
									var _oArgs = {
										processName: _sTechnologyName,
										requirePath: _sTechnologyPath,
										className: ( _sTechnologyClassName ? _sTechnologyClassName : null ),
										arguments: ( _sTechnologyArguments ? _sTechnologyArguments : null ),
										debug: Tools.getDebug()

									};
									var _sAncillaNodePathRelativeToTechnologyCwd = Path.relative( _sTechonlogyPathDir, process.cwd() ) || '.';
									var _aArgs = [ _sAncillaNodePathRelativeToTechnologyCwd + '/Ancilla.node.js' ];
									for( var _sField in _oArgs ){
										var _value = _oArgs[ _sField ];
										if( _value ){
											_aArgs.push( '--' + _sField );
											if( _value !== true ){
												_aArgs.push( _value );
											}
										}
									}
									// Spawning process
									var _oProcess = ChildProcess.spawn( 'node', _aArgs, {
										cwd: _sTechonlogyPathDir
									});
									// Piping process stdout/stderror to Core stdout/stderror
									_oProcess.stdout.pipe( process.stdout );
									_oProcess.stderr.pipe( process.stderr );
								break;
								default:
									_Core.error( 'Unknown technology script type: "%s"; unable to start technology.', _sTechnologyScriptType );
								break;
							}
						}
					} else {
						_Core.info( 'No configured technologies to start.' );
					}
				})
				.catch( function( oError ){
					_Core.error( '[ Error: %j ] Unable to get technologies.', oError );
					process.exit();
				})
			;
		})
		.catch( function( oError ){
			_Core.error( '[ Error: %j ] Unable to get technology types.', oError );
			process.exit();
		})
	;
};

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
Core.prototype.getConnectedSocket = function( sID, bGetSocketFromWebsocket ){
//TODO: improve this
	var _oSocket = null;
	var _aEndpoints = this.getGateway().getEndpoints();
	for( var _iIndex in _aEndpoints ){
		var _oEndpoint = _aEndpoints[ _iIndex ];
		_oSocket = _oEndpoint.getConnectedSocket( sID );
		if( _oSocket ){
			_oSocket = ( bGetSocketFromWebsocket && _oSocket._socket ? _oSocket._socket : _oSocket ); // Handling websockets custom environment
			break;
		}
	}
	return _oSocket;
};

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
Core.prototype.setConnectedSocketID = function( oGateway, oGatewayEndpoint, iSocketIndex, sConnectedSocketID ){
	this.getGateway( oGateway.getID() ).getEndpoints( oGatewayEndpoint.getID() ).setConnectedSocketID( iSocketIndex, sConnectedSocketID );
};

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
Core.prototype.__getTechnology = function( sTechnologyID, bCreateOnMissing ){
	var _Core = this;
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
Core.prototype.__technologyGetUser = function( sTechnologyID ){
	var _Core = this;
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
Core.prototype.__technologyGetUserID = function( sTechnologyID ){
	var _Core = this;
	return new Promise( function( fResolve, fReject ){
		var _oSocket = _Core.getConnectedSocket( sTechnologyID, true );
		var _oAddress = _oSocket.address(); // {"address":"127.0.0.1","family":"IPv4","port":10080}
		var _oDB = _Core.__DBget();
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
Core.prototype.__technologyLogIn = function( sTechnologyID, iUserID ){
	var _Core = this;
	return new Promise( function( fResolve, fReject ){
			_Core.__getTechnology( sTechnologyID )
				.then( function( oRowTechnology ){
					if( !oRowTechnology ){
						fReject( Constant._ERROR_TECHNOLOGY_UNKNOWN );
					} else {
						var _oSocket = _Core.getConnectedSocket( sTechnologyID, true );
						var _oAddress = _oSocket.address(); // {"address":"127.0.0.1","family":"IPv4","port":10080}
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
Core.prototype.__technologyLogOut = function( sTechnologyID ){
	var _Core = this;
	return _Core.__getTechnology( sTechnologyID )
		.then(function( oRowTechnology ){
			return new Promise( function( fResolve, fReject ){
				if( !oRowTechnology ){
					fReject( Constant._ERROR_TECHNOLOGY_UNKNOWN );
				} else {
					var _oDB = _Core.__DBget();
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
Core.prototype.__technologyIsLogged = function( sTechnologyID ){
	var _Core = this;
	return new Promise( function( fResolve, fReject ){
		var _bIsLogged = false;
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

/**
* Method called when event "Ancilla" is fired, to handle it
*
* @method    onAncilla
* @public
*
* @param	{Object}	oEvent		The Ancilla event
*
* @example
*   Core.onAncilla( oEvent );
*/
Core.prototype.onAncilla = function( oEvent ){
	this.debug( 'Received Ancilla Event: "%j".', oEvent );
	var _oGateway = arguments[1];
	var _oGatewayEndpoint = arguments[2];
	var _iSocketIndex = arguments[3];
	var _sTechnologyID = oEvent.getFrom();
	var _sEventType = oEvent.getType();
	var _bCheckIfLogged = true;
	// Handling Ancilla Event Requests sent to the core and preparing answer if needed
	if( oEvent.isRequest() && ( oEvent.getTo() == this.getID() ) ){
		var _Core = this;
		// Technology is Logged Promise
		var _oIsLoggedPromise = new Promise( function( fResolve, fReject ){
			switch( _sEventType ){
				// login check can be ignored on the following cases
				case Constant._EVENT_TYPE_INTRODUCE:
				case Constant._EVENT_TYPE_LOGIN:
				case Constant._EVENT_TYPE_LOGOUT:
					_Core.debug( 'Ancilla event "%s" not requires a login check...', _sEventType );
					fResolve();
					break;
				default: // Login check must be done
					return _Core.__technologyIsLogged( _sTechnologyID )
						.then( function( bIsLogged ){
							if( bIsLogged ){
								_Core.debug( 'Technology "%s" is logged...', _sTechnologyID );
								fResolve();
							} else {
								_Core.debug( 'Technology "%s" is NOT logged...', _sTechnologyID );
								fReject( Constant._ERROR_TECHNOLOGY_NOT_LOGGED );
							}
						})
						.catch( function ( oError ){
							_Core.error( '[ Error "%j" ] on checking it technology "%s" is logged', oError, _sTechnologyID );
						})
					;
					//
					break;
			}
		});
		// Main promise
		var _oMainPromise = new Promise( function( fResolve, fReject ){
		// Choosing the ancilla event type handler
			switch( _sEventType ){
	/**
	* Ancilla Event used to introduce a new technology to the Core
	*
	* @method    Constant._EVENT_TYPE_INTRODUCE
	* @public
	*
	* @return    {Void}
	*
	* @example
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_INTRODUCE } );
	*/
				case Constant._EVENT_TYPE_INTRODUCE:
					// Using technology ID to get the current connected socket
					var _oConnectedSocket = _Core.getConnectedSocket( _sTechnologyID );
					if( _oConnectedSocket ){
						_Core.error( 'already knows a technology "%s"... ignoring introduction! Use a different ID to "introduce" a new Technology.', _sTechnologyID );
						fReject( Constant._ERROR_TECHNOLOGY_ALREADY_INTRODUCED );
					} else {
						// Setting socket ID to Technology ID
						_Core.setConnectedSocketID( _oGateway, _oGatewayEndpoint, _iSocketIndex, _sTechnologyID );
						// If the introduced technology is a web client, creating the technolgy if needed
						var _bIsWebTechnology = ( _oGatewayEndpoint.getID() == 'web'  ? true : false );
						// Collecting data on current used user for the current technology
						_Core.__technologyGetUser( _sTechnologyID )
							// Creating missing web technology if needed
							.then( _bIsWebTechnology ?
									_Core.__getTechnology( _sTechnologyID, true ).catch(function(oError){fReject( oError );}) :
									Promise.resolve()
								)
							// Handling latest actions
							.then( function( oUser ){
								_Core.info( 'knows the "%s" technology "%s" can be reached logged as "%s".', ( _bIsWebTechnology ? 'web' : 'generic' ), _sTechnologyID, ( oUser ? oUser[ 'NAME' ] : 'noone' ) );
								oEvent.setToAnswer( { oUser: oUser } );
								// Resolving Main Promise
								fResolve( oEvent );
							})
							.catch( function( iError ){
								_Core.error( '[ Error "%s" ] on introducing technology "%s".', iError, _sTechnologyID );
								fReject( iError );
							})
						;
					}
				break;
	/**
	* Ancilla Event used to login
	*
	* @method    Constant._EVENT_TYPE_LOGIN
	* @public
	*
	* @return    {Void}
	*
	* @example
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_LOGIN } );
	*/
				case Constant._EVENT_TYPE_LOGIN:
					_Core.__selectTableRows( 'OBJECT', _Core.__DBget().expr()
							.and( 'NAME = ?', oEvent.sUsername )
							.and( 'TYPE = ?', Constant._OBJECT_TYPE_USER )
						)
						.then( function( oRows ){
//TODO: trace failed/successfull login attempts
							var _oUser = oRows[ 0 ];
							if( oRows.length==0 || oRows.length > 1 || oEvent.sPassword != _oUser[ 'VALUE' ]  ){
								_Core.error( ( ( oRows.length==0 || oRows.length > 1 ) ? 'found none or more than a single user with username as "%s"' : 'username "%s" used wrong password "%s"' ), oEvent.sUsername, oEvent.sPassword );
								// Sending answer
								oEvent.setToAnswer( Constant._ERROR_FAILED_LOGIN );
								// Resolving main promise
								fResolve( oEvent );
							} else {
								_Core.__technologyLogIn( _sTechnologyID, _oUser[ 'ID' ] )
									.then(function(){
										_Core.info('Technology "%s" is now logged as "%s"', _sTechnologyID, oEvent.sUsername );
										// Sending answer
										oEvent.setToAnswer({ oUser: _oUser });
										// Resolving main promise
										fResolve( oEvent );
									})
									.catch(function( iError ){
										fReject( iError );
									})
								;
							}
						})
						.catch(function( iError ){
							fReject( iError );
						})
					;
				break;
	/**
	* Ancilla Event used to login
	*
	* @method    Constant._EVENT_TYPE_LOGOUT
	* @public
	*
	* @return    {Void}
	*
	* @example
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_LOGOUT } );
	*/
				case Constant._EVENT_TYPE_LOGOUT:
					_Core.__technologyLogOut( _sTechnologyID )
						.then(function(){
							_Core.info('Technology "%s" logged out...', _sTechnologyID );
							// Sending answer
							oEvent.setToAnswer();
							// Resolving main promise
							fResolve( oEvent );
						})
						.catch(function( iError ){
							fReject( iError );
						})
					;
				break;
	/**
	* Ancilla Event used by the client to load specific objects by ID.
	*
	* @method    Constant._EVENT_TYPE_OBJ_LOAD_BY_ID
	* @public
	*
	* @return    {Void}
	*
	* @example
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_OBJ_LOAD_BY_ID, ids: 100 } );
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_OBJ_LOAD_BY_ID, ids: [ 100, 101, 102 ] } );
	*/
				case Constant._EVENT_TYPE_OBJ_LOAD_BY_ID:
					var ids = oEvent.ids;
					_Core.__loadObjectByID( ids )
						.then( function( oRows ){
							oEvent.setToAnswer( { oRows: oRows } );
							// Resolving Main Promise
							fResolve( oEvent );
						})
						.catch( function( iError ){
							// Resolving main promise with error
							fReject( iError );
						})
					;
					break;
	/**
	* Ancilla Event used by the client to load specific objects by type.
	*
	* @method    Constant._EVENT_TYPE_OBJ_LOAD_BY_TYPE
	* @public
	*
	* @return    {Void}
	*
	* @example
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_OBJ_LOAD_BY_TYPE, types: 'TECHNOLOGY' } );
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_OBJ_LOAD_BY_TYPE, types: [ 'TECHNOLOGY', 'GROUP' ] } );
	*/
				case Constant._EVENT_TYPE_OBJ_LOAD_BY_TYPE:
					var types = oEvent.types;
					_Core.__loadObjectByType( types )
						.then( function( oRows ){
							oEvent.setToAnswer( { oRows: oRows } );
							// Resolving Main Promise
							fResolve( oEvent );
						})
						.catch( function( iError ){
							// Resolving main promise with error
							fReject( iError );
						})
					;
					break;
	/**
	* Ancilla Event used by the client to create specific objects/relations/widgets.
	*
	* @method    Constant._EVENT_TYPE_CREATE
	* @public
	*
	* @return    {Void}
	*
	* @example
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_CREATE, aObjs: [ { ... Object 1 ... }, { ... Object 2 ... } ] );
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_CREATE, aRelations: [ { ... Relation 1 ... }, { ... Relation 2 ... } ] );
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_CREATE, aWidgets: [ { ... Widget 1 ... }, { ... Widget 2 ... } ] );
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_CREATE, aObjs: [ { ... Object 1 ... }, { ... Object 2 ... } ], aRelations: [ { ... Relation 1 ... }, { ... Relation 2 ... } ], aWidgets: [ { ... Widget 1 ... }, { ... Widget 2 ... } ] );
	*/
				case Constant._EVENT_TYPE_CREATE:
					var _aCreatePromises = [];
					if( oEvent.aObjs ){
						_aCreatePromises.push( _Core.__insertTableRows( 'OBJECT', oEvent.aObjs ) );
					}
					if( oEvent.aRelations ){
						_aCreatePromises.push( _Core.__insertTableRows( 'RELATION', oEvent.aRelations ) );
					}
					if( oEvent.aWidgets ){
						_aCreatePromises.push( _Core.__insertTableRows( 'WIDGET', oEvent.aWidgets ) );
					}
					Promise.all( _aCreatePromises )
						.then( function( oRows ){
							oEvent.setToAnswer( { oRows: oRows } );
							// Resolving Main Promise
							fResolve( oEvent );
						})
						.catch( function( iError ){
							// Resolving main promise with error
							fReject( iError );
						})
					;
				break;
	/**
	* Ancilla Event used by the client to update specific objects/relations/widgets.
	*
	* @method    Constant._EVENT_TYPE_UPDATE
	* @public
	*
	* @return    {Void}
	*
	* @example
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_UPDATE, aObjs: [ { ... Object 1 ... }, { ... Object 2 ... } ] );
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_UPDATE, aRelations: [ { ... Relation 1 ... }, { ... Relation 2 ... } ] );
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_UPDATE, aWidgets: [ { ... Widget 1 ... }, { ... Widget 2 ... } ] );
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_UPDATE, aObjs: [ { ... Object 1 ... }, { ... Object 2 ... } ], aRelations: [ { ... Relation 1 ... }, { ... Relation 2 ... } ], aWidgets: [ { ... Widget 1 ... }, { ... Widget 2 ... } ] );
	*/
				case Constant._EVENT_TYPE_UPDATE:
//TODO: handle events linked to obj or relation!
					var _aUpdatePromises = [];
					if( oEvent.aObjs ){
						for( var _iIndex in oEvent.aObjs ){
							var _oCurrent = oEvent.aObjs[ _iIndex ];
							_aUpdatePromises.push( _Core.__updateTableRows( 'OBJECT', _oCurrent, _Core.__DBget().expr().and( 'ID = ?', _oCurrent.id ), true ) );
						}
					}
					if( oEvent.aRelations ){
						for( var _iIndex in oEvent.aRelations ){
							var _oCurrent = oEvent.aRelations[ _iIndex ];
							_aUpdatePromises.push( _Core.__updateTableRows( 'RELATION', _oCurrent, _Core.__DBget().expr().and( 'ID = ?', _oCurrent.id ), true ) );
						}
					}
					if( oEvent.aWidgets ){
						for( var _iIndex in oEvent.aWidgets ){
							var _oCurrent = oEvent.aWidgets[ _iIndex ];
							_aUpdatePromises.push( _Core.__updateTableRows( 'WIDGET', _oCurrent, _Core.__DBget().expr().and( 'ID = ?', _oCurrent.id ), true ) );
						}
					}
					Promise.all( _aUpdatePromises )
						.then( function( oRows ){
							oEvent.setToAnswer( { oRows: oRows } );
							// Resolving Main Promise
							fResolve( oEvent );
						})
						.catch( function( iError ){
							// Resolving main promise with error
							fReject( iError );
						})
					;
				break;
	/**
	* Ancilla Event used by the client to update specific objects/relations/widgets.
	*
	* @method    Constant._EVENT_TYPE_DELETE
	* @public
	*
	* @return    {Void}
	*
	* @example
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_DELETE, aObjIDs: [ iID1, iID2, ... ] );
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_DELETE, aRelationIDs: [ iID1, iID2, ... ] );
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_DELETE, aWidgetIDs: [ iID1, iID2, ... ] );
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_DELETE, aObjIDs: [ iID1, iID2, ... ], aRelationIDs: [ iID1, iID2, ... ], aWidgetIDs: [ iID1, iID2, ... ] );
	*/
				case Constant._EVENT_TYPE_DELETE:
					var _aDeletePromises = [];
					if( oEvent.aObjIDs ){
						_aDeletePromises.push( _Core.__deleteTableRows( 'OBJECT', _oCurrent, _Core.__DBget().expr().and( 'ID IN ?', oEvent.aObjIDs ), true ) );
					}
					if( oEvent.aRelationIDs ){
						_aDeletePromises.push( _Core.__deleteTableRows( 'RELATION', _oCurrent, _Core.__DBget().expr().and( 'ID IN ?', oEvent.aRelationIDs ), true ) );
					}
					if( oEvent.aWidgetIDs ){
						_aDeletePromises.push( _Core.__deleteTableRows( 'WIDGET', _oCurrent, _Core.__DBget().expr().and( 'ID IN ?', oEvent.aWidgetIDs ), true ) );
					}
					Promise.all( _aDeletePromises )
						.then( function( oRows ){
							oEvent.setToAnswer( { oRows: oRows } );
							// Resolving Main Promise
							fResolve( oEvent );
						})
						.catch( function( iError ){
							// Resolving main promise with error
							fReject( iError );
						})
					;
				break;
	/**
	* Ancilla Event used to observe changes over objects inside the Core.
	*
	* @method    Constant._EVENT_TYPE_OBSERVE_OBJECTS
	* @public
	*
	* @return    {Void}
	*
	* @example
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_OBSERVE_OBJECTS, ids: 100 } );
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_OBSERVE_OBJECTS, ids: [ 100, 101, 102 ] } );
	*/
				case Constant._EVENT_TYPE_OBSERVE_OBJECTS:
// TODO:
					console.error( 'TODO: _EVENT_TYPE_OBSERVE_OBJECTS: %j ', oEvent );
				break;
	/**
	* Ancilla Event used to unobserve changes over objects inside the Core, previously observed.
	*
	* @method    Constant._EVENT_TYPE_UNOBSERVER_OBJECTS
	* @public
	*
	* @return    {Void}
	*
	* @example
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_UNOBSERVER_OBJECTS, ids: 100 } );
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_UNOBSERVER_OBJECTS, ids: [ 100, 101, 102 ] } );
	*/
				case Constant._EVENT_TYPE_UNOBSERVER_OBJECTS:
// TODO:
					console.error( 'TODO: _EVENT_TYPE_UNOBSERVER_OBJECTS: %j ', oEvent );
				break;
	/**
	* Ancilla Event used to register technology's objects inside the Core
	*
	* @method    Constant._EVENT_TYPE_REGISTER_OBJECTS
	* @public
	*
	* @return    {Void}
	*
	* @example
	*   Technology.trigger( {sType: Constant._EVENT_TYPE_REGISTER_OBJECTS, aObjects: [ { ... oObject1 ... }, { ... oObject2 ... }, { ... oObject3 ... } ] } );
	*/
				case Constant._EVENT_TYPE_REGISTER_OBJECTS:
// TODO:
					console.error( 'TODO: _EVENT_TYPE_REGISTER_OBJECTS: %j ', oEvent );
				break;
				// Deafult Beahviour
				default:
					_Core.error( 'Unknown Ancilla Event: "%s" [ %j ]...', oEvent.getType(), oEvent );
					fReject( Constant._ERROR_EVENT_UNKNOWN );
				break;
			}
		});
		// Main Promises handler
		Promise.all( [ _oMainPromise, _oIsLoggedPromise ] )
			.then( function( aArguments ){ // the "All" will return an array of arguments; since the Main promise is the first promise, the first argument of the array will be the returned Event
				var _oEvent = aArguments[ 0 ];
				_Core.__onAncillaDispatch( oEvent );
			})
			.catch( function( iError ){
				_Core.error( '[ Error "%s" ] on Ancilla Event: "%s" [ %j ]; closing socket without answering...', iError, oEvent.getType(), oEvent );
				_Core.getGateway( _oGateway.getID() )
					.getEndpoints( _oGatewayEndpoint.getID() )
						.getConnectedSockets( _iSocketIndex )
							.close()
				;
			})
		;
	} else {
		this.__onAncillaDispatch( oEvent );
	}
};

/**
* Method called to dispatch an Ancilla event
*
* @method    __onAncillaDispatch
* @private
*
* @param	{Object}	oEvent		The Ancilla event
*
* @example
*   Core.__onAncillaDispatch( oEvent );
*/
Core.prototype.__onAncillaDispatch = function( oEvent ){
	// Dispatching event ( if needed )
	var _sTo = oEvent.getTo();
	var _oConnectedSocket = this.getConnectedSocket( _sTo );
	if( _sTo != this.getID() ){
		this.debug( 'Dispatching Ancilla Event: "%s" [ %j ] to "%s"...', oEvent.getType(), oEvent, _sTo );
		if( _oConnectedSocket ){
			if( _oConnectedSocket.write ){
				_oConnectedSocket.write( oEvent.toString() );
			} else if( _oConnectedSocket.send ){
				_oConnectedSocket.send( oEvent.toString() );
			}
		} else {
			this.error( 'Unable to dispath Ancilla Event: "%s" [ %j ]; unknown destination...', oEvent.getType(), oEvent );
		}
	} else {
		this.debug( 'Ancilla Event: "%s" [ %j ] reached its destination.', oEvent.getType(), oEvent );
	}
};

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
Core.prototype.__loadObjectByID = function( ids ){
	//TODO: checking if current user has rights to access the object/relations and filter them
	//TODO: caching results somehow ?
	// Transforming ids into array if needed
	var _aIDs = null;
	if( Tools.isArray( ids ) ){
		_aIDs = ids;
	} else {
		_aIDs = [ ids ];
	}
	var _Core = this;
	var _oResult = {
		aLoadedSurroundings: _aIDs
	};
	var _oDB = _Core.__DBget();
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
				var _aIDsToSeach = _aIDs.slice();
				for( var _iIndex in oRows ){
					var _oCurrentRow = oRows[ _iIndex ];
					var _iParentID = _oCurrentRow[ 'PARENT_ID' ];
					var _iChildID = _oCurrentRow[ 'CHILD_ID' ];
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
					return Promise.resolve( [] );
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
				var _aIDs = [];
				for( var _iIndex in oRows ){
					var _oCurrentRow = oRows[ _iIndex ];
					if( _aIDs.indexOf( _oCurrentRow[ 'WIDGET_ID' ] )==-1 ){
						_aIDs.push( _oCurrentRow[ 'WIDGET_ID' ] );
					}
				}
				// Checking if we have at least one ID to obtain
				if( _aIDs.length == 0 ){
					// Returning resolved Promise with empty Rows
					return Promise.resolve( [] );
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
Core.prototype.__loadObjectByType = function( types ){
	// Transforming into array if needed
	var _aTypes = null;
	if( Tools.isArray( types ) ){
		_aTypes = types;
	} else {
		_aTypes = [ types ];
	}
	var _Core = this;
	var _oDB = _Core.__DBget();
	return _Core.__selectTableRows( 'OBJECT', _oDB.expr()
			.or( 'TYPE IN ?', _aTypes )
		)
		.then( function( oRows ){
			// Getting all ID's objects which must be loaded
			var _aIDs = [];
			for( var _iIndex in oRows ){
				var _oCurrentRow = oRows[ _iIndex ];
				_aIDs.push( _oCurrentRow[ 'ID' ] );
			}
			// Checking if we have at least one ID to obtain
			if( _aIDs.length == 0 ){
				// Returning resolved Promise with empty Rows
				return Promise.resolve( [] );
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
Core.prototype.__selectTableRows = function( sTable, SQLExpr, bUseDefaultFilter ){
	var _oDB = this.__DBget();
	// Adding default DB filter if needed
	if( bUseDefaultFilter ){
		if( !SQLExpr ){
			SQLExpr = _oDB.expr();
		}
		SQLExpr = this.__getDefaultDBFilters( SQLExpr );
	}
	return _oDB.selectTableRows( sTable, SQLExpr );
}

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

Core.prototype.__updateTableRows = function( sTable, oFieldsAndValues, SQLExpr, bUseDefaultFilter ){
	var _oDB = this.__DBget();
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

Core.prototype.__insertTableRows = function( sTable, Rows ){
	var _oDB = this.__DBget();
	return _oDB.insertTableRows( sTable, Rows );
};

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
Core.prototype.__deleteTableRows = function( sTable, SQLExpr, bUseDefaultFilter ){
	var _oDB = this.__DBget();
	// Adding default DB filter if needed
	if( bUseDefaultFilter ){
		if( !SQLExpr ){
			SQLExpr = _oDB.expr();
		}
		SQLExpr = this.__getDefaultDBFilters( SQLExpr );
	}
	return _oDB.deleteTableRows( sTable, SQLExpr );
}

module.exports = Tools.exports( Core, module );
