var Ancilla = require('../../../lib/ancilla.node.js');
var Constant = Ancilla.Constant;

/**
* Ancilla Event used by the client to update specific objects/relations/widgets.
*
* @method    Constant._EVENT_TYPE_DELETE
* @public
*
* @return    {Void}
*
* @example
*   Technology.trigger( {sType: Constant._EVENT_TYPE_DELETE, aObjIDs: [ iID1, iID2, ... ] );
*   Technology.trigger( {sType: Constant._EVENT_TYPE_DELETE, aRelationIDs: [ iID1, iID2, ... ] );
*   Technology.trigger( {sType: Constant._EVENT_TYPE_DELETE, aWidgetIDs: [ iID1, iID2, ... ] );
*   Technology.trigger( {sType: Constant._EVENT_TYPE_DELETE, aObjIDs: [ iID1, iID2, ... ], aRelationIDs: [ iID1, iID2, ... ], aWidgetIDs: [ iID1, iID2, ... ] );
*/
module.exports = {
  name: Constant._EVENT_TYPE_DELETE,
  event: function( oCore, oEvent ) {
  }
}
/*
      case Constant._EVENT_TYPE_DELETE:
        var _aDeletePromises = [];
        if( oEvent.aObjIDs ){
          _aDeletePromises.push( _Core.__deleteTableRows( 'OBJECT', _oCurrent, _Core.__DBget().expr().and( 'ID IN ?', oEvent.aObjIDs ), true ) );
        }
        if( oEvent.aRelationIDs ){
          _aDeletePromises.push( _Core.__deleteTableRows( 'RELATION', _oCurrent, _Core.__DBget().expr().and( 'ID IN ?', oEvent.aRelationIDs ), true ) );
        }
        if( oEvent.aWidgetIDs ){
          _aDeletePromises.push( _Core.__deleteTableRows( 'WIDGET', _oCurrent, _Core.__DBget().expr().and( 'ID IN ?', oEvent.aWidgetIDs ), true ) );
        }
        Promise.all( _aDeletePromises )
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
