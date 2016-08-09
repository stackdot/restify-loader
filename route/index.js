
'use strict';

const EventEmitter = require('events');

module.exports = class RESTroute extends EventEmitter {

	constructor(name, server, events, raven, libs) {

		// Extend the EventEmitter:
		super();

		// Setup debugging:
		this.debug = require('debug')( `restify-${name}` );
		console.log = this.debug;

		// Register args:
		this.server = server;
		this._events = events;
		this.libs = libs;
		this._raven = raven;

		// Log for each new route:
		this.debug('Route Created!');

		// Kick off init:
		this.init();

	}

	// This should be overwritten:
	init(){
		console.log('Route Initialized ( Your route class should overwrite this init function )');
	}

}