"use strict";
let url = require('url');

let _ = require('lodash');

let Ancilla = require('../../lib/ancilla.js');
let Technology = Ancilla.Technology;

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
 *		node --harmony Technology.MQTT.js --url mqtt://foo:1883 --username foo --password foo --topic test/foo1,test/foo2
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
			bUseDB: false,
			bUseLog: false,
      oEndpoints: {
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
		let _oEndpoint = this.getEndpoint('mqtt-client');
		let _MQTT = this;
		process.stdin.resume();
	  process.stdin.setEncoding('utf8');
	  process.stdin.on('data', function( sText ){
			sText = sText.replace(/(\r\n|\n|\r)/gm,'');
			if( sText ){
				_MQTT.debug('Read string: ', sText );
				_oEndpoint.write( new Buffer( sText ) );
			}
		});
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
		let _oTopics = {};
		if( _oArgs.topic ){
			let _aTopics = _oArgs.topic.split(',');
			_aTopics.forEach( function( sTopic ){
				_oTopics[ sTopic ] = null;
			});
		}
		let _oURL = url.parse( _oArgs.url ) || {};
		//let _sProcessName = Path.basename( oCurrentModule.filename );
		let oOptions = _.extend( super.__argsToOptions(), {
			oEndpoints: {
				'mqtt-client': {
					sProtocol: _oURL.protocol.replace(':',''),
					sHost: _oURL.hostname,
					iPort: _oURL.port,
					sUsername: _oArgs.username,
					sPassword: _oArgs.password,
					oTopics: _oTopics
				}
			}
		}, _oArgs );
		return oOptions;
	}
}

module.exports = new TechnologyMQTT().export( module );
