var Ancilla = require('../../../lib/ancilla.js');
var Constant = Ancilla.Constant;

/**
* Ancilla Event used by the client to update specific objects/relations/widgets.
*
* @method    Constant._EVENT_TYPE_UPDATE
* @public
*
* @return    {Void}
*
* @example
*   Technology.trigger( {sType: Constant._EVENT_TYPE_UPDATE, aObjs: [ { ... Object 1 ... }, { ... Object 2 ... } ] );
*   Technology.trigger( {sType: Constant._EVENT_TYPE_UPDATE, aRelations: [ { ... Relation 1 ... }, { ... Relation 2 ... } ] );
*   Technology.trigger( {sType: Constant._EVENT_TYPE_UPDATE, aWidgets: [ { ... Widget 1 ... }, { ... Widget 2 ... } ] );
*   Technology.trigger( {sType: Constant._EVENT_TYPE_UPDATE, aObjs: [ { ... Object 1 ... }, { ... Object 2 ... } ], aRelations: [ { ... Relation 1 ... }, { ... Relation 2 ... } ], aWidgets: [ { ... Widget 1 ... }, { ... Widget 2 ... } ] );
*/
module.exports = {
  name: Constant._EVENT_TYPE_UPDATE,
  event: function( oCore, oEvent ) {
  }
}
/*
      case Constant._EVENT_TYPE_UPDATE:
//TODO: handle events linked to obj or relation!
        var _aUpdatePromises = [];
        if( oEvent.aObjs ){
          for( var _iIndex in oEvent.aObjs ){
            var _oCurrent = oEvent.aObjs[ _iIndex ];
            _aUpdatePromises.push( _Core.__updateTableRows( 'OBJECT', _oCurrent, _Core.__DBget().expr().and( 'ID = ?', _oCurrent.id ), true ) );
          }
        }
        if( oEvent.aRelations ){
          for( var _iIndex in oEvent.aRelations ){
            var _oCurrent = oEvent.aRelations[ _iIndex ];
            _aUpdatePromises.push( _Core.__updateTableRows( 'RELATION', _oCurrent, _Core.__DBget().expr().and( 'ID = ?', _oCurrent.id ), true ) );
          }
        }
        if( oEvent.aWidgets ){
          for( var _iIndex in oEvent.aWidgets ){
            var _oCurrent = oEvent.aWidgets[ _iIndex ];
            _aUpdatePromises.push( _Core.__updateTableRows( 'WIDGET', _oCurrent, _Core.__DBget().expr().and( 'ID = ?', _oCurrent.id ), true ) );
          }
        }
        Promise.all( _aUpdatePromises )
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
