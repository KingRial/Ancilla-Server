var Ancilla = require('../../../lib/ancilla.node.js');
var Constant = Ancilla.Constant;

/**
* Ancilla Event used to register technology's objects inside the Core
*
* @method    Constant._EVENT_TYPE_REGISTER_OBJECTS
* @public
*
* @return    {Void}
*
* @example
*   Technology.trigger( {sType: Constant._EVENT_TYPE_REGISTER_OBJECTS, aObjects: [ { ... oObject1 ... }, { ... oObject2 ... }, { ... oObject3 ... } ] } );
*/
module.exports = {
  name: Constant._EVENT_TYPE_REGISTER_OBJECTS,
  event: function( oCore, oEvent ) {
// TODO:
    console.error( 'TODO: _EVENT_TYPE_REGISTER_OBJECTS: %j ', oEvent );
  }
}
