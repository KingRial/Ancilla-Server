module.exports = function(sequelize, DataTypes) {
  var Track = sequelize.define('track', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    data_string: {
      type: DataTypes.STRING
    },
    data_hex: {
      type: DataTypes.STRING
    }
  }, {
    freezeTableName: true // Model tableName will be the same as the model name
  });

  return Track;
};
