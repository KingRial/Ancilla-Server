"use strict";

let _ = require( 'lodash' );
let Bluebird = require( 'bluebird' );

let Endpoint = require('../../../lib/ancilla.js').Endpoint;

let Peripheral = require( './Peripheral.js' );

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
    let _Endpoint = this;
    _Endpoint.__aPeripherals = [];
    _Endpoint.__oPromiseReady = _Endpoint.__readyController();
/*/TODO: Remove me
    process.stdin.on('data', function( oBuffer ){
      console.log('received data: "%s"', oBuffer.toString('hex') );
      if( oBuffer.toString('hex') === '0d0a' ){
        _Endpoint.__test();
      }
    });
*/
 }

/*
 __test(){
   let _Endpoint = this;
   return Bluebird.map( _Endpoint.getPeripherals(), function( oPeripheral ){
     //oPeripheral.connect()
      //.then( function(){
        return Bluebird.map( oPeripheral.getServices(), function( oService ){
          _Endpoint.silly( 'Found service "%s", for peripheral ID: "%s" ( Name: "%s" )', oService.getUUID(), oPeripheral.getID(), oPeripheral.getLabel() );
          return Bluebird.map( oService.getCharacteristics(), function( oCharacteristic ){
            _Endpoint.silly( 'Found characteristic "%s", in service "%s", for peripheral ID: "%s" ( Name: "%s" )', oCharacteristic.getUUID(), oService.getUUID(), oPeripheral.getID(), oPeripheral.getLabel() );
            return ( oCharacteristic.isReadable() ? oCharacteristic.read() : Bluebird.resolve() )
              .then( function(){
                return ( oCharacteristic.canSubscribe() ? oCharacteristic.subscribe() : Bluebird.resolve() )
                  .catch( function( error ){
                    _Endpoint.error( 'Failed to subscribe characteristic "%s", in service "%s", for peripheral ID: "%s" ( Name: "%s" )', oCharacteristic.getUUID(), oService.getUUID(), oPeripheral.getID(), oPeripheral.getLabel() );
                    return Bluebird.reject( error );
                  })
                ;
              })
              .catch( function( error ){
                _Endpoint.error( 'Failed to read characteristic "%s", in service "%s", for peripheral ID: "%s" ( Name: "%s" )', oCharacteristic.getUUID(), oService.getUUID(), oPeripheral.getID(), oPeripheral.getLabel() );
                return Bluebird.reject( error );
              })
            ;
          }, { concurrency: 1 } );
        }, { concurrency: 1 })
          .then( function(){
            _Endpoint.debug( 'Subscribed/Read all characteristics of all discovered peripherals' );
          })
    ;
   })
     .then( function(){
       _Endpoint.debug( 'Test done!' );
     })
   ;
 }
*/

 __readyController(){
   let _Endpoint = this;
   try{
     let noble = require( 'noble' );
     noble.on('scanStart', function(){
       _Endpoint.debug( 'Starting to scan...' );
     });
     noble.on('scanStop', function(){
       _Endpoint.debug( 'Scan stopped.' );
     });
     noble.on('discover', function( peripheral ){
       let _oPeripheral = new Peripheral( peripheral );
       _Endpoint.addPeripheral( _oPeripheral );
       _Endpoint.debug( 'Peripheral discovered ID: "%s" ( Name: "%s" ), address: "%s", address type: "%s", connectable: "%s", RSSI: "%s"', _oPeripheral.getID(), _oPeripheral.getLabel(), _oPeripheral.getAddress(), _oPeripheral.getAddressType(), _oPeripheral.isConnectable(), _oPeripheral.getRSSI() );
       _oPeripheral.discover()
          .then( function(){
            _Endpoint.debug( 'Discovered all characteristics/services for peripheral ID: "%s" ( Name: "%s" )', _oPeripheral.getID(), _oPeripheral.getLabel() );
          })
          .catch( function( error ){
            _Endpoint.error( 'Failed on peripheral ID: "%s": %s', _oPeripheral.getID(), _oPeripheral.getLabel(), error );
          })
        ;
     });
     noble.on('error', function( error ){
       console.info('Error: ', error );
     });
     noble.on('warning', function( sMessage ){
       _Endpoint.warn( sMessage );
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
     return new Bluebird( function( fResolve ){
       _Endpoint.debug( 'connecting to USB BLE' );
       noble.on('stateChange', function( state ){
         _Endpoint.silly( 'State changed to: ', state );
         if (state === 'poweredOn') {
           noble.startScanning( [], false ); // any service UUID, no duplicates
           fResolve();
         } else {
           noble.stopScanning();
         }
       });
     });
   } catch( e ) {
     this.error( 'Unable to start endpoint: ', e );
     return Bluebird.reject( e );
   }
 }

 addPeripheral( oPeripheral ){
   this.__aPeripherals.push( oPeripheral );
 }

 getPeripherals(){
   return this.__aPeripherals;
 }

 onDestroy(){
   let _Endpoint = this;
   return super.onDestroy()
     .then( function(){
      _Endpoint.info( 'Disconnecting from all peripherals...' );
      let _aPeripherals = _Endpoint.getPeripherals();
      return Bluebird.each( _aPeripherals, function( oPeripheral ){
        return oPeripheral.disconnect();
      });
    })
    .catch( function( error ){
      _Endpoint.error( 'Unable to correctly close handler: ', error );
    })
   ;
 }

}

module.exports = BLEEndpoint;
