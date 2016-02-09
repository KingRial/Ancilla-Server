var Bluebird = require('bluebird');

module.exports = function( breeze, oMetadataStore ) {
  "use strict";
  return new Bluebird( function( fResolve, fReject ){
    var _oEntityType = new breeze.EntityType({
        shortName: 'OAUTH_USERS',
    });
    _oEntityType
      .addProperty( new breeze.DataProperty({
        name: 'id',
        dataType: breeze.DataType.Int32,
        isPartOfKey: true
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'username',
        dataType: breeze.DataType.String
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'password',
        dataType: breeze.DataType.String,
        defaultValue: 0
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
