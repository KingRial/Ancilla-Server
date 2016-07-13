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
let Constant = Ancilla.Constant;

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
  handle( oTechnology ){
    let _aMockObjs = [{
        iID: 1,
        sName: 'Environment One',
        sType: 'GROUP',
        value: '/runtime/grid'
      },{
        iID: 2,
        sName: 'Environment Two',
        sType: 'GROUP',
        value: '/runtime/grid',
      },{
        iID: 3,
        sName: 'Variable On/Off',
        iValueClass: Constant.VALUE_CLASS_BOOLEAN_GENERIC,
        value: true
      },{
        iID: 4,
        sName: 'Variable Generic Input',
        iValueClass: Constant.VALUE_CLASS_STRING_GENERIC,
        value: 'Generic String Value'
      },{
        iID: 5,
        sName: 'Dimmer',
        iValueClass: Constant.VALUE_CLASS_PERCENTAGE_DIMMER,
        value: 50
      },{
        iID: 6,
        sName: 'Status Byte',
        iValueClass: Constant.VALUE_CLASS_1BYTE_GENERIC,
        value: 0
      }];
		let _aPromises = [];
    _aMockObjs.forEach( function( oMockObj ){
      _aPromises.push( oTechnology.offer(  new Ancilla.Object({
        iID: oMockObj.iID,
        sName: oMockObj.sName,
        sType: oMockObj.sType,
        iStatus: oMockObj.iStatus,
        iValueClass: oMockObj.iValueClass,
        value: oMockObj.value
      }) ) );
    });
		return Bluebird.all( _aPromises );
  }
}

module.exports = EventRequest;
