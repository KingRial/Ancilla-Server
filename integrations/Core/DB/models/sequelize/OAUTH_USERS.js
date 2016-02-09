"use strict";

module.exports = function(sequelize, DataTypes) {
  var Table = sequelize.define( 'OAUTH_USERS', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    timestamps: false,
    freezeTableName: true,
  });
  return Table;
};
