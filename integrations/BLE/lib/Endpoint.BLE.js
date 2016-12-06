"use strict";

let _ = require( 'lodash' );
let Bluebird = require( 'bluebird' );

let Endpoint = require('../../../lib/ancilla.js').Endpoint;

/**
 * A generic class to access noble library.
 *
 * The endpoint will fire also the following custom events:
 *  -
 *
 * @class	BLEEndpoint
 * @public
 *
 * @param	{Object}		oOptions		A javascript object of options used to configure the runner behaviour
 *
 * @return	{Void}
 *
 * @example
 *		new BLEEndpoint();
 */

class BLEEndpoint extends Endpoint {
  constructor( oOptions ){
    oOptions = _.extend({
    }, oOptions );
    super( oOptions );
    this.__oPromiseReady = this.__readyController();
 }

 __readyController(){
   try{
     let noble = require( 'noble' );
     noble.on('scanStart', function(){
       console.info( 'scanStart' );
     });
     noble.on('scanStop', function(){
       console.info( 'scanStop' );
     });
     noble.on('discover', function( peripheral ){
       console.info( 'found peripheral: ', peripheral );
     });
     noble.on('error', function( error ){
       console.info('Error: ', error );
     });
     noble.on('warning', function( message ){
       console.info('Warning: ', message );
     });
     /*
     peripheral.once('connect', callback);
     peripheral.once('disconnect', callback);
     peripheral.once('rssiUpdate', callback(rssi));
     peripheral.once('servicesDiscover', callback(services));
     service.once('includedServicesDiscover', callback(includedServiceUuids));
     service.once('characteristicsDiscover', callback(characteristics));
     characteristic.on('data', callback(data, isNotification));
     characteristic.once('read', callback(data, isNotification)); // legacy
     characteristic.once('write', withoutResponse, callback());
     characteristic.once('broadcast', callback(state));
     characteristic.once('notify', callback(state));
     characteristic.once('descriptorsDiscover', callback(descriptors));
     descriptor.once('valueRead', data);
     descriptor.once('valueWrite');
     */
     //noble.startScanning( [], false ); // any service UUID, no duplicates
     //
     let _Endpoint = this;
     return new Bluebird( function( fResolve ){
       _Endpoint.debug( 'connecting to USB Enocean controller: "%s"', _Endpoint.getConfig().sUSBController );
       noble.on('stateChange', function( state ){
         console.info( 'stateChange: ', state );
         if (state === 'poweredOn') {
           noble.startScanning( [], false ); // any service UUID, no duplicates
           fResolve();
         } else {
           noble.stopScanning();
         }
       });
     });
   }catch( e ){
     this.error( 'Unable to start endpoint: ', e );
     return Bluebird.reject( e );
   }
 }

}

module.exports = BLEEndpoint;
