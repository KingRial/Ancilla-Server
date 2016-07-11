"use strict";

let _ = require('lodash');

let Ancilla = require('../../lib/ancilla.js');

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

class TechnologyZWave extends Ancilla.Technology {
	constructor( oOptions ){
		//Default Technology Options
		oOptions = _.merge({
			sID: 'ZWave-1',
			sType: 'Technology.Z-Wave',
			sUSBController: '/dev/ttyACM0',
      //sUSBController: '\\\\.\\COM4',
			//sUSBController: 'COM4',
//TODO: re-enable DB
			//bUseDB: true
			oEndpoints: {
				'openzwave': {
//TODO: security key for pair security
					//sNetworkKey: '',
					module: require( './lib/Endpoint.openzwave.js' )
				}
			}
		}, oOptions );
		// Calling inherited constructor
		super( oOptions );
	}

	onReady(){
		// Calling inherited method
		super.onReady();
		// Current method
		this.info( 'Z-Wave Technology is ready to process...');
	}

	/**
	* Method used get currently known nodes/values
	*
	* @method    getNodes
	* @public
	*
	* @param     {Boolean}		bSecure		If true, the pair procedure will use the secure connection
	*
	* @return    {Object}		returns an object describing a collection of Node objects
	*
	* @example
	*   ZWave.getNodes();
	*/
	getNodes(){
    return this.getEndpoint( 'openzwave' ).getNodes();
  }

	/**
	* Method used to pair a Z-Wave device with Z-Wave endpoint's controller
	* This method will start the learning mode on the controller
	*
	* @method    pair
	* @public
	*
	* @param     {Boolean}		bSecure		If true, the pair procedure will use the secure connection
	*
	* @return    {Object}		returns a Promise
	*
	* @example
	*   ZWave.pair();
	*   ZWave.pair( true );
	*/
	pair( bSecure ){
    return this.getEndpoint( 'openzwave' ).pair( bSecure );
  }

	/**
	* Method used to unpair a Z-Wave device from Z-Wave endpoint's controller
	* This method will start the learning mode on the controller
	*
	* @method    unpair
	* @public
	*
	* @return    {Object}		returns a Promise
	*
	* @example
	*   ZWave.unpair();
	*/
	unpair(){
    return this.getEndpoint( 'openzwave' ).unpair();
  }

	/**
	* Method used to cancel a Z-Wave controller command in progress
	*
	* @method    cancel
	* @public
	*
	* @return    {Object}		returns a Promise
	*
	* @example
	*   ZWave.cancel();
	*/
	cancel(){
		return this.getEndpoint( 'openzwave' ).cancel();
	}

	/**
	* Method used to reset Z-Wave endpoint's controller's memory
	*
	* @method    reset
	* @public
	*
	* @param     {Boolean}		bHardReset		If true, will start a destructive reset clearing all configuration; otherwise will justs reset the chip
	*
	* @return    {Object}		returns a Promise
	*
	* @example
	*   ZWave.reset();
	*   ZWave.reset( true );
	*/
	reset( bHardReset ){
    return this.getEndpoint( 'openzwave' ).reset( bHardReset );
  }

	/**
   * Method used to heal a node or the network
   *
   * @method    heal
   * @public
   *
   * @param     {Number}		[iNodeID]			The node ID to heal; if missing the network will be healed
   *
   * @return	{Object} returna a Promise
   *
   * @example
   *   ZWave.heal();
   *   ZWave.heal( 1 );
   */
	heal( iNodeID ){
    return this.getEndpoint( 'openzwave' ).reset( iNodeID );
  }

	/*
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
	*/
}

module.exports = new TechnologyZWave().export( module );
