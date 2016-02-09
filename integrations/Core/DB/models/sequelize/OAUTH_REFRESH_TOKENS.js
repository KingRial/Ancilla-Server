"use strict";

module.exports = function(sequelize, DataTypes) {
  var Table = sequelize.define( 'OAUTH_REFRESH_TOKENS', {
    refresh_token: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    client_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    expires: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    timestamps: false,
    freezeTableName: true,
  });
  return Table;
};
