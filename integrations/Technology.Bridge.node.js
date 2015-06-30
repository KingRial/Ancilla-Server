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
 * A Technology which will link multiple endpoints; every data received from a configured endpoint will be written on all the other ones
 *
 * @class	TechnologyBridge
 * @public
 *
 * @param	{Object[]}		oBridgeOptions		A javascript object of options used to configure the technology behaviour
 *
 * @example
 *		new TechnologyBridge( { sID: 'bridge-1', aEndpoints: [{ type: 'listen', connectionType: 'net', host: 'localhost', port: 10001 }, { type: 'connect', connectionType: 'net', host: '192.168.0.100', port: 10002 }] } );
 *		new TechnologyBridge( { sID: 'bridge-2', aEndpoints: [{ connectionType: 'serial', port: '/dev/ttyS0', baudrate: 9600, databits: 8, stopbits: 1, parity: 'none', buffersize: 255 },{ type: 'listen', connectionType: 'ws', port: 10003 }] } );
 *
 * @return	{Void}
 *
 */
var TechnologyBridge=function( oBridgeOptions ){
	//Default Technology Options
	oBridgeOptions = Tools.extend({
		sType: 'Bridge',
		bUseDB: false,
		bUseLog: false
	}, oBridgeOptions );
	// Calling inherited constructor
	TechnologyBridge.super_.call( this, oBridgeOptions );
}
Tools.inherits( TechnologyBridge, Technology );

TechnologyBridge.prototype.onReady = function(){
	// Calling inherited constructor
	TechnologyBridge.super_.prototype.onReady.apply( this );
	//Executing custom onReady event actions
	this.info( 'is ready to process...' );
}

TechnologyBridge.prototype.onData = function( oData, oGWEndpoint ){
	var _Bridge = this;
	var _aEndpoints = _Bridge.getEndpoints();
	var _oCoreEnpoint = _Bridge.getCoreEndpoint();
	for( var _sID in _aEndpoints ){
		// Ignoring endpoint which received the "data" or the endpoint to the Ancilla Core; otherwise writing on the configured endpoint
		if( _sID == oGWEndpoint.getID() || _sID == _oCoreEnpoint.getID() ){
			continue;
		}
		this.debug('Data received: "%s" from Gateway Endpoint: "%s" writing to Endpoint: "%s"...', oData.toString('hex'), oGWEndpoint.getID(), _sID );
		_Bridge.write( _sID, oData );
	}
}

module.exports = new TechnologyBridge().export( module );
