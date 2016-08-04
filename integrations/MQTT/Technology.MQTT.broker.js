"use strict";

let _ = require('lodash');

let Ancilla = require('../../lib/ancilla.js');
let Technology = Ancilla.Technology;

/**
 * A Technology used to create a MQTT broker
 *
 * @class	TechnologyMQTTBroker
 * @public
 *
 * @param	{Object[]}		oOptions		A javascript object of options used to configure the technology behaviour
 *
 * @example
 *		new TechnologyMQTT( { sID: 'MQTT-Broker-1' } );
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
		this.info( 'MQTT Broker Technology is ready to process on port "%s"...', this.getEndpoint('mqtt-broker').getPort() );
	}

	onData( oEndpoint, oBuffer, sTopic ){
		this.debug('Data received: "%s" from Endpoint: "%s" and topic "%s"...', oBuffer.toString(), oEndpoint.getID(), sTopic );
	}

	/**
	* Method called to transform args to technology's options
	*
	* @method    __argsToOptions
	* @private
	*
	* @return	{Object}	The parsed technology's options
	*
	* @example
	*   Technology.__argsToOptions();
	*/
	__argsToOptions() {
		// Arguments
		let _oArgs = this.getProcessArgs();
		//let _sProcessName = Path.basename( oCurrentModule.filename );
		let oOptions = _.extend( super.__argsToOptions(), {
			oEndpoints: {
				'mqtt-broker': {
					iPort: ( _oArgs.port ? _oArgs.port : ( _oArgs.certificate && _oArgs.key ? 8883 : 1883 ) ),
					sSSLCert: _oArgs.certificate,
					sSSLKey: _oArgs.key,
					sSSLCA: _oArgs.ca,
				}
			}
		}, _oArgs );
		return oOptions;
	}
}

module.exports = new TechnologyMQTTBroker().export( module );
