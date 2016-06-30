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
      sLocality: '',
			iStatus: 1 // Status Byte ( 0 is all fine )( by default is Dead / Timeout / Not Ready )
		}, oOptions );
		// Initializing Event
		super( oOptions );
    this.__oValues = {};
	}

  getID(){
    return this.iID;
  }

	getStatus(){
		return this.iStatus;
	}

	setAlive(){
		this.iStatus = 0;
	}

	isAlive(){
		return ( !this.isDead() ); // Mask: 100
	}

	setDead(){
		this.iStatus = this.iStatus ^ 4; // Mask: 100
	}

	isDead(){
		return ( this.iStatus & 4 ? true : false ); // Mask: 100
	}

	setTimeout(){
		this.iStatus = this.iStatus ^ 2; // Mask: 010
	}

	isTimedOut(){
		return ( this.iStatus & 2 ? true : false ); // Mask: 010
	}

	setReady(){
		this.setAlive();
	}

	isReady(){
		return ( this.iStatus & 1 ? false : true ); // Mask: 001
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
