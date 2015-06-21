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

var Ancilla = require('./lib/ancilla.node.js');
var Tools = Ancilla.Tools;
var Core = Ancilla.Core;

process.argv.push( '--sCwd' );
process.argv.push( '"."' );
process.argv.push( '--sUpdatePath' );
process.argv.push( '"./lib"' );
// This is the same as using the following command: node lib/Core.node.js --sCwd "." --sUpdatePath "./lib"
module.exports = Tools.exports( Core, module );
