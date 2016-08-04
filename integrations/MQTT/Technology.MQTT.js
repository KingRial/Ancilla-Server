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
 *		node --harmony Technology.MQTT.js --url mqtt://foo:1883 --username foo --password foo --topic test/foo1,test/foo2 --certificate ./cert.pem --key ./cert.key --passphrase foo --ca ./ca.pem
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
					sType: 'client.mqtt'
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
		this.info( 'Write a "message" to publish on all topics or "\'topic\' \'message\'" to publish on a specific topic...');
	  process.stdin.on('data', function( sText ){
			sText = sText.replace(/(\r\n|\n|\r)/gm,'');
			if( sText ){
				// Deciding if current command is written as "topic stringToWrite" or just "stringToWriteToAllTopics"
				let _aText = sText.split(' ');
				let _sTopic = null;
				var _aTopics = _oEndpoint.getTopics();
				_aTopics.forEach( function( sTopic ){
					if( _aText[ 0 ] === sTopic ){
						_sTopic = _aText[ 0 ];
						_aText.shift();
					}
				});
				sText = _aText.join(' ');
				_MQTT.debug('Writing string: %s to %s', sText, ( _sTopic ? 'topic "' + _sTopic + '"' : 'all topics' ) );
				_oEndpoint.write( new Buffer( sText ), {
					sTopic: _sTopic
				} );
			}
		});
	}

	onData( oEndpoint, oBuffer, sTopic ){
		this.info('Data received: "%s" from topic "%s"...', oBuffer.toString(), sTopic );
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
		let _oURL = url.parse( _oArgs.url || '' ) || {};
		//let _sProcessName = Path.basename( oCurrentModule.filename );
		let oOptions = _.extend( super.__argsToOptions(), {
			oEndpoints: {
				'mqtt-client': {
					sProtocol: ( _oURL.protocol ? _oURL.protocol.replace(':','') : 'mqtt' ),
					sHost: ( _oURL.hostname ? _oURL.hostname : '127.0.0.1' ),
					iPort: ( _oURL.port ? _oURL.port : 1883 ),
					sUsername: _oArgs.username,
					sPassword: _oArgs.password,
					oTopics: _oTopics,
					sCert: _oArgs.certificate,
		      sCertKey: _oArgs.key,
		      sCertPassphrase: _oArgs.passphrase,
		      sCA: _oArgs.ca,
				}
			}
		}, _oArgs );
		return oOptions;
	}
}

module.exports = new TechnologyMQTT().export( module );
