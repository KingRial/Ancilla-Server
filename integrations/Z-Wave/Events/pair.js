"use strict";

/**
* Ancilla Event used to pair a Node with Z-Wave controller.
*
* @method    pair
* @public
*
* @return    {Void}
*
* @example
*   Technology.pair();
*/
module.exports = {
  name: 'pair',
  event: function( oTechnology, oEvent ) {
    oTechnology.getEndpoint('openzwave').pair()
      .then( function(){
// TODO: could trigger an answer when the action is completed
        console.error( '---------->TODO Done PAIR!' );
      })
    ;
  }
};
