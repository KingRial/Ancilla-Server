"use strict";

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

let util = require('util');
let path = require('path');

/**
 * A generic class to describe a generic Ancilla Tool library.
 *
 * @class	Tools
 * @public
 *
 * @return	{Void}
 *
 */
class Tools {
	constructor(){
		this._bDebug = false;
	}

	getLocalIPs( iIndexIP ){
		let _oOS = require('os');
		let _aInterfaces = _oOS.networkInterfaces();
		let _aIPs = [];
		//for( let [ _sType, _aInterface ] of Object.entries( _aInterfaces ) ){
		for( let _sType in _aInterfaces ){
			if( _aInterfaces.hasOwnProperty( _sType ) ){
				let _aInterface = _aInterfaces[ _sType ];
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
		}
		return ( typeof iIndexIP === 'undefined' ? _aIPs : _aIPs[ iIndexIP ] );
	}

	processArgs( aArgs ){
		let _oArgs = {};
		let _sCurrentField = null;
		let _sPreviousField = null;
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
		let isString = ( typeof value!=='object' ) && ( !this.isNumeric(value) );
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

	getEventHandlerFunctionName( sEvent ){
		let _aEventTokens = sEvent.split( ' ' );
		_aEventTokens.unshift( 'on' );
		_aEventTokens.forEach(function( sEventToken, iIndex ){
			if( iIndex!== 0 ){
				_aEventTokens[ iIndex ] = sEventToken.charAt(0).toUpperCase() + sEventToken.slice(1);
			}
		});
		return _aEventTokens.join('');
	}

	/**
   * Method used to set a bit of status byte
   *
   * @method    setStatusByteByMask
   * @private
   *
   * @param     {Number}		iValue   The status byte value to set
   * @param     {String/Number}		mask   A string describing the binary mask or the converted decimal number
   *
   * @return	{Void}
   *
   * @example
	 *   Object.setStatusByteByMask( 0, '10' );
   *   Object.setStatusByteByMask( 0, 2 );
   */
  setStatusByteByMask( iValue, mask ){
    let _iMask = parseInt( mask , ( typeof mask === 'string' ? 2 : 10 ) );
    return ( this.checkStatusByteByMask( iValue, mask ) ? iValue : iValue ^ _iMask );
  }

	/**
   * Method used to unset a bit of a status byte
   *
   * @method    unsetStatusByteByMask
   * @private
   *
   * @param     {Number}		iValue   The status byte value to set
   * @param     {String/Number}		mask   A string describing the binary mask or the converted decimal number
   *
   * @return	{Void}
   *
   * @example
	 *   Object.unsetStatusByteByMask( 0, '10' );
   *   Object.unsetStatusByteByMask( 0, 2 );
   */
  unsetStatusByteByMask( iValue, mask ){
    let _iMask = parseInt( mask , ( typeof mask === 'string' ? 2 : 10 ) );
    return ( this.checkStatusByteByMask( iValue, mask ) ? iValue ^ _iMask  : iValue );
  }

  /**
   * Method used to check a status byte mask
   *
   * @method    checkStatusByteByMask
   * @private
   *
   * @param     {Number}		iValue   The status byte value to check
   * @param     {String/Number}		mask   A string describing the binary mask or the converted decimal number
   *
   * @return	{Void}
   *
   * @example
   *   Object.checkStatusByteByMask( 2, '10' );
   *   Object.checkStatusByteByMask( 2, 2 );
   */
  checkStatusByteByMask( iValue, mask ){
    return ( iValue & parseInt( mask ,( typeof mask === 'string' ? 2 : 10 ) ) ? true : false );
  }

}

module.exports = new Tools();
