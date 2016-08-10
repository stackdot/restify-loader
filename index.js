'use strict'


// Require Modules:
let restify = require('restify')
let lodash = require('lodash')
let debug = require('debug')('restify-loader')
console.log = debug
let CookieParser = require('restify-cookies')
let restifyValidation = require('node-restify-validation')
let requireDir = require('require-dir')
let path = require('path')
const EventEmitter = require('events')
class _AppEmitter extends EventEmitter {}
const AppEmitter = new _AppEmitter()


module.exports = function( options = {}, routeParams = {} ){

	console.log('options', options)

	// Load routes:
	let Routes = requireDir( path.resolve( options.dir, './routes/' ) )
	let Libs = requireDir( path.resolve( options.dir, './libs/' ) )


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


	// Sentry Error Reporting:
	let ravenClient = null;
	if( options.raven ){

		console.log('enable sentry')
		ravenClient = new require('raven').Client( options.raven.DSN )
		ravenClient.setTagsContext( options.raven.context || { ENV: 'localhost' } )
		ravenClient.patchGlobal()

		// Error reporting to Sentry:
		function sendErrorToSentry( level ){
			return function(req, res, err){
				ravenClient.captureException( err, {
					level: level
				});
				return res.send( err )
			}
		}
		server.on('uncaughtException', function(req, res, route, err){
			ravenClient.captureException( err )
		});
		server.on('InternalServer', sendErrorToSentry('error'));
		server.on('NotFound', sendErrorToSentry('warning'));
		server.on('MethodNotAllowed', sendErrorToSentry('warning'));
		server.on('VersionNotAllowed', sendErrorToSentry('error'));
		server.on('UnsupportedMediaType', sendErrorToSentry('error'));
		server.on('after', function(req, res, route, err){
			if(err) ravenClient.captureException( err )
		})

	}


	// Allow Cookies to be sent via browser
	server.use(function( req, res, next ){
		res.header('Access-Control-Allow-Credentials', true)
		next()
	});


	// For load balancer health checks
	server.get( '/ping', function( req, res, next ){
		res.send( 200 )
	});


	// Register all the routes:
	server.LoadedRoutes = {};
	lodash.map( Routes, function( route, name ){
		debug(`Registering Route: ${name}`)
		server.LoadedRoutes[ name ] = new route( name, server, AppEmitter, ravenClient, Libs, routeParams )
	});


	// Serve up docs
	server.get(/\/specs\/?.*/, restify.serveStatic({
		directory: path.resolve( options.dir, '../' )
	}));


	return server;


}