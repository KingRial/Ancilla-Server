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
    return oTechnology.getEndpoint('openzwave').reset( oEvent.bHardReset );
  }
};
