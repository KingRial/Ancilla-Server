"use strict";

let _ = require( 'lodash' );
//let Bluebird = require( 'bluebird' );

let Characteristic = require( './Characteristic.js' );

/**
 * A generic class to describe a BLE service.
 *
 *
 * @class	Service
 * @public
 *
 * @param	{Object}		oOptions		A javascript object of options used to configure the runner behaviour
 *
 * @return	{Void}
 *
 * @example
 *		new BLEEndpoint();
 */

class Service {
  constructor( oHandler ){
    this.__aCharacteristics = [];
    this.__setHandler( oHandler );
 }

 getUUID(){
   return this.__getHandler().uuid;
 }

 addCharacteristic( oCharacteristic ){
   this.__aCharacteristics.push( new Characteristic( oCharacteristic ) );
 }

 getCharacteristic( sUUID ){
   return _.find( this.__aCharacteristics, function( oCharacteristic ){
     return ( oCharacteristic.getUUID() === sUUID );
   });
 }

 getCharacteristics(){
   return this.__aCharacteristics;
 }

 __getHandler(){
   return this.__oHandler;
 }

 __setHandler( oHandler ){
   this.__oHandler = oHandler;
 }

}

module.exports = Service;
