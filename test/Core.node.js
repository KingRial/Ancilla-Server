var vows = require('vows'),
    assert = require('assert');
var Ancilla = require('../lib/ancilla.js');
var Tools = Ancilla.Tools;
var Core = require('../integrations/Core/Technology.Core.js');
var _oCore = new Core();
/*
var _oCore = new Core({
  sCwd: ,
  sDBPath:
  sDBPathTmp:
  sLogPath:
  sLogPathTmp:
});
*/
//var Constant = require('./Constants.js');
/*
notEqual
isNull
isNaN
isNumber
isTrue
*/
vows.describe('Technology Core').addBatch({
  /*
  '[Fake test]': {
     'boolean true': {
         topic: true,

         'is equal to true': function (topic) {
             assert.equal(topic, true);
         }
     }
 },
 */
 '[Ancilla Core]': {
   'init': {
     topic: _oCore,

     'initialized': function( topic ){
       assert.instanceOf( topic, Core );
     }
   },
   'methods': {
     topic: _oCore,

     'getID': function( topic ){
       assert.isFunction( topic.getID );
       assert.equal( topic.getID(), 'Core' );
     },

     'run': function( topic ){
       assert.isFunction( topic.run );
     }
   }
 }
}).export(module);
