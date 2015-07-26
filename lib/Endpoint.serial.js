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
//Serial Emitter
var Tools = require('./Tools.js');

var _ = require('lodash');

class EmitterSerial {
	constructor( oOptions ){
		var _oSerial = require( 'serialport' );
		// Default Options
		oOptions = _.extend( {
			port: '/dev/ttyS0',
			baudrate: 9600, // Should be one of: 115200, 57600, 38400, 19200, 9600, 4800, 2400, 1800, 1200, 600, 300, 200, 150, 134, 110, 75, or 50. Custom rates as allowed by hardware is supported.
			databits: 8, // Must be one of: 8, 7, 6, or 5.
			stopbits: 1, // Must be one of: 1 or 2.
			parity: 'none', // Must be one of: 'none', 'even', 'mark', 'odd', 'space'
			buffersize: 255
			//parser: The parser engine to use with read data, defaults to rawPacket strategy which just emits the raw buffer as a "data" event. Can be any function that accepts EventEmitter as first parameter and the raw buffer as the second parameter.
		}, oOptions );
		Tools.info('[ Endpoint Serial ( ID: %s ) ] Connected on port: "%s", BaudRate: %s, DataBits: %s, StopBits: %s, Parity: %s, BufferSize: %s', oOptions.id, oOptions.port, oOptions.baudrate, oOptions.databits, oOptions.stopbits, oOptions.parity, oOptions.buffersize );
		return new _oSerial( oOptions.port, oOptions, false );
	}
}

module.exports = EmitterSerial;
