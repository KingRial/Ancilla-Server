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
 * A Technology which will link multiple endpoints; every data received from a configured endpoint will be written on all the other ones
 *
 * @class	TechnologyBridge
 * @public
 *
 * @param	{Object[]}		oBridgeOptions		A javascript object of options used to configure the technology behaviour
 *
 * @example
 *		new TechnologyBridge( { sID: 'bridge-1', oEndpoints: {"Endpoint-1":{"type":"client.net","host":"192.168.0.110","port":10001},"Endpoint-2":{"type":"server.net","host":"localhost","port":10002}} } );
 *
 * @return	{Void}
 *
 */
class TechnologyBridge extends Technology {

	constructor( oBridgeOptions ){
		//Default Technology Options
		oBridgeOptions = _.extend({
			sID: 'Bridge-1',
			sType: 'Technology.Bridge',
			bUseDB: false,
			bUseLog: false
		}, oBridgeOptions );
		// Calling inherited constructor
		super( oBridgeOptions );
	}

	onReady(){
		// Calling inherited constructor
		super.onReady();
		//Executing custom onReady event actions
		this.info( 'is ready to process...' );
	}
	
	onData( oEndpoint, oBuffer ){
		let _Bridge = this;
		let _oEndpoints = _Bridge.getEndpoints();
		let _oCoreEnpoint = _Bridge.getCoreEndpoint();
		for( let _sEndpointID in _oEndpoints ){
			if( _oEndpoints.hasOwnProperty( _sEndpointID ) ){
				let _oEndpoint = _oEndpoints[ _sEndpointID ];
				// Ignoring endpoint which received the "data" or the endpoint to the Ancilla Core; otherwise writing on the configured endpoint
				if( _sEndpointID === _oEndpoint.getID() || _sEndpointID === _oCoreEnpoint.getID() ){
					continue;
				}
				this.debug('Data received: "%s" from Endpoint: "%s" writing to Endpoint: "%s"...', oBuffer.toString('hex'), oEndpoint.getID(), _sEndpointID );
				_Bridge.write( _sEndpointID, oBuffer );
			}
		}
	}

}

module.exports = new TechnologyBridge().export( module );
