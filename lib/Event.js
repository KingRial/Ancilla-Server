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

let AncillaObject = require('./Object.js');
let Constant = require('./Constants.js');

/**
 * A class to describe an Ancilla Event
 *
 * @class	Event
 * @public
 *
 * @param	{Object}		oOptions		Default datas to fill the newly created Ancilla Event
 *
 * @return	{Void}
 *
 * @example
 *		new Event( { sType: 'test-event' } );
 */
class Event extends AncillaObject {
	constructor( oOptions ){
		// Default Options
    let __oOptionsDefault = {
      iID: null, // TODO: could be renamed to sSessionID for better understanding
			sType: null, // TODO: could be renamed to sServiceType for better understanding
			sFromID: null, // 'null' means whoever receive the event is the correct source
			sToID: null, // 'null' means whoever receive the event is the correct target
			//iResult : 0
			//bIsAnswer: false,
			bNeedsAnswer : true,
			iTimeout: 15000, // Milliseconds
    };
    // Custom options
		oOptions = _.extend( {}, __oOptionsDefault, {
			iID: new Date().getTime()
		}, oOptions );
		super( oOptions );
    this.__oOptionsDefault = __oOptionsDefault;
	}

	/**
	 * Method used to return Event ID
	 *
	 * @method    getID
	 * @public
	 *
	 * @return    {Number}	it returns the Event ID
	 *
	 * @example
	 *   Event.getID();
	 */
	getID(){
		return this.iID;
	}

	/**
	 * Method used to return Event type
	 *
	 * @method    getType
	 * @public
	 *
	 * @return    {String}	it returns the Event type
	 *
	 * @example
	 *   Event.getType();
	 */
	getType(){
		return this.sType;
	}

	/**
	 * Method used to return Event recipient
	 *
	 * @method    getTo
	 * @public
	 *
	 * @return    {String}	it returns the Event recipient
	 *
	 * @example
	 *   Event.getTo();
	 */
	getTo(){
		return this.sToID;
	}

	/**
	 * Method used to return Event sender
	 *
	 * @method    getFrom
	 * @public
	 *
	 * @return    {String}	it returns the Event sender
	 *
	 * @example
	 *   Event.getFrom();
	 */
	getFrom(){
		return this.sFromID;
	}

	/**
	 * Method used to return Event timeout ( milliseconds )
	 *
	 * @method    getTimeout
	 * @public
	 *
	 * @return    {Number}	it returns the Event timeout ( milliseconds )
	 *
	 * @example
	 *   Event.getTimeout();
	 */
	getTimeout(){
		return this.iTimeout;
	}

	/**
	 * Method used to understand if the Event is a Request
	 *
	 * @method    isRequest
	 * @public
	 *
	 * @return    {Boolean}	it returns true if it's a request
	 *
	 * @example
	 *   Event.isRequest();
	 */
	isRequest(){
		return ( this.bIsAnswer ? false : true );
	}

	/**
	 * Method used to understand if the Event is an Answer
	 *
	 * @method    isAnswer
	 * @public
	 *
	 * @return    {Boolean}	it returns true if it's an Answer
	 *
	 * @example
	 *   Event.isAnswer();
	 */
	isAnswer(){
		return ( ! this.isRequest() );
	}

  /**
	 * Method used to understand if the Event is an Answer was successfull
	 *
	 * @method    isAnswerSuccessfull
	 * @public
	 *
	 * @return    {Boolean}	it returns true if it's a successfull Answer
	 *
	 * @example
	 *   Event.isAnswer();
	 */
	isAnswerSuccessfull(){
		return ( this.iResult === Constant._NO_ERROR );
	}

  /**
	 * Method used to obtain the answer's result
	 *
	 * @method    getAnswerResult
	 * @public
	 *
	 * @return    {Number}	it returns the answer result
	 *
	 * @example
	 *   Event.getAnswerResult();
	 */
	getAnswerResult(){
		return this.iResult;
	}

