"use strict";

let _ = require('lodash');

let Ancilla = require('../../lib/ancilla.js');

/**
 * A Technology used to connect to BLE
 *
 * @class	TechnologyBLE
 * @public
 *
 * @param	{Object[]}		oOptions		A javascript object of options used to configure the technology behaviour
 *
 * @example
 *		new TechnologyBLE( { sID: 'BLE-1' } );
 *
 * @return	{Void}
 *
 */

class TechnologyBLE extends Ancilla.Technology {
	constructor( oOptions ){
		//Default Technology Options
		oOptions = _.merge({
			sID: 'BLE-1',
			sType: 'Technology.BLE',
			oEndpoints: {
				'ble': {
					module: require( './lib/Endpoint.BLE.js' )
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
		this.info( 'BLE Technology is ready to process...');
	}
}

module.exports = new TechnologyBLE().export( module );
