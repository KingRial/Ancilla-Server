"use strict";

let OZW = require('openzwave-shared');

let _ = require('lodash');
let Bluebird = require('bluebird');

let Technology = require('../../lib/ancilla.js').Technology;

/**
 * A Technology used to connect to Z-Wave
 *
 * @class	TechnologyZWave
 * @public
 *
 * @param	{Object[]}		oOptions		A javascript object of options used to configure the technology behaviour
 *
 * @example
 *		new TechnologyZWave( { sID: 'ZWave-1' } );
 *
 * @return	{Void}
 *
 */

class TechnologyZWave extends Technology {
	constructor( oOptions ){
		//Default Technology Options
		oOptions = _.extend({
			sID: 'ZWave-1',
			sType: 'Technology.Z-Wave',
			sUSBController: '/dev/ttyACM0',
      //sUSBController: '\\\\.\\COM4',
			//sUSBController: 'COM4',
			bUseDB: true
		}, oOptions );
		// Calling inherited constructor
		super( oOptions );
	}

	ready(){
		let _Zwave = this;
		return super.ready()
			.then( function(){
				return _Zwave.__readyController();
			})
		;
	}

	onReady(){
		// Calling inherited method
		super.onReady();
		// Current method
		this.info( 'Z-Wave Technology is ready to process...');
	}

	onData( oBuffer, oEndpoint, sTopic ){
		this.debug('Data received: "%s" from Endpoint: "%s" and topic "%s"...', oBuffer.toString(), oEndpoint.getID(), sTopic );
	}

	/*
		onDatagram( oDatagram, oParsedBuffer, oBuffer, oEndpoint, sSocketID ){
			this.debug('Datagram received: "%s" from Endpoint: "%s" and socket ID "%s": "%s" parsed to...', oDatagram.getID(), oEndpoint.getID(), sSocketID, oBuffer.toString( 'hex' ), oParsedBuffer );
		}
	*/

	onDestroy(){
		let _Zwave = this;
		return super.onDestroy()
			.then( function(){
				_Zwave.getController().disconnect( _Zwave.getConfig().sUSBController );
				return this;
			})
		;
	}

	__readyController(){
		let _oController = new OZW({
				Logging: false,
				//ConsoleOutput: this.getConfig().sDebug
				ConsoleOutput: false
		});
		this.setController( _oController );
		let _Zwave = this;
		_oController.on('driver ready', function( sHomeID ){
			_Zwave.setHomeID( sHomeID );
			_Zwave.debug( 'Starting network scan...' );
		});
		_oController.on('node added', function( sNodeID ){
			_Zwave.debug( 'Added node ID: "%s"', sNodeID );
		} );
		_oController.on('node naming', function( sNodeID, oNodeinfo ){
			_Zwave.debug( 'node ID: "%s" -> Naming with info:', sNodeID, oNodeinfo );
		});
		_oController.on('polling enabled', function( sNodeID ){
			_Zwave.debug( 'node ID: "%s" -> Polling enabled', sNodeID );
		});
		_oController.on('polling disabled', function( sNodeID ){
			_Zwave.debug( 'node ID: "%s" -> Polling disabled:', sNodeID );
		});
		_oController.on('scene event', function( sNodeID, iSceneID ){
			_Zwave.debug( 'node ID: "%s" -> Fired scene ID: "%s"', sNodeID, iSceneID );
		});
		_oController.on('node event', function( sNodeID, oData ) {
			_Zwave.debug( 'node ID: "%s" -> Fired event:', sNodeID, oData );
		});
		_oController.on('value added', function( sNodeID, commandclass, iValueID ){
			_Zwave.debug( 'node ID: "%s" -> value added:', sNodeID, commandclass, iValueID );
		});
		_oController.on('value changed', function( sNodeID, commandclass, iValueID ){
			_Zwave.debug( 'node ID: "%s" -> value changed:', sNodeID, commandclass, iValueID );
		});
		_oController.on('value refresh', function( sNodeID, commandclass, iValueID ){
			_Zwave.debug( 'node ID: "%s" -> value refresh:', sNodeID, commandclass, iValueID );
		});
		_oController.on('value removed', function( sNodeID, commandclass, iValueID ){
			_Zwave.debug( 'node ID: "%s" -> value removed:', sNodeID, commandclass, iValueID );
		});
		_oController.on('controller command', function(sNodeID, iCtrlState, iCtrlError, sHelpMsg ){
			_Zwave.debug( 'node ID: "%s" -> controller command:', sNodeID, iCtrlState, iCtrlError, sHelpMsg );
		});
		_oController.on('node available', function( sNodeID, oNodeinfo ){
			_Zwave.debug( 'Node ID: "%s" -> Available with info:', sNodeID, oNodeinfo );
		});
		// Handling events which are required to trigger the "ready" event
		let _aPromiseReady =  new Bluebird( function( fResolve ){
			let _aReadyPromises = [];
			// Updating/Inserting node into "DEVICE" table
			_oController.on('node ready', function( sNodeID, oNodeinfo ){
				_Zwave.debug( 'node ID: "%s" -> ready with info:', sNodeID, oNodeinfo );
				_aReadyPromises.push(
					_Zwave.__nodeReady( sNodeID, oNodeinfo )
				);
			});
			// Initial scan completed
			_oController.on('scan complete', function(){
				_Zwave.debug( 'Initial network scan completed' );
				Bluebird.all( _aReadyPromises ).then(function(){
					fResolve();
				});
			});
			_Zwave.debug( 'connecting to USB ZWave controller: "%s"', _Zwave.getConfig().sUSBController );
    });
		// Starting connection
		_oController.connect( _Zwave.getConfig().sUSBController );
		//
		return _aPromiseReady;
	}

	__nodeReady( sNodeID, oNodeinfo ){
		let _Zwave = this;
		//_Zwave.debug( 'node ID: "%s" -> Ready with info:', sNodeID, oNodeinfo );
		return _Zwave.getDBModel( 'DEVICE' ).findOrCreate({
				defaults: {
					name: oNodeinfo.name,
					description: oNodeinfo.type,
					product: oNodeinfo.product,
					productType: oNodeinfo.producttype,
					productID: oNodeinfo.productid,
					manufacturer: oNodeinfo.manufacturer,
					manufacturerID: oNodeinfo.manufacturerid
				},
				where: {
					nodeID: sNodeID
				}
			})
		;
	}

	setController( oController ){
		this.__oController = oController;
	}

	getController(){
		return this.__oController;
	}

	setHomeID( sHomeID ){
		this.debug( 'Using Home ID: "%s"...', sHomeID );
		this.__sHomeID = sHomeID;
	}
}

module.exports = new TechnologyZWave().export( module );
