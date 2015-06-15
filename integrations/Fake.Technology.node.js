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
var Ancilla = require('ancilla');
var Tools = Ancilla.Tools;
var Technology = Ancilla.Technology;

console.error( '\n TEST: %j', Ancilla.Technology  );

/**
 * A Fake Technology
 *
 * @class	FakeTechnology
 * @public
 *
 * @param	{String}		sID						A unique string ID which will point to the current technology
 * @param	{Object[]}		aGatewayOptions			An array of javascript objects describing the endpoints used by the gateway
 * @param	{Object[]}		oTechnologyOptions		A javascript object of options used to configure the technology behaviour
 *
 * @example
 *		new FakeTechnology( 'fake-1', [{ type: 'listen', connectionType: 'net', host: 'localhost', port: 10001 }, { type: 'connect', connectionType: 'net', host: '192.168.0.100', port: 10002 }] );
 *
 * @return	{Void}
 *
 */
var FakeTechnology=function( sID, aGatewayOptions, oFakeOptions ){
	//Default Technology Options
	oFakeOptions = Tools.extend({
		sType: 'Fake.Technology'
	}, oFakeOptions );
	// Calling inherited constructor
	FakeTechnology.super_.call( this, sID, aGatewayOptions, oFakeOptions );
}
Tools.inherits( FakeTechnology, Technology );

FakeTechnology.prototype.onReady = function(){
	// Calling inherited constructor
	FakeTechnology.super_.prototype.onReady.apply( this );
	// Executing custom onReady event actions
	Tools.info( '[ FakeTechnology "%s" ] is ready to process...', this.getID() );
	// Registering Fake Objects
	this.trigger({
		sType: 'register-objects',
		aObjects: [ { id:1, name: 'Oggetto Fake 1' }, { id:2, name: 'Oggetto Fake 2' },{ id:3, name: 'Oggetto Fake 3' } ]
	});
}

FakeTechnology.prototype.onData = function( oData, oGWEndpoint ){
	var _FakeTechnology = this;
	Tools.debug('[ FakeTechnology "%s" ] Data received: "%s" from Gateway Endpoint: "%s"; tracking...', _FakeTechnology.getID(), oData.toString('hex'), oGWEndpoint.getID() );
	//Tracking Data
	_FakeTechnology.__DBget().query( "INSERT INTO TRACK ( DATA_STRING, DATA_HEX ) VALUES ( '" + oData.toString() + "', '" + oData.toString('hex') + "' );", function( iError, oRows, sQuery ){
		if( iError != 0 ){
			Tools.error( '[ FakeTechnology "%s" ] Error on tracking data', _FakeTechnology.getID() );
		}
	});
	//Sending Event to itself using the Core ( no real reason :P )
	_FakeTechnology.trigger({
		sType: 'fakeEvent',
		sToID: this.getID(),
		data: oData.toString()
	});
}

FakeTechnology.prototype.onAncilla = function( oEvent ){
	Tools.debug( '[ FakeTechnology "%s" ] Received Ancilla Event [%s]: "%s" ', this.getID(), oEvent.sType, oEvent.data );
}

module.exports = FakeTechnology;
