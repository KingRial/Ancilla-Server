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
let Ancilla = require('../../../lib/ancilla.js');
let AncillaEventHandler = Ancilla.EventHandler;

/**
 * A class to describe an Ancilla Event Handler for event "set"
 *
 * @class	EventSet
 * @public
 *
 * @return	{Void}
 *
 * @example
 *		new EventSet();
 */
class EventSet extends AncillaEventHandler {
  handle( oTechnology, oEvent ) {
// TODO: this is not the correct way to set the object! should be changed ASAP
    return oTechnology.getEndpoint('openzwave').set( oEvent.msp, oEvent.value );
  }
}

module.exports = EventSet;
