var Bluebird = require('bluebird');

module.exports = function( breeze, oMetadataStore ) {
  "use strict";
  return new Bluebird( function( fResolve, fReject ){
    var _oEntityType = new breeze.EntityType({
        shortName: 'WIDGET',
        //namespace: 'myAppNamespace'
    });
    _oEntityType
      .addProperty( new breeze.DataProperty({
        name: 'id',
        isPartOfKey: true,
        dataType: breeze.DataType.Int32
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'name',
        dataType: breeze.DataType.String
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'model',
        dataType: breeze.DataType.String
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'options',
        dataType: breeze.DataType.String
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'isVisible',
        dataType: breeze.DataType.Boolean,
        defaultValue: true
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'isProtected',
        dataType: breeze.DataType.Boolean,
        defaultValue: false
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
