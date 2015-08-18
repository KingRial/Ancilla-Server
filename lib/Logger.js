var _ = require('lodash');
var winston = require('winston');
var Chalk = require('chalk');

class Logger {
  constructor( oLoggerOptions, oTargetToExtend ){
    this.__oOptions = _.extend({
      sID: 'logger',
      sLevel: 'debug',
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
    // Translating Ancilla options to Winston options
    var _oLogOptions = {
			console: {
				level: this.__oOptions.sLevel,
				silent: this.__oOptions.bSilent,
        colorize: true,
        prettyPrint: true,
        timestamp: true
			}
		};
    if( this.__oOptions.sLogPath ){
			_oLogOptions.file = {
        level: this.__oOptions.sLevel,
				filename: this.__oOptions.sLogPath,
				maxsize: this.__oOptions.iLogMaxSize, // 500 kB
				maxFiles: this.__oOptions.iLogMaxFiles,
        prettyPrint: true,
        timestamp: true,
				json: false,
				tailable: true,
				zippedArchive: true,
				exitOnError: false
	    };
		}
    winston.loggers.add( this.getID(), _oLogOptions );
    // Extending target with log methods if needed
    if( oTargetToExtend ){
      this.extend( oTargetToExtend );
    }
    if( _oLogOptions.file ){
			this.info( 'Log ID "%s" logging on console and file: "%s" for "%s"...', this.getID(), _oLogOptions.file.filename );
		} else {
      this.info( 'Log ID "%s" logging on console...', this.getID() );
    }
  }

  extend( oTarget ) {
    var _Logger = this;
    [ 'silly', 'debug', 'verbose', 'info', 'warn', 'error' ].forEach( function( sMethod ){
      oTarget[ sMethod ] = function(){
        return _Logger[ sMethod ].apply( _Logger, arguments );
      };
    });
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

  __getRandomItemFromArray( aArray, aFilterArray ){
		if( !aFilterArray ){
			aFilterArray = [];
		}
		var _aFilteredArray = aArray.filter(function( sElement ){
			for( let _sElement of aFilterArray ){
				if( _sElement === sElement ){
					return false;
				}
			}
			return true;
		});
		return _aFilteredArray[ Math.floor( Math.random() * _aFilteredArray.length ) ];
	}

  __setRandomStyle(){
    if( this.__oOptions.bUseRandomStyle4Header ){
      /*
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
      */
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
      //var _sModifier = this.__getRandomItemFromArray( _aMofiers );
  		this.__oOptions.sHeaderStyleColor = this.__getRandomItemFromArray( _aColours );
      this.__oOptions.sHeaderStyleBackground = this.__getRandomItemFromArray( _aBackground );
    }
  }

  __setStyleToHeader( sString ){
    return Chalk.styles[ this.__oOptions.sHeaderStyleBackground ].open + Chalk.styles[ this.__oOptions.sHeaderStyleColor ].open + sString + Chalk.styles[ this.__oOptions.sHeaderStyleColor ].close + Chalk.styles[ this.__oOptions.sHeaderStyleBackground ].close;
  }

  silly( ...args ){
    args[ 0 ] = ( this.__oOptions.sHeader  ? '[ ' + this.__setStyleToHeader( this.__oOptions.sHeader ) + ' ] ' : '' ) + args[ 0 ];
    args.unshift( 'silly' );
    var _oLogRotation = this.get( this.getID() );
    _oLogRotation.log( ...args );
  }

  debug( ...args ){
    args[ 0 ] = ( this.__oOptions.sHeader  ? '[ ' + this.__setStyleToHeader( this.__oOptions.sHeader ) + ' ] ' : '' ) + args[ 0 ];
    args.unshift( 'debug' );
    var _oLogRotation = this.get( this.getID() );
    _oLogRotation.log( ...args );
  }

  verbose( ...args ){
    args[ 0 ] = ( this.__oOptions.sHeader  ? '[ ' + this.__setStyleToHeader( this.__oOptions.sHeader ) + ' ] ' : '' ) + args[ 0 ];
    args.unshift( 'verbose' );
    var _oLogRotation = this.get( this.getID() );
    _oLogRotation.log( ...args );
  }

  info( ...args ){
    args[ 0 ] = ( this.__oOptions.sHeader  ? '[ ' + this.__setStyleToHeader( this.__oOptions.sHeader ) + ' ] ' : '' ) + args[ 0 ];
    args.unshift( 'info' );
    var _oLogRotation = this.get( this.getID() );
    _oLogRotation.log( ...args );
	}

	warn( ...args ){
    args[ 0 ] = ( this.__oOptions.sHeader  ? '[ ' + this.__setStyleToHeader( this.__oOptions.sHeader ) + ' ] ' : '' ) + args[ 0 ];
    args.unshift( 'warn' );
    var _oLogRotation = this.get( this.getID() );
    _oLogRotation.log( ...args );
	}

	error( ...args ){
    args[ 0 ] = ( this.__oOptions.sHeader  ? '[ ' + this.__setStyleToHeader( this.__oOptions.sHeader ) + ' ] ' : '' ) + args[ 0 ];
    args.unshift( 'error' );
    var _oLogRotation = this.get( this.getID() );
    _oLogRotation.log( ...args );
	}

}

module.exports = Logger;
