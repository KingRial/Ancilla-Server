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
        },
        createdAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        },
        updatedAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        }
      }, {
          transaction: oTransaction
        })
      .then(
        migration.createTable( 'CHANNEL', {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          valueID: {
            type: DataTypes.INTEGER,
            unique: true
          },
          name: {
            type: DataTypes.STRING
          },
          description: {
            type: DataTypes.STRING
          },
          value: {
            type: DataTypes.BIGINT
          },
          values: {
            type: DataTypes.STRING
          },
          minValue: {
            type: DataTypes.FLOAT
          },
          maxValue: {
            type: DataTypes.FLOAT
          },
          nodeID: {
            type: DataTypes.INTEGER
          },
          classID: {
            type: DataTypes.INTEGER
          },
          type: {
            type: DataTypes.STRING
          },
          genre: {
            type: DataTypes.STRING
          },
          instance: {
            type: DataTypes.INTEGER
          },
          index: {
            type: DataTypes.INTEGER
          },
          units: {
            type: DataTypes.STRING
          },
          readOnly: {
            type: DataTypes.BOOLEAN
          },
          writeOnly: {
            type: DataTypes.BOOLEAN
          },
          isPolled: {
            type: DataTypes.BOOLEAN
          },
          createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
          },
          updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
          }
        }, {
          transaction: oTransaction
        } )
      )
    ;
    });
  },
  down: function( migration ) {
    return migration
      .dropAllTables()
    ;
  }
};
