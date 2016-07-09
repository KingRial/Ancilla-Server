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
 * A class to describe an Ancilla Event Handler for event "technology"
 *
 * @class	EventTechnology
 * @public
 *
 * @return	{Void}
 *
 * @example
 *		new EventTechnology();
 */
class EventTechnology extends AncillaEventHandler {
  handle( oCore, oEvent ){
    let _oPromiseDone = null;
    let _sTechnologyID = oEvent.sTechnologyID;
    let _sAction = oEvent.sAction;
    switch( _sAction ){
      case 'start':
        _oPromiseDone = oCore.startTechnology( _sTechnologyID );
      break;
      case 'stop':
        _oPromiseDone = oCore.stopTechnology( oEvent.sTechnology );
      break;
      case 'restart':
        _oPromiseDone = oCore.stopTechnology( oEvent.sTechnology )
          .then( function(){
            return  oCore.startTechnology( _sTechnologyID );
          })
        ;
      break;
      default:
        oCore.error( 'Unknown operation "%s" over technology "%s" for Ancilla technology event', _sAction, _sTechnologyID );
      break;
    }
    return _oPromiseDone;
  }
}

module.exports = EventTechnology;
