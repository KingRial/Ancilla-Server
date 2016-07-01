"use strict";

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
		oOptions = _.merge({
			sID: 'ZWave-1',
			sType: 'Technology.Z-Wave',
			sUSBController: '/dev/ttyACM0',
      //sUSBController: '\\\\.\\COM4',
			//sUSBController: 'COM4',
//TODO: security key for pair security
//TODO: re-enable DB
			//bUseDB: true
			oEndpoints: {
				'openzwave': {
					module: require( './lib/Endpoint.openzwave.js' )
				}
			}
		}, oOptions );
		// Calling inherited constructor
		super( oOptions );
	}
/*
//TODO: should handle such method differently in the future ( should be configurable on Endpoint's options )
	__initEndpoint( oEndpoint ){
		let _ZWave = this;
		switch( oEndpoint.getID() ){
			case 'openzwave':
				oEndpoint.on( 'node available', ( oNodeInfo ) => _ZWave.onNodeAvailable( oNodeInfo ) );
				oEndpoint.on( 'node ready', ( oNodeInfo ) => _ZWave.onNodeReady( oNodeInfo ) );
				oEndpoint.on( 'node nop', ( iNodeID ) => _ZWave.onNodeNop( iNodeID ) );
				oEndpoint.on( 'node timeout', ( iNodeID ) => _ZWave.onNodeTimeout( iNodeID ) );
				oEndpoint.on( 'node dead', ( iNodeID ) => _ZWave.onNodeDead( iNodeID ) );
				oEndpoint.on( 'node alive', ( iNodeID ) => _ZWave.onNodeAlive( iNodeID ) );
				//oEndpoint.on( 'value added', ( oValue ) => _ZWave.onValueAdded( oValue ) );
			break;
		}
		super.__initEndpoint( oEndpoint );
	}
*/
	onReady(){
		// Calling inherited method
		super.onReady();
		// Current method
		this.info( 'Z-Wave Technology is ready to process...');
	}

	onData( oBuffer, oEndpoint, sSocketID ){
		switch( oEndpoint.getID() ){
			case 'openzwave':
				this.debug('Data received: "%s" from node ID "%s"...', oBuffer.toString(), sSocketID );
			break;
		}
	}

/*
	onDatagram( oDatagram, oParsedBuffer, oBuffer, oEndpoint, sSocketID ){
		switch( oEndpoint.getID() ){ // Useless when you have only one "listening" endpoint
			case 'openzwave':
				this.debug('Datagram received: "%s" from Endpoint: "%s" and socket ID "%s": "%s" parsed to...', oDatagram.getID(), oEndpoint.getID(), sSocketID, oBuffer.toString( 'hex' ), oParsedBuffer );
			break;
			default:
				// Calling inherited method
				super.onDatagram( oDatagram, oParsedBuffer, oBuffer, oEndpoint, sSocketID );
			break;
		}
	}
	*/
