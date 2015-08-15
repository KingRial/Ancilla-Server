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
		for( let [ _sType, _aInterface ] of Object.entries( _aInterfaces ) ){
			switch( _sType ){
				default:
					for( let _oAddress of _aInterface ){
						if( _oAddress.family === 'IPv4' && !_oAddress.internal ){
							_aIPs.push( _oAddress.address );
						}
					}
				break;
			}
		}
		return ( typeof iIndexIP === 'undefined' ? _aIPs : _aIPs[ iIndexIP ] );
	}

	processArgs( aArgs ){
		var _oArgs = {};
		var _sCurrentField = null;
		var _sPreviousField = null;
		for( let _sValue of aArgs ){
			if( _sValue.indexOf( '--' ) === 0 ){
				if( _sPreviousField && typeof _oArgs[ _sPreviousField ] === 'undefined' ){
					_oArgs[ _sPreviousField ] = true;
				}
				_sCurrentField = _sValue.substring( 2 );
			} else {
				_oArgs[ _sCurrentField ] = ( this.isNumeric( _sValue ) ? parseFloat( _sValue ) : ( this.isJSON( _sValue ) ? JSON.parse( _sValue ) : _sValue ) ) ;
			}
			_sPreviousField = _sCurrentField;
		}
		if( _sPreviousField && typeof _oArgs[ _sPreviousField ] === 'undefined' ){
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
		var isString = ( typeof value!=='object' ) && ( !this.isNumeric(value) );
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

}

module.exports = new Tools();
