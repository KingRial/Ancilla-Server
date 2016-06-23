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

let Object = require('../../../lib/ancilla.js').Object;
let Value = require('./Value.js');

/**
 * A class to describe a Z-wave Node
 *
 * @class	Node
 * @public
 *
 * @param	{Object}		oOptions		Default datas to fill the newly created Ancilla Event
 *
 * @return	{Void}
 *
 * @example
 *		new Node();
 */
class Node extends Object {
	constructor( oOptions ){
		// Default Options
		oOptions = _.extend({
      iID: null,
      sName: 'unknown',
      iProductID: null,
      sProduct: 'unknown',
      iProductType: null,
      sManufacturer: 'unknown',
      iManufacturerID: null,
			sType: '',
      sLocality: ''
		}, oOptions );
		// Initializing Event
		super( oOptions );
    this.__oValues = {};
	}

  getID(){
    return this.iID;
  }

  update( oOptions ){
    this.__fillByOptions( oOptions );
  }

  addValue( oValue ){
    this.__oValues[ oValue.sValueID ] = new Value( oValue );
  }

  getValue( sID ){
    return this.__oValues[ sID ];
  }
}

module.exports = Node;
