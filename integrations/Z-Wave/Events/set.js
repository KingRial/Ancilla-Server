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
    return oTechnology.getEndpoint('openzwave').set( oEvent.msp, oEvent.value );
  }
};
