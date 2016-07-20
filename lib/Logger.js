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
let Bluebird = require('bluebird');
let winston = require('winston');
let Chalk = require('chalk');

let Constant = require('./Constants.js');

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

  setLevel( sLevel ){
    console.error( '---->TODO Logger set Level', sLevel );
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
      winston.loggers.add( sID, { transports: _aTransports } );
    }
    this.__addRemoteTransport( sID, oOptions );
    winston.loggers.get( sID ).filters.push( function( sHeader ){ return function(iLevel, sMsg){ return ( sHeader  ? '[ ' + sHeader + ' ] ' : '' ) + sMsg; }; }( ( oOptions.sHeader ?_Logger.__getTag( oOptions ) : null ) ) );
    //
    if( oOptions.sLogPath ){
			winston.loggers.get( sID ).info( 'Log ID "%s" logging level "%s" on file: "%s"...', sID, oOptions.sLevel, oOptions.sLogPath );
		}
    if( oOptions.sRemote ){
      winston.loggers.get( sID ).info( 'Log ID "%s" logging level "%s" using remote transport "%s"...', sID, oOptions.sLevel, oOptions.sRemote );
    }
    winston.loggers.get( sID ).info( 'Log ID "%s" logging level "%s" on console...', sID, oOptions.sLevel );
  }

  __addRemoteTransport( _sLoggerID, oOptions ){
    oOptions = _.extend({
      sRemote: false
    }, oOptions );
    if( oOptions.sRemote && ( oOptions.sRemote === 'mqtt' || oOptions.sRemote === 'ws' )){
      this.__oTransportLogRemote = ( this.__oTransportLogRemote ? this.__oTransportLogRemote : new (require('./Logger.Transports/' + oOptions.sRemote +'.js'))({
        sLevel: oOptions.sLevel
      }));
      /*
      // TODO: Correct way  ( but we can't create more instance of the same transport... how to deal with it ? )
      let _Transport = require('./Logger.Transports/' + oOptions.sRemote +'.js');
      winston.loggers.loggers[ _sLoggerID ].add( _Transport, {
        sLevel: oOptions.sLevel
      });
      */
      // TODO: Wrong way  ( since we can't create more instance of the same transport we are following this solution )
      let _sID = this.__oTransportLogRemote.getID();
      winston.loggers.loggers[ _sLoggerID ].transports[ _sID ] = this.__oTransportLogRemote;
      winston.loggers.loggers[ _sLoggerID ]._names = winston.loggers.loggers[ _sLoggerID ]._names.concat( _sID );
      return this.__oTransportLogRemote.ready();
    }
    return Bluebird.resolve();
  }

  enableRemoteTransport( oOptions ){
    oOptions = _.extend({
      sRemote: false
    }, oOptions );
    if( oOptions.sRemote && ( oOptions.sRemote === 'mqtt' || oOptions.sRemote === 'ws' )){
      let _aPromises = [ Bluebird.resolve() ];
      let _oLoggers = winston.loggers.loggers;
      for( let _sLoggerID in _oLoggers ){
        if( _oLoggers.hasOwnProperty( _sLoggerID ) ){
          let _bFound = false;
          let _oTransports = _oLoggers[ _sLoggerID ].transports;
          for( let _sTransportID in _oTransports ){
            if( _oTransports.hasOwnProperty( _sTransportID ) && _sTransportID.match('(wstransport|mqtttransport)') ){
              _bFound = true;
            }
          }
          if( !_bFound ){
            // Adding remote transport if needed
            _aPromises.push( this.__addRemoteTransport( _sLoggerID, oOptions ) );
          }
        }
      }
      return Bluebird.all( _aPromises );
    } else {
      Bluebird.reject( Constant._ERROR_GENERIC_UNKNOWN );
    }
  }

  disableRemoteTransport(){
    let _aPromises = [ Bluebird.resolve() ];
    let _oLoggers = winston.loggers.loggers;
    for( let _sLoggerID in _oLoggers ){
      if( _oLoggers.hasOwnProperty( _sLoggerID ) ){
        let _oTransports = _oLoggers[ _sLoggerID ].transports;
        for( let _sTransportID in _oTransports ){
          if( _oTransports.hasOwnProperty( _sTransportID ) && _sTransportID.match('(wstransport|mqtttransport)') ){
            // Killing Transport
            _aPromises.push( _oTransports[ _sTransportID ].destroy() );
            delete _oTransports[ _sTransportID ];
          }
        }
      }
    }
    return Bluebird.all( _aPromises );
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
