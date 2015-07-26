Ancilla Server — CHANGELOG
==================================================

#v0.1.0
- Using ES6 standards and babel as a transpiler
- Refactored code to be used as a simple NPM's library
- Reworked code: first step to obtain an easier environment to create, debug and test scripts to integrate different technologies in the same supervisor.
- Refactored DB management to easily add, mantain, use a DB for each technology/integration using [sequelize](http://docs.sequelizejs.com/en/latest/): each integration/technology has now a DB subdirectory in which you will find DB's "models" and "migrations" and the current used DB
- Using breeze-sequelize to open a possible new type of communication with the Web UI using [Breeze](http://www.getbreezenow.com/)
- Added automatic testing
- Added log rotation
- Various fixing

#v0.0.3
- Added to GiTHub
