"use strict";

let _ = require('lodash');

let Ancilla = require('../../lib/ancilla.js');

/**
 * A Technology used to connect to Enocean
 *
 * @class	TechnologyEnocean
 * @public
 *
 * @param	{Object[]}		oOptions		A javascript object of options used to configure the technology behaviour
 *
 * @example
 *		new TechnologyEnocean( { sID: 'Enocean-1' } );
 *
 * @return	{Void}
 *
 */

class TechnologyEnocean extends Ancilla.Technology {
	constructor( oOptions ){
		//Default Technology Options
		oOptions = _.merge({
			sID: 'Enocean-1',
			sType: 'Technology.Enocean',
			oEndpoints: {
				'enocean': {
					module: require( './lib/Endpoint.enocean.js' )
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
		this.info( 'Enocean Technology is ready to process...');
	}
}

module.exports = new TechnologyEnocean().export( module );
