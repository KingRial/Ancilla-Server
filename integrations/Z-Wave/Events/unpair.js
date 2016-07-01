"use strict";

/**
* Ancilla Event used to unpair a Node from Z-Wave controller.
*
* @method    unpair
* @public
*
* @return    {Void}
*
* @example
*   Technology.unpair();
*/
module.exports = {
  name: 'unpair',
  event: function( oTechnology, oEvent ) {
    oTechnology.getEndpoint('openzwave').unpair()
      .then( function(){
// TODO: could trigger an answer when the action is completed
        console.error( '---------->TODO Done UNPAIR!' );
      })
    ;
  }
};
