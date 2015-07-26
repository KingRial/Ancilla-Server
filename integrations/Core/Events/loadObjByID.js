var Ancilla = require('../../../lib/ancilla.js');
var Constant = Ancilla.Constant;

/**
* Ancilla Event used by the client to load specific objects by ID.
*
* @method    Constant._EVENT_TYPE_OBJ_LOAD_BY_ID
* @public
*
* @return    {Void}
*
* @example
*   Technology.trigger( {sType: Constant._EVENT_TYPE_OBJ_LOAD_BY_ID, ids: 100 } );
*   Technology.trigger( {sType: Constant._EVENT_TYPE_OBJ_LOAD_BY_ID, ids: [ 100, 101, 102 ] } );
*/
module.exports = {
  name: Constant._EVENT_TYPE_OBJ_LOAD_BY_ID,
  event: function( oCore, oEvent ) {
  }
}
/*
case Constant._EVENT_TYPE_OBJ_LOAD_BY_ID:
  var ids = oEvent.ids;
  _Core.__loadObjectByID( ids )
    .then( function( oRows ){
      oEvent.setToAnswer( { oRows: oRows } );
      // Resolving Main Promise
      fResolve( oEvent );
    })
    .catch( function( iError ){
      // Resolving main promise with error
      fReject( iError );
    })
  ;
  break;
  */
