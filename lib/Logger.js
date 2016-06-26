"use strict";
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

let _ = require('lodash');
let winston = require('winston');
let Chalk = require('chalk');

class Logger {
  constructor( oLoggerOptions, oTargetToExtend ){
    this.__oOptions = {};
    this.config( _.extend({
      sID: 'logger',
      sLevel: 'debug',
      bRemote: null,
      iRemotePort: 3000,
      bSilent: false,
      //sLogPath: './' + __filename + '.log',
      sLogPath: null,
      iLogMaxSize: 500000, // kB
			iLogMaxFiles: 1,
      sHeader: null,
      sHeaderStyleBackground: 'black',
      sHeaderStyleColor: 'white',
      bUseRandomStyle4Header: false,
    }, oLoggerOptions ) );
    this._bRemoteEnabled = false;
    // Extending target with log methods if needed
    if( oTargetToExtend ){
      this.extend( this.getID(), oTargetToExtend );
    }
  }

  config( oDefaultOptions ){
		// Merging curren default options with default options from argument
		this.__oOptions = _.extend( this.__oOptions, oDefaultOptions );
	}

  add( sID, sHeader, oOptions ){
    oOptions = this.__buildLoggerOptions( oOptions );
    // Setting Header style if needed
    this.__setRandomStyle( oOptions );
    let _Logger = this;
    if( !winston.loggers.loggers[ sID ] ){ // Creating Sub logger
      let _aTransports = [
        new (winston.transports.Console)({
          level: oOptions.sLevel,
          silent: oOptions.bSilent,
          colorize: true,
          prettyPrint: true,
          timestamp: true
        })
      ];
      if( oOptions.sLogPath ){
        this.__oTransportLogFile = ( this.__oTransportLogFile ? this.__oTransportLogFile : new (winston.transports.File)({
          level: oOptions.sLevel,
  				filename: oOptions.sLogPath,
  				maxsize: oOptions.iLogMaxSize, // 500 kB
  				maxFiles: oOptions.iLogMaxFiles,
          prettyPrint: true,
          timestamp: true,
  				json: false,
  				tailable: true,
  				zippedArchive: true,
  				exitOnError: false
  	    }));
        _aTransports.push( this.__oTransportLogFile );
      }
      if( oOptions.bRemote && sID !== 'Endpoint-Debug-Remoter' ){
        this.__oTransportLogRemote = ( this.__oTransportLogRemote ? this.__oTransportLogRemote : new (require('./Logger.Transports/ws.js'))({
          level: oOptions.sLevel,
          silent: false, // Should never be silenced
          colorize: true,
          prettyPrint: true,
          timestamp: true,
          port: oOptions.iRemotePort
        }));
        _aTransports.push( this.__oTransportLogRemote );
      }
      winston.loggers.add( sID, { transports: _aTransports } );
    }
    winston.loggers.get( sID ).filters.push( function( sHeader ){ return function(iLevel, sMsg){ return ( sHeader  ? '[ ' + sHeader + ' ] ' : '' ) + sMsg; }; }( ( oOptions.sHeader ?_Logger.__getTag( oOptions ) : null ) ) );
    //
    if( oOptions.sLogPath ){
			winston.loggers.get( sID ).info( 'Log ID "%s" logging level "%s" on file: "%s"...', sID, oOptions.sLevel, oOptions.sLogPath );
		}
    if( oOptions.bRemote ){
      winston.loggers.get( sID ).info( 'Log ID "%s" logging level "%s" on remote WS port: "%s"...', sID, oOptions.sLevel, oOptions.iRemotePort );
    }
    winston.loggers.get( sID ).info( 'Log ID "%s" logging level "%s" on console...', sID, oOptions.sLevel );
  }

  extend( sID, oTarget, oOptions ) {
    if( oTarget ){
      // Bypassing .get because it will create an empty logger if sID is not present
      let _Logger = winston.loggers.loggers[ sID ];//let _Logger = winston.loggers.get( sID );
      if( !_Logger ){
        this.add( sID, oOptions.sHeader, oOptions );
        _Logger = winston.loggers.get( sID );
      }
      [ 'silly', 'debug', 'verbose', 'info', 'warn', 'error' ].forEach( function( sMethod ){
        oTarget[ sMethod ] = function(){
          return _Logger[ sMethod ].apply( _Logger, arguments );
        };
      });
    } else {
      this.error( 'Unable to extend with logging functions ( ID: "%s" ), the target: ', sID, oTarget );
    }
    return this;
  }

  get( sID ){
    if( !sID ){
      sID = this.getID();
    }
    return winston.loggers.get( sID );
  }

  __buildLoggerOptions( oOptions ){
    return _.extend( this.__oOptions, oOptions );
  }

  __getRandomItemFromArray( aArray, aFilterArray ){
		if( !aFilterArray ){
			aFilterArray = [];
		}
		let _aFilteredArray = aArray.filter(function( sElement ){
			for( let _sElement in aFilterArray ){
        if( aFilterArray.hasOwnProperty( _sElement ) ){
  				if( _sElement === sElement ){
  					return false;
  				}
        }
			}
			return true;
		});
		return _aFilteredArray[ Math.floor( Math.random() * _aFilteredArray.length ) ];
	}

  __setRandomStyle( oOptions ){
    if( oOptions.bUseRandomStyle4Header ){
      /*
      let _aMofiers = [
  			'reset',
  			'bold',
  			'dim',
  			'italic',
  			'underline',
  			'inverse',
  			'hidden',
  			'strikethrough'
  		];
      */
  		let _aColours = [
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
  		let _aBackground = [
  			'bgBlack',
  			'bgRed',
  			'bgGreen',
  			'bgYellow',
  			'bgBlue',
  			'bgMagenta',
  			'bgCyan',
  			'bgWhite'
  		];
      //let _sModifier = this.__getRandomItemFromArray( _aMofiers );
  		oOptions.sHeaderStyleColor = this.__getRandomItemFromArray( _aColours );
      oOptions.sHeaderStyleBackground = this.__getRandomItemFromArray( _aBackground );
    }
  }

  __getTag( oOptions ){
    return Chalk.styles[ oOptions.sHeaderStyleBackground ].open + Chalk.styles[ oOptions.sHeaderStyleColor ].open + oOptions.sHeader + Chalk.styles[ oOptions.sHeaderStyleColor ].close + Chalk.styles[ oOptions.sHeaderStyleBackground ].close;
  }
}

module.exports = Logger;
