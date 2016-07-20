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
 * A class to describe an Ancilla Event Handler for event "log"
 * This event is used to enable/modify/disable log outputs
 *
 * @class	EventLog
 * @public
 *
 * @return	{Void}
 *
 * @example
 *		new EventLog();
 */
class EventLog extends AncillaEventHandler {
  handle( oTechnology, oEvent ){
    let _oLogger = oTechnology.getLogger();
    let _aPromisesToWait = [ Bluebird.resolve() ];
    if( oEvent.sLevel ){
      _oLogger.setLevel( oEvent.sLevel );
    }
    if( oEvent.bRemote === false ){
      _aPromisesToWait.push( _oLogger.disableRemoteTransport() );
    } else if( oEvent.bRemote ){
      _aPromisesToWait.push( _oLogger.enableRemoteTransport() );
    }
    return Bluebird.all( _aPromisesToWait );
  }
}

module.exports = EventLog;
