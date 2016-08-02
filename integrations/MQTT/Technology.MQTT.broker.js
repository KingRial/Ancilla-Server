"use strict";

let _ = require('lodash');

let Technology = require('../../lib/ancilla.js').Technology;

/**
 * A Technology used to create a MQTT broker
 *
 * @class	TechnologyMQTTBroker
 * @public
 *
 * @param	{Object[]}		oOptions		A javascript object of options used to configure the technology behaviour
 *
 * @example
 *		new TechnologyMQTT( { sID: 'MQTT-1' } );
 *
 * @return	{Void}
 *
 */

class TechnologyMQTTBroker extends Technology {
	constructor( oOptions ){
		//Default Technology Options
		oOptions = _.extend({
			sID: 'MQTT-Broker-1',
			sType: 'Technology.MQTT.broker',
			bUseDB: false,
			bUseLog: false,
      oEndpoints: {
				'mqtt-broker': {
					sType: 'server.mqtt'
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
		this.info( 'MQTT Broker Technology is ready to process...');
	}

	onData( oEndpoint, oBuffer, sTopic ){
		this.debug('Data received: "%s" from Endpoint: "%s" and topic "%s"...', oBuffer.toString(), oEndpoint.getID(), sTopic );
	}
}

module.exports = new TechnologyMQTTBroker().export( module );
