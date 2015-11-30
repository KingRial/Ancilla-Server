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
 * A Demo Technology used to show how to integrate new technologies using ancilla library
 *
 * @class	DemoTechnology
 * @public
 *
 * @param	{Object[]}		oDemoOptions		A javascript object of options used to configure the technology behaviour
 *
 * @example
 *		new DemoTechnology( { sID: 'demo-1', oEndpoints: {"Endpoint-1":{"type":"client.net","host":"192.168.0.110","port":10001},"Endpoint-2":{"type":"server.net","host":"localhost","port":10002}} } );
 *
 * @return	{Void}
 *
 */
class DemoTechnology extends Technology {

	constructor( oDemoOptions ){
		//Default Technology Options
		oDemoOptions = _.extend({
			sID: 'Demo-1',
			sType: 'Technology.Demo',
			bUseLog: false
		}, oDemoOptions );
		// Calling inherited constructor
		super( oDemoOptions );
	}

	onReady(){
		// Calling inherited constructor
		super.onReady();
		// Executing custom onReady event actions
		this.info( 'is ready to process...' );
	}

	onData( oBuffer, oEndpoint ){
		var _DemoTechnology = this;
		_DemoTechnology.debug('Data received: "%s" from Gateway Endpoint: "%s"; tracking...', oBuffer.toString('hex'), oEndpoint.getID() );
		// Sending Event to itself using the Core ( no real reason :P Just to show how to trigger events )
		_DemoTechnology.debug('Triggering Ancilla events to itself...' );
		_DemoTechnology.trigger({
			sType: 'demoEvent',
			sToID: this.getID(),
			data: oBuffer.toString()
		});
	}

	onAncilla( oEvent ){
		this.debug( 'Received Ancilla Event [%s]: "%s" ', oEvent.sType, oEvent.data );
	}

}

module.exports = new DemoTechnology().export( module );
