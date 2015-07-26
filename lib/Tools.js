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
var Chalk = require('chalk');

var util = require( 'util' );
var path = require('path');

// Ancilla tools
class Tools {
	constructor(){
		this._bDebug = false;
	}

	/*
	inherits( oConstructor, oSuperConstructor ){
		//superConstructor will be accessible through the constructor.super_ property.
		return util.inherits( oConstructor, oSuperConstructor );
	}

	extend(){ //jQuery extend
		var _oExtend = require('node.extend');
		return _oExtend.apply( this, arguments );
	}
	*/
	proxy( fFunc, oContext ){
		var _aArgs = Array.prototype.slice.call( arguments, 2 );
		var _fProxyFunc = function() {
			// Deciding the order of the arguments: first the arguments from the proxy then the arguments received from the external call
			return fFunc.apply( oContext || this, _aArgs.concat( Array.prototype.slice.call( arguments ) ) );
			//return fFunc.apply( oContext || this, Array.prototype.slice.call( arguments ).concat( _aArgs ) );
		};
		return _fProxyFunc;
	}

	getLocalIPs( iIndexIP ){
		var _oOS = require('os');
		var _aInterfaces = _oOS.networkInterfaces();
		var _aIPs = [];
		for( var _iInterfaceIndex in _aInterfaces ){
			for (var _iIPIndex in _aInterfaces[ _iInterfaceIndex ]) {
				var _oAddress = _aInterfaces[ _iInterfaceIndex ][ _iIPIndex ];
				if( _oAddress.family === 'IPv4' && !_oAddress.internal ){
					_aIPs.push( _oAddress.address );
				}
			}
		}
		return ( typeof iIndexIP == 'undefined' ? _aIPs : _aIPs[ iIndexIP ] );
	}

	processArgs( aArgs ){
		var _oArgs = {};
		var _sCurrentField = null;
		var _sPreviousField = null;
		for( var _iIndex in aArgs ){
			var _sValue = aArgs[ _iIndex ];
			var _sPreviousValue = aArgs[ _iIndex - 1 ] || '';
			if( _sValue.indexOf( '--' ) === 0 ){
				if( _sPreviousField && typeof _oArgs[ _sPreviousField ] == 'undefined' ){
					_oArgs[ _sPreviousField ] = true;
				}
				_sCurrentField = _sValue.substring( 2 );
			} else {
				_oArgs[ _sCurrentField ] = ( this.isNumeric( _sValue ) ? parseFloat( _sValue ) : ( this.isJSON( _sValue ) ? JSON.parse( _sValue ) : _sValue ) ) ;
			}
			_sPreviousField = _sCurrentField;
		}
		if( _sPreviousField && typeof _oArgs[ _sPreviousField ] == 'undefined' ){
			_oArgs[ _sPreviousField ] = true;
		}
		return _oArgs;
	}

	isAbsolutePath( sPath ){
		return ( path.resolve( sPath ) === sPath );
	}

	isArray( aElement ){
		return util.isArray( aElement );
	}

	isEmptyObject( oObj ) {
		return !Object.keys( oObj ).length;
	}

	isString( value ){
		var isString = ( typeof value!='object' ) && ( !this.isNumeric(value) );
		return isString;
	}

	isJSON( sString ){
		try {
				JSON.parse( sString );
		} catch (e) {
				return false;
		}
		return true;
	}

	isNumeric( value ){
		value = typeof( value ) === 'string' ? value.replace(',', '.') : value;
		return !isNaN(parseFloat( value )) && isFinite( value ) && Object.prototype.toString.call( value ).toLowerCase() !== '[object array]';
	}

	isOSWin(){
		return /^win/.test( process.platform );
	}

	info(){
		var _sMessage = util.format.apply( this, arguments );
//TODO: for some reasons Chalck won't close correctly strings so we have to do this way
		//util.log( '[ ' + Chalk.white('Info') + ' ] ' + _sMessage );
		util.log( '[ ' + Chalk.styles.white.open + 'Info' + Chalk.styles.white.close + ' ] ' + _sMessage );
	}

	error(){
		var _sMessage = util.format.apply( this, arguments );
//TODO: for some reasons Chalck won't close correctly strings so we have to do this way
		//util.log( '[ ' + Chalk.red('Error') + ' ] ' + _sMessage );
		//util.error( '[ ' + Chalk.red('Error') + ' ] ' + _sMessage );
		util.log( '[ ' + Chalk.styles.red.open + 'Error' + Chalk.styles.red.close + ' ] ' + _sMessage );
		//console.trace();
		//util.error( '[ ' + Chalk.styles.red.open + 'Error' + Chalk.styles.red.close + ' ] ' + _sMessage );
	}

	setDebug( bDebug ){
		this._bDebug = bDebug;
	}

	getDebug(){
		return this._bDebug;
	}

	debug(){
		if( this._bDebug ){
			var _sMessage = util.format.apply( this, arguments );
//TODO: for some reasons Chalck won't close correctly strings so we have to do this way
			//util.log( '[ ' + Chalk.blue('Debug') + ' ] ' + _sMessage );
			util.log( '[ ' + Chalk.styles.blue.open + 'Debug' + Chalk.styles.blue.close + ' ] ' + _sMessage );
		}
	}

	getRandomItemFromArray( aArray, aFilterArray ){
		if( !aFilterArray ){
			aFilterArray = [];
		}
		var _aFilteredArray = aArray.filter(function( sElement ){
			for( var _iIndex in aFilterArray ){
				var _sElement = aFilterArray[ _iIndex ];
				if( _sElement == sElement ){
					return false;
				}
			}
			return true;
		});
		return _aFilteredArray[ Math.floor( Math.random() * _aFilteredArray.length ) ];
	}

	__styleTerminalMessage( sMessage, aStyles ){
		/*
		var _fChalk = Chalk;
		for( var _iIndex in aStyles ){
			_fChalk = _fChalk[ aStyles[ _iIndex ] ];
		}
		return _fChalk( sMessage );
		*/
//TODO: for some reasons Chalck won't close correctly strings so we have to do this way
		var _aOpen = [];
		var _aClose = [];
		for( var _iIndex in aStyles ){
			var _oStyle = Chalk.styles[ aStyles[ _iIndex ] ];
			_aOpen.push( _oStyle.open );
			_aClose.push( _oStyle.close );
		}
		return _aOpen.join('') + sMessage + _aClose.join('');
	}

	__styleTerminalGetRandom(){
		var _aMofiers = [
			'reset',
			'bold',
			'dim',
			'italic',
			'underline',
			'inverse',
			'hidden',
			'strikethrough'
		];
		var _aColours = [
			'black',
			'red',
			'green',
			'yellow',
			'blue',
			'magenta',
			'cyan',
			'white',
			'gray'
		];
		var _aBackground = [
			'bgBlack',
			'bgRed',
			'bgGreen',
			'bgYellow',
			'bgBlue',
			'bgMagenta',
			'bgCyan',
			'bgWhite'
		];
		var _sModifier = this.getRandomItemFromArray( _aMofiers );
		var _sColour = this.getRandomItemFromArray( _aColours );
		//var _sBackground = this.getRandomItemFromArray( _aBackground, [ 'bg' + _sColour.replace( /\w\S*/g, function(sTxt){return sTxt.charAt(0).toUpperCase() + sTxt.substr(1).toLowerCase();} ) ] );
		//if( _sBackground != 'bgBlack' ){
		//	_sColour='black';
		//}
		//return [ _sModifier, _sColour, _sBackground ];
		return [ _sModifier, _sColour ];
	}
}

module.exports = new Tools();
