"use strict";

let OZW = require('openzwave-shared');
let _ = require( 'lodash' );
let Bluebird = require( 'bluebird' );

let Endpoint = require('../../../lib/ancilla.js').Endpoint;

/**
 * A generic class to access openzwave library.
 *
 * @class	OpenZWaveEndpoint
 * @public
 *
 * @param	{Object}		oOptions		A javascript object of options used to configure the runner behaviour
 *
 * @return	{Void}
 *
 * @example
 *		new OpenZWaveEndpoint();
 */

class OpenZWaveEndpoint extends Endpoint {
  constructor( oOptions ){
    oOptions = _.extend({
      sUSBController: '/dev/ttyACM0',
      //sUSBController: '\\\\.\\COM4',
			//sUSBController: 'COM4',
      sNetworkKey: null,
      //sNetworkKey: "0xCA,0xFE,0xBA,0xBE,.... " // <16 bytes total>
      //aEventsToShare: [ 'node available', 'node ready', 'node nop', 'node timeout', 'node dead', 'node alive', 'value added' ]
    }, oOptions );
    super( oOptions );
    this.__oPromiseReady = this.__readyController();
 }

 setController( oController ){
   this.__oEndpoint = oController;
 }

 getController(){
   return this.__oEndpoint;
 }

 __readyController(){
  let _oOptions = _.extend({
    Logging: false,
    ConsoleOutput: false
  }, ( this.getConfig().sNetworkKey ? { NetworkKey: this.getConfig().sNetworkKey } : {} ));
  let _oController = new OZW( _oOptions );
   this.setController( _oController );
   let _Zwave = this;
   // Driver events
   _oController.on('driver ready', function( sHomeID ){
     _Zwave.setHomeID( sHomeID );
     _Zwave.debug( 'Starting network scan...' );
   });
   _oController.on('driver failed', function( sHomeID ){
     _Zwave.setHomeID( sHomeID );
     _Zwave.error( 'Failed to start controller driver...' );
   });
   // Node events
   _oController.on('node available', function( sNodeID, oNodeInfo ){
     _Zwave.debug( 'Node ID: "%s" -> Available', sNodeID );
     oNodeInfo.node_id = sNodeID;
     _Zwave.emit( 'node available', oNodeInfo ); // Partial Infos
   });
   _oController.on('node ready', function( sNodeID, oNodeInfo ){
     _Zwave.debug( 'Node ID: "%s" -> Ready', sNodeID );
     oNodeInfo.node_id = sNodeID;
     _Zwave.emit( 'node ready', oNodeInfo ); // All correct Infos
   });
   _oController.on('node added', function( sNodeID ){
     _Zwave.debug( 'Node ID: "%s" -> Added', sNodeID );
   } );
   _oController.on('node removed', function( sNodeID ){
     _Zwave.debug( 'Node ID: "%s" -> Removed', sNodeID );
   } );
   _oController.on('node naming', function( sNodeID, oNodeInfo ){
     _Zwave.debug( 'Node ID: "%s" -> Naming with info:', sNodeID, oNodeInfo );
   });
   _oController.on('node event', function( sNodeID, oData ) {
     _Zwave.debug( 'Node ID: "%s" -> Fired event:', sNodeID, oData );
   });
   // Value events
   _oController.on('value added', function( sNodeID, sClassID, oValue ){
     _Zwave.emit( 'value added', oValue );
   });
   _oController.on('value changed', function( sNodeID, iClassID, oValue ){
     _Zwave.debug( 'node ID: "%s" -> value changed:', sNodeID, iClassID, oValue );
     _Zwave.emit( 'data', oValue, sNodeID );
     //_Zwave.emit( 'data', oValue, _oController, sNodeID );
     //_Technology.emit( 'data', oBuffer, oEndpoint, sSocketID );
     //_Zwave.emit( 'datagram', oDatagram, oParsedBuffer, oBuffer, oEndpoint, sSocketID );
   });
   _oController.on('value refresh', function( sNodeID, commandclass, iValueID ){
     _Zwave.debug( 'node ID: "%s" -> value refresh:', sNodeID, commandclass, iValueID );
   });
   _oController.on('value removed', function( sNodeID, commandclass, iValueID ){
     _Zwave.debug( 'node ID: "%s" -> value removed:', sNodeID, commandclass, iValueID );
   });
   // Polling events
   _oController.on('polling enabled', function( sNodeID ){
     _Zwave.debug( 'node ID: "%s" -> Polling enabled', sNodeID );
   });
   _oController.on('polling disabled', function( sNodeID ){
     _Zwave.debug( 'node ID: "%s" -> Polling disabled:', sNodeID );
   });
   // Scene events
   _oController.on('scene event', function( sNodeID, iSceneID ){
     _Zwave.debug( 'node ID: "%s" -> Fired scene ID: "%s"', sNodeID, iSceneID );
   });
   // Controller events
   _oController.on('controller command', function(sNodeID, iCtrlState, iCtrlError, sHelpMsg ){
     _Zwave.debug( 'node ID: "%s" -> controller command:', sNodeID, iCtrlState, iCtrlError, sHelpMsg );
   });
   // Notification event
   _oController.on('notification', function( sNodeID, iNotify ) {
     switch( iNotify ){
       case 0:
           _Zwave.debug('Node ID: "%s" -> message complete', sNodeID );
       break;
       case 1:
           _Zwave.debug('Node ID: "%s" -> timeout', sNodeID );
           _Zwave.emit( 'node timeout', sNodeID );
       break;
       case 2:
         _Zwave.debug('Node ID: "%s" -> nop', sNodeID );
         _Zwave.emit( 'node nop', sNodeID );
       break;
       case 3:
         _Zwave.debug('Node ID: "%s" -> node awake', sNodeID );
       break;
       case 4:
         _Zwave.debug('Node ID: "%s" -> node sleep', sNodeID );
       break;
       case 5:
         _Zwave.debug('Node ID: "%s" -> node dead', sNodeID );
         _Zwave.emit( 'node dead', sNodeID );
       break;
       case 6:
         _Zwave.debug('Node ID: "%s" -> node alive', sNodeID );
         _Zwave.emit( 'node alive', sNodeID );
       break;
     }
   });
   // Starting connection
   _oController.connect( _Zwave.getConfig().sUSBController );
   //
   return new Bluebird( function( fResolve ){
     let _aReadyPromises = [];
     // Initial scan completed
     _oController.on('scan complete', function(){
       _Zwave.debug( 'Initial network scan completed' );
       //_aReadyPromises.push( _Zwave.__updateStructureToDB() );
       Bluebird.all( _aReadyPromises ).then(function(){
         fResolve();
       });
     });
     _Zwave.debug( 'connecting to USB ZWave controller: "%s"', _Zwave.getConfig().sUSBController );
   });
 }

