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
*   Technology.trigger( {sType: 'pair', bSecure: true } );
*   Technology.trigger( {sType: 'pair', bSecure: false } );
*/
module.exports = {
  name: 'pair',
  event: function( oTechnology, oEvent ) {
    return oTechnology.getEndpoint('openzwave').pair( oEvent.bSecure );
  }
};
