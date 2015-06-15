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
//Network Emitter
var Tools = require('./Tools.node.js');

var EmitterWebsocket = function ( oOptions ){
	// Default Options
	oOptions = Tools.extend( ( oOptions.SSLenabled ? {
		type: 'listen',
		SSLenabled: true,
// TODO handling correctly SSL
		SSLkey: 'key.key',
		SSLcrt: 'cert.crt',
		port: 10443
	} : {
		type: 'listen',
		SSLenabled: false,
		port: 10080
	} ), oOptions );
	var _oEmitter = null;
	switch( oOptions.type ){
		case 'connect':
// TODO ws connect
		break;
		case 'listen':
			var _oFS = ( oOptions.SSLenabled ? require('fs') : null );
			var _oHTTP = ( ( oOptions.SSLenabled ) ? require('https') : require('http') );
			var WebSocketServer = require('ws').Server;
			_oEmitter = new WebSocketServer( {
				server: _oHTTP.createServer( ( oOptions.SSLenabled ? {
					key: _oFS.readFileSync( oOptions.SSLkey ),
					cert: _oFS.readFileSync( oOptions.SSLcrt )
				}: null ) ),
				port: oOptions.port
			} );
			//_oEmitter.listen( oOptions.port, function(){
				Tools.info('[ Endpoint Websocket ( ID: %s ) ] listening on "%s://%s:%s"...', oOptions.id, ( oOptions.SSLenabled ? 'wss' : 'ws' ), Tools.getLocalIPs( 0 ), oOptions.port );
			//});
		break;
		default:
			Tools.error( '[ Endpoint Websocket ( ID: %s ) ] Error: unable to determine endpoint connection type from "%s"; please use "listen" or "connect"', oOptions.id, oOptions.type );
		break;
	}
	return _oEmitter;
}
module.exports = EmitterWebsocket;
