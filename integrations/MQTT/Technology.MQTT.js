"use strict";

let _ = require('lodash');
let Bluebird = require('bluebird');

let Technology = require('../../lib/ancilla.js').Technology;

/**
 * A Technology used to connect to MQTT
 *
 * @class	TechnologyMQTT
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

class TechnologyMQTT extends Technology {
	constructor( oOptions ){
		//Default Technology Options
		oOptions = _.extend({
			sID: 'MQTT-1',
			sType: 'Technology.MQTT',
      oEndpoints: {
				'mqtt-broker': {
					sType: 'server.mqtt'
				},
				'mqtt-client': {
					sType: 'client.mqtt',
					//sURL: 'mqtt://test.mosquitto.org',
					//sURL: 'mqtt://79.60.236.79',
					//sUsername: 'Bearer 033a2b2fcbda8647220d11e237c2d5433b2dccc3',
					//sUsername: 'admin',
					//sPassword: 'dev',
					//oTopics: {}
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
		this.info( 'MQTT Technology is ready to process...');
//TEST
		/*
		this.write( 'mqtt-client', 'Hello World!' );
		this.write( 'mqtt-client', JSON.stringify( { name: 'Riccardo' } ), { sTopic: 'test' } ); // Publish on specific topic
		this.write( 'mqtt-client', JSON.stringify({
		    "hw_code": "DLH09042",
		    "latitude": "44.5884977",
		    "longitude": "7.6615533",
		    "address": "Via Guglielmo Marconi, 26,Genola CN",
		    "ram_free": "189872",
		    "ram_used": "47448",
		    "disk_free": "117M",
		    "disk_used": "12M",
		    "sw_version": "3.0.0",
		    "uptime": "60 days",
		    "client_id": "iKon_server",
		    "client_secret": "Dl@B$1K0n5eRv3R",
				"Authorization": "Bearer 033a2b2fcbda8647220d11e237c2d5433b2dccc3"
		} ), { sTopic: 'EVENT/MACHINE/SYNCH' } );
		*/
	}

	onData( oEndpoint, oBuffer, sTopic ){
		this.debug('Data received: "%s" from Endpoint: "%s" and topic "%s"...', oBuffer.toString(), oEndpoint.getID(), sTopic );
	}
}

module.exports = new TechnologyMQTT().export( module );
