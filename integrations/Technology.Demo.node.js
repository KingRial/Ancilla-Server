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
var Ancilla = require('../lib/ancilla.node.js');
var Tools = Ancilla.Tools;
var Technology = Ancilla.Technology;

/**
 * A Demo Technology used to show how to integrate new technologies using ancilla library
 *
 * @class	DemoTechnology
 * @public
 *
 * @param	{Object[]}		oDemoOptions		A javascript object of options used to configure the technology behaviour
 *
 * @example
 *		new DemoTechnology( { sID: 'demo-1', aEndpoints: [{ type: 'listen', connectionType: 'net', host: 'localhost', port: 10001 }, { type: 'connect', connectionType: 'net', host: '192.168.0.100', port: 10002 }] } );
 *
 * @return	{Void}
 *
 */
var DemoTechnology=function( oDemoOptions ){
	//Default Technology Options
	oDemoOptions = Tools.extend({
		sType: 'Technology.Demo',
		bUseLog: false
	}, oDemoOptions );
	// Calling inherited constructor
	DemoTechnology.super_.call( this, oDemoOptions );
}
Tools.inherits( DemoTechnology, Technology );

DemoTechnology.prototype.onReady = function(){
	// Calling inherited constructor
	DemoTechnology.super_.prototype.onReady.apply( this );
	// Executing custom onReady event actions
	Tools.info( '[ DemoTechnology "%s" ] is ready to process...', this.getID() );
	/*
	// Registering Fake Objects
	this.trigger({
		sType: 'register-objects',
		aObjects: [ { id:1, name: 'Oggetto Fake 1' }, { id:2, name: 'Oggetto Fake 2' },{ id:3, name: 'Oggetto Fake 3' } ]
	});
	*/
}

DemoTechnology.prototype.onData = function( oData, oGWEndpoint ){
	var _DemoTechnology = this;
	Tools.debug('[ DemoTechnology "%s" ] Data received: "%s" from Gateway Endpoint: "%s"; tracking...', _DemoTechnology.getID(), oData.toString('hex'), oGWEndpoint.getID() );
	// Tracking Data when something is received
	_DemoTechnology.__DBget().query( "INSERT INTO TRACK ( DATA_STRING, DATA_HEX ) VALUES ( '" + oData.toString() + "', '" + oData.toString('hex') + "' );", function( iError, oRows, sQuery ){
		if( iError != 0 ){
			Tools.error( '[ DemoTechnology "%s" ] Error on tracking data', _DemoTechnology.getID() );
		}
	});
	// Sending Event to itself using the Core ( no real reason :P Just to show how to trigger events )
	_DemoTechnology.trigger({
		sType: 'demoEvent',
		sToID: this.getID(),
		data: oData.toString()
	});
}

DemoTechnology.prototype.onAncilla = function( oEvent ){
	Tools.debug( '[ DemoTechnology "%s" ] Received Ancilla Event [%s]: "%s" ', this.getID(), oEvent.sType, oEvent.data );
}

module.exports = new DemoTechnology().export( module );
