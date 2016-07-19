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
	constructor( oOptions, oConfigTechs ){
		this.__aReadyPromises = [];
		this.__oOptions = {};
		this.__oOptionsTechnolgies = {};
		this.__oTechnologies = {};
		// Init manager options
		oOptions = _.merge({
      sID: 'Manager',
			bUseLog: true, // Disabling log ouput for iKon
			bSilentLog: false, // Disabling log ouput for iKon
			oLogger: null
    }, oOptions);
		this.config( oOptions );
		this.configTechs( _.merge({
			// No Technology configured
		}, oConfigTechs ) ) ;
	}

	config( oOptions ){
		if( _.isObject( oOptions ) ){
			this.__oOptions = _.merge( this.__oOptions, oOptions );
		}
	}

	getConfig(){
		return this.__oOptions;
	}


	configTechs( oConfigTechs ){
		this.__oOptionsTechnolgies = _.merge( oConfigTechs, this.__oOptionsTechnolgies );
	}

	getConfigTechs(){
		return this.__oOptionsTechnolgies;
	}

	getID(){
		return this.getConfig().sID;
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
		this.config( oManagerOptions );
		// Init Loggers and extending current class with logger methods
		this.__oLogger = ( this.getConfig().oLogger ? this.getConfig().oLogger : require( './Logger.singleton' ) );
		this.__oLogger.extend( this.getID(), this, {
			sHeader: this.getID(),
			bUseRandomStyle4Header: true,
      sLevel: ( this.getConfig().sDebugLevel ? this.getConfig().sDebugLevel : 'info' ),
			bSilent: this.getConfig().bSilentLog,
			bRemote: this.getConfig().bDebugRemote,
			iRemotePort: this.getConfig().iDebugRemotePort,
			sID: this.getConfig().sTechnologyTag,
      sLogPath: ( this.getConfig().bUseLog ? this.getConfig().sLogPathTmp + this.getConfig().sLogName : null),
      iLogMaxSize: 500000, // kB
			iLogMaxFiles: 3
		} );
		// Init Technologies
		let _oConfigTechs = this.getConfigTechs();
		for( let _sTechID in _oConfigTechs ){
			if( _oConfigTechs.hasOwnProperty( _sTechID ) ){
				// Getting current Technology options
				let oTechnologyOptions = _oConfigTechs[ _sTechID ];
				// Passing logger to use to current Technology
				oTechnologyOptions = _.extend( {
					oLogger: this.__oLogger
				}, oTechnologyOptions );
				// Adding current Technology
				this.addTechnology( _sTechID, oTechnologyOptions );
				// Running current Technology
				this.__aReadyPromises.push( this.runTechnology( _sTechID, oTechnologyOptions, oCurrentModule ) );
			}
		}
		let _TechnologyManager = this;
		this.ready()
			.then( function(){
				return _TechnologyManager.__listenTechnologies();
			})
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
		return Bluebird.all( this.__aReadyPromises );
	}

	getTechnologies(){
		return this.__oTechnologies;
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
			return Bluebird.reject( new Error( 'Unknown' ) );
		}
	}

	__listenTechnologies(){
		let _oTechnologies = this.getTechnologies();
		for( let _sTechID in _oTechnologies ){
			if( _oTechnologies.hasOwnProperty( _sTechID ) ){
				let _oTechnology = _oTechnologies[ _sTechID ];
				let _TechnologyManager = this;
				let _sID = _oTechnology.getID();
				let _aEvents = _oTechnology.getEvents();
				_aEvents.forEach( function( sEvent ){
					_TechnologyManager.debug( 'listening on event "%s" of technology "%s"...', sEvent, _sID );
					_oTechnology.on( sEvent, ( ...Args ) => _TechnologyManager.__onEvent( sEvent, _sID, ...Args ) );
				});
			}
		}
		return Bluebird.resolve();
	}

	__onEvent( sEvent, sTechnologyID ){
		let _sHandlerEventFunction = Tools.getEventHandlerFunctionName( sEvent );
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

	onData( sTechnologyID, oEndpoint, oBuffer, sSocketID ){
		this.debug('Data received from "%s": "%s" ( Endpoint: "%s"; Socket ID "%s" )', sTechnologyID, oBuffer.toString( 'hex' ), oEndpoint.getID(), sSocketID );
	}

	onDatagram( sTechnologyID, oEndpoint, oDatagram, oBuffer, oParsedBuffer, sSocketID ){
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