	/**
	 * Method used to understand if the Event request needs an answer
	 *
	 * @method    needsAnswer
	 * @public
	 *
	 * @return    {Boolean}	it returns true if it needs an answer
	 *
	 * @example
	 *   Event.needsAnswer();
	 */
	needsAnswer(){
		return ( !this.isAnswer() && this.bNeedsAnswer );
	}

	/**
	 * Method used to transform an Event request into an Event answer
	 *
	 * @method    needsAnswer
	 * @public
	 *
	 * @param     {Number}		[iResultOrAdditionalData]			The result of the requested operation which needed the answer or the addittional data to add to the response; if nothind used the answer is considered without errors
	 * @param     {Object}		[oAdditionalData]			Additional data to add to the Event answer
	 *
	 * @return	{Void}
	 *
	 * @example
	 *   Event.setToAnswer( Constant._NO_ERROR );
	 *   Event.setToAnswer( oAdditionalData );
	 *   Event.setToAnswer( Constant._NO_ERROR, oAdditionalData );
	 */
	setToAnswer( iResultOrAdditionalData, oAdditionalData ){
		let _oAdditionalData = null;
	  let _iResult = null;
	  if( !oAdditionalData ){
      if( typeof iResultOrAdditionalData === 'object' ){
        _oAdditionalData = iResultOrAdditionalData;
      } else {
        _iResult = iResultOrAdditionalData;
      }
    } else {
      _iResult = iResultOrAdditionalData;
      _oAdditionalData = oAdditionalData;
    }
		// It should be an answer so it doesn't require a response anymore... but this can be overwritten using additional datas
		// Removing useless fields to reduce string length
		delete this.bNeedsAnswer;
		delete this.iTimeout;
		_oAdditionalData = _.extend({
			sFromID: this.getTo(), // Exchanging source with destination
			sToID: this.getFrom(), // Exchanging source with destination
			bIsAnswer: true, // Setting answer type
			iResult: ( _iResult || Constant._NO_ERROR ), // Setting default response
		}, ( _oAdditionalData || {} ) );
		// Filling with additional data
		this.__fillByOptions( _oAdditionalData );
	}

	/**
	 * Method used to check if the target ID used as an argument is the event's target
	 *
	 * @method    isTarget
	 * @public
	 *
	 * @param     {String}		sTargetID		The target ID to check
	 *
	 * @return	{Boolean}	true if the target is the event's target
	 *
	 * @example
	 *   Event.isTarget( 'Core' );
	 */
	isTarget( sTargetID ){
		return ( !this.getTo() || this.getTo() === sTargetID );
	}

	/**
	 * Method used to check if the source ID used as an argument is the event's source
	 *
	 * @method    isTarget
	 * @public
	 *
	 * @param     {String}		sSourceID		The source ID to check
	 *
	 * @return	{Boolean}	true if the target is the event's source
	 *
	 * @example
	 *   Event.isTarget( 'Core' );
	 */
	isSource( sSourceID ){
		return ( !this.getFrom() || this.getFrom() === sSourceID );
	}

  /**
   * Method used to convert Event to String
   *
   * @method    toString
   * @public
   *
   * @return    {String}	the converted string which describes current Event
   *
   * @return	{Void}
   *
   * @example
   *   Event.toString();
   */
  toString(){
    let _oParsedObj = {};
    for( let _sField in this ){
      if( this.hasOwnProperty( _sField ) && typeof this[ _sField ] !== 'function' ){
        // Ignoring null field and default options to create a smaller MQTT payload
        if( this[ _sField ] !== null &&  ( _sField!=='__oOptionsDefault' && ( this.__oOptionsDefault[ _sField ] === null || this[ _sField ] !== this.__oOptionsDefault[ _sField ] ) ) ){
          _oParsedObj[ _sField ] = this[ _sField ];
        }
      }
    }
    return JSON.stringify( _oParsedObj );
  }
}

module.exports = Event;
