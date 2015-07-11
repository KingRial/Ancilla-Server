module.exports = function(sequelize, DataTypes) {
  var Table = sequelize.define( 'WIDGET', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
    },
    model: {
      type: DataTypes.STRING,
    },
    options: {
      type: DataTypes.STRING
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
    timestamps: false,
    freezeTableName: true,
  });
  return Table;
};
