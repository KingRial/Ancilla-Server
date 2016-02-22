var Bluebird = require('bluebird');

module.exports = function( breeze, oMetadataStore ) {
  "use strict";
  return new Bluebird( function( fResolve, fReject ){
    var _oEntityType = new breeze.EntityType({
        shortName: 'OAUTH_CLIENTS',
    });
    _oEntityType
      .addProperty( new breeze.DataProperty({
        name: 'client_id',
        dataType: breeze.DataType.String,
        isPartOfKey: true
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'client_secret',
        dataType: breeze.DataType.String,
        isPartOfKey: true
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'grant_types',
        dataType: breeze.DataType.String,
        defaultValue: null
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'redirect_uri',
        dataType: breeze.DataType.String,
        defaultValue: null
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
