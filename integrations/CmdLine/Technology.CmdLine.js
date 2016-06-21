"use strict";

/*
 *	Copyright (C) 2014  Riccardo Re <kingrichard1980.gmail.com>
 *	This file is part of "Ancilla Libary".
 *
 *  "Ancilla Libary" is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  "Ancilla Libary" is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with "Ancilla Libary".  If not, see <http://www.gnu.org/licenses/>.
*/
let Technology = require('../../lib/ancilla.js').Technology;

let _ = require( 'lodash' );

/**
 * A Technology which will allow to test inter-process communication
 *
 * @class	TechnologyCmdLine
 * @public
 *
 * @param	{Object[]}		oOptions		A javascript object of options used to configure the technology behaviour
 *
 * @example
 *		new TechnologyCmdLine();
 *
 * @return	{Void}
 *
 */
class TechnologyCmdLine extends Technology {

	constructor( oOptions ){
		//Default Technology Options
		oOptions = _.extend({
			sID: 'CmdLine-1',
			sType: 'Technology.CmdLine',
			bUseDB: false,
			bUseLog: false,
			oEndpoints: {
				'mqtt-client': {
					sType: 'client.mqtt',
					//sURL: 'mqtt://192.168.0.81',
					oTopics: {
					}
				}
			}
		}, oOptions );
		// Calling inherited constructor
		super( oOptions );
	}

	onReady(){
		// Calling inherited constructor
		super.onReady();
		//Executing custom onReady event actions
		this.info( 'is ready to process...' );
		// Enabling cmd line
		let _CmdLine = this;
		process.stdin.resume();
	  process.stdin.setEncoding('utf8');
	  process.stdin.on('data', function( sText ){
			sText = sText.replace(/(\r\n|\n|\r)/gm,'');
			_CmdLine.debug( 'Read line: "%s"', sText );
			let _oEndpoint = _CmdLine.getEndpoint('mqtt-client');
			let _aText = sText.split(' ');
			let _sAction = _aText[ 0 ];
			let _sTopic;
			let _sValue;
			switch( _sAction ){
				case 'subscribe':
					_sTopic = _aText.slice( 1 ).join(' ');
					_CmdLine.info( 'Subscribing to: "%s"...', _sTopic );
					_oEndpoint.subscribe( _sTopic );
				break;
				case 'publish':
					_sTopic = _aText[ 1 ];
					_sValue = _aText.slice( 2 ).join(' ');
					_CmdLine.info( 'Publishing to: "%s": %s... ', _sTopic, _sValue );
					_oEndpoint.publish( _sTopic, _sValue );
				break;
			}
		});
	}

	onData( oBuffer, oEndpoint, sTopic ){
		this.debug('Data received: "%s" from Endpoint: "%s" and topic "%s"...', oBuffer.toString(), oEndpoint.getID(), sTopic );
	}

	/*
		onDatagram( oDatagram, oParsedBuffer, oBuffer, oEndpoint, sSocketID ){
			this.debug('Datagram received: "%s" from Endpoint: "%s" and socket ID "%s": "%s" parsed to...', oDatagram.getID(), oEndpoint.getID(), sSocketID, oBuffer.toString( 'hex' ), oParsedBuffer );
		}
	*/

}

module.exports = new TechnologyCmdLine().export( module );
