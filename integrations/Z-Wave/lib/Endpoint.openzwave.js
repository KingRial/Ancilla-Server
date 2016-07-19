"use strict";

let OZW = require('openzwave-shared');
let _ = require( 'lodash' );
let Bluebird = require( 'bluebird' );

let ZWaveNode = require('./Node.js');
let Endpoint = require('../../../lib/ancilla.js').Endpoint;

/**
 * A generic class to access openzwave library.
 *
 * The endpoint will fire also the following custom events:
 *  - "controller ready": when the controller is ready
 *  - "controller error": when there is some kind of problems with the controller
 *  - "controller pairing": when the pairing procedure has been started
 *  - "controller unpairing": when the unpairing procedure has been started
 *  - "node ready": when the node signals it is "ready", "awake" or "alive"
 *  - "node sleep": when the node signals it is "sleeping"
 *  - "node timeout": when the "timeout" or "nop" has been fired to contact a node
 *  - "node dead": when the "dead" has been fired while trying to contac a node
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
      aOfferedEvents: [ 'controller ready', 'controller error', 'controller pairing', 'controller unpairing', 'node ready', 'node sleep', 'node timeout', 'node dead' ]
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
  let _oOptions = _.extend({
    Logging: false,
    ConsoleOutput: false
  }, ( this.getConfig().sNetworkKey ? { NetworkKey: this.getConfig().sNetworkKey } : {} ));
  let _oController = new OZW( _oOptions );
   this.setController( _oController );
   let _Endpoint = this;
   // Driver events
   _oController.on('driver ready', function( sHomeID ){
     _Endpoint.setHomeID( sHomeID );
     _Endpoint.debug( 'Starting network scan...' );
     _Endpoint.emit('controller ready');
   });
   _oController.on('driver failed', function( sHomeID ){
     _Endpoint.setHomeID( sHomeID );
     _Endpoint.error( 'Failed to start controller driver...' );
     _Endpoint.emit('controller error');
   });
   // Node events
   _oController.on('node available', function( sNodeID, oNodeInfo ){
     _Endpoint.debug( 'Node ID: "%s" -> Available', sNodeID );
     oNodeInfo.node_id = sNodeID;
     _Endpoint.emit( 'node available', oNodeInfo ); // Partial Infos
   });
   _oController.on('node ready', function( sNodeID, oNodeInfo ){
    _Endpoint.debug( 'Node ID: "%s" -> Ready', sNodeID );
    oNodeInfo.node_id = sNodeID;
    _Endpoint.addNode( oNodeInfo );
    let _oNode = _Endpoint.getNode( sNodeID );
    _oNode.setReady();
    _Endpoint.emit( 'node ready', _oNode ); // All correct Infos
   });
   _oController.on('node added', function( sNodeID ){
     _Endpoint.debug( 'Node ID: "%s" -> Added', sNodeID );
   } );
   _oController.on('node removed', function( sNodeID ){
     _Endpoint.debug( 'Node ID: "%s" -> Removed', sNodeID );
   } );
   _oController.on('node naming', function( sNodeID, oNodeInfo ){
     _Endpoint.debug( 'Node ID: "%s" -> Naming', sNodeID );
     _Endpoint.silly( 'Detailed node just named:', oNodeInfo );
   });
   _oController.on('node event', function( sNodeID, oData ) {
     _Endpoint.debug( 'Node ID: "%s" -> Fired event:', sNodeID, oData );
   });
   // Value events
   _oController.on('value added', function( sNodeID, sClassID, oValue ){
     _Endpoint.addValue( oValue );
   });
   _oController.on('value changed', function( sNodeID, iClassID, oValue ){
     _Endpoint.debug( 'node ID: "%s" -> value ID: "%s" changed value to:', sNodeID, oValue.value_id, oValue.value );
     // When the node has fired "timeout" and returns active, nothing tells it's ready; we are using "value changed" to set the correct status again
     let _oNode = _Endpoint.getNode( sNodeID );
     if( _oNode && _oNode.isTimeout() ){
       _Endpoint.debug('Node ID: "%s" -> Ready ( there was a previous timeout )', sNodeID );
       _oNode.setReady();
       _Endpoint.emit( 'node ready', _oNode );
     }
     // Emitting data
     let _oValue = _Endpoint.getNode( oValue.node_id ).getValue( oValue.value_id );
     _oValue.set( oValue.value );
     _Endpoint.emit( 'data', _oValue, sNodeID );
   });
   _oController.on('value refresh', function( sNodeID, commandclass, iValueID ){
     _Endpoint.debug( 'node ID: "%s" -> value refresh:', sNodeID, commandclass, iValueID );
   });
   _oController.on('value removed', function( sNodeID, commandclass, iValueID ){
     _Endpoint.debug( 'node ID: "%s" -> value removed:', sNodeID, commandclass, iValueID );
   });
   // Polling events
   _oController.on('polling enabled', function( sNodeID ){
     _Endpoint.debug( 'node ID: "%s" -> Polling enabled', sNodeID );
   });
   _oController.on('polling disabled', function( sNodeID ){
     _Endpoint.debug( 'node ID: "%s" -> Polling disabled:', sNodeID );
   });
   // Scene events
   _oController.on('scene event', function( sNodeID, iSceneID ){
     _Endpoint.debug( 'node ID: "%s" -> Fired scene ID: "%s"', sNodeID, iSceneID );
   });
   // Controller events
   _oController.on('controller command', function(sNodeID, iCtrlState, iCtrlError, sHelpMsg ){
     _Endpoint.debug( 'node ID: "%s" -> controller command:', sNodeID, iCtrlState, iCtrlError, sHelpMsg );
   });
   // Notification event
   _oController.on('notification', function( sNodeID, iNotify ) {
     let _oNode = null;
     _oNode = _Endpoint.getNode( sNodeID );
     switch( iNotify ){
       case 0:
         _Endpoint.debug('Node ID: "%s" -> Message complete', sNodeID );
       break;
       case 1:
         _Endpoint.debug('Node ID: "%s" -> Timeout', sNodeID );
         if( _oNode ){
           _oNode.setTimeout();
         }
         _Endpoint.emit( 'node timeout', _oNode );
       break;
       case 2:
         _Endpoint.debug('Node ID: "%s" -> Nop', sNodeID );
         if( _oNode ){
          _oNode.setNop();
         }
         _Endpoint.emit( 'node timeout', _oNode );
       break;
       case 3:
         _Endpoint.debug('Node ID: "%s" -> Awake', sNodeID );
         if( _oNode ){
          _oNode.setAwake();
         }
         _Endpoint.emit( 'node ready', _oNode );
       break;
       case 4:
         _Endpoint.debug('Node ID: "%s" -> Sleep', sNodeID );
         if( _oNode ){
          _oNode.setSleep();
         }
         _Endpoint.emit( 'node sleep', _oNode );
       break;
       case 5:
         _Endpoint.debug('Node ID: "%s" -> Dead', sNodeID );
         if( _oNode ){
           _oNode.setDead();
           _Endpoint.emit( 'node dead', _oNode );
         }
       break;
       case 6:
         _Endpoint.debug('Node ID: "%s" -> Alive', sNodeID );
         if( _oNode ){
           _oNode.setAlive();
           _Endpoint.emit( 'node ready', _oNode );
         }
       break;
     }
   });
   // Starting connection
   _oController.connect( _Endpoint.getConfig().sUSBController );
   //
   return new Bluebird( function( fResolve ){
     //let _aReadyPromises = [];
     // Initial scan completed
     _oController.on('scan complete', function(){
       _Endpoint.info( 'Initial network scan completed' );
       //_aReadyPromises.push( _Endpoint.__updateStructureToDB() );
       //Bluebird.all( _aReadyPromises ).then(function(){
         fResolve();
       //});
     });
     _Endpoint.debug( 'connecting to USB ZWave controller: "%s"', _Endpoint.getConfig().sUSBController );
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


 	removeNode( iNodeID ){
 		delete this.__oNodes[ iNodeID ];
 	}

 	getNode( iID ){
 		return this.__oNodes[ iID ];
 	}

 	getNodes(){
 		return this.__oNodes;
 	}

  addNode( oNodeInfo ){
		let _Endpoint = this;
		let _oNode = this.getNode( oNodeInfo.node_id );
		_oNode = ( _oNode ? _oNode : new ZWaveNode() );
		_oNode.update({
			iID: oNodeInfo.node_id,
			sName: oNodeInfo.name,
      iProductID: oNodeInfo.productid,
      sProduct: oNodeInfo.product,
      iProductType: oNodeInfo.producttype,
      sManufacturer: oNodeInfo.manufacturer,
      iManufacturerID: oNodeInfo.manufacturerid,
			sType: oNodeInfo.type,
			sLocality: oNodeInfo.loc
		});
		_Endpoint.__oNodes[ oNodeInfo.node_id ] = _oNode;
		_Endpoint.debug( 'Node ID: "%s" -> Discovered', _oNode.getID() );
    _Endpoint.silly( 'Detailed node just discovered:', _oNode );
		/*
		if( _Endpoint.isReady() ){
			// TODO: viene scatenato anche quando si "risveglia" il device; quindi bisogna lanciare questa operazione solo se si sta facendo pair
			_Endpoint.__updateStructureToDB( oNodeInfo );
		}
		*/
	}

	addValue( oValue ){
		let _Endpoint = this;
		let _iNodeID = oValue.node_id;
		let _oNode = _Endpoint.getNode( _iNodeID );
		if( !_oNode ){
			_Endpoint.addNode({
				node_id: _iNodeID
			});
			_oNode = _Endpoint.getNode( _iNodeID );
		}
		let _oValue = _oNode.addValue({
      sValueID: oValue.value_id,
      iNodeID: oValue.node_id,
      iClassID: oValue.class_id,
      sType: oValue.type,
      sGenre: oValue.genre,
      iInstance: oValue.instance,
      iIndex: oValue.index,
      sLabel: oValue.label,
      sUnits: oValue.unit,
      sHelp: oValue.help,
      bReadOnly: oValue.read_only,
      bWriteOnly: oValue.write_only,
      bIsPolled: oValue.is_pollet,
      fMin: oValue.min,
      fMax: oValue.max,
      value: oValue.value
		});
		_Endpoint.debug( 'Node ID: "%s" -> Discovered value: "%s"', _oValue.getNodeID(), _oValue.getID() );
    _Endpoint.silly( 'Detailed value just discovered:', _oValue );
	}

  __setCurrentCommand( fReject ){
    if( this.__fRejectCurrentCommand ){
      this.warn( 'Previous controller command already in progress; stopping it...' );
      this.__fRejectCurrentCommand();
    }
    this.__fRejectCurrentCommand = fReject;
  }

  __clearCurrentCommand(){
    this.__fRejectCurrentCommand = null;
  }

 /**
  * Method used to pair a Node
  *
  * @method    pair
  * @public
  *
  * @param     {Boolean}		bSecure		If true, the pair procedure will use the secure connection
  *
  * @return	{Object} returna a Promise
  *
  * @example
  *   Endpoint.pair();
  */
 pair( bSecure ){
   bSecure = bSecure || false;
   let _Endpoint = this;
   let _oController = _Endpoint.getController();
   let _fHandler = null;
   return this.cancel()
    .then( function(){
      return new Bluebird(function( fResolve, fReject ){
        _Endpoint.__setCurrentCommand( fReject );
        _fHandler = function( iNodeID ){
          _Endpoint.info( 'Paired Node ID: "%s"', iNodeID );
          fResolve( iNodeID );
        };
        _Endpoint.info( 'Pairing %s network security...', ( bSecure ? 'WITH' : 'WITHOUT' ) );
      //TODO: should use "once" but the controller's library doesn't offer such method...
        _oController.on('node ready', _fHandler );
        _oController.addNode( bSecure );
      })
        .then( function( sNodeID ){
          _Endpoint.__clearCurrentCommand();
          _oController.removeListener('node ready', _fHandler);
          let _oNode = _Endpoint.getNode( sNodeID );
          return Bluebird.resolve( _oNode );
        })
      ;
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
  *   Endpoint.unpair();
  */
 unpair(){
   let _Endpoint = this;
   let _oController = _Endpoint.getController();
   let _fHandler = null;
   return this.cancel()
    .then( function(){
       return new Bluebird(function( fResolve, fReject ){
         _Endpoint.__setCurrentCommand( fReject );
         _fHandler = function( iNodeID ){
           _Endpoint.info( 'Unpaired Node ID: "%s"', iNodeID );
           fResolve( iNodeID );
         };
         _Endpoint.info( 'Unpairing...' );
    //TODO: should use "once" but the controller's library doesn't offer such method...
         _oController.on('node removed', _fHandler );
         _oController.removeNode();
       })
         .then( function( sNodeID ){
           _oController.removeListener('node removed', _fHandler);
           _Endpoint.__clearCurrentCommand();
           let _oNode = _Endpoint.getNode( sNodeID );
           _Endpoint.removeNode( sNodeID );
           return Bluebird.resolve( _oNode );
         })
       ;
     })
   ;
 }

 /**
  * Method used to cancel a Z-Wave controller command in progress
  *
  * @method    cancel
  * @public
  *
  * @return	{Object} returna a Promise
  *
  * @example
  *   Endpoint.cancel();
  */
 cancel(){
   let _Endpoint = this;
   let _oController = _Endpoint.getController();
   _Endpoint.__setCurrentCommand( null );
   _oController.cancelControllerCommand();
   _Endpoint.info( 'Cleared any controller command in progress...' );
   return Promise.resolve();
 }

 /**
  * Method used to reset the OpenZWave controller configuration
  *
  * @method    reset
  * @public
  *
  * @param     {Boolean}		bHardReset		If true, will start a destructive reset clearing all configuration; otherwise will justs reset the chip
  *
  * @return	{Object} returna a Promise
  *
  * @example
  *   Endpoint.reset();
  *   Endpoint.reset( true );
  */
 reset( bHardReset ){
   let _Endpoint = this;
   let _oController = _Endpoint.getController();
   if( bHardReset ){
     _Endpoint.info( 'Configuration hard reset' );
     _oController.hardReset();
   } else {
     _Endpoint.info( 'Configuration soft reset' );
     _oController.softReset();
   }
   return Promise.resolve();
 }

 /**
  * Method used to set a value on an open Z-Wave node's value
  *
  * @method    set
  * @public
  *
  * @param     {String/Number}		iNodeIDOrValueID			The node ID or the Value ID
  * @param     {String/Number}		iClassIDOrValue			The node value class ID or the value to set
  * @param     {Number}		[iInstance]			The node value instance ID
  * @param     {Number}		[iIndex]			The node value index ID
  * @param     {String/Number}		[value]			The value to set
  *
  * @return	{Object} returna a Promise
  *
  * @example
  *   Endpoint.set( '2-37-1-0', true );
  *   Endpoint.set( 2, 37, 1, 0, true );
  */
 set( iNodeIDOrValueID, iClassIDOrValue, iInstance, iIndex, value ){
   let _Endpoint = this;
   let _oController = _Endpoint.getController();
   if( typeof iNodeIDOrValueID ==='string' && !iInstance && !iIndex && !value){
     let _aArguments = iNodeIDOrValueID.split('-');
     value = iClassIDOrValue;
     iNodeIDOrValueID = parseInt( _aArguments[ 0 ] );
     iClassIDOrValue = parseInt( _aArguments[ 1 ] );
     iInstance = parseInt( _aArguments[ 2 ] );
     iIndex = parseInt( _aArguments[ 3 ] );
   }
// TODO: sanitize value from node's value's type ( if it's numeric/boolean it must be converted from string to number/ boolean )
   this.debug( 'setting value "%s" on "%s-%s-%s-%s"', value, iNodeIDOrValueID, iClassIDOrValue, iInstance, iIndex );
   _oController.setValue( iNodeIDOrValueID, iClassIDOrValue, iInstance, iIndex, value );
   return Promise.resolve();
 }

 /**
  * Method used to heal a node or the network
  *
  * @method    heal
  * @public
  *
  * @param     {Number}		[iNodeID]			The node ID to heal; if missing the network will be healed
  *
  * @return	{Object} returna a Promise
  *
  * @example
  *   Endpoint.heal();
  *   Endpoint.heal( 1 );
  */
 heal( iNodeID ){
  if( iNodeID ){
    this.info('Healing node "%s"...', iNodeID);
    this.getController().healNetworkNode( iNodeID ); // TODO: doReturnRoutes parameter ? ( https://github.com/OpenZWave/node-openzwave-shared/blob/master/README-api.md )
  } else {
    this.info('Healing network...');
    this.healNetwork().healNetworkNode();
  }
  return Bluebird.promise();
 }

 disconnect( sUSBController ){
   sUSBController = sUSBController || this.getConfig().sUSBController;
   this.info( 'Disconnecting from controller "%s"...', sUSBController );
   this.getController().disconnect( sUSBController );
   return Bluebird.resolve();
 }

 onDestroy(){
   let _Endpoint = this;
   let _oController = _Endpoint.getController();
   return super.onDestroy()
     .then( function(){
      if( _oController ){ // Checking if controller has been already declared
        return _Endpoint.cancel(); // This way we are sure we leave the controller into the correct state
      } else {
        return Bluebird.resolve();
      }
    })
     .then( function(){
       if( _oController ){ // Checking if controller has been already declared
         return _Endpoint.disconnect();
       } else {
         return Bluebird.resolve();
      }
     })
   ;
 }

}

module.exports = OpenZWaveEndpoint;
