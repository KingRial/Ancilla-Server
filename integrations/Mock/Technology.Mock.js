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
 * A fake Technology used to test Ancilla library
 *
 * @class	TechnologyMock
 * @public
 *
 * @param	{Object}		oOptions		A javascript object of options used to configure the technology behaviour
 *
 * @example
 *		new TechnologyMock();
 *
 * @return	{Void}
 *
 */
class TechnologyMock extends Technology {

	constructor( oBridgeOptions ){
		//Default Technology Options
		oBridgeOptions = _.extend({
			sID: 'Mock-1',
			sType: 'Technology.Mock',
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
		this.info( 'is ready to MOCK!...' );
	}

	getMockObjs(){
		return this.__aMockObjs;
	}

	getMockObj( iID ){
		return this.__aMockObjs[ iID ];
	}

}

module.exports = new TechnologyMock().export( module );
