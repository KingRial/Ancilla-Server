module.exports = {
  up: function( migration, DataTypes ) {
    return migration.createTable( 'TRACK', {
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
      })
  },

  down: function( migration, DataTypes ) {
    return migration
      .dropAllTables()
    ;
  }
};
