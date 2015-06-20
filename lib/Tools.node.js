/*
 *	Copyright (C) 2014  Riccardo Re <kingrichard1980.gmail.com>
 *	This file is part of "Ancilla Libary".
 *
 *  "Ancilla Libary" is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  "Ancilla Libary" is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with "Ancilla Libary".  If not, see <http://www.gnu.org/licenses/>.
*/
var Chalk = require('chalk');

var util = require( 'util' );
var path = require('path');

//Ancilla tools
var Tools = function(){
		this._bDebug = false;
}

Tools.prototype = {
	inherits: function( oConstructor, oSuperConstructor ){
		//superConstructor will be accessible through the constructor.super_ property.
		return util.inherits( oConstructor, oSuperConstructor );
	},
	extend: function(){ //jQuery extend
		var _oExtend = require('node.extend');
		return _oExtend.apply( this, arguments );
	},
	proxy: function( fFunc, oContext ){
		var _aArgs = Array.prototype.slice.call( arguments, 2 );
		_fProxyFunc = function() {
			// Deciding the order of the arguments: first the arguments from the proxy then the arguments received from the external call
			return fFunc.apply( oContext || this, _aArgs.concat( Array.prototype.slice.call( arguments ) ) );
			//return fFunc.apply( oContext || this, Array.prototype.slice.call( arguments ).concat( _aArgs ) );
		};
		return _fProxyFunc;
	},
	getLocalIPs: function( iIndexIP ){
		var _oOS = require('os');
		var _aInterfaces = _oOS.networkInterfaces();
		var _aIPs = [];
		for( var _iInterfaceIndex in _aInterfaces ){
			for (var _iIPIndex in _aInterfaces[ _iInterfaceIndex ]) {
				var _oAddress = _aInterfaces[ _iInterfaceIndex ][ _iIPIndex ];
				if( _oAddress.family === 'IPv4' && !_oAddress.internal ){
					_aIPs.push( _oAddress.address );
				}
			}
		}
		return ( typeof iIndexIP == 'undefined' ? _aIPs : _aIPs[ iIndexIP ] );
	},
	processArgs: function( aArgs ){
		var _oArgs = {};
		var _sCurrentField = null;
		var _sPreviousField = null;
		for( var _iIndex in aArgs ){
			var _sValue = aArgs[ _iIndex ];
			var _sPreviousValue = aArgs[ _iIndex - 1 ] || '';
			if( _sValue.indexOf( '--' ) === 0 ){
				if( _sPreviousField && typeof _oArgs[ _sPreviousField ] == 'undefined' ){
					_oArgs[ _sPreviousField ] = true;
				}
				_sCurrentField = _sValue.substring( 2 );
			} else {
				_oArgs[ _sCurrentField ] = ( this.isNumeric( _sValue ) ? parseFloat( _sValue ) : ( this.isJSON( _sValue ) ? JSON.parse( _sValue ) : _sValue ) ) ;
			}
			_sPreviousField = _sCurrentField;
		}
		if( _sPreviousField && typeof _oArgs[ _sPreviousField ] == 'undefined' ){
			_oArgs[ _sPreviousField ] = true;
		}
		return _oArgs;
	},
	isAbsolutePath : function( sPath ){
		return ( path.resolve( sPath ) === sPath );
	},
	isArray: function( aElement ){
		return util.isArray( aElement );
	},
	isEmptyObject: function( oObj ) {
		return !Object.keys( oObj ).length;
	},
	isString: function( value ){
		var isString = ( typeof value!='object' ) && ( !this.isNumeric(value) );
		return isString;
	},
	isJSON: function( sString ){
	  try {
	      JSON.parse( sString );
	  } catch (e) {
	      return false;
	  }
	  return true;
	},
	isNumeric: function( value ){
		value = typeof( value ) === 'string' ? value.replace(',', '.') : value;
		return !isNaN(parseFloat( value )) && isFinite( value ) && Object.prototype.toString.call( value ).toLowerCase() !== '[object array]';
	},
	isOSWin: function(){
		return /^win/.test( process.platform );
	},
	info: function(){
		var _sMessage = util.format.apply( this, arguments );
//TODO: for some reasons Chalck won't close correctly strings so we have to do this way
		//util.log( '[ ' + Chalk.white('Info') + ' ] ' + _sMessage );
		util.log( '[ ' + Chalk.styles.white.open + 'Info' + Chalk.styles.white.close + ' ] ' + _sMessage );
	},
	error: function(){
		var _sMessage = util.format.apply( this, arguments );
//TODO: for some reasons Chalck won't close correctly strings so we have to do this way
		//util.log( '[ ' + Chalk.red('Error') + ' ] ' + _sMessage );
		//util.error( '[ ' + Chalk.red('Error') + ' ] ' + _sMessage );
		util.log( '[ ' + Chalk.styles.red.open + 'Error' + Chalk.styles.red.close + ' ] ' + _sMessage );
		//util.error( '[ ' + Chalk.styles.red.open + 'Error' + Chalk.styles.red.close + ' ] ' + _sMessage );
	},
	setDebug: function( bDebug ){
		this._bDebug = bDebug;
	},
	getDebug: function(){
		return this._bDebug;
	},
	debug: function(){
		if( this._bDebug ){
			var _sMessage = util.format.apply( this, arguments );
//TODO: for some reasons Chalck won't close correctly strings so we have to do this way
			//util.log( '[ ' + Chalk.blue('Debug') + ' ] ' + _sMessage );
			util.log( '[ ' + Chalk.styles.blue.open + 'Debug' + Chalk.styles.blue.close + ' ] ' + _sMessage );
		}
	},
	getRandomItemFromArray: function( aArray, aFilterArray ){
		if( !aFilterArray ){
			aFilterArray = [];
		}
		var _aFilteredArray = aArray.filter(function( sElement ){
			for( var _iIndex in aFilterArray ){
				var _sElement = aFilterArray[ _iIndex ];
				if( _sElement == sElement ){
					return false;
				}
			}
			return true;
		});
		return _aFilteredArray[ Math.floor( Math.random() * _aFilteredArray.length ) ];
	},
	__styleTerminalMessage: function( sMessage, aStyles ){
		/*
		var _fChalk = Chalk;
		for( var _iIndex in aStyles ){
			_fChalk = _fChalk[ aStyles[ _iIndex ] ];
		}
		return _fChalk( sMessage );
		*/
//TODO: for some reasons Chalck won't close correctly strings so we have to do this way
		var _aOpen = [];
		var _aClose = [];
		for( var _iIndex in aStyles ){
			var _oStyle = Chalk.styles[ aStyles[ _iIndex ] ];
			_aOpen.push( _oStyle.open );
			_aClose.push( _oStyle.close );
		}
		return _aOpen.join('') + sMessage + _aClose.join('');
	},
	__styleTerminalGetRandom: function(){
		var _aMofiers = [
			'reset',
			'bold',
			'dim',
			'italic',
			'underline',
			'inverse',
			'hidden',
			'strikethrough'
		];
		var _aColours = [
			'black',
			'red',
			'green',
			'yellow',
			'blue',
			'magenta',
			'cyan',
			'white',
			'gray'
		];
		var _aBackground = [
			'bgBlack',
			'bgRed',
			'bgGreen',
			'bgYellow',
			'bgBlue',
			'bgMagenta',
			'bgCyan',
			'bgWhite'
		];
		var _sModifier = this.getRandomItemFromArray( _aMofiers );
		var _sColour = this.getRandomItemFromArray( _aColours );
		//var _sBackground = this.getRandomItemFromArray( _aBackground, [ 'bg' + _sColour.replace( /\w\S*/g, function(sTxt){return sTxt.charAt(0).toUpperCase() + sTxt.substr(1).toLowerCase();} ) ] );
		//if( _sBackground != 'bgBlack' ){
		//	_sColour='black';
		//}
		//return [ _sModifier, _sColour, _sBackground ];
		return [ _sModifier, _sColour ];
	},
	exports: function( fClass, oCurrentModule ) {
			// Checking if we are "requiring" the class or calling it using command shell
	  	if( require.main === oCurrentModule ){
				var _Tools = this;
	      // Arguments
	      var _oArgs = this.processArgs( process.argv.slice( 2 ) );
				var _sProcessName = path.basename( oCurrentModule.filename );
	      var _oClassOptions = this.extend({
	        sCwd: path.dirname( oCurrentModule.filename ),
	      	bDebug: ( false || _oArgs.debug )
	      }, _oArgs );
				// Init debug
				this.setDebug( _oClassOptions.bDebug );
				this.debug( '[ Process: "%s" ] Using Debug...', _sProcessName );
				this.info( '[ Process: "%s" ] starting from command with arguments "%j"...', _sProcessName, _oClassOptions );
	      // Process working directory
	      if( _oClassOptions.sCwd != process.cwd() ){
	        process.chdir( _oClassOptions.sCwd );
					this.info( '[ Process: "%s" ] set working directory to: "%s"...', _sProcessName, _oClassOptions.sCwd );
	      } else {
					this.debug( '[ Process: "%s" ] using working directory: "%s"...', _sProcessName, _oClassOptions.sCwd );
	      }
	      // Executing
	      try {
					var _oObject = new fClass( _oClassOptions );
	      } catch( oError ){
					this.error( '[ Process: "%s" ] Error: "%s". Unable to start process...', _sProcessName, oError );
	      }
	      // Setting process events
	      process.on('SIGINT', function() {
					_Tools.info('[ Process: "%s" ] Event SIGINT...', _sProcessName );
	      	process.exit();
	      });
	      process.on('SIGTERM', function() {
					_Tools.info('[ Process: "%s" ] Event SIGTERM...', _sProcessName );
	      	process.exit();
	      });
	      process.on('SIGHUP', function() {
					_Tools.info('[ Process: "%s" ] Event SIGHUP...', _sProcessName );
	      	process.exit();
	      });
	      process.on('exit', function( iCode ){
	      	//TODO: killing process children before exiting current process
					_Tools.info('[ Process: "%s" ] Closing ( exit code: %s )...', _sProcessName, iCode );
	      });
	      process.on('close', function( iCode ) {
					_Tools.info( '[ Process: "%s" ] Process "%s" exited with code "%s" ', _sProcessName, process.argv[2], iCode  );
	      });
	      process.on('uncaughtException', function( oError ){
					_Tools.error('[ Process: "%s" ] Uncaught Exception: %s...', _sProcessName, oError );
	      });
	    } else {
	      // Since it's required instead of called by command line, we are returning the class
	      return fClass;
	    }
	}
}

module.exports = new Tools();
