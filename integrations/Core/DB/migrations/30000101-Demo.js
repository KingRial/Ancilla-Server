/*
 * Demo STEP
 * This step will preinstall some objects to build a DEMO project while waiting for the web UI to grow enough and being able to do such things
 */

module.exports = {
  up: function( migration, DataTypes ) {
    return migration.sequelize.models.OBJECT.create({
        id: 20,
        name: 'Environment One',
        type: 'GROUP',
        value: '/runtime/grid',
        options: ''
      })
      .then( migration.sequelize.models.OBJECT.create({
        id: 21,
        name: 'Environment One/A',
        type: 'GROUP',
        value: '/runtime/grid',
        options: ''
      }) )
      .then( migration.sequelize.models.OBJECT.create({
        id: 22,
        name: 'Environment One/B',
        type: 'GROUP',
        widgetID: 2, // SELECT ID FROM WIDGET WHERE MODEL='widget.onoff'
        options: ''
      }) )
      .then( migration.sequelize.models.OBJECT.create({
        id: 23,
        name: 'Variable On/Off',
        type: 'VARIABLE',
        widgetID: 3, // SELECT ID FROM WIDGET WHERE MODEL='widget.generic-input'
        options: ''
      }) )
      .then( migration.sequelize.models.OBJECT.create({
        id: 24,
        name: 'Variable Generic Input',
        type: 'VARIABLE',
        value: '/runtime/grid',
        options: ''
      }) )
      .then( migration.sequelize.models.OBJECT.create({
        id: 30,
        name: 'Environment Two',
        type: 'GROUP',
        value: '/runtime/grid',
        options: ''
      }) )
    .then(
      migration.sequelize.models.RELATION.create({
          parentID: 3, // SELECT ID FROM OBJECT WHERE NAME='_LANG_GROUP_ROOT'
          childID: 20,
          options: ''
        })
      .then( migration.sequelize.models.RELATION.create({
          parentID: 3, // SELECT ID FROM OBJECT WHERE NAME='_LANG_GROUP_ROOT'
          childID: 30,
          options: ''
        }) )
      .then( migration.sequelize.models.RELATION.create({
        parentID: 20,
        childID: 21,
        options: ''
      }) )
      .then( migration.sequelize.models.RELATION.create({
          parentID: 20,
          childID: 22,
          options: ''
        }) )
      .then( migration.sequelize.models.RELATION.create({
        parentID: 20,
        childID: 23,
        options: ''
      }) )
      .then( migration.sequelize.models.RELATION.create({
        parentID: 20,
        childID: 24,
        options: ''
      }) )
    );
  },

  down: function( migration, DataTypes ) {
    return migration.sequelize.models.OBJECT.destroy({
      where: {
        id: [ 20, 21, 22, 23, 24, 30]
      }
    })
    .then(
      migration.sequelize.models.RELATION.destroy({
        where: {
          $or: {
            parentID: [ 20, 21, 22, 23, 24, 30],
            childID: [ 20, 21, 22, 23, 24, 30]
          }
        }
      })
    )
    ;
  }
};
/*
-- ( DEMO STEP ) DELETE THIS STEP
--{{ UPDATE: 0.0.1 to 0.0.2 }}
-- Demo Technology
--INSERT INTO TECHNOLOGY_TYPE ( ID, TYPE, LANGUAGE, PATH ) VALUES ( NULL, 'Technology.Demo', 'nodejs', './integrations/Technology.Demo.node.js' );
--INSERT INTO OBJECT ( ID, NAME, TYPE, TECHNOLOGY, IS_PROTECTED, OPTIONS ) VALUES ( NULL, 'Bridge', 'TECHNOLOGY', 'Bridge', 1, '{"aEndpoints":[{"id":"BridgeEndpoint1","type":"listen","connectionType":"net","port":10001},{"id":"BridgeEndpoint2","type":"listen","connectionType":"net","port":10002},{"id":"BridgeEndpoint3","type":"listen","connectionType":"net","port":10003}]}' );
--INSERT INTO OBJECT ( ID, NAME, TYPE, TECHNOLOGY, IS_PROTECTED, OPTIONS ) VALUES ( NULL, 'Demo-1', 'TECHNOLOGY', 'Technology.Demo', 1, '{"aArguments":[[{"id":"FakeEndpoint1","type":"connect","connectionType":"net","port":10003}]]}' );
*/
