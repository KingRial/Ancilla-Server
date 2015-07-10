module.exports = {
  up: function( migration, DataTypes ) {
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
      })
      .then(
        return migration.sequelize.models.TECHNOLOGY_TYPE.bulkCreate([
        // Adding Core Technology Type
        {
          type: 'Core',
          language: 'nodejs',
          path: './integrations/Core/Technology.Core.node.js'
        },
        // Adding Core Technology Type
        {
          type: 'Web'
        },
        // Adding Core Technology Type
        {
          type: 'Bridge',
          language: 'nodejs',
          path: './integrations/Bridge/Technology.Bridge.node.js'
        }
        ])
      )
//Creating OBJECT table
      .createTable( 'OBJECT', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        name: {
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
          type: DataTypes.STRING
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
          type: DataTypes.INTEGER,
          defaultValue: -1
        },
        isEnabled: {
          type: DataTypes.INTEGER,
          defaultValue: 1
        },
        isVisible: {
          type: DataTypes.INTEGER,
          defaultValue: 1
        },
        isProtected: {
          type: DataTypes.INTEGER,
          defaultValue: 0
        },
        createdAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        }/*,
        updatedAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        }*/
      })
      .then(
        return migration.sequelize.models.OBJECT.bulkCreate([
          // Creating CORE technology instance
          {
            name: '_LANG_TECHNOLOGY_CORE',
            type: 'TECHNOLOGY',
            is_protected: 1
          },
          // Create user "Admin" with password "admin"
          {
            name: 'admin',
            type: 'USER',
            value: 'd033e22ae348aeb5660fc2140aec35850c4da997',
            is_protected: 1
          },
          // Create user "User" with password "user"
          {
            name: 'user',
            type: 'USER',
            value: '12dea96fec20593566ab75692c9949596833adc9',
            is_protected: 1
          },
          // Root's Groups
          {
            name: '_LANG_GROUP_ROOT',
            type: 'GROUP',
            is_protected: 1
          }
        })
      )
// Create RELATION Table
      .createTable( 'RELATION', {
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
        }
        isEnabled: {
          type: DataTypes.INTEGER,
          defaultValue: 1
        },
        isVisible: {
          type: DataTypes.INTEGER,
          defaultValue: 1
        },
        isProtected: {
          type: DataTypes.INTEGER,
          defaultValue: 0
        }
      })
// Create WIDGET Table
      .createTable( 'WIDGET', {
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
        isBisible: {
          type: DataTypes.INTEGER,
          defaultValue: 1
        },
        isProtected: {
          type: DataTypes.INTEGER,
          defaultValue: 0
        }
      })
      .then(
        return migration.sequelize.models.WIDGET.bulkCreate([
          // Widget None
          {
            name: '_LANG_WIDGET_NONE',
            model: 'widget.none',
            isProtected: 1
          },
          // Widget On / Off
          {
            name: '_LANG_WIDGET_ONOFF',
            model: 'widget.onoff',
            options: '[{"value":0,"label":"_LANG_OFF","css":"off"},{"value":1,"label":"_LANG_ON","css":"on"}]',
            isProtected: 1
          },
          // Widget Generic Input ( no controls over input )
          {
            name: '_LANG_WIDGET_GENERIC-INPUT',
            model: 'widget.generic-input',
            isProtected: 1
          }
        ])

      )
    ;
  },

  down: function( migration, DataTypes ) {
    return migration
      .dropAllTables()
    ;
  }
};
