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
        // Adding Core Technology Type
        migration.sequelize.models.TECHNOLOGY_TYPE.create({
            type: 'Core',
            language: 'nodejs',
            path: './integrations/Core/Technology.Core.node.js'
          })
        // Adding Web Technology Type
        .then( migration.sequelize.models.TECHNOLOGY_TYPE.create({
          type: 'Web'
        }) )
        // Adding Brdige Technology Type
        .then( migration.sequelize.models.TECHNOLOGY_TYPE.create(  {
            type: 'Bridge',
            language: 'nodejs',
            path: './integrations/Bridge/Technology.Bridge.node.js'
          }) )
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
        })
      )
      .then(
        // Creating CORE technology instance
        migration.sequelize.models.OBJECT.create({
            name: '_LANG_TECHNOLOGY_CORE',
            type: 'TECHNOLOGY',
            technology: 'Core',
            isProtected: true,
            options: ''
          })
        // Create user "Admin" with password "admin"
        .then( migration.sequelize.models.OBJECT.create({
          name: 'admin',
          type: 'USER',
          value: 'd033e22ae348aeb5660fc2140aec35850c4da997',
          isProtected: true,
          options: ''
        }) )
        // Create user "User" with password "user"
        .then( migration.sequelize.models.OBJECT.create({
          name: 'user',
          type: 'USER',
          value: '12dea96fec20593566ab75692c9949596833adc9',
          is_protected: true,
          options: ''
        }) )
        // Create Root's Groups
        .then( migration.sequelize.models.OBJECT.create({
          name: '_LANG_GROUP_ROOT',
          type: 'GROUP',
          isProtected: true,
          options: ''
        }) )
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
        })
      )
      .then(
        // Widget None
        migration.sequelize.models.WIDGET.create({
            name: '_LANG_WIDGET_NONE',
            model: 'widget.none',
            isProtected: true,
            options: ''
          })
        // Widget On / Off
        .then( migration.sequelize.models.WIDGET.create({
          name: '_LANG_WIDGET_ONOFF',
          model: 'widget.onoff',
          options: '[{"value":0,"label":"_LANG_OFF","css":"off"},{"value":1,"label":"_LANG_ON","css":"on"}]',
          isProtected: true,
          options: ''
        }) )
        // Widget Generic Input ( no controls over input )
        .then( migration.sequelize.models.WIDGET.create({
          name: '_LANG_WIDGET_GENERIC-INPUT',
          model: 'widget.generic-input',
          isProtected: true,
          options: ''
        }) )
      )
    ;
  },

  down: function( migration, DataTypes ) {
    return migration
      .dropAllTables()
    ;
  }
};
