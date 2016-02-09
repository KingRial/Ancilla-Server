"use strict";

module.exports = function(sequelize, DataTypes) {
  var Table = sequelize.define( 'TECHNOLOGY_TYPE', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.STRING,
      //field: 'first_name' // Will result in an attribute that is firstName when user facing but first_name in the database
    },
    language: {
      type: DataTypes.STRING
    },
    path: {
      type: DataTypes.STRING
    }
  }, {
    timestamps: false,
    freezeTableName: true,
  });
  return Table;
};
