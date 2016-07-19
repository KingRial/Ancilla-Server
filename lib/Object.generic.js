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
let _ = require('lodash');
let Tools = require( './Tools.js' );

/**
 * A class to describe an Ancilla Object
 *
 * @class	Object
 * @public
 *
 * @param	{Object}		oOptions		Default datas to fill the newly created Ancilla Event
 *
 * @return	{Void}
 *
 * @example
 *		new Object();
 */
class Object {

  constructor( oOptions ){
		// Default Options
		oOptions = _.extend({}, oOptions );
		// Initializing Event
		this.__fillByOptions( oOptions );
	}

  /**
   * Method used to fill the event with datas
   *
   * @method    __fillByOptions
   * @private
   *
   * @param     {Object}		oArray			The datas used to fill the event
   *
   * @return	{Void}
   *
   * @example
   *   Object.__fillByOptions( oArray );
   */
  __fillByOptions( oArray ){
    if( oArray ){
      //for( let [ _sField, value ] of Object.entries( oArray ) ){
      for( let _sField in oArray ){
        if( oArray.hasOwnProperty( _sField ) ){
          let value = oArray[ _sField ];
          this[ _sField ] = value;
        }
      }
    }
  }

  getStatus(){
    return this.iStatus;
  }

  setStatus( iStatus ){
    this.iStatus = iStatus;
  }

  setStatusMask( mask ){
    this.iStatus = Tools.setStatusByteByMask( this.iStatus, mask );
  }

  checkStatusMask( mask ){
    return Tools.checkStatusByteByMask( this.iStatus, mask );
  }

  /**
   * Method used to convert Object to String
   *
   * @method    toString
   * @public
   *
   * @return    {String}	the converted string which describes current Event
   *
   * @return	{Void}
   *
   * @example
   *   Object.toString();
   */
  toString(){
    let _oParsedObj = {};
    for( let _sField in this ){
      if( this.hasOwnProperty( _sField ) && typeof this[ _sField ] !== 'function' ){
        // Ignoring null field ( this way the string will be smaller and will show only important infos )
        if( this[ _sField ] !== null ){
          _oParsedObj[ _sField ] = this[ _sField ];
        }
      }
    }
    return JSON.stringify( _oParsedObj );
  }
}

module.exports = Object;
