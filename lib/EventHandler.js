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
let path = require('path');
let _ = require('lodash');
let Bluebird = require('bluebird');

let AncillaGenericObject = require('./Object.generic.js');

/**
 * A class to describe an Ancilla Event Handler
 *
 * @class	Event
 * @public
 *
 * @param	{Object}		oOptions		Default datas to fill the newly created Ancilla Event
 *
 * @return	{Void}
 *
 * @example
 *		new EventHandler();
 */
class EventHandler extends AncillaGenericObject {
	constructor( oOptions ){
		oOptions = _.extend( {
      sID: 'unknown'
		}, oOptions );
		super( oOptions );
	}

  getID(){
    return this.sID;
  }

  handle( oTechnology, oEvent ){
    return Bluebird.resolve( oEvent );
  }
}

module.exports = EventHandler;
