var Ancilla = require('../../../lib/ancilla.node.js');
var Constant = Ancilla.Constant;

/**
* Ancilla Event used to observe changes over objects inside the Core.
*
* @method    Constant._EVENT_TYPE_OBSERVE_OBJECTS
* @public
*
* @return    {Void}
*
* @example
*   Technology.trigger( {sType: Constant._EVENT_TYPE_OBSERVE_OBJECTS, ids: 100 } );
*   Technology.trigger( {sType: Constant._EVENT_TYPE_OBSERVE_OBJECTS, ids: [ 100, 101, 102 ] } );
*/
module.exports = {
  name: Constant._EVENT_TYPE_OBSERVE_OBJECTS,
  event: function( oCore, oEvent ) {
// TODO:
    console.error( 'TODO: _EVENT_TYPE_OBSERVE_OBJECTS: %j ', oEvent );
  }
}
