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
 * A class to describe an Ancilla Event Handler for event "reset"
 * This event is used to start the "reset" procedure on Z-Wave
 *
 * @class	EventReset
 * @public
 *
 * @param {Boolean} bHardReset when true will reset the entire configuration in the controller ( otherwise will just restart the controller )
 *
 * @return	{Void}
 *
 * @example
 *		new EventReset();
 */
class EventReset extends AncillaEventHandler {
  handle( oTechnology, oEvent ) {
    return oTechnology.getEndpoint('openzwave').reset( oEvent.bHardReset );
  }
}

module.exports = EventReset;
