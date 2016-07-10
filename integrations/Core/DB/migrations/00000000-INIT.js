"use strict";

module.exports = {
  up: function( migration, DataTypes ) {
    // Using single transaction for "up" migrations; this way if any errors occurs we can rollback it
    return  migration.sequelize.transaction( function( oTransaction ) {
      // Creating TECHNOLOGY_TYPE table
      return migration.createTable( 'TECHNOLOGY_TYPE', {
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
          transaction: oTransaction
        })
        .then(
          // Adding Core Technology Type
          migration.sequelize.models.TECHNOLOGY_TYPE.create({
              type: 'Core',
              language: 'nodejs',
              path: './integrations/Core/Technology.Core.node.js'
            }, {
              transaction: oTransaction
            }
          )
          // Adding Web Technology Type
          .then( migration.sequelize.models.TECHNOLOGY_TYPE.create({
              type: 'Web'
            }, {
              transaction: oTransaction
            })
          )
          // Adding Bridge Technology Type
          .then( migration.sequelize.models.TECHNOLOGY_TYPE.create(  {
              type: 'Bridge',
              language: 'nodejs',
              path: './integrations/Bridge/Technology.Bridge.node.js'
            }, {
              transaction: oTransaction
            })
          )
          // Adding Bridge Technology Type
          .then( migration.sequelize.models.TECHNOLOGY_TYPE.create(  {
              type: 'Z-Wave',
              language: 'nodejs',
              path: './integrations/Z-Wave/Technology.Z-Wave.node.js'
            }, {
              transaction: oTransaction
            })
          )
        )
  //Creating OBJECT table
        .then(
          migration.createTable( 'OBJECT', {
            id: {
              type: DataTypes.INTEGER,
              primaryKey: true,
              autoIncrement: true
            },
            name: {
              type: DataTypes.STRING
            },
            description: {
              type: DataTypes.STRING
            },
            type: {
              type: DataTypes.STRING
            },
            status: {
              type: DataTypes.INTEGER,
              defaultValue: 0
            },
            value: {
              type: DataTypes.STRING,
              defaultValue: 'VIRTUAL'
            },
            widgetID: {
              type: DataTypes.INTEGER,
              defaultValue: -1
            },
            options: {
              type: DataTypes.STRING
            },
            technology: {
              type: DataTypes.STRING,
              defaultValue: 'Core'
            },
            technologyID: {
              type: DataTypes.STRING,
              defaultValue: ''
            },
            isEnabled: {
              type: DataTypes.BOOLEAN,
              defaultValue: true
            },
            isVisible: {
              type: DataTypes.BOOLEAN,
              defaultValue: true
            },
            isProtected: {
              type: DataTypes.BOOLEAN,
              defaultValue: false
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
        )
        .then(
          // Create FAVOURITEs Group
          migration.sequelize.models.OBJECT.create({
            name: '_LANG_GROUP_FAVOURITES',
            type: 'GROUP',
            isProtected: true,
            options: ''
          }, {
            transaction: oTransaction
          })
          // Creating CORE technology instance
          .then(  migration.sequelize.models.OBJECT.create({
              name: '_LANG_TECHNOLOGY_CORE',
              type: 'TECHNOLOGY',
              technology: 'Core',
              isProtected: true,
              options: '{"sID":"Core"}'
            }, {
              transaction: oTransaction
            })
          )
          .then(  migration.sequelize.models.OBJECT.create({
              name: '_LANG_TECHNOLOGY_ZWAVE',
              type: 'TECHNOLOGY',
              technology: 'Z-Wave',
              isEnabled: false,
              options: '{"sID":"Z-Wave"}'
            }, {
              transaction: oTransaction
            })
          )
        )
  // Create RELATION Table
        .then(
          migration.createTable( 'RELATION', {
            id: {
              type: DataTypes.INTEGER,
              primaryKey: true,
              autoIncrement: true
            },
            parentID: {
              type: DataTypes.INTEGER
            },
            childID: {
              type: DataTypes.INTEGER
            },
            type: {
              type: DataTypes.STRING
            },
            event: {
              type: DataTypes.STRING
            },
            options: {
              type: DataTypes.STRING
            },
            orderNum: {
              type: DataTypes.INTEGER,
              defaultValue: 0
            },
            isEnabled: {
              type: DataTypes.BOOLEAN,
              defaultValue: true
            },
            isVisible: {
              type: DataTypes.BOOLEAN,
              defaultValue: true
            },
            isProtected: {
              type: DataTypes.BOOLEAN,
              defaultValue: false
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
        )
  // Create WIDGET Table
        .then(
          migration.createTable( 'WIDGET', {
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
            transaction: oTransaction
          })
        )
        .then(
          // Widget None
          migration.sequelize.models.WIDGET.create({
            name: '_LANG_WIDGET_NONE',
            model: 'widget.none',
            isProtected: true,
            options: ''
          }, {
            transaction: oTransaction
          })
          // Widget On / Off
          .then( migration.sequelize.models.WIDGET.create({
            name: '_LANG_WIDGET_ONOFF',
            model: 'widget.onoff',
            options: '[{"value":0,"label":"_LANG_OFF","css":"off"},{"value":1,"label":"_LANG_ON","css":"on"}]',
            isProtected: true
          }, {
            transaction: oTransaction
          }) )
          // Widget Generic Input ( no controls over input )
          .then( migration.sequelize.models.WIDGET.create({
            name: '_LANG_WIDGET_GENERIC-INPUT',
            model: 'widget.generic-input',
            isProtected: true,
            options: ''
          }, {
            transaction: oTransaction
          }) )
        )
// oAUTH 2.0
  // Create ACCESS TOKENS Table
        .then(
          migration.createTable( 'OAUTH_ACCESS_TOKENS', {
            access_token: {
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
            transaction: oTransaction
          })
        )
  // Create REFRESH TOKENS Table
        .then(
          migration.createTable( 'OAUTH_REFRESH_TOKENS', {
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
            transaction: oTransaction
          })
        )
  // Create CLIENTS Table
        .then(
          migration.createTable( 'OAUTH_CLIENTS', {
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
            transaction: oTransaction
          })
          .then(
            migration.sequelize.models.OAUTH_CLIENTS.create({
              client_id: 'ancilla-web-UI',
              client_secret: 'a104750c3cabe05501e4826afd02251f0828755e', // @anc1ll@w3BU1
              grant_types: '["password","refresh_token"]'
            }, {
              transaction: oTransaction
            })
          )
        )
  // Create USERS Table
        .then(
          migration.createTable( 'OAUTH_USERS', {
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
            transaction: oTransaction
          })
          .then(
            migration.sequelize.models.OAUTH_USERS.create({
              username: 'admin',
              password: 'd033e22ae348aeb5660fc2140aec35850c4da997'
            }, {
              transaction: oTransaction
            })
            .then( migration.sequelize.models.OAUTH_USERS.create({
              username: 'user',
              password: '12dea96fec20593566ab75692c9949596833adc9'
            }, {
              transaction: oTransaction
            }) )
          )
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
