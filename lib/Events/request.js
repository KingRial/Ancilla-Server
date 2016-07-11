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
let Bluebird = require('bluebird');

let AncillaEventHandler = require('../EventHandler.js');

/**
 * A class to describe an Ancilla Event Handler for event "offer"
 * This event is used to request from other technologies all the Ancilla objects they can share
 * When receiving this event the target technology will fire an "offer" event to the source technology
 *
 * @class	EventRequest
 * @public
 *
 * @return	{Void}
 *
 * @example
 *		new EventRequest();
 */
class EventRequest extends AncillaEventHandler {
  handle( oTechnology, oEvent ){
    if( oTechnology.onRequest ){
      return oTechnology.onRequest( oEvent );
    } else {
      oTechnology.warn( '"%s" fired a \"request\" event but the technology has nothing to offer...', oEvent.getFrom() );
      return Bluebird.resolve();
    }
  }
}

module.exports = EventRequest;
