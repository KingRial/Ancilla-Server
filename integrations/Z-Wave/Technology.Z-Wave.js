"use strict";

let OZW = require('openzwave-shared');

let _ = require('lodash');
let Bluebird = require('bluebird');

let Technology = require('../../lib/ancilla.js').Technology;

let Node = require('./lib/Node.js');

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
//TODO: security key for pair security
//TODO: re-enable DB
			//bUseDB: true
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
					_Zwave.pair();
				break;
				case 'pair security\n':
					_Zwave.pair( true );
				break;
				case 'unpair\n':
					_Zwave.unpair();
				break;
				case 'hard reset\n':
					console.error('hard reset');
					_Zwave.getController().hardReset();
				break;
				case 'soft reset\n':
					console.error('soft reset');
					_Zwave.getController().softReset();
				break;
				case 'map\n':
					console.error( 'Map: ', _Zwave.getNodes() );
				break;
			}
	  });

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
				// TODO: security
				//NetworkKey: "0xCA,0xFE,0xBA,0xBE,.... " // <16 bytes total>
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
		_oController.on('node removed', function( sNodeID ){
			_Zwave.debug( 'Node ID: "%s" -> Removed', sNodeID );
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
				//_aReadyPromises.push( _Zwave.__updateStructureToDB() );
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
		let _oNode = this.getNode( oNodeInfo.node_id );
		_oNode = ( _oNode ? _oNode : new Node() );
		_oNode.update({
			iID: oNodeInfo.node_id,
			sName: oNodeInfo.name,
      iProductID: oNodeInfo.productid,
      sProduct: oNodeInfo.product,
      iProductType: oNodeInfo.producttype,
      sManufacturer: oNodeInfo.manufacturer,
      iManufacturerID: oNodeInfo.manufacturerid,
			sLocality: oNodeInfo.loc
		});
		_Zwave.__oNodes[ oNodeInfo.node_id ] = _oNode;
		_Zwave.debug( 'Node ID: "%s" -> Discovered:', _oNode.getID(), _oNode );
		/*
		if( _Zwave.isReady() ){
			// TODO: viene scatenato anche quando si "risveglia" il device; quindi bisogna lanciare questa operazione solo se si sta facendo pair
			_Zwave.__updateStructureToDB( oNodeInfo );
		}
		*/
	}

	removeNode( iNodeID ){
		delete this.__oNodes[ iNodeID ];
	}

	getNode( iID ){
		return this.__oNodes[ iID ];
	}

	getNodes(){
		return this.__oNodes;
	}

	addNodeValue( oValue ){
		let _Zwave = this;
		let _iNodeID = oValue.node_id;
		let _oNode = _Zwave.getNode( _iNodeID );
		if( !_oNode ){
			_Zwave.addNode({
				node_id: _iNodeID
			});
			_oNode = _Zwave.getNode( _iNodeID );
		}
		_oNode.addValue({
      sValueID: oValue.value_id,
      iNodeID: oValue.node_id,
      iClassID: oValue.class_id,
      sType: oValue.type,
      sGenre: oValue.genre,
      iInstance: oValue.instance,
      iIndex: oValue.index,
      sLabel: oValue.label,
      sUnits: oValue.unit,
      sHelp: oValue.help,
      bReadOnly: oValue.read_only,
      bWriteOnly: oValue.write_only,
      bIsPolled: oValue.is_pollet,
      fMin: oValue.min,
      fMax: oValue.max,
      value: oValue.value
		});
		let _oValue = _Zwave.getNode( oValue.node_id ).getValue( oValue.value_id );
		_Zwave.debug( 'Node ID: "%s" -> Valued discovered:', _oValue.getID(), _oValue );
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
					// Updating/Inserting value into "VALUE" table
					_aQueries.push( _Zwave.getDBModel( 'VALUE' ).findOrCreate({
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

	pair( bSecure ){
		bSecure = bSecure || false;
		let _Zwave = this;
		let _oController = _Zwave.getController();
		let _fHandler = null;
		return new Bluebird(function( fResolve ){
			_fHandler = function( sNodeID ){
				_Zwave.info( 'Paired Node ID: "%s"', sNodeID );
				fResolve( sNodeID );
			};
			_Zwave.info( 'Pairing %s network security...', ( bSecure ? 'WITH' : 'WITHOUT' ) );
			_oController.on('node added', _fHandler );
			_oController.addNode( bSecure );
		})
			.then( function( sNodeID ){
				_oController.removeListener('node added', _fHandler);
				let _oNode = _Zwave.getNode( sNodeID );
				return Bluebird.resolve( _oNode );
			})
		;
	}

	unpair(){
		let _Zwave = this;
		let _oController = _Zwave.getController();
		let _fHandler = null;
		return new Bluebird(function( fResolve ){
			_fHandler = function( sNodeID ){
				_Zwave.info( 'Unpaired Node ID: "%s"', sNodeID );
				fResolve( sNodeID );
			};
			_Zwave.info( 'Unpairing...' );
			_oController.on('node removed', _fHandler );
			_oController.removeNode();
		})
			.then( function( sNodeID ){
				_oController.removeListener('node removed', _fHandler);
				let _oNode = _Zwave.getNode( sNodeID );
				_Zwave.removeNode( sNodeID );
				return Bluebird.resolve( _oNode );
			})
		;
	}

}

module.exports = new TechnologyZWave().export( module );
