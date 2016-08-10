
'use strict';

const EventEmitter = require('events')
let lodash = require('lodash')

module.exports = class RESTroute extends EventEmitter {

	constructor( name, server ) {

		// Extend the EventEmitter:
		super()
		let self = this

		// Setup debugging:
		this.debug = require('debug')( `restify-${name}` )

		// Register args:
		this.server = server
		this.params = server._routeParams
		this._events = server._events
		this._raven = server._raven
		this._name = name

		// Register Directories as keys:
		lodash.each(server._dirs, ( files, dir ) => {
			// Make sure we arent overwritting something:
			if(!lodash.isEmpty( self[dir] ))
				throw Error(`Key '${dir}' is already on this classes object. Please try using a different directory name/key`)
			// Attach it to this class:
			self[dir] = files
		})

		// Log for each new route:
		this.debug('Route Created!')

		// Kick off init:
		this.init()

	}

	// This should be overwritten:
	init(){
		this.debug('Route Initialized ( Your route class should overwrite this init function )')
	}

}