 /**
  * Method used to remember the current HomeID obtained by the controller
  *
  * @method    setHomeID
  * @public
  *
  * @param     {String}		sHomeID			The Home ID which has to be remembered
  *
  * @return	{Void}
  *
  * @example
  *   Zwave.setHomeID( 'foo' );
  */
 setHomeID( sHomeID ){
   this.debug( 'Using Home ID: "%s"...', sHomeID );
   this.__sHomeID = sHomeID;
 }

 /**
  * Method used to pair a Node
  *
  * @method    pair
  * @public
  *
  * @return	{Object} returna a Promise
  *
  * @example
  *   Zwave.pair();
  */
 pair( bSecure ){
   bSecure = bSecure || false;
   let _Zwave = this;
   let _oController = _Zwave.getController();
   let _fHandler = null;
   return new Bluebird(function( fResolve ){
     _fHandler = function( iNodeID ){
       _Zwave.info( 'Paired Node ID: "%s"', iNodeID );
       fResolve( iNodeID );
     };
     _Zwave.info( 'Pairing %s network security...', ( bSecure ? 'WITH' : 'WITHOUT' ) );
     _oController.on('node ready', _fHandler );
     _oController.addNode( bSecure );
   })
     .then( function( sNodeID ){
       _oController.removeListener('node ready', _fHandler);
       let _oNode = _Zwave.getNode( sNodeID );
       return Bluebird.resolve( _oNode );
     })
   ;
 }

 /**
  * Method used to unpair a Node
  *
  * @method    unpair
  * @public
  *
  * @return	{Object} returna a Promise
  *
  * @example
  *   Zwave.unpair();
  */
 unpair(){
   let _Zwave = this;
   let _oController = _Zwave.getController();
   let _fHandler = null;
   return new Bluebird(function( fResolve ){
     _fHandler = function( iNodeID ){
       _Zwave.info( 'Unpaired Node ID: "%s"', iNodeID );
       fResolve( iNodeID );
     };
     _Zwave.info( 'Unpairing...' );
     _oController.on('node removed', _fHandler );
     _oController.removeNode();
   })
     .then( function( sNodeID ){
       _oController.removeListener('node removed', _fHandler);
       let _oNode = _Zwave.getNode( sNodeID );
       _Zwave.removeNode( sNodeID );
       return Bluebird.resolve( _oNode );
     })
   ;
 }

 /**
  * Method used to reset the OpenZWave controller configuration
  *
  * @method    reset
  * @public
  *
  * @param     {Boolean}		bHardReset			A flag which tells the controller to do an hard reset instead of a soft reset
  *
  * @return	{Object} returna a Promise
  *
  * @example
  *   Zwave.reset();
  *   Zwave.reset( true );
  */
 reset( bHardReset ){
   let _Zwave = this;
   let _oController = _Zwave.getController();
   if( bHardReset ){
     _Zwave.info( 'Configuration hard reset' );
     _oController.hardReset();
   } else {
     _Zwave.info( 'Configuration soft reset' );
     _oController.softReset();
   }
   return Promise.resolve();
 }

 /**
  * Method used to set a value on an open Z-Wave value
  *
  * @method    write
  * @public
  *
  * @param     {String/Number}		iNodeIDOrValueID			The node ID or the Value ID
  * @param     {Number}		iClassIDOrValue			The node value class ID or the value to set
  * @param     {Number}		[iInstance]			The node value instance ID
  * @param     {Number}		[iIndex]			The node value index ID
  * @param     {String/Number}		[value]			The value to set
  *
  * @return	{Object} returna a Promise
  *
  * @example
  *   Zwave.write( '2-37-1-0', true );
  *   Zwave.write( 2, 37, 1, 0, true );
  */
 write( iNodeIDOrValueID, iClassIDOrValue, iInstance, iIndex, value ){
   let _Zwave = this;
   let _oController = _Zwave.getController();
   if( typeof iNodeIDOrValueID ==='string' && !iInstance && !iIndex && !value){
     let _aArguments = iNodeIDOrValueID.split('-');
     value = iClassIDOrValue;
     iNodeIDOrValueID = parseInt( _aArguments[ 0 ] );
     iClassIDOrValue = parseInt( _aArguments[ 1 ] );
     iInstance = parseInt( _aArguments[ 2 ] );
     iIndex = parseInt( _aArguments[ 3 ] );
   }
   this.debug( 'setting value "%s" on "%s-%s-%s-%s"', value, iNodeIDOrValueID, iClassIDOrValue, iInstance, iIndex );
   _oController.setValue( iNodeIDOrValueID, iClassIDOrValue, iInstance, iIndex, value );
   return Promise.resolve();
 }

}

module.exports = OpenZWaveEndpoint;
