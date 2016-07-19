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

let Ancilla = require('../../../lib/ancilla.js');
let Value = require('./Value.js');

const NODE_STATUS_READY = 	'00001';
const NODE_STATUS_SLEEP = 	'00010';
const NODE_STATUS_NOP = 		'00100';
const NODE_STATUS_TIMEOUT = '01000';
const NODE_STATUS_DEAD = 		'10000';

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
class Node extends Ancilla.ObjectGeneric {
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

	getName(){
		return this.sName;
	}

	setAlive(){
		this.setStatus( 0 );
	}

	isAlive(){
		return ( !this.isDead() );
	}

	setDead(){
		this.setStatusMask( NODE_STATUS_DEAD );
	}

	isDead(){
		return this.checkStatusMask( NODE_STATUS_DEAD );
	}

	setAwake(){
		this.setStatus( 0 );
	}

	isAwake(){
		return ( !this.isSleep() );
	}

	setSleep(){
		this.setStatusMask( NODE_STATUS_SLEEP );
	}

	isSleep(){
		return this.checkStatusMask( NODE_STATUS_SLEEP );
	}

	setNop(){
		this.setStatusMask( NODE_STATUS_NOP );
	}

	isNop(){
		return this.checkStatusMask( NODE_STATUS_NOP );
	}

	setTimeout(){
		this.setStatusMask( NODE_STATUS_TIMEOUT );
	}

	isTimeout(){
		return this.checkStatusMask( NODE_STATUS_TIMEOUT );
	}

	setReady(){
		this.setAlive();
	}

	isReady(){
		return this.checkStatusMask( NODE_STATUS_READY );
	}

  update( oOptions ){
    this.__fillByOptions( oOptions );
  }

  addValue( oValue ){
    this.__oValues[ oValue.sValueID ] = new Value( oValue );
		return this.__oValues[ oValue.sValueID ];
  }

  getValue( sID ){
    return this.__oValues[ sID ];
  }

	getValues(){
    return this.__oValues;
  }
}

module.exports = Node;
