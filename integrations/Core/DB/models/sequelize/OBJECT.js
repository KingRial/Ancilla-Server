"use strict";

module.exports = function(sequelize, DataTypes) {
  var Table = sequelize.define( 'OBJECT', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING
    },
    description: {
      type: DataTypes.STRING
    },
    type: {
      type: DataTypes.STRING
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    value: {
      type: DataTypes.STRING
    },
    widgetID: {
      type: DataTypes.INTEGER,
      defaultValue: -1
    },
    options: {
      type: DataTypes.STRING
    },
    technology: {
      type: DataTypes.STRING,
      defaultValue: 'Core'
    },
    technologyID: {
      type: DataTypes.STRING,
      defaultValue: ''
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
