var Ancilla = require('../../../lib/ancilla.node.js');
var Constant = Ancilla.Constant;

/**
* Ancilla Event used by the client to create specific objects/relations/widgets.
*
* @method    Constant._EVENT_TYPE_CREATE
* @public
*
* @return    {Void}
*
* @example
*   Technology.trigger( {sType: Constant._EVENT_TYPE_CREATE, aObjs: [ { ... Object 1 ... }, { ... Object 2 ... } ] );
*   Technology.trigger( {sType: Constant._EVENT_TYPE_CREATE, aRelations: [ { ... Relation 1 ... }, { ... Relation 2 ... } ] );
*   Technology.trigger( {sType: Constant._EVENT_TYPE_CREATE, aWidgets: [ { ... Widget 1 ... }, { ... Widget 2 ... } ] );
*   Technology.trigger( {sType: Constant._EVENT_TYPE_CREATE, aObjs: [ { ... Object 1 ... }, { ... Object 2 ... } ], aRelations: [ { ... Relation 1 ... }, { ... Relation 2 ... } ], aWidgets: [ { ... Widget 1 ... }, { ... Widget 2 ... } ] );
*/
module.exports = {
  name: Constant._EVENT_TYPE_CREATE,
  event: function( oCore, oEvent ) {
  }
}
/*
      case Constant._EVENT_TYPE_CREATE:
        var _aCreatePromises = [];
        if( oEvent.aObjs ){
          _aCreatePromises.push( _Core.__insertTableRows( 'OBJECT', oEvent.aObjs ) );
        }
        if( oEvent.aRelations ){
          _aCreatePromises.push( _Core.__insertTableRows( 'RELATION', oEvent.aRelations ) );
        }
        if( oEvent.aWidgets ){
          _aCreatePromises.push( _Core.__insertTableRows( 'WIDGET', oEvent.aWidgets ) );
        }
        Promise.all( _aCreatePromises )
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
