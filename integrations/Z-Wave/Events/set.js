"use strict";

/**
* Ancilla Event used to pair a Node with Z-Wave controller.
*
* @method    set
* @public
*
* @return    {Void}
*
* @example
*   Technology.pair();
*/
module.exports = {
  name: 'set',
  event: function( oTechnology, oEvent ) {
//TODO: event should be able to handle parameters differently!
    oTechnology.set( oEvent.msp, oEvent.value )
      .then( function(){
// TODO: could trigger an answer when the action is completed
        console.error( '---------->TODO Done SET!' );
      })
    ;
  }
};