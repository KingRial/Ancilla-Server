"use strict";

module.exports = function(sequelize, DataTypes) {
 var Table = sequelize.define( 'CHANNEL', {
   id: {
     type: DataTypes.INTEGER,
     primaryKey: true,
     autoIncrement: true
   },
   valueID: {
     type: DataTypes.INTEGER,
     unique: true
   },
   name: {
     type: DataTypes.STRING
   },
   description: {
     type: DataTypes.STRING
   },
   value: {
     type: DataTypes.BIGINT
   },
   values: {
     type: DataTypes.STRING
   },
   minValue: {
     type: DataTypes.FLOAT
   },
   maxValue: {
     type: DataTypes.FLOAT
   },
   nodeID: {
     type: DataTypes.INTEGER
   },
   classID: {
     type: DataTypes.INTEGER
   },
   type: {
     type: DataTypes.STRING
   },
   genre: {
     type: DataTypes.STRING
   },
   instance: {
     type: DataTypes.INTEGER
   },
   index: {
     type: DataTypes.INTEGER
   },
   units: {
     type: DataTypes.STRING
   },
   readOnly: {
     type: DataTypes.BOOLEAN
   },
   writeOnly: {
     type: DataTypes.BOOLEAN
   },
   isPolled: {
     type: DataTypes.BOOLEAN
   }
 }, {
   timestamps: true,
   freezeTableName: true,
 });
 return Table;
};
