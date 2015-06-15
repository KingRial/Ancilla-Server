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
/**
 * This script can be called from line command and will:
 * - Require a particular library
 * - Instantiate an object from the library
 * - Handle the process linking it to the Ancilla Tools library
 *
 * The command line parameters are:
 *		- processName:		the process name
 *		- requirePath:		the path of the library
 *		- [className]:		an optional parameter used to select the class inside the library to instantiate. If not use the library will be instantiated
 *		- [argument]:		an array of arguments, described by a JSON string, which will be used on the istantiate object when the script will create it
 *		- [debug]:			when used, Tools.debug calls will be also shown
 * @example
 *		node Ancilla.node.js --processName Core --requirePath ancilla [[--className Core] [--arguments "array of arguments"][--debug]]
 *		node Ancilla.node.js --processName Core --requirePath ancilla --className Core --debug
 *		node Ancilla.node.js --processName Test1 --requirePath /hello/wolrd/test.node.js --debug
 */

var Ancilla = require('ancilla');
var Tools = Ancilla.Tools;
// Parsing command line arguments
var _oArgs = Tools.processArgs( process.argv.slice( 2 ) );
_oArgs = Tools.extend({
	processName: 'Core',
	requirePath: 'ancilla',
	className: 'Core',
	debug: false,
}, _oArgs );
if( _oArgs.arguments ){
	try {
		_oArgs.arguments = JSON.parse( _oArgs.arguments );
	} catch( e ){
		Tools.error( '[ Ancilla ][ Process: "%s" ] Unable to convert arguments: "%s"...', _oArgs.processName, _oArgs.arguments );
		process.exit();
	}
}
//
Tools.setDebug( _oArgs.debug );
Tools.debug( '[ Ancilla ][ Process: "%s" ] Using Debug...', _oArgs.processName );
Tools.debug( '[ Ancilla ][ Process: "%s" ] Cwd: "%s"...', _oArgs.processName, process.cwd() );
Tools.debug( '[ Ancilla ][ Process: "%s" ] Called from command line "%s"...', _oArgs.processName, process.argv.join( ' ' ) );
// Executing
try {
	// Loading library
	var _oRequire = require( _oArgs.requirePath );
	Tools.info('[ Ancilla ][ Process: "%s" ] Starting Process...', _oArgs.processName );
	// Initiating function's arguments
	var _oFunctionArgs = [ _oArgs.processName ];
	for( var _iIndex in _oArgs.arguments ){
		_oFunctionArgs.push( _oArgs.arguments[ _iIndex ] );
	}
	// Calling function
	var _oObject = ( _oArgs.className ? new _oRequire[ _oArgs.className ]( _oFunctionArgs[ 0 ], _oFunctionArgs[ 1 ], _oFunctionArgs[ 2 ] ) : new _oRequire( _oFunctionArgs[ 0 ], _oFunctionArgs[ 1 ], _oFunctionArgs[ 2 ] ) );
} catch( oError ){
	Tools.error( '[ Ancilla ][ Process: "%s" ] Error: "%s". Unable to start Process...', _oArgs.processName, oError );
}
// Setting process events
process.on('SIGINT', function() {
	Tools.info('[ Ancilla ][ Process: "%s" ] Event SIGINT...', _oArgs.processName );
	process.exit();
});
process.on('SIGTERM', function() {
	Tools.info('[ Ancilla ][ Process: "%s" ] Event SIGTERM...', _oArgs.processName );
	process.exit();
});
process.on('SIGHUP', function() {
	Tools.info('[ Ancilla ][ Process: "%s" ] Event SIGHUP...', _oArgs.processName );
	process.exit();
});
process.on('exit', function( iCode ){
	//TODO: killing process children before exiting current process
	Tools.info('[ Ancilla ][ Process: "%s" ] Closing ( exit code: %s )...', _oArgs.processName, iCode );
});
process.on('close', function( iCode ) {
	Tools.info( '[ Ancilla ][ Process: "%s" ] Process "%s" exited with code "%s" ', _oArgs.processName, process.argv[2], iCode  );
});
process.on('uncaughtException', function( oError ){
	Tools.error('[ Ancilla ][ Process: "%s" ] Uncaught Exception: %s...', _oArgs.processName, oError );
});
