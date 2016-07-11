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

let Ancilla = require('../../../lib/ancilla.js');

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
class EventRequest extends Ancilla.EventHandler {
  handle( oTechnology, oEvent ){
    let _oNodes = oTechnology.getNodes();
		let _aPromises = [];
		for( let _iNodeID in _oNodes ){
			if( _oNodes.hasOwnProperty( _iNodeID ) ){
				let _oNode = _oNodes[ _iNodeID ];
				let _oNodeToOffer = new Ancilla.Object({
					sID: _oNode.getID(),
					sName: _oNode.getName(),
					iStatus: _oNode.getStatus()
// TODO: some kind of value which will tell the system what kind of generic rendering should be used ( On/Off, Dimmer, RGB, STATUS_BYTE, etc.. etc.. )
				});
				_aPromises.push( oTechnology.offer( _oNodeToOffer ) );
				let _oValues = _oNode.getValues();
				for( let _sValueID in _oValues ){
					if( _oValues.hasOwnProperty( _sValueID ) ){
						let _oValue = _oValues[ _sValueID ];
						// Coverting Node object to Ancilla Object
						let _oValueToOffer = new Ancilla.Object({
							sID: _oValue.getID(),
							sName: _oValue.getLabel(),
							sDescription: _oValue.getHelp(),
							value: _oValue.get(),
							//iStatus:
// TODO: some kind of value which will tell the system what kind of generic rendering should be used ( On/Off, Dimmer, RGB, etc.. etc.. )
						});
						_aPromises.push( oTechnology.offer( _oValueToOffer, [ _oNode.getID() ] ) );
					}
				}
			}
		}
		return Bluebird.all( _aPromises );
  }
}

module.exports = EventRequest;
