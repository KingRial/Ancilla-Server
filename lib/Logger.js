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
    this.__oOptions = _.extend({
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
    }, oLoggerOptions );
    // Setting Header style if needed
    this.__setRandomStyle();
    // Translating Ancilla options to Winston options and saving default values
    this.__oLogOptions = this.__buildWinstonLogOptions( this.__oOptions );
    // Adding console/file transports
    this.add( this.getID(), this.__oOptions.sHeader, this.__oOptions );
    // Extending target with log methods if needed
    if( oTargetToExtend ){
      this.extend( this.getID(), oTargetToExtend );
    }
    if( this.__oLogOptions.file ){
			winston.loggers.get( this.getID() ).info( 'Log ID "%s" logging level "%s" on file: "%s"...', this.getID(), this.__oOptions.sLevel, this.__oLogOptions.file.filename );
		}
    if( this.__oOptions.bRemote ){
			winston.loggers.get( this.getID() ).info( 'Log ID "%s" logging level "%s" on remote WS port: "%s"...', this.getID(), this.__oOptions.sLevel, this.__oOptions.iRemotePort );
		}
    winston.loggers.get( this.getID() ).info( 'Log ID "%s" logging level "%s" on console...', this.getID(), this.__oOptions.sLevel );
  }

  add( sID, sHeader, oOptions ){
    let _Logger = this;
    //oOptions = _.extend( this.__oOptions, oOptions );
    if( winston.loggers.loggers[ this.getID()] ){ // Creating Sub logger
      winston.loggers.add( sID );
      // Using same transports as main logger
      let _oLogger = winston.loggers.get( sID );
      let _oMainLogger = winston.loggers.get( this.getID() );
      _oLogger.transports = _oMainLogger.transports;
      _oLogger._names = _oMainLogger._names;
    } else if( sID === this.getID() ){ // Creating Main logger
      let oLogOptions = this.__buildWinstonLogOptions( oOptions );
      winston.loggers.add( sID, oLogOptions );
      // Adding WS transports if needed
      if( this.__oOptions.bRemote ){
        let _oWinstonWsTranpsport = require('./Logger.Transports/ws.js');
        winston.loggers.get( sID ).add( _oWinstonWsTranpsport, {
          level: this.__oOptions.sLevel,
  				silent: false, // Should never be silenced
          colorize: true,
          prettyPrint: true,
          timestamp: true,
          port: this.__oOptions.iRemotePort,
          oLogger: this
        } );
      }
    }
    let _oLogger = winston.loggers.get( sID );
    _oLogger.filters.push( function(iLevel, sMsg){ return ( oOptions.sHeader  ? '[ ' + _Logger.__getTag( oOptions.sHeader ) + ' ] ' : '' ) + sMsg; } );
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

  getID(){
    return this.__oOptions.sID;
  }

  __buildWinstonLogOptions( oOptions ){
    // Overwriting options
    oOptions = _.extend( oOptions, {
      sLevel: this.__oOptions.sLevel,
      bSilent: this.__oOptions.bSilent
    });
    // Building options
    let _oLogOptions = {
			console: {
				level: oOptions.sLevel,
				silent: oOptions.bSilent,
        colorize: true,
        prettyPrint: true,
        timestamp: true
			}
		};
    if( oOptions.sLogPath ){
			_oLogOptions.file = {
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
	    };
		}
    return _oLogOptions;
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

  __setRandomStyle(){
    if( this.__oOptions.bUseRandomStyle4Header ){
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
  		this.__oOptions.sHeaderStyleColor = this.__getRandomItemFromArray( _aColours );
      this.__oOptions.sHeaderStyleBackground = this.__getRandomItemFromArray( _aBackground );
    }
  }

  __getTag( sString ){
    return Chalk.styles[ this.__oOptions.sHeaderStyleBackground ].open + Chalk.styles[ this.__oOptions.sHeaderStyleColor ].open + sString + Chalk.styles[ this.__oOptions.sHeaderStyleColor ].close + Chalk.styles[ this.__oOptions.sHeaderStyleBackground ].close;
  }
}

module.exports = Logger;
