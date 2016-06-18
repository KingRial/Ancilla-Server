"use strict";

module.exports = function(sequelize, DataTypes) {
  var Table = sequelize.define( 'DEVICE', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nodeID: {
      type: DataTypes.INTEGER,
      unique: true
    },
    name: {
      type: DataTypes.STRING
    },
    description: {
      type: DataTypes.STRING
    },
    product: {
      type: DataTypes.STRING
    },
    productType: {
      type: DataTypes.BIGINT // Hexadecimal
    },
    productID: {
      type: DataTypes.BIGINT // Hexadecimal
    },
    manufacturer: {
      type: DataTypes.STRING
    },
    manufacturerID: {
      type: DataTypes.BIGINT // Hexadecimal
    }
  }, {
    timestamps: true,
    freezeTableName: true,
  });
  return Table;
};
