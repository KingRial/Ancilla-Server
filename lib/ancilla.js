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
let Technology = require('./Technology.js');
let TechnologyManager = require('./TechnologyManager.js');

module.exports = {
  Technology: new Technology().export( module ),
  TechnologyManager: new TechnologyManager().export( module ),
  DB: require('./DB.js'),
  Datagram: require('./Datagram.js'),
  Endpoint: require('./Endpoint.js'),
  EndpointClient: require('./Endpoint.client.js'),
  EndpointClientNet: require('./Endpoint.client.net.js'),
  EndpointServer: require('./Endpoint.server.js'),
  Object: require('./Object.js'),
  ObjectGeneric: require('./Object.generic.js'),
  Event: require('./Event.js'),
  EventHandler: require('./EventHandler.js'),
  Constant: require('./Constants.js')
};
