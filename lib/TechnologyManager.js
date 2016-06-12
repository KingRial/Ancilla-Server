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

let _ = require('lodash');
let Bluebird = require('bluebird');

let Tools = require('./Tools.js');
let Logger = require('./Logger.js');

/**
 * A generic class to manage multiple technologies in the same process.
 *
 * @class	TechnologyManager
 * @public
 *
 * @param	{Object[]}		oOptions		A javascript object of options used to configure the manager of technologie
 * @param	{Object[]}		oTechnologies		A javascript object of options used to configure the technologies behaviour
 *
 * @return	{Void}
 *
 * @example
 *		new TechnologyManager( { 'tech-1': { module: require('./tech-1.js'), oEndpoints: {"testTCP":{"type":"client.net","host":"192.168.0.110","port":10001}} } );
 */
class TechnologyManager {
	constructor( oOptions, oTechnologies ){
		// Init manager options
		this.__oOptions = _.extend({
			sID: 'Manager',
			oLogger: null
  	}, oOptions );
		this.__oOptionsTechnolgies = oTechnologies;
		this._aReadyPromises = [];
	}

	/**
	 * Method called to run the technologies
	 *
	 * @method    run
	 * @public
	 *
	 * @param	{Object}		[oCurrentModule]	The current nodejs caller module ( default: the current module used by the required file )
	 *
	 * @example
	 *   Technology.run();
	 *   Technology.run( { 'tech-1': { module: require('./tech-1.js'), oEndpoints: {"testTCP":{"type":"client.net","host":"192.168.0.110","port":10001}} } );
	 */
	run( oManagerOptions, oCurrentModule ){
		// Selecting current module if none specified
		if( !oCurrentModule ){
			oCurrentModule = module;
		}
		oManagerOptions = _.extend( this.__oOptions, oManagerOptions );
		// Init Logger
		let oLogOptions = {
			sID: this.__oOptions.sID,
			sHeader: this.__oOptions.sID,
			bUseRandomStyle4Header: true,
      sLevel: ( this.__oOptions.sDebugLevel ? this.__oOptions.sDebugLevel : 'info' ),
			bSilent: this.__oOptions.bSilentLog,
			bRemote: this.__oOptions.bDebugRemote,
			iRemotePort: this.__oOptions.iDebugRemotePort,
      sLogPath: ( this.__oOptions.bUseLog ? this.__oOptions.sLogPathTmp + this.__oOptions.sLogName : null),
      iLogMaxSize: 500000, // kB
			iLogMaxFiles: 3
		};
		this.__oLogger = ( this.__oOptions.oLogger ? this.__oOptions.oLogger : require( './Logger.singleton' ) );
		this.__oLogger.extend( oLogOptions.sID, this, oLogOptions );
		// Init Technologies
		this.__oTechnologies = {};
		for( let _sTechID in this.__oOptionsTechnolgies ){
			if( this.__oOptionsTechnolgies.hasOwnProperty( _sTechID ) ){
				// Getting current Technology options
				let oTechnologyOptions = this.__oOptionsTechnolgies[ _sTechID ];
				// Passing logger to use to current Technology
				oTechnologyOptions = _.extend( {}, oTechnologyOptions );
				// Adding current Technology
				this.addTechnology( _sTechID, oTechnologyOptions );
				// Running current Technology
				this._aReadyPromises.push( this.runTechnology( _sTechID, oTechnologyOptions, oCurrentModule ) );
			}
		}
		let _TechnologyManager = this;
		this.ready()
			.then( function(){
				_TechnologyManager.onReady();
			})
		;
	}

	/**
	 * Method called to complete ready operations over the technology and let the "ready" event to be emitted
	 *
	 * @method    ready
	 * @public
	 *
	 * @return    {Object}			It returns a successfully promise when all the technologies are ready and the "ready" event must be emitted
	 *
	 * @example
	 *   Technologies.ready();
	 */
	ready(){
		return Bluebird.all( this._aReadyPromises );
	}

	getTechnology( sID ){
		return this.__oTechnologies[ sID ];
	}

	addTechnology( sID, oOptions ){
		oOptions.sID = sID;
		if( oOptions.module ){
			// Getting reference to Technology module
			let Technology = oOptions.module;
			// Removing reference to technology module from options
			delete oOptions.module;
			// Adding technology
			this.debug( 'Adding technology "%s" with options: ', sID, oOptions );
			if( this.__oTechnologies[ sID ] ){
				this.error( 'Technology "%s" already added...', sID );
			} else {
				this.__oTechnologies[ sID ] = new Technology( oOptions );
				let _oTechnology = this.getTechnology( sID );
				this.__listenEvents( _oTechnology );
			}
		} else {
			this.error( 'Unable to create technologys "%s"; missing module reference...', sID );
		}
	}

