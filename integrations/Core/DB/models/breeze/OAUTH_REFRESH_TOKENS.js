var Bluebird = require('bluebird');

module.exports = function( breeze, oMetadataStore ) {
  "use strict";
  return new Bluebird( function( fResolve, fReject ){
    var _oEntityType = new breeze.EntityType({
        shortName: 'OAUTH_REFRESH_TOKENS',
    });
    _oEntityType
      .addProperty( new breeze.DataProperty({
        name: 'refresh_token',
        dataType: breeze.DataType.String,
        isPartOfKey: true
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'client_id',
        dataType: breeze.DataType.String
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'user_id',
        dataType: breeze.DataType.Int32,
        defaultValue: 0
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'expires',
        dataType: breeze.DataType.DateTime
      }) )
    ;
    try{
      oMetadataStore.addEntityType( _oEntityType );
      fResolve();
    } catch(e){
      fReject( e );
    }
  });
};
