'use strict'



// Require Modules:
const colors = require('colors')
const restify = require('restify')
const lodash = require('lodash')
const CookieParser = require('restify-cookies')
const restifyValidation = require('node-restify-validation')
const requireDir = require('require-dir')
const path = require('path')
const EventEmitter = require('events')
class _AppEmitter extends EventEmitter {}



// Set custom Colors theme:
colors.setTheme({
	verbose: 'gray',
	info: 'gray',
	warn: ['bgYellow', 'black'],
	good: 'green',
	debug: 'cyan',
	error: ['bgRed', 'white']
})



// Export the Main Class:
module.exports = function( options = {}, routeParams = {} ){

	const debug = require('debug')(`${options.name}:rl`)
	debug('Loader Options:'.info, JSON.stringify(options, null, 4).info )

	// Load routes:
	// Always load routes:
	let Routes = requireDir( path.resolve( options.dir, 'routes' ) )
	// Additional defined dirs to load in:
	let dirs = {}
	lodash.each(options.dirs, ( value, dir ) => {
		debug( `Loading Directory: ${dir}`.info )
		dirs[dir] = requireDir( path.resolve( options.dir, value ) )
	})


	// Create REST API:
	let server = restify.createServer({
		name: options.name || 'rest-api',
		version: options.version || '1.0.0',
	})


	// Setup Server
	server.use(restify.acceptParser(server.acceptable));
	server.pre(restify.CORS({
		credentials: true
	}))
	server.pre(restify.fullResponse());
	server.use(restify.dateParser());
	server.use(restify.queryParser());
	server.use(restify.bodyParser({ mapParams: true }));
	server.use(restifyValidation.validationPlugin({
		errorsAsArray: true,
	}))
	server.use(restify.jsonp());
	server.use(restify.gzipResponse());
	server.use(CookieParser.parse);
	server.use(restify.throttle({
		burst: 100,
		rate: 50,
		ip: true,
		overrides: {
			'127.0.0.1': {
				rate: 0,
				burst: 0
			}
		}
	}))

	// Attach to server for easy reference outside:
	server._events = new _AppEmitter()
	server._dirs = dirs
	server._options = options
	server._routeParams = routeParams


	// Sentry Error Reporting:
	server._raven = null
	if( options.raven ){

		debug('Sentry [Enabled]'.good)
		server._raven = new require('raven').Client( options.raven.DSN )
		server._raven.setTagsContext( options.raven.context || { ENV: 'localhost' } )
		server._raven.patchGlobal()

		// Error reporting to Sentry:
		function sendErrorToSentry( level ){
			return function(req, res, err){
				console.log('ERROR'.error, err)
				server._raven.captureException( err, {
					level: level
				})
				return res.send( err )
			}
		}
		server.on('uncaughtException', (req, res, route, err) => {
			server._raven.captureException( err )
		})
		server.on('InternalServer', sendErrorToSentry('error'))
		server.on('NotFound', sendErrorToSentry('warning'))
		server.on('MethodNotAllowed', sendErrorToSentry('warning'))
		server.on('VersionNotAllowed', sendErrorToSentry('error'))
		server.on('UnsupportedMediaType', sendErrorToSentry('error'))
		server.on('after', (req, res, route, err) => {
			if(err) server._raven.captureException( err )
		})

	}


	// Allow Cookies to be sent via browser
	server.use(( req, res, next ) => {
		res.header('Access-Control-Allow-Credentials', true)
		next()
	})


	// For load balancer health checks
	server.get( '/ping', ( req, res, next ) => {
		res.send( 200 )
	})


	// Register all the routes:
	server.LoadedRoutes = {}
	lodash.map( Routes, ( route, name ) => {
		debug(`Registering Route: ${name}`.info)
		server.LoadedRoutes[ name ] = new route( name, server )
	})


	// Serve up docs
	server.get(/\/specs\/?.*/, restify.serveStatic({
		directory: path.resolve( options.dir, '../' )
	}))


	return server


}

