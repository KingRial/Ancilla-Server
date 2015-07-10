var vows = require('vows'),
    assert = require('assert');
var Ancilla = require('../lib/ancilla.node.js');
var Tools = Ancilla.Tools;
var Core = Ancilla.Core;
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
//var Constant = require('./Constants.node.js');
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

         'is instanceOf Core': function (topic) {
             assert.equal(topic, true);
         }
     }
 },
 */
 '[Ancilla Core]': {
   'init': {
     topic: _oCore,

     'initialized': function( topic ){
       assert.instanceOf(topic, Core);
     }
   },
   'methods': {
     topic: _oCore,

     'getID': function( topic ){
       assert.isFunction(topic.getID);
       assert.equal(topic.getID(),'Core');
     },

     'run': function( topic ){
       assert.isFunction( topic.run );
     }
   }
 }
}).export(module);
