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
  event: function( oTechnology ) {
    return oTechnology.getEndpoint('openzwave').unpair();
  }
};
