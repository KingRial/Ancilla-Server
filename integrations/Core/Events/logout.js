var Ancilla = require('../../../lib/ancilla.node.js');
var Constant = Ancilla.Constant;

/**
* Ancilla Event used to login
*
* @method    Constant._EVENT_TYPE_LOGOUT
* @public
*
* @return    {Void}
*
* @example
*   Technology.trigger( {sType: Constant._EVENT_TYPE_LOGOUT } );
*/
module.exports = {
  name: Constant._EVENT_TYPE_LOGOUT,
  event: function( oCore, oEvent ) {
  }
}
/*
      case Constant._EVENT_TYPE_LOGOUT:
        _Core.__technologyLogOut( _sTechnologyID )
          .then(function(){
            _Core.info('Technology "%s" logged out...', _sTechnologyID );
            // Sending answer
            oEvent.setToAnswer();
            // Resolving main promise
            fResolve( oEvent );
          })
          .catch(function( iError ){
            fReject( iError );
          })
        ;
      break;
*/
