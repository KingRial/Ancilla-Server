"use strict";

let _ = require( 'lodash' );
let Bluebird = require( 'bluebird' );

let Service = require( './Service.js' );

/**
 * A generic class to describe a BLE peripheral.
 *
 *
 * @class	Peripheral
 * @public
 *
 * @param	{Object}		oOptions		A javascript object of options used to configure the runner behaviour
 *
 * @return	{Void}
 *
 * @example
 *		new Peripheral();
 */

class Peripheral {
  constructor( oHandler ){
    let _Peripheral = this;
    _Peripheral._bConnected = false;
    _Peripheral.__aServices = [];
    oHandler.on( 'connect', function(){
      _Peripheral._bConnected = true;
    });
    oHandler.on( 'disconnect', function(){
      _Peripheral._bConnected = false;
    });
    _Peripheral.__setHandler( oHandler );
  }

  getID(){
    return this.__getHandler().id;
  }

  getLabel(){
    return this.__getHandler().advertisement.localName;
  }

  getAddress(){
    return this.__getHandler().address;
  }

  getAddressType(){
    return this.__getHandler().addressType;
  }

  isConnected(){
    return this._bConnected;
  }

  isConnectable(){
    return this.__getHandler().connectable;
  }

  getRSSI(){
    return this.__getHandler().rssi;
  }

  connect(){
    let _Peripheral = this;
    return new Bluebird( function( fResolve, fReject ){
      if( _Peripheral.isConnected() ){
        fResolve();
      } else {
        _Peripheral.__getHandler().connect( function( error ){
          if( error ){
            fReject( error );
          } else {
            fResolve();
          }
        });
      }
    });
  }

  disconnect(){
    let _Peripheral = this;
    return new Bluebird( function( fResolve, fReject ){
      if( _Peripheral.isConnected() ){
        _Peripheral.__getHandler().disconnect( function( error ){
          if( error ){
            fReject( error );
          } else {
            fResolve();
          }
        });
      } else {
        fResolve();
      }
    });
  }

  discover(){
    let _Peripheral = this;
    return _Peripheral.connect()
      .then( function(){
        return new Bluebird( function( fResolve, fReject ){
          _Peripheral.__getHandler().discoverAllServicesAndCharacteristics( function( error, aServices, aCharacteristics ){
            if( error ){
              fReject( error );
            } else {
              aServices.forEach( function( oService ){
                _Peripheral.addService( oService );
              });
              aCharacteristics.forEach( function( oCharacteristic ){
                let _sServiceUUID = oCharacteristic._serviceUuid ;
                let _oService = _Peripheral.getService( _sServiceUUID );
                if( _oService ){
                  _oService.addCharacteristic( oCharacteristic );
                } else {
                  fReject( 'Unable to add characteristic to missing service "%s"; something went really wrong in the code!', _sServiceUUID );
                }
              });
              fResolve();
            }
          });
        });
      })
    ;
  }

  addService( oService ){
    this.__aServices.push( new Service( oService ) );
  }

  getService( sUUID ){
    return _.find( this.__aServices, function( oService ){
      return ( oService.getUUID() === sUUID );
    });
  }

  getServices(){
    return this.__aServices;
  }

  __getHandler(){
    return this.__oHandler;
  }

  __setHandler( oHandler ){
    this.__oHandler = oHandler;
  }

  onDestroy(){
  }
}

module.exports = Peripheral;