/*
	onNodeAvailable( oNode ){
this.error( '------------>Node Available', oNode );
	}

	onNodeReady( oNode ){
console.error( '------------>Node Ready', oNode );
	}

	onNodeTimeout( oNode ){
console.error( '------------>Node timeout', oNode );
	}

	onNodeNop( oNode ){
console.error( '------------>Node Nop', oNode );
	}

	onNodeDead( oNode ){
console.error( '------------>Node Dead', oNode );
	}

	onNodeAlive( oNode ){
console.error( '------------>Node Alive', oNode );
	}
*/
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
// TODO: remove the following methods
	/**
	 * Method used to obtain the OpenZWave controller ( https://github.com/OpenZWave/node-openzwave-shared )
	 *
	 * @method    getController
	 * @public
	 *
	 * @return	{Object}	The OpenZWave controller
	 *
	 * @example
	 *   Zwave.getController();
	 */
	getController(){
		return this.getEndpoint('openzwave').getController();
	}

	/*
	getNode( iNodeID ){
		return this.getEndpoint('openzwave').getNode( iNodeID );
	}
	*/

	/**
	 * Method used to pair a Node
	 *
	 * @method    pair
	 * @public
	 *
	 * @return	{Object} returna a Promise
	 *
	 * @example
	 *   Zwave.pair();
	 */
	pair( bSecure ){
		bSecure = bSecure || false;
		let _Zwave = this;
		let _oController = _Zwave.getController();
		let _fHandler = null;
		return new Bluebird(function( fResolve ){
			_fHandler = function( iNodeID ){
				_Zwave.info( 'Paired Node ID: "%s"', iNodeID );
				fResolve( iNodeID );
			};
			_Zwave.info( 'Pairing %s network security...', ( bSecure ? 'WITH' : 'WITHOUT' ) );
			_oController.on('node ready', _fHandler );
			_oController.addNode( bSecure );
		})
			.then( function( sNodeID ){
				_oController.removeListener('node ready', _fHandler);
				let _oNode = _Zwave.getNode( sNodeID );
				return Bluebird.resolve( _oNode );
			})
		;
	}

	/**
	 * Method used to unpair a Node
	 *
	 * @method    unpair
	 * @public
	 *
	 * @return	{Object} returna a Promise
	 *
	 * @example
	 *   Zwave.unpair();
	 */
	unpair(){
		let _Zwave = this;
		let _oController = _Zwave.getController();
		let _fHandler = null;
		return new Bluebird(function( fResolve ){
			_fHandler = function( iNodeID ){
				_Zwave.info( 'Unpaired Node ID: "%s"', iNodeID );
				fResolve( iNodeID );
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

	/**
	 * Method used to reset the OpenZWave controller configuration
	 *
	 * @method    reset
	 * @public
	 *
	 * @param     {Boolean}		bHardReset			A flag which tells the controller to do an hard reset instead of a soft reset
	 *
	 * @return	{Object} returna a Promise
	 *
	 * @example
	 *   Zwave.reset();
	 *   Zwave.reset( true );
	 */
	reset( bHardReset ){
		let _Zwave = this;
		let _oController = _Zwave.getController();
		if( bHardReset ){
			_Zwave.info( 'Configuration hard reset' );
			_oController.hardReset();
		} else {
			_Zwave.info( 'Configuration soft reset' );
			_oController.softReset();
		}
		return Promise.resolve();
	}

	/**
	 * Method used to set a value on an open Z-Wave value
	 *
	 * @method    set
	 * @public
	 *
	 * @param     {String/Number}		iNodeIDOrValueID			The node ID or the Value ID
	 * @param     {Number}		iClassIDOrValue			The node value class ID or the value to set
	 * @param     {Number}		[iInstance]			The node value instance ID
	 * @param     {Number}		[iIndex]			The node value index ID
	 * @param     {String/Number}		[value]			The value to set
	 *
	 * @return	{Object} returna a Promise
	 *
	 * @example
	 *   Zwave.set( '2-37-1-0', true );
	 *   Zwave.set( 2, 37, 1, 0, true );
	 */
	set( iNodeIDOrValueID, iClassIDOrValue, iInstance, iIndex, value ){
		let _Zwave = this;
		let _oController = _Zwave.getController();
		if( typeof iNodeIDOrValueID ==='string' && !iInstance && !iIndex && !value){
			let _aArguments = iNodeIDOrValueID.split('-');
			value = iClassIDOrValue;
			iNodeIDOrValueID = parseInt( _aArguments[ 0 ] );
			iClassIDOrValue = parseInt( _aArguments[ 1 ] );
			iInstance = parseInt( _aArguments[ 2 ] );
			iIndex = parseInt( _aArguments[ 3 ] );
		}
		this.debug( 'setting value "%s" on "%s-%s-%s-%s"', value, iNodeIDOrValueID, iClassIDOrValue, iInstance, iIndex );
		_oController.setValue( iNodeIDOrValueID, iClassIDOrValue, iInstance, iIndex, value );
		return Promise.resolve();
	}

}

module.exports = new TechnologyZWave().export( module );
