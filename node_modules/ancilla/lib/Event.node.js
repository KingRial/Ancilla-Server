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
var Tools = require('./Tools.node.js');
var Constant = require('./Constants.node.js');

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
var Event=function( oOptions ){
	// Default Options
	oOptions = Tools.extend({
		iID: new Date().getTime(),
		sType: null,
		sFromID: null,
		sToID: 'Core',
		//iResult : 0
		//bIsAnswer: false,
		bNeedsAnswer : true,
		iTimeout: 15000, // Milliseconds
	}, oOptions );
	// Initializing Event
	this.__fillByOptions( oOptions );
}

/**
 * Method used to fille the event with datas
 *
 * @method    __fillByOptions
 * @private
 *
 * @param     {Object}		oArray			The datas used to fill the event
 *
 * @return	{Void}
 *
 * @example
 *   Event.__fillByOptions( oArray );
 */
Event.prototype.__fillByOptions = function( oArray ){
	if( oArray ){
		for( var _sField in oArray ){
			this[ _sField ] = oArray[ _sField ];
		}
	}
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
Event.prototype.toString = function(){
	return JSON.stringify( this );
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
Event.prototype.getID = function(){
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
Event.prototype.getType = function(){
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
Event.prototype.getTo = function(){
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
Event.prototype.getFrom = function(){
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
Event.prototype.getTimeout = function(){
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
Event.prototype.isRequest = function(){
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
Event.prototype.isAnswer = function(){
	return ( ! this.isRequest() );
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
Event.prototype.needsAnswer = function(){
	return this.bNeedsAnswer;
}

/**
 * Method used to transform an Event request into an Event answer
 *
 * @method    needsAnswer
 * @public
 *
 * @param     {Number}		[iResult]			The result of the requested operation which needed the answer
 * @param     {Object}		[oAdditionalData]			Additional data to add to the Event answer
 *
 * @return	{Void}
 *
 * @example
 *   Event.setToAnswer( Constant._NO_ERROR );
 *   Event.setToAnswer( oAdditionalData );
 *   Event.setToAnswer( Constant._NO_ERROR, oAdditionalData );
 */
Event.prototype.setToAnswer = function(){
	var oAdditionalData = null;
  var iResult = null;
  switch( arguments.length ){
    case 1:
			var _bIsNumeric = Tools.isNumeric( arguments[ 0 ]  );
			iResult = ( _bIsNumeric ? arguments[ 0 ] : null );
      oAdditionalData = ( !_bIsNumeric ? arguments[ 0 ] : null );
      break;
    default:
			iResult = arguments[ 0 ];
			oAdditionalData = arguments[ 1 ];
      break;
  }
	// It should be an answer so it doesn't require a response anymore... but this can be overwritten using additional datas
	// Removing useless fields to reduce string length
	delete this.bRequireResponse;
	delete this.iTimeout;
	oAdditionalData = Tools.extend({
		sFromID: this.sToID, // Exchanging source with destination
		sToID: this.sFromID, // Exchanging source with destination
		bIsAnswer: true, // Setting answer type
		iResult: ( iResult || Constant._NO_ERROR ), // Setting default response
	}, ( oAdditionalData || {} ) );
	// Filling with additional data
	this.__fillByOptions( oAdditionalData );
}

module.exports = Event;
