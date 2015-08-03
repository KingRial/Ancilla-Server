var Ancilla = require('../../../lib/ancilla.js');
var Constant = Ancilla.Constant;

var Bluebird = require('bluebird');

/**
* Ancilla Event used to introduce a new technology to the Core
*
* @method    Constant._EVENT_TYPE_INTRODUCE
* @public
*
* @return    {Void}
*
* @example
*   Technology.trigger( {sType: Constant._EVENT_TYPE_INTRODUCE } );
*/
module.exports = {
  name: Constant._EVENT_TYPE_INTRODUCE,
  event: function( oCore, oEvent ) {
    "use strict";
    return new Bluebird( function( fResolve, fReject ){
      var _sTechnologyID = oEvent.getFrom();
    	var _sEventType = oEvent.getType();
      // Using technology ID to get the current connected socket
      var _oConnectedSocket = oCore.getConnectedSocket( _sTechnologyID );
      if( _oConnectedSocket ){
        oCore.error( 'already knows a technology "%s"... ignoring introduction! Use a different ID to "introduce" a new Technology.', _sTechnologyID );
        fReject( Constant._ERROR_TECHNOLOGY_ALREADY_INTRODUCED );
      } else {
        // Setting socket ID to Technology ID
        oCore.setConnectedSocketID( _oGateway, _oGatewayEndpoint, _iSocketIndex, _sTechnologyID );
        // If the introduced technology is a web client, creating the technolgy if needed
        var _bIsWebTechnology = ( _oGatewayEndpoint.getID() == 'web'  ? true : false );
        // Collecting data on current used user for the current technology
        oCore.__technologyGetUser( _sTechnologyID )
          // Creating missing web technology if needed
          .then( _bIsWebTechnology ?
              oCore.__getTechnology( _sTechnologyID, true ).catch(function(oError){fReject( oError );}) :
              Promise.resolve()
            )
          // Handling latest actions
          .then( function( oUser ){
            oCore.info( 'knows the "%s" technology "%s" can be reached logged as "%s".', ( _bIsWebTechnology ? 'web' : 'generic' ), _sTechnologyID, ( oUser ? oUser[ 'NAME' ] : 'noone' ) );
            oEvent.setToAnswer( { oUser: oUser } );
            // Resolving Main Promise
            fResolve( oEvent );
          })
          .catch( function( iError ){
            oCore.error( '[ Error "%s" ] on introducing technology "%s".', iError, _sTechnologyID );
            fReject( iError );
          })
        ;
      }
    });
  }
};
