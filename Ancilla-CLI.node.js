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

var Ancilla = require('./lib/ancilla.js');
var Technology = Ancilla.Technology;
var Constant = Ancilla.Constant;

var _ = require('lodash');

/**
 * A CLI Technology used to send commands to the Core
 *
 * @class	AncillaCLI
 * @public
 *
 * @example
 *		new AncillaCLI();
 *
 * @return	{Void}
 *
 */

class AncillaCLI extends Technology{

	constructor( oCLIOptions ){
		//Default Technology Options
		oCLIOptions = _.extend({
			sID: 'CLI',
			sType: 'CLI',
	    bUseDB: false,
			bUseLog: false,
	    aEndpoints: [{
	      id: Constant._EVENT_CORE_ENDPOINT_NET_ID,
	      type: 'connect',
	      connectionType: 'net',
	      host: Constant._EVENT_CORE_ENDPOINT_NET_HOST,
	      port: Constant._EVENT_CORE_ENDPOINT_NET_PORT,
	      isAncillaEventsHandler: true
	    }]
		}, oCLIOptions );
		// Calling inherited constructor
		super( oCLIOptions );
	}

	onReady(){
		console.error( 'TODO' );
	  process.exit();
	}

	onError( oError ){
	  super.onError( oError );
	  process.exit();
	}
}

new AncillaCLI().run();
