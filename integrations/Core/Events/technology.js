"use strict";

let Constant = require('../../../lib/ancilla.js').Constant;

/**
* Ancilla Event used to handle specific actions over technologies handled by the core.
*
* @method    technology
* @public
*
* @return    {Void}
*
* @example
*   Technology.trigger( {sType: 'technology', sTechnologyID: 'fake-tech', sAction: 'run' } );
*   Technology.trigger( {sType: 'technology', sTechnologyID: 'fake-tech', sAction: 'stop' } );
*/
module.exports = {
  name: 'technology',
  event: function( oCore, oEvent ) {
    let _oPromiseDone = null;
    let _sTechnologyID = oEvent.sTechnologyID;
    let _sAction = oEvent.sAction;
    switch( _sAction ){
      case 'start':
        _oPromiseDone = oCore.startTechnology( _sTechnologyID );
      break;
      /*
//TODO stop
      case 'stop':
        _oPromiseDone = oCore.stopTechnology( oEvent.sTechnology );
      break;
//TODO restart
      case 'restart':
        _oPromiseDone = oCore.stopTechnology( oEvent.sTechnology )
          .then( function(){
            return  oCore.startTechnology( _sTechnologyID );
          })
        ;
      break;
      */
      default:
        oCore.error( 'Unknown operation "%s" over technology "%s" for Ancilla technology event', _sAction, _sTechnologyID );
      break;
    }
    return _oPromiseDone;
  }
};
