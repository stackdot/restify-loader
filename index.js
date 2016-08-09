
'use strict';


const DSN = process.env.DSN || '';

// Sentry Error Reporting:
var raven = require('raven');
var client = new raven.Client( DSN );
client.setTagsContext({ ENV: process.env.ENVIRONMENT || "localhost" });
client.patchGlobal();


// Default variables:
const PORT = process.env.PORT || 8080;


// Require Modules:
var restify = require('restify');
var lodash = require('lodash');
var debug = require('debug')('restify-loader');
var CookieParser = require('restify-cookies');
var requireDir = require('require-dir');
var path = require('path');
const EventEmitter = require('events');
class _AppEmitter extends EventEmitter {}
const AppEmitter = new _AppEmitter();


console.log('dirname', __dirname);

module.exports = function( options = {} ){

	// Load routes:
	var Routes = requireDir('./routes/');


	// Create REST API:
	var server = restify.createServer({
		name: options.name || 'rest-api',
		version: options.version || '1.0.0',
	});



	// Setup Server
	server.use(restify.acceptParser(server.acceptable));
	server.pre(restify.CORS({
		credentials: true
	}));
	server.pre(restify.fullResponse());
	server.use(restify.dateParser());
	server.use(restify.queryParser());
	server.use(restify.jsonp());
	server.use(restify.gzipResponse());
	server.use(restify.bodyParser({ mapParams: true }));
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
	}));



	// Error reporting to Sentry:
	function sendErrorToSentry( level ){
		return function(req, res, err){
			client.captureException( err, {
				level: level
			});
			return res.send( err );
		}
	}
	server.on('uncaughtException', function(req, res, route, err){
		client.captureException( err );
	});
	server.on('InternalServer', sendErrorToSentry('error'));
	server.on('NotFound', sendErrorToSentry('warning'));
	server.on('MethodNotAllowed', sendErrorToSentry('warning'));
	server.on('VersionNotAllowed', sendErrorToSentry('error'));
	server.on('UnsupportedMediaType', sendErrorToSentry('error'));
	server.on('after', function(req, res, route, err){
		if(err) client.captureException( err );
	});




	// Allow Cookies to be send via client
	server.use(function( req, res, next ){
		res.header('Access-Control-Allow-Credentials', true);
		next();
	});



	// For load balancer health checks
	server.get( '/ping', function( req, res, next ){
		res.send( 200 );
	});



	// Register all the routes:
	server.LoadedRoutes = {};
	lodash.map( Routes, function( route, name ){
		debug('Registering Route:', name);
		server.LoadedRoutes[ name ] = new route( server, AppEmitter );
	});



	// Serve up docs
	server.get(/\/specs\/?.*/, restify.serveStatic({
		directory: path.resolve( __dirname, '../' )
	}));



	// Listen for connections:
	server.listen(PORT, function(){
		debug('Listening to port', PORT);
	});


}