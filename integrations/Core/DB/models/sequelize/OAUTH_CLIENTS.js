"use strict";

module.exports = function(sequelize, DataTypes) {
  var Table = sequelize.define( 'OAUTH_CLIENTS', {
    client_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    client_secret: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    grant_types: {
      type: DataTypes.STRING,
      allowNull: true
    },
    redirect_uri: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: false,
    freezeTableName: true,
  });
  return Table;
};
