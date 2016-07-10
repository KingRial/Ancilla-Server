var Bluebird = require('bluebird');

module.exports = function( breeze, oMetadataStore ) {
  "use strict";
  return new Bluebird( function( fResolve, fReject ){
    var _oEntityType = new breeze.EntityType({
        shortName: 'OBJECT'
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
        name: 'description',
        dataType: breeze.DataType.String
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'type',
        dataType: breeze.DataType.String
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'status',
        dataType: breeze.DataType.Int32,
        defaultValue: 0
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'value',
        dataType: breeze.DataType.String
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'widgetID',
        dataType: breeze.DataType.Int32,
        defaultValue: -1
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'options',
        dataType: breeze.DataType.String
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'technology',
        dataType: breeze.DataType.String,
        defaultValue: 'Core'
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'technologyID',
        dataType: breeze.DataType.String,
        defaultValue: ''
      }) )
      .addProperty( new breeze.DataProperty({
        name: 'isEnabled',
        dataType: breeze.DataType.Boolean,
        defaultValue: true
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
      /*
      .addProperty( new breeze.NavigationProperty({
        name: 'parentID',
        //entityTypeName: 'RELATION:#myAppNamespace',
        entityTypeName: 'RELATION:#',
        isScalar: true,
        associationName: 'parentID',
        foreignKeyNames: ['parentID']
      }) )
      */
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
