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
		this.__oNodes = {};
		this.__oNodesValues = {};
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

// Testing things
/*
	//TODO: https://github.com/OpenZWave/node-openzwave-shared/blob/master/README-api.md
		let _Zwave = this;
		process.stdin.resume();
	  process.stdin.setEncoding('utf8');
	  process.stdin.on('data', function( text ){
			switch( text ){
				case 'on\n':
				 console.error('ON');
					_Zwave.getController().setValue(3,37,1,0,true);
				break;
				case 'off\n':
				console.error('OFF');
					_Zwave.getController().setValue(3,37,1,0,false);
				break;
				case 'pair\n':
					console.error('Pair node');
					_Zwave.getController().addNode( false );
				break;
				case 'pair security\n':
					console.error('Pair node security');
					_Zwave.getController().addNode( true );
				break;
				case 'unpair\n':
					console.error('unpair node');
					_Zwave.getController().removeNode();
				break;
				case 'hard reset\n':
					console.error('hard reset');
					_Zwave.getController().hardReset();
				break;
				case 'soft reset\n':
					console.error('soft reset');
					_Zwave.getController().softReset();
				break;
			}
	  });
*/
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
		// Driver events
		_oController.on('driver ready', function( sHomeID ){
			_Zwave.setHomeID( sHomeID );
			_Zwave.debug( 'Starting network scan...' );
		});
		_oController.on('driver failed', function( sHomeID ){
			_Zwave.setHomeID( sHomeID );
			_Zwave.error( 'Failed to start controller driver...' );
		});
		// Node events
		_oController.on('node available', function( sNodeID, oNodeInfo ){
			_Zwave.debug( 'Node ID: "%s" -> Available', sNodeID );
			oNodeInfo.node_id = sNodeID;
			_Zwave.addNode( oNodeInfo ); // Partial Infos
		});
		_oController.on('node ready', function( sNodeID, oNodeInfo ){
			_Zwave.debug( 'Node ID: "%s" -> Ready', sNodeID );
			oNodeInfo.node_id = sNodeID;
			_Zwave.addNode( oNodeInfo ); // All correct Infos
		});
		_oController.on('node added', function( sNodeID ){
			_Zwave.debug( 'Node ID: "%s" -> Added', sNodeID );
		} );
		_oController.on('node naming', function( sNodeID, oNodeInfo ){
			_Zwave.debug( 'Node ID: "%s" -> Naming with info:', sNodeID, oNodeInfo );
		});
		_oController.on('node event', function( sNodeID, oData ) {
			_Zwave.debug( 'Node ID: "%s" -> Fired event:', sNodeID, oData );
		});
		// Value events
		_oController.on('value added', function( sNodeID, sClassID, oValue ){
			_Zwave.addNodeValue( oValue );
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
		// Polling events
		_oController.on('polling enabled', function( sNodeID ){
			_Zwave.debug( 'node ID: "%s" -> Polling enabled', sNodeID );
		});
		_oController.on('polling disabled', function( sNodeID ){
			_Zwave.debug( 'node ID: "%s" -> Polling disabled:', sNodeID );
		});
		// Scene events
		_oController.on('scene event', function( sNodeID, iSceneID ){
			_Zwave.debug( 'node ID: "%s" -> Fired scene ID: "%s"', sNodeID, iSceneID );
		});
		// Controller events
		_oController.on('controller command', function(sNodeID, iCtrlState, iCtrlError, sHelpMsg ){
			_Zwave.debug( 'node ID: "%s" -> controller command:', sNodeID, iCtrlState, iCtrlError, sHelpMsg );
		});
		// Notification event
		_oController.on('notification', function( sNodeID, iNotify ) {
	    switch( iNotify ){
		    case 0:
		        _Zwave.debug('Node ID: "%s" -> message complete', sNodeID );
        break;
		    case 1:
		        _Zwave.debug('Node ID: "%s" -> timeout', sNodeID );
        break;
		    case 2:
	        _Zwave.debug('Node ID: "%s" -> nop', sNodeID );
        break;
		    case 3:
	        _Zwave.debug('Node ID: "%s" -> node awake', sNodeID );
        break;
		    case 4:
	        _Zwave.debug('Node ID: "%s" -> node sleep', sNodeID );
        break;
		    case 5:
	        _Zwave.debug('Node ID: "%s" -> node dead', sNodeID );
        break;
		    case 6:
	        _Zwave.debug('Node ID: "%s" -> node alive', sNodeID );
        break;
    	}
		});
		// Handling events which are required to trigger the "ready" event
		let _aPromiseReady =  new Bluebird( function( fResolve ){
			let _aReadyPromises = [];
			// Initial scan completed
			_oController.on('scan complete', function(){
				_Zwave.debug( 'Initial network scan completed' );
				_aReadyPromises.push( _Zwave.__updateStructureToDB() );
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

	addNode( oNodeInfo ){
		let _Zwave = this;
		_Zwave.debug( 'Node ID: "%s" -> Discovered with info:', oNodeInfo.node_id, oNodeInfo );
		oNodeInfo = oNodeInfo || {};
		oNodeInfo.oValues = {};
		_Zwave.__oNodes[ oNodeInfo.node_id ] = oNodeInfo;
		if( _Zwave.isReady() ){
			_Zwave.__updateStructureToDB( oNodeInfo );
		}
	}

	getNode( iID ){
		return this.__oNodes[ iID ];
	}

	getNodes(){
		return this.__oNodes;
	}

	addNodeValue( oValue ){
		let _Zwave = this;
		_Zwave.debug( 'Node ID: "%s" -> Valued discovered with info:', oValue.node_id, oValue );
		_Zwave.__oNodes[ oValue.node_id ].oValues[ oValue.value_id ] = oValue;
	}

	getNodeValue( iNodeID, iValueID ){
		return ( this.__oNodes[ iNodeID ] ? this.__oNodes[ iNodeID ].oValues[ iValueID ] : null );
	}

	getNodeValues( iNodeID ){
		return ( this.__oNodes[ iNodeID ] ? this.__oNodes[ iNodeID ].oValues : null );
	}

	__updateStructureToDB( aNodesInfo ){
		aNodesInfo = ( aNodesInfo ? aNodesInfo : _.values( this.getNodes() ) );
		aNodesInfo = ( Array.isArray( aNodesInfo ) ? aNodesInfo : [ aNodesInfo ] );
		let _Zwave = this;
		return _Zwave.DBTransaction(function( oTransaction ) {
			let _aQueries = [];
			aNodesInfo.forEach( function( oNodeInfo ){
				// Updating/Inserting node into "DEVICE" table
				_aQueries.push( _Zwave.getDBModel( 'DEVICE' ).findOrCreate({
						defaults: {
							name: oNodeInfo.name,
							description: oNodeInfo.type,
							product: oNodeInfo.product,
							productType: oNodeInfo.producttype,
							productID: oNodeInfo.productid,
							manufacturer: oNodeInfo.manufacturer,
							manufacturerID: oNodeInfo.manufacturerid
						},
						where: {
							nodeID: oNodeInfo.node_id
						},
						transaction: oTransaction
					})
				);
				let aNodeValues = _.values( _Zwave.getNodeValues( oNodeInfo.node_id ) );
				aNodeValues.forEach( function( oValue ){
					// Updating/Inserting value into "CHANNEL" table
					_aQueries.push( _Zwave.getDBModel( 'CHANNEL' ).findOrCreate({
							defaults: {
								valueID: oValue.value_id,
								name: oValue.label,
								description: oValue.help,
								value: oValue.value,
								values: JSON.stringify( oValue.values ),
								minValue: oValue.min,
								maxValue: oValue.max,
								nodeID: oValue.node_id,
								classID: oValue.class_id,
								type: oValue.type,
								genre: oValue.genre,
								instance: oValue.instance,
								index: oValue.index,
								units: oValue.units,
								readOnly: oValue.read_only,
								writeOnly: oValue.write_only,
								isPolled: oValue.is_plled
							},
							where: {
								valueID: oValue.value_id
							},
							transaction: oTransaction
						})
					);
				});
			});
			return Bluebird.all( _aQueries );
	  });
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
