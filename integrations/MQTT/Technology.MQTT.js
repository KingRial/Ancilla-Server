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
				'mqtt-broker': {
					type: 'server.mqtt'/*,
					authenticate: function( oClient, sUsername, sPassword, fCallback ){
console.error( 'TEST USERNAME/PASSWORD', sUsername, sPassword );
						fCallback( null, false );
					}
					*/
				},
				'mqtt-client': {
					type: 'client.mqtt',
					//sURL: 'mqtt://test.mosquitto.org',
					//sURL: 'mqtt://79.60.236.79',
					sURL: 'mqtt://127.0.0.1/api/v1',
					//sUsername: 'pippo',
					//sPassword: 'pluto',
					oTopics: {
						'test': ( oBuffer ) => this.onTopic( 'test', oBuffer )
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
		this.getEndpoint('mqtt-client').write( 'Hello World!' );
	}

	onData( oBuffer, oEndpoint, sTopic ){
		this.debug('Data received: "%s" from Endpoint: "%s" and topic "%s"...', oBuffer.toString(), oEndpoint.getID(), sTopic );
	}

	onTopic( sTopic, oBuffer ){
		this.debug('Topic received: "%s": "%s"', sTopic, oBuffer.toString() );
	}
/*
	onDatagram( oDatagram, oParsedBuffer, oBuffer, oEndpoint, sSocketID ){
		this.debug('Datagram received: "%s" from Endpoint: "%s" and socket ID "%s": "%s" parsed to...', oDatagram.getID(), oEndpoint.getID(), sSocketID, oBuffer.toString( 'hex' ), oParsedBuffer );
	}
*/
}

module.exports = new TechnologyMQTT().export( module );
