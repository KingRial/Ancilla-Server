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
//let _ = require('lodash');

let AncillaGenericObject = require('./Object.generic.js');

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
class AncillaObject extends AncillaGenericObject {
  /**
   * Method used to fille the event with datas
   *
   * @method    __fillByOptions
   * @private
   *
   * @param     {Object}		oArray			The datas used to fill the event
   *
   * @return	{Void}
   *
   * @example
   *   Event.__fillByOptions( oArray );
   */
  __fillByOptions( oArray ){
    if( oArray ){
      for( let _sField in oArray ){
        if( oArray.hasOwnProperty( _sField ) ){
          switch( _sField ){
            case 'sID':
            case 'iID':
            case 'sName':
            case 'sDescription':
            case 'value':
            case 'iStatus':
              let value = oArray[ _sField ];
              this[ _sField ] = value;
            break;
            default:
              // Nothing to do ( it's an unwanted field )
            break;
          }
        }
      }
    }
  }

  getID(){
    return ( this.iID || this.sID );
  }

  getName(){
    return this.sName;
  }

  getDescription(){
    return this.sDescription;
  }

  getValue(){
    return this.value;
  }
}

module.exports = AncillaObject;
