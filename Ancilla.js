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

var Core = require('./integrations/Core/Technology.Core.js');
/*
 * This is the same as using the following command line:
 * node ./integrations/Core/Technology.Core.js
 * babel-node ./integrations/Core/Technology.Core.js
 *
 * if you wish to use Debug:
 * node ./integrations/Core/Technology.Core.js --debug
 * babel-node -- ./integrations/Core/Technology.Core.js --debug
 */
module.exports = new Core().run({
  sAssetsPath: './integrations/Core'
}, module );
