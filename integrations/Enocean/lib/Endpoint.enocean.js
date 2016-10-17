"use strict";

let ENOCEAN = require("node-enocean");
let _ = require( 'lodash' );
let Bluebird = require( 'bluebird' );

let Endpoint = require('../../../lib/ancilla.js').Endpoint;

/**
 * A generic class to access node-enocean library.
 *
 * The endpoint will fire also the following custom events:
 *  -
 *
 * @class	EnoceanEndpoint
 * @public
 *
 * @param	{Object}		oOptions		A javascript object of options used to configure the runner behaviour
 *
 * @return	{Void}
 *
 * @example
 *		new EnoceanEndpoint();
 */

class EnoceanEndpoint extends Endpoint {
  constructor( oOptions ){
    oOptions = _.extend({
      //sUSBController: '/dev/ttyUSB0',
      sUSBController: '\\\\.\\COM4',
      sBaseAddress: null,
      //sSensorFilePath: './enocean.sensor.json',
      //sConfigFilePath: './enocean.config.json',
      iTimeout: 30
    }, oOptions );
    super( oOptions );
    this.__oNodes = {};
    this.__oPromiseReady = this.__readyController();
    this.__fRejectCurrentCommand = null;
 }

 setController( oController ){
   this.__oEndpoint = oController;
 }

 getController(){
   return this.__oEndpoint;
 }

 __readyController(){
  // https://github.com/Holger-Will/node-enocean/wiki/the-Enocean-Object#properties
  let _oController = ENOCEAN({
    base: this.getConfig().sBaseAddress,
    //eepDesc
    //eepResolvers
    //emitters
    //forgetMode
    //learnMode
    sensorFilePath: this.getConfig().sSensorFilePath,
    configFilePath: this.getConfig().sConfigFilePath,
    timeout: this.getConfig().iTimeout
  });
  _oController.listen( this.getConfig().sUSBController );
  _oController.on( 'data', function(data){
    console.log('DATA EVENT: ', data);
  });
  _oController.on( 'all-sensors', function(data){
    console.log('all-sensors event: ', data);
  });
  _oController.on( 'base', function(data){
    console.log('base: ', data);
  });
  _oController.on( 'forget-error', function(data){
    console.log('forget-error: ', data);
  });
  _oController.on( 'learned', function(data){
    console.log('LEARNED: ', data);
  });
  _oController.on( 'forget-mode-start', function(data){
    console.log('forget-mode-start: ', data);
  });
  _oController.on( 'forget-mode-stop', function(data){
    console.log('forget-mode-stop: ', data);
  });
  _oController.on( 'forgotten', function(data){
    console.log('forgotten: ', data);
  });
  _oController.on( 'known-data', function(data){
    console.log('known-data: ', data);
  });
  _oController.on( 'learn-error', function(data){
    console.log('learn-error: ', data);
  });
  _oController.on( 'earn-mode-start', function(data){
    console.log('earn-mode-start: ', data);
  });
  _oController.on( 'learn-mode-stop', function(data){
    console.log('learn-mode-stop: ', data);
  });
  _oController.on( 'learned', function(data){
    console.log('learned: ', data);
  });
  _oController.on( 'response', function(data){
    console.log('response: ', data);
  });
  _oController.on( 'sensor-info', function(data){
    console.log('sensor-info: ', data);
  });
  _oController.on( 'sent', function(data){
    console.log('sent: ', data);
  });
  _oController.on( 'sent-error', function(data){
    console.log('sent-error: ', data);
  });
  _oController.on( 'unknown-data', function(data){
    console.log('unknown-data: ', data);
  });
  _oController.on( 'unknown-teach-in', function(data){
    console.log('unknown-teach-in: ', data);
  });
  //
  let _Endpoint = this;
  return new Bluebird( function( fResolve ){
    _Endpoint.debug( 'connecting to USB Enocean controller: "%s"', _Endpoint.getConfig().sUSBController );
    _oController.on( 'ready', function(){
      fResolve();
    });
  });
 }

}

module.exports = EnoceanEndpoint;
