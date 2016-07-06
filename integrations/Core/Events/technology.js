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
// TODO:
    let _sTechnologyID = oEvent.sTechnologyID;
    let _sAction = oEvent.sAction;
    switch( _sAction ){
      case 'start':
        oCore.startTechnology( _sTechnologyID )
          .then( function(){
            oCore.trigger( oEvent.toAnswer( Constant._NO_ERROR ) );
          })
          .catch( function(){
//TODO return an error from startTechnology
            oCore.trigger( oEvent.toAnswer( Constant._ERROR_TECHNOLOGY_UNKNOWN ) );
          })
        ;
      break;
      /*
//TODO stop
      case 'stop':
        oCore.startTechnology( oEvent.sTechnology );
      break;
//TODO restart
      */
      default:
        oCore.error( 'Unknown operation "%s" over technology "%s" for Ancilla technology event', _sAction, _sTechnologyID );
      break;
    }
// TODO: could trigger an answer when the action is completed
  }
};
