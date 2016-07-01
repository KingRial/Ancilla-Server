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
}

module.exports = new TechnologyZWave().export( module );
