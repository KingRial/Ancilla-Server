"use strict";

let _ = require('lodash');
let Technology = require('../../lib/ancilla.js').Technology;

/**
 * A Technology used to connect to Domino
 *
 * @class	TechnologyIFTT
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
				/*
				'mqtt-broker': {
					type: 'server.mqtt'
				},
				*/
				'mqtt-client': {
					sType: 'client.mqtt',
					//sURL: 'mqtt://79.60.236.79',
					//sURL: 'mqtt://127.0.0.1/api/v1',
					//sURL: 'mqtt://test.mosquitto.org',
					sURL: 'mqtt://79.60.236.79',
					sUsername: 'Bearer 033a2b2fcbda8647220d11e237c2d5433b2dccc3',
					//sUsername: 'admin',
					//sPassword: 'dev',
					oTopics: {
						'test': ( oBuffer ) => this.onTopic( 'test', oBuffer ),
						'EVENT/MACHINE/SYNCH': ( oBuffer ) => this.onTopic( 'EVENT/MACHINE/SYNCH', oBuffer )
					}
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
	}

	onData( oBuffer, oEndpoint, sTopic ){
		this.debug('Data received: "%s" from Endpoint: "%s" and topic "%s"...', oBuffer.toString(), oEndpoint.getID(), sTopic );
	}

	onTopic( sTopic, oBuffer ){
		this.debug('Topic "%s" received: "%s"', sTopic, oBuffer.toString() );
	}
/*
	onDatagram( oDatagram, oParsedBuffer, oBuffer, oEndpoint, sSocketID ){
		this.debug('Datagram received: "%s" from Endpoint: "%s" and socket ID "%s": "%s" parsed to...', oDatagram.getID(), oEndpoint.getID(), sSocketID, oBuffer.toString( 'hex' ), oParsedBuffer );
	}
*/
}

module.exports = new TechnologyMQTT().export( module );
