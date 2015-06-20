var Tools = require('./Tools.node.js');

var path = require('path');

function call( fClass ) {
  	if( require.main === module || ( module.parent && module.parent.parent && require.main === module.parent.parent )  ){
      // Arguments
      var _oArgs = Tools.processArgs( process.argv.slice( 2 ) );
      _oArgs = Tools.extend({
        sID: path.basename( require.main.filename ),
      	sRequirePath: 'ancilla',
        sCwd: process.cwd(),
      	bDebug: false,
      }, _oArgs );
      // Debug
      Tools.setDebug( _oArgs.bDebug );
      if( _oArgs.bDebug ){
        Tools.debug( '[ Process: "%s" ] Using Debug...', _oArgs.sID );
      } else {
        Tools.info( '[ Process: "%s" ] starting from command with arguments "%j"...', _oArgs.sID, _oArgs );
      }
      // Process working directory
      if( _oArgs.sCwd != process.cwd() ){
        process.chdir( _oArgs.sCwd );
        Tools.info( '[ Process: "%s" ] set working directory to: "%s"...', _oArgs.sID, _oArgs.sCwd );
      } else {
        Tools.debug( '[ Process: "%s" ] using working directory: "%s"...', _oArgs.sID, _oArgs.sCwd );
      }
return;
      // Executing
      try {
      	// Loading library
      	var _oRequire = require( _oArgs.requirePath );
      	Tools.info('[ Process: "%s" ] Starting Process...', _oArgs.sID );
      	// Initiating function's arguments
      	var _oFunctionArgs = [ _oArgs.sID ];
      	for( var _iIndex in _oArgs.arguments ){
      		_oFunctionArgs.push( _oArgs.arguments[ _iIndex ] );
      	}
      	// Calling function
      	var _oObject = ( _oArgs.className ? new _oRequire[ _oArgs.className ]( _oFunctionArgs[ 0 ], _oFunctionArgs[ 1 ], _oFunctionArgs[ 2 ] ) : new _oRequire( _oFunctionArgs[ 0 ], _oFunctionArgs[ 1 ], _oFunctionArgs[ 2 ] ) );
      } catch( oError ){
      	Tools.error( '[ Process: "%s" ] Error: "%s". Unable to start Process...', _oArgs.sID, oError );
      }
      // Setting process events
      process.on('SIGINT', function() {
      	Tools.info('[ Process: "%s" ] Event SIGINT...', _oArgs.sID );
      	process.exit();
      });
      process.on('SIGTERM', function() {
      	Tools.info('[ Process: "%s" ] Event SIGTERM...', _oArgs.sID );
      	process.exit();
      });
      process.on('SIGHUP', function() {
      	Tools.info('[ Process: "%s" ] Event SIGHUP...', _oArgs.sID );
      	process.exit();
      });
      process.on('exit', function( iCode ){
      	//TODO: killing process children before exiting current process
      	Tools.info('[ Process: "%s" ] Closing ( exit code: %s )...', _oArgs.sID, iCode );
      });
      process.on('close', function( iCode ) {
      	Tools.info( '[ Process: "%s" ] Process "%s" exited with code "%s" ', _oArgs.sID, process.argv[2], iCode  );
      });
      process.on('uncaughtException', function( oError ){
      	Tools.error('[ Process: "%s" ] Uncaught Exception: %s...', _oArgs.sID, oError );
      });
    } else {
      // Since it's required we are returning the tech
      return fClass;
    }
}

module.exports.call = call;
