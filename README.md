[![Node Version](https://img.shields.io/node/v/restify-loader.svg?maxAge=60)](https://www.npmjs.com/package/restify-loader) [![NPM Version](https://img.shields.io/npm/v/restify-loader.svg?maxAge=60)](https://www.npmjs.com/package/restify-loader) [![NPM License](https://img.shields.io/npm/l/restify-loader.svg?maxAge=60)](https://www.npmjs.com/package/restify-loader) 

[![Build Status](https://drone.stackdot.com/api/badges/stackdot/restify-loader/status.svg?maxAge=60)](https://drone.stackdot.com/stackdot/restify-loader) [![dependencies Status](https://img.shields.io/david/stackdot/restify-loader.svg?maxAge=60)](https://david-dm.org/stackdot/restify-loader)


<p align="center"><img src="etc/logo.png" /></p>


RESTify Loader
===

Load in Restify and Setup basic functionality ( Remove the restify Boilerplate ).

Installation
--- 

```shell
npm install restify-loader
```


Usage
---

```javascript

// REST API Server:
let server = require('restify-loader')({
	dir: __dirname,
	name: 'fresca',
	version: '1.0.0',
	dirs: {
		libs: 'libraries',
		middleware: 'middleware',
		schemas: 'schemas'
	}
}, {
	someData: 'foo'
})

// Add custom stuff to root Server object
// server.use( passport )

// Listen for connections:
server.listen( process.env.PORT || 8080, () => {
	console.log( `Listening to port: ${PORT}` )
})

```


Parameters
---
<a name="parameters"></a>

`restifyLoader( options, routeParams )` **returns** server instance.

> Note that it will always recursively load in all files in the `routes` directory. Do not put `routes` in the 'dirs' object.

- **options** ( Object ) [ required ]
  - **dir** ( String ) [ required ] - Directory from which we execute from. Almost always pass in `__dirname` in your main application.
  - **name** ( String ) [ required ] - *Default: 'rest-api'* - This will be in your HTTP responses. Also this is what all debug messages will be logged under.Eg: If your app name is `fresca` you will enable debugging via: `DEBUG=fresca* npm start`.
  - **version** ( String ) [ required ] - *Default: '1.0.0'* - This will be returned in your HTTP responses. This is useful for versioning APIs.
  - **dirs** ( Object ) [ optional ] - This is a key value set of directories we should recursively require in and attach to every `Route` instance. In the above example `libraries`, `middleware`, and `schemas` are all directories with multiple js files. Every js file will be required in and stored as the filename. If in `libraries` directory you had a file named *helpers.js* it would be accessible in all `Route`s as `this.libs.helpers`.
  - **raven** ( Object ) [ optional ]
    - **DSN** ( String ) [ required ] - DSN string used to report back to Sentry.
    - **context** ( Object ) [ optional ] - Additional context to add to Sentry messages.

- **routeParams** ( Object ) [ optional ] - This is arbitrary data you want passed to each `route` instance. Useful for passing DB connections, etc. to routes.

- **Returns** :: Server ( Object ) - Instance of Restify libraries server object. Very similar to Express' server / app instance. You can attach additional things to the server object before listening. Passport or other Auth for instance.







License
----

[MIT License](http://en.wikipedia.org/wiki/MIT_License)


