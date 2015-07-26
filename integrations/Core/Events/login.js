var Ancilla = require('../../../lib/ancilla.js');
var Constant = Ancilla.Constant;

/**
* Ancilla Event used to login
*
* @method    Constant._EVENT_TYPE_LOGIN
* @public
*
* @return    {Void}
*
* @example
*   Technology.trigger( {sType: Constant._EVENT_TYPE_LOGIN } );
*/
module.exports = {
  name: Constant._EVENT_TYPE_LOGIN,
  event: function( oCore, oEvent ) {
  }
}
/*
      case Constant._EVENT_TYPE_LOGIN:
        _Core.__selectTableRows( 'OBJECT', _Core.__DBget().expr()
            .and( 'NAME = ?', oEvent.sUsername )
            .and( 'TYPE = ?', Constant._OBJECT_TYPE_USER )
          )
          .then( function( oRows ){
//TODO: trace failed/successfull login attempts
            var _oUser = oRows[ 0 ];
            if( oRows.length==0 || oRows.length > 1 || oEvent.sPassword != _oUser[ 'VALUE' ]  ){
              _Core.error( ( ( oRows.length==0 || oRows.length > 1 ) ? 'found none or more than a single user with username as "%s"' : 'username "%s" used wrong password "%s"' ), oEvent.sUsername, oEvent.sPassword );
              // Sending answer
              oEvent.setToAnswer( Constant._ERROR_FAILED_LOGIN );
              // Resolving main promise
              fResolve( oEvent );
            } else {
              _Core.__technologyLogIn( _sTechnologyID, _oUser[ 'ID' ] )
                .then(function(){
                  _Core.info('Technology "%s" is now logged as "%s"', _sTechnologyID, oEvent.sUsername );
                  // Sending answer
                  oEvent.setToAnswer({ oUser: _oUser });
                  // Resolving main promise
                  fResolve( oEvent );
                })
                .catch(function( iError ){
                  fReject( iError );
                })
              ;
            }
          })
          .catch(function( iError ){
            fReject( iError );
          })
        ;
      break;
      */
