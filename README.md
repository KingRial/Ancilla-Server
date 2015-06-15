[Ancilla](http://ancilla.com/) — Free Home Automation [![Build Status](https://travis-ci.org/ancilla/ancilla.svg)](https://travis-ci.org/ancilla/ancilla)
==================================================

[![ZenHub](https://raw.githubusercontent.com/ZenHubIO/support/master/zenhub-badge.png)](https://zenhub.io)
[![Join the chat at https://gitter.im/ancilla/discuss](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/ancilla/discuss?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Ancilla it's the server-side part of the [Ancilla](http://ancilla.com/) project.
Built with [nodeJS](https://nodejs.org/) the purpose is to create a scalable, secure, customizable and free solution to handle home automation.

See documentation for details.

*Please be aware this is just an experimental version used to test technologies and solutions; it's still far from being complete*

*Any idea or contribution is welcome!*

Changelog
----------------------------
#v0.0.3
- Added to GiTHub

Project documentation
----------------------------
Here a simple and minimal description of the experimental project intent.

Using Ancilla as a middleware will allow to easily create independent sandboxes for each technology desired to be integrated inside the home automation.
![Ancilla Concept](https://raw.github.com/KingRial/Ancilla/blob/master/Docs/DemoConcept.png)
The Ancilla server is composed by:
- a "Core" service able to centralize all the aspects for a correct supervision
- multiple independent "Technology" services for each handled technology
On the previous concept there "Core" service will handle all the communications with the clients and will start the two other services.
- The KNX service will handle the communication with the KNX bus and signal specific events to the "Core" when needed
- The Bridge service is a simple technology which will just route every information received on a specific endpoints to all the other endpoints.

Each service can be described with the following concept diagram:
![Technology Concept](https://raw.github.com/KingRial/Ancilla/blob/master/Docs/TechnologyConcept.png)
The technology, like a simple plugin or addon, is independent from all the rest of the Ancilla software using it's own database if needed and it's own programming logics.
However it will communicate with all the other services by a standard message called "Ancilla Event".

Each "Ancilla Event" is just a simple JSON message following specific signatures.

API
----------------------------
Here the ![API documentation](https://raw.github.com/KingRial/Ancilla/blob/master/Docs/Ancilla.node.html) for Ancilla

How to install your own Ancilla server
----------------------------

Clone a copy of the main Ancilla git repo by running:

```bash
git clone git://github.com/ancilla/ancilla.git
```

Enter the ancilla directory and run the build script:
```bash
cd node_modules/ancilla
npm install
```

Now you are ready to start the server execution
```bash
node Ancilla.node.js
```

Debug
--------------------------------------
If you wish to see all the debug messages use the following options while starting Ancilla
```bash
node Ancilla.node.js --debug
```

Running the Unit Tests
--------------------------------------
TODO

The future
--------------------------------------
- Add tests
- Add HTTPS/WSS support
- Add Nest support
- Add KNX support
- more to come!

License
-------
[GNU3](http://www.gnu.org/licenses/gpl-3.0.html)
