"use strict";

module.exports = function(sequelize, DataTypes) {
  var Table = sequelize.define( 'RELATION', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    parentID: {
      type: DataTypes.INTEGER
    },
    childID: {
      type: DataTypes.INTEGER
    },
    type: {
      type: DataTypes.STRING
    },
    event: {
      type: DataTypes.STRING
    },
    options: {
      type: DataTypes.STRING
    },
    orderNum: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isProtected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: true,
    freezeTableName: true,
  });
  return Table;
};