	runTechnology( sID, oOptions, oCurrentModule ){
		let _oTechnology = this.getTechnology( sID );
		if( _oTechnology ){
			this.debug( 'Running technology "%s" with options: ', sID, oOptions );
			return _oTechnology.run( oOptions, oCurrentModule );
		} else {
			this.error( 'Unable to run technolgy "%s"; the technolgy is unknown...', sID );
			return Bluebird.reject( new Error( 'Unknown' ) )
		}
	}

	__listenEvents( oTechnology ){
		let _TechnologyManager = this;
		let _sID = oTechnology.getID();
		let _aEvents = [ 'data', 'datagram', 'error' ];
		for( let _sEvent of _aEvents ){
			this.debug( 'listening on event "%s" of technology "%s"...', _sEvent, _sID );
			oTechnology.on( _sEvent, ( ...Args ) => _TechnologyManager.__onEvent( _sEvent, _sID, ...Args ) );
		}
	}

	__onEvent( sEvent, sTechnologyID ){
		let _sHandlerEventFunction = 'on' + sEvent.charAt(0).toUpperCase() + sEvent.slice(1);
		// Getting all arguments except for the first
		let _aArgs = Array.prototype.slice.call( arguments, 1 );
		if( this[ _sHandlerEventFunction ] ){
			this[ _sHandlerEventFunction ].apply( this, _aArgs );
		} else {
			this.debug( 'received event "%s" for technology "%s", but missing method "%s" to handle event...', sEvent, sTechnologyID, _sHandlerEventFunction );
		}
	}

	/**
	 * Method called when the technology is ready to process
	 *
	 * @method    onReady
	 * @public
	 *
	 * @example
	 *   Technology.onReady();
	 */
	onReady(){
		this.info( 'Technologies are ready...' );
	}

	/**
	 * Method called when the technology is ready to process
	 *
	 * @method    onError
	 * @public
	 *
	 * @example
	 *   Technology.onError();
	 */
	onError( sTechnologyID, oError ){
		this.error( '[ Error: "%s" ] Technology "%s" fired an error event...', oError, sTechnologyID );
	}

	onData( sTechnologyID, oBuffer, oEndpoint, sSocketID ){
		this.debug('Data received from "%s": "%s" ( Endpoint: "%s"; Socket ID "%s" )', sTechnologyID, oBuffer.toString( 'hex' ), oEndpoint.getID(), sSocketID );
	}

	onDatagram( sTechnologyID, oDatagram, oParsedBuffer, oBuffer, oEndpoint, sSocketID ){
		this.debug('Datagram received from "%s": "%s" from Endpoint: "%s" and socket ID "%s": "%s" parsed to...',sTechnologyID, oDatagram.getID(), oEndpoint.getID(), sSocketID, oBuffer.toString( 'hex' ), oParsedBuffer );
	}

	/**
	* Method called to transform args to technology's options
	*
	* @method    __argsToOptions
	* @private
	*
	* @return	{Object}	The parsed technology's options
	*
	* @example
	*   Technology.__argsToOptions();
	*/
	__argsToOptions() {
		// Arguments
		let _oArgs = Tools.processArgs( process.argv.slice( 2 ) );
		//let _sProcessName = Path.basename( oCurrentModule.filename );
		let oOptions = _.extend({
			sDebugLevel: ( ( _oArgs.debug || _oArgs[ 'remote-debug' ] ) ? ( ( !_oArgs.debug || _.isBoolean( _oArgs.debug ) ) ? 'debug' : _oArgs.debug ) : null ),
			bDebugRemote: ( false || ( _oArgs[ 'remote-debug' ] ) ),
			iDebugRemotePort: ( _oArgs[ 'remote-debug' ] ? ( _.isBoolean( _oArgs[ 'remote-debug' ] ) ? 3000 : ( _.isNumber( _oArgs[ 'remote-debug' ] ) ? _oArgs[ 'remote-debug' ] : 3000 ) ) : 3000 )
		}, _oArgs );
		return oOptions;
	}

	export( oCurrentModule ) {
			if( require.main === oCurrentModule ){
					// Arguments
					return this.run( this.__argsToOptions(), oCurrentModule );
			} else {
					return this.constructor;
			}
	}
}

module.exports = TechnologyManager;
