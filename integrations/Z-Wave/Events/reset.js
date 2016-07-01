"use strict";

/**
* Ancilla Event used to reset Z-Wave controller configuration.
*
* @method    reset
* @public
*
* @return    {Void}
*
* @example
*   Technology.trigger( {sType: 'reset', bHardReset: true } );
*   Technology.trigger( {sType: 'reset', bHardReset: false } );
*/
module.exports = {
  name: 'reset',
  event: function( oTechnology, oEvent ) {
    oTechnology.getEndpoint('openzwave').reset( oEvent.bHardReset )
      .then( function(){
// TODO: could trigger an answer when the action is completed
        console.error( '---------->TODO Done RESET!' );
      })
    ;
  }
};
