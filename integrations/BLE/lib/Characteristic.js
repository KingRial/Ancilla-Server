"use strict";

let EventEmitter = require( 'events' ).EventEmitter;

let _ = require( 'lodash' );
let Bluebird = require( 'bluebird' );

/**
 * A generic class to describe a BLE characteristic.
 *
 *
 * @class	Characteristic
 * @public
 *
 * @param	{Object}		oOptions		A javascript object of options used to configure the runner behaviour
 *
 * @return	{Void}
 *
 * @example
 *		new Characteristic();
 */

class Characteristic extends EventEmitter {
  constructor( oHandler ){
    super();
    this.__setHandler( oHandler );
    oHandler.on( 'data', function( oData ){
      console.info( '---------> DATA: %s ( "%s" ) ', oData.toString( 'hex' ), oData.toString( 'utf-8' ) );
    });
    oHandler.on( 'broadcast', function( oData ){
      console.info( '---------> Broadcast: %s ( "%s" ) ', oData.toString( 'hex' ), oData.toString( 'utf-8' ) );
    });
 }

 getUUID(){
   return this.__getHandler().uuid;
 }

 isReadable(){
   return _.find( this.__getHandler().properties, function( sProperty ) { return sProperty === 'read';});
 }

 isWritable(){
   return _.find( this.__getHandler().properties, function( sProperty ) { return sProperty === 'write';});
 }

 canSubscribe(){
   return ( this.isNotify() || this.isIndicate() );
 }

 isIndicate(){
   return _.find( this.__getHandler().properties, function( sProperty ) { return sProperty === 'indicate';});
 }

 isNotify(){
   return _.find( this.__getHandler().properties, function( sProperty ) { return sProperty === 'notify';});
 }

 read(){
  let _Characteristic = this;
  return new Bluebird( function( fResolve, fReject ){
    let _oCharHandler = _Characteristic.__getHandler();
    if( _Characteristic.isReadable() ){
      _oCharHandler.read( function( error, oData ){
        if( error ){
          fReject( error );
        } else {
          fResolve( oData );
        }
      });
    } else {
      fReject( 'not readable' );
    }
  });
 }

 subscribe(){
   let _Characteristic = this;
   return new Bluebird( function( fResolve, fReject ){
     let _oCharHandler = _Characteristic.__getHandler();
     if( _Characteristic.isReadable() ){
       if( _Characteristic.isIndicate() ){
         _oCharHandler.notify(true, function( error ){
           if( error ){
             fReject( error );
           } else {
             fResolve();
           }
         });
       } else if( _Characteristic.isNotify() ){
        _oCharHandler.notify(true, function( error ){
          if( error ){
            fReject( error );
          } else {
            _oCharHandler.subscribe( function( error ){
              if( error ){
                fReject( error );
              } else {
                fResolve();
              }
            });
          }
        });
      } else {
       fReject( 'impossible to subscribe' );
      }
     } else {
// TODO: Nothing can't be done; deciding if returning error or just a warning
       fResolve();
     }
   });
 }

 unsubscribe(){
   let _Characteristic = this;
   return new Bluebird( function( fResolve, fReject ){
     _Characteristic.__getHandler().unsubscribe( function( error ){
       if( error ){
         fReject( error );
       } else {
         fResolve();
       }
     });
   });
 }

 __getHandler(){
   return this.__oHandler;
 }

 __setHandler( oHandler ){
   this.__oHandler = oHandler;
 }
}

module.exports = Characteristic;
