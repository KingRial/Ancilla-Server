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
let Constant = require('../../lib/ancilla.js').Constant;

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
			bConnectToCore: true
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
      if( sText ){
  			_CmdLine.debug( 'Read line: "%s"', sText );
  			let _oEndpoint = _CmdLine.getEndpoint('mqtt-client');
  			let _aText = sText.split(' ');
  			let _sAction = _aText[ 0 ];
  			let _sTopic = Constant._API_CORE_TOPIC;
  			let _sValue;
  			switch( _sAction ){
  				case 'subscribe':
  					_sTopic = _aText.slice( 1 ).join(' ');
  					_CmdLine.debug( 'Subscribing: "%s"...', _sTopic, function( oError ){
  						if( !oError ){
  							_CmdLine.info( 'Subscribed "%s"', _sTopic );
  						} else {
  							_CmdLine.error( 'Error on subscribing to "%s"', _sTopic, oError );
  						}
  					} );
  					_oEndpoint.subscribe( _sTopic );
  				break;
  				case 'publish':
  					_sTopic = _aText[ 1 ];
  					_sValue = _aText.slice( 2 ).join(' ');
  					_CmdLine.debug( 'Publishing on topic "%s": ""%s"... ', _sTopic, _sValue );
  					_oEndpoint.publish( _sTopic, _sValue );
  				break;
          // Generic event
          case 'event':
          // Example: event {"sType":"set","msp":"2-37-1-0","value":0}
          let _sDescribedEvent = _aText.slice( 1 ).join(' ') ;
          try{
            let _oDescribedEvent = JSON.parse( _sDescribedEvent );
						_CmdLine.trigger( _oDescribedEvent );
          } catch( oError ){
            _CmdLine.error( 'Unable to fire generic event; "%s" is not a JSON: %s', _sDescribedEvent, oError );
          }
          break;
          // Specific events
  				case 'tech':
						_CmdLine.trigger({
  						sType: 'technology',
  						sAction: _aText[ 1 ],
  						sTechnologyID: _aText[ 2 ]
  					})
							.then( function(){
								_CmdLine.info( 'technology "%s" started', _aText[ 2 ] );
							})
							.catch( function( iResult ){
								_CmdLine.error( 'Failed to start technology "%s" with error: %s', _aText[ 2 ], iResult );
							})
						;
  				break;
  				case 'set':
						_CmdLine.trigger({
  						sType: 'set',
  						iObjID: _aText[ 1 ],
  						value: _aText[ 2 ]
  					});
  				break;
          case 'reset':
						_CmdLine.trigger({
							sType: _sAction,
							bHardReset: true
						});
  				break;
					case 'request':
          case 'pair':
  				case 'unpair':
						_CmdLine.trigger({
							sType: _sAction
						});
          break;
  			}
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
