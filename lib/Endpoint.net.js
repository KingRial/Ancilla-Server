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
var Tools = require('./Tools.js');

var _ = require('lodash');

class EmitterNet {
	constructor( oOptions ){
		var _oNet = require('net');
		//Default Options
		oOptions = _.extend( {
			host: 'localhost',
			port: 10001,
			type: 'listen'
		}, oOptions );
		var _oEmitter = null;
		switch( oOptions.type ){
			case 'connect':
				_oEmitter = _oNet.connect({
					host: oOptions.host,
					port: oOptions.port
					}, function(){
						Tools.debug('[ Endpoint Network ( ID: %s ) ] Connected to: "%s:%s"', oOptions.id, oOptions.host, oOptions.port );
					});
			break;
			case 'listen':
				//Network
				_oEmitter = _oNet.createServer();
				_oEmitter.listen( oOptions.port, oOptions.host, function(){
					Tools.debug('[ Endpoint Network ( ID: %s ) ] listening on network: "%s:%s"...', oOptions.id, oOptions.host, oOptions.port );
				});
			break;
			default:
				Tools.error( '[ Endpoint Network ( ID: %s ) ] Error: unable to determine endpoint connection type from "%s"; please use "listen" or "connect"', oOptions.id, oOptions.type );
			break;
		}
		return _oEmitter;
	}
}

module.exports = EmitterNet;
