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
 * This event is used to set a specific value on "Z-Wave"
 *
 * @class	EventSet
 * @public
 *
 * @param {String/Number} iObjID   The string describing the Z-Wave value ID or the Ancilla Object's ID obtained from a previous "offer/request" event
 * @param {String/Number} value   The value to set
 *
 * @return	{Void}
 *
 * @example
 *		new EventSet();
 */
class EventSet extends AncillaEventHandler {
  handle( oTechnology, oEvent ) {
// TODO: delete MSP!
    return oTechnology.getEndpoint('openzwave').set( ( oEvent.iObjID || oEvent.msp ), oEvent.value );
  }
}

module.exports = EventSet;
