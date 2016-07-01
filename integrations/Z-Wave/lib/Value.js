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
let _ = require('lodash');

let AncillaObject = require('../../../lib/ancilla.js').Object;

/**
 * A class to describe a Z-wave Value
 *
 * @class	Value
 * @public
 *
 * @param	{Object}		oOptions		Default datas to fill the newly created Ancilla Event
 *
 * @return	{Void}
 *
 * @example
 *		new Value();
 */
class Value extends AncillaObject {
	constructor( oOptions ){
		// Default Options
		oOptions = _.extend({
      sValueID: '',
      iNodeID: null,
      iClassID: null,
			iInstance: null,
      iIndex: null,
      sType: '',
      sGenre: '',
      sLabel: '',
      sUnits: '',
      sHelp: '',
      bReadOnly: false,
      bWriteOnly: false,
      bIsPolled: false,
      fMin: 0,
      fMax: 0,
      value: null
		}, oOptions );
		super( oOptions );
	}

  getID(){
    return this.sValueID;
  }

  getClassID(){
    return this.sClassID;
  }

	setValue(value){
		this.value = value;
	}
}

module.exports = Value;
