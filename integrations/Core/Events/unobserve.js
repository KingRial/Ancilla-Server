var Ancilla = require('../../../lib/ancilla.js');
var Constant = Ancilla.Constant;

/**
* Ancilla Event used to unobserve changes over objects inside the Core, previously observed.
*
* @method    Constant._EVENT_TYPE_UNOBSERVER_OBJECTS
* @public
*
* @return    {Void}
*
* @example
*   Technology.trigger( {sType: Constant._EVENT_TYPE_UNOBSERVER_OBJECTS, ids: 100 } );
*   Technology.trigger( {sType: Constant._EVENT_TYPE_UNOBSERVER_OBJECTS, ids: [ 100, 101, 102 ] } );
*/
module.exports = {
  name: Constant._EVENT_TYPE_UNOBSERVER_OBJECTS,
  event: function( oCore, oEvent ) {
// TODO:
    console.error( 'TODO: _EVENT_TYPE_UNOBSERVER_OBJECTS: %j ', oEvent );
  }
}
