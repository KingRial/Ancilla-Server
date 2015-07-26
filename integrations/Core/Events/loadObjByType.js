var Ancilla = require('../../../lib/ancilla.js');
var Constant = Ancilla.Constant;

/**
* Ancilla Event used by the client to load specific objects by type.
*
* @method    Constant._EVENT_TYPE_OBJ_LOAD_BY_TYPE
* @public
*
* @return    {Void}
*
* @example
*   Technology.trigger( {sType: Constant._EVENT_TYPE_OBJ_LOAD_BY_TYPE, types: 'TECHNOLOGY' } );
*   Technology.trigger( {sType: Constant._EVENT_TYPE_OBJ_LOAD_BY_TYPE, types: [ 'TECHNOLOGY', 'GROUP' ] } );
*/
module.exports = {
  name: Constant._EVENT_TYPE_OBJ_LOAD_BY_TYPE,
  event: function( oCore, oEvent ) {
  }
}
/*
      case Constant._EVENT_TYPE_OBJ_LOAD_BY_TYPE:
        var types = oEvent.types;
        _Core.__loadObjectByType( types )
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
