"use strict";

module.exports = {
  up: function( migration, DataTypes ) {
    // Using single transaction for "up" migrations; this way if any errors occurs we can rollback it
    return  migration.sequelize.transaction( function( oTransaction ) {
      // Creating TECHNOLOGY_TYPE table
      return migration.createTable( 'DEVICE', {
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
          transaction: oTransaction
        })
      ;
    });
  },

  down: function( migration ) {
    return migration
      .dropAllTables()
    ;
  }
};
