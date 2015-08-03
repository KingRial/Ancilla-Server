var Bluebird = require('bluebird');

module.exports = function( breeze, oMetadataStore ) {
  "use strict";
  return new Bluebird( function( fResolve, fReject ){
    var _oEntityType = new breeze.EntityType({
        shortName: 'TECHNOLOGY_TYPE',
        //namespace: 'myAppNamespace'
    });
    _oEntityType
      .addProperty( new breeze.DataProperty({
        name: 'id',
        isPartOfKey: true,
        dataType: breeze.DataType.Int32
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'type',
        dataType: breeze.DataType.String
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'language',
        dataType: breeze.DataType.String
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'path',
        dataType: breeze.DataType.String
      }) )
      //timestamps ?
    ;
    try{
      oMetadataStore.addEntityType( _oEntityType );
      fResolve();
    } catch(e){
      fReject( e );
    }
  });
};
