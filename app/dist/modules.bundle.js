exports.ids = ["modules"];
exports.modules = {

/***/ "./app/config.json":
/*!*************************!*\
  !*** ./app/config.json ***!
  \*************************/
/*! exports provided: initializationUrls, parameters, database, default */
/***/ (function(module) {

module.exports = {"initializationUrls":["terria"],"parameters":{"googleUrlShortenerKey":null,"googleAnalyticsKey":null,"googleAnalyticsOptions":null,"disclaimer":{"text":"Disclaimer: This map must not be used for navigation or precise spatial analysis","url":""},"appName":"Terria Map","brandBarElements":["","<a target=\"_blank\" href=\"https://terria.io\"><img src=\"images/terria_logo.png\" height=\"52\" title=\"Version: {{version}}\" /></a>",""],"supportEmail":"help@example.com","proj4ServiceBaseUrl":"proj4def/","feedbackUrl":"feedback","mobileDefaultViewerMode":"2d","experimentalFeatures":true},"database":{"type":"mysql","host":"localhost","username":"","password":""}};

/***/ }),

/***/ "./app/core/app.ts":
/*!*************************!*\
  !*** ./app/core/app.ts ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Using require as it is simpler instead of typescript's import/export derived syntax. 
// See typescript's "export = and import = require()" modules documentation section. 
// Documentation: https://www.typescriptlang.org/docs/handbook/modules.html
// This works well with the existing codebase.
var fs = __webpack_require__(/*! fs */ "fs");
var cluster = __webpack_require__(/*! cluster */ "cluster");
var exists = __webpack_require__(/*! ./exists */ "./app/core/exists.ts");
var serveroptions = __webpack_require__(/*! ./serveroptions */ "./app/core/serveroptions.ts");
var configureserver = __webpack_require__(/*! ./configureserver */ "./app/core/configureserver.ts");
var configuredatabase = __webpack_require__(/*! ./configuredatabase */ "./app/core/configuredatabase.ts");
class app {
    init() {
        this.options = new serveroptions();
        this.options.init(true);
        if (cluster.isMaster) {
            console.log('TerriaJS Server ' + __webpack_require__(/*! ../../package.json */ "./package.json").version); // The master process just spins up a few workers and quits.
            if (fs.existsSync('terriajs.pid')) {
                this.warn('TerriaJS-Server seems to be running already.');
            }
            this.portInUse(this.options.port, this.options.listenHost);
            if (this.options.listenHost !== 'localhost') {
                this.runMaster();
            }
            else {
                this.startServer(this.options);
                this.connectDatabase();
            }
        }
        else {
            // We're a forked process.
            this.startServer(this.options);
            this.connectDatabase();
        }
    }
    portInUse(port, host) {
        var server = __webpack_require__(/*! net */ "net").createServer();
        server.listen(port, host);
        server.on('error', function () {
            console.log('Port ' + port + ' is in use. Exit server using port 3001 and try again.');
        });
        server.on('listening', function () {
            server.close();
        });
    }
    error(message) {
        console.error('Error: ' + message);
        process.exit(1);
    }
    warn(message) {
        console.warn('Warning: ' + message);
    }
    handleExit() {
        console.log('(TerriaJS-Server exiting.)');
        if (fs.existsSync('terriajs.pid')) {
            fs.unlinkSync('terriajs.pid');
        }
        process.exit(0);
    }
    runMaster() {
        var cpuCount = __webpack_require__(/*! os */ "os").cpus().length;
        // Let's equate non-public, localhost mode with "single-cpu, don't restart".
        if (this.options.listenHost === 'localhost') {
            cpuCount = 1;
        }
        console.log('Serving directory "' + this.options.wwwroot + '" on port ' + this.options.port + ' to ' + (this.options.listenHost ? this.options.listenHost : 'the world') + '.');
        __webpack_require__(/*! ./controllers/convert */ "./app/core/controllers/convert.js")().testGdal();
        if (!exists(this.options.wwwroot)) {
            this.warn('"' + this.options.wwwroot + '" does not exist.');
        }
        else if (!exists(this.options.wwwroot + '/index.html')) {
            this.warn('"' + this.options.wwwroot + '" is not a TerriaJS wwwroot directory.');
        }
        else if (!exists(this.options.wwwroot + '/build')) {
            this.warn('"' + this.options.wwwroot + '" has not been built. You should do this:\n\n' +
                '> cd ' + this.options.wwwroot + '/..\n' +
                '> gulp\n');
        }
        if (typeof this.options.settings.allowProxyFor === 'undefined') {
            this.warn('The configuration does not contain a "allowProxyFor" list.  The server will proxy _any_ request.');
        }
        process.on('SIGTERM', this.handleExit);
        // Listen for dying workers
        cluster.on('exit', function (worker) {
            if (!worker.suicide) {
                // Replace the dead worker if not a startup error like port in use.
                if (this.options.listenHost === 'localhost') {
                    console.log('Worker ' + worker.id + ' died. Not replacing it as we\'re running in non-public mode.');
                }
                else {
                    console.log('Worker ' + worker.id + ' died. Replacing it.');
                    cluster.fork();
                }
            }
        });
        fs.writeFileSync('terriajs.pid', process.pid.toString());
        console.log('(TerriaJS-Server running with pid ' + process.pid + ')');
        console.log('Launching ' + cpuCount + ' worker processes.');
        // Create a worker for each CPU
        for (var i = 0; i < cpuCount; i += 1) {
            cluster.fork();
        }
    }
    startServer(options) {
        this.server = configureserver.start(options); // Set server configurations and generate server. We replace app here with the actual application server for proper naming conventions.
        this.server.listen(options.port, options.listenHost, () => console.log(`Terria framework running on ${options.port}!`)); // Start HTTP/s server with expressjs middleware.
    }
    connectDatabase() {
        this.db = configuredatabase.start(); // Run database configuration and get database object for the framework.
    }
}
module.exports = app;


/***/ }),

/***/ "./app/core/configuredatabase.ts":
/*!***************************************!*\
  !*** ./app/core/configuredatabase.ts ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var database = __webpack_require__(/*! ./database */ "./app/core/database.ts");
var config = __webpack_require__(/*! ../config.json */ "./app/config.json");
// This is a static class with static properties to configure the database. 
// Creates and returns a single database object with connection property.
// It does not need to be instantiated. 
class configuredatabase {
    static start() {
        var connection;
        switch (config.database.type) {
            case 'mysql':
                connection = __webpack_require__(/*! ./databases/mysql/mysql.js */ "./app/core/databases/mysql/mysql.js");
            /* Other database example
            case 'mssql':
                terriadb = require('./databases/mssql/mssql.js');
            */
            /* Other database example
            case 'mongodb':
                terriadb = require('./databases/mongodb/mongodb.js');
            */
            /* Custom example
            case 'customdb':
                terriadb = require('./databases/customdb/customdb.js');
            */
            default:
                connection = __webpack_require__(/*! ./databases/mysql/mysql.js */ "./app/core/databases/mysql/mysql.js");
        }
        return new database(config.database.type, config.database.host, config.database.username, config.database.password, connection); // Return database object
    }
}
module.exports = configuredatabase;


/***/ }),

/***/ "./app/core/configureserver.ts":
/*!*************************************!*\
  !*** ./app/core/configureserver.ts ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var express = __webpack_require__(/*! express */ "express");
var compression = __webpack_require__(/*! compression */ "compression");
var path = __webpack_require__(/*! path */ "path");
var cors = __webpack_require__(/*! cors */ "cors");
var cluster = __webpack_require__(/*! cluster */ "cluster");
var exists = __webpack_require__(/*! ./exists */ "./app/core/exists.ts");
var basicAuth = __webpack_require__(/*! basic-auth */ "basic-auth");
var fs = __webpack_require__(/*! fs */ "fs");
var ExpressBrute = __webpack_require__(/*! express-brute */ "express-brute");
// This is a static class with static properties to configure the server. 
// Creates and returns a single express server.
// It does not need to be instantiated. 
class configureserver {
    static start(options) {
        // eventually this mime type configuration will need to change
        // https://github.com/visionmedia/send/commit/d2cb54658ce65948b0ed6e5fb5de69d022bef941
        var mime = express.static.mime;
        mime.define({
            'this.application/json': ['czml', 'json', 'geojson'],
            'text/plain': ['glsl']
        });
        this.options = options;
        // initialise this.app with standard middlewares
        this.app = express();
        this.app.use(compression());
        this.app.use(cors());
        this.app.disable('etag');
        //routes.init(this.app, this.options); // We configure the server by running the routes class.
        if (options.verbose) {
            this.app.use(__webpack_require__(/*! morgan */ "morgan")('dev'));
        }
        if (typeof options.settings.trustProxy !== 'undefined') {
            this.app.set('trust proxy', options.settings.trustProxy);
        }
        if (options.verbose) {
            this.log('Listening on these this.endpoints:', true);
        }
        this.endpoint('/ping', function (req, res) {
            res.status(200).send('OK');
        });
        // We do this after the /ping service above so that ping can be used unauthenticated and without TLS for health checks.
        if (options.settings.redirectToHttps) {
            var httpAllowedHosts = options.settings.httpAllowedHosts || ["localhost"];
            this.app.use(function (req, res, next) {
                if (httpAllowedHosts.indexOf(req.hostname) >= 0) {
                    return next();
                }
                if (req.protocol !== 'https') {
                    var url = 'https://' + req.hostname + req.url;
                    res.redirect(301, url);
                }
                else {
                    next();
                }
            });
        }
        var auth = options.settings.basicAuthentication;
        if (auth && auth.username && auth.password) {
            var store = new ExpressBrute.MemoryStore();
            var rateLimitOptions = {
                freeRetries: 2,
                minWait: 200,
                maxWait: 60000,
            };
            if (options.settings.rateLimit && options.settings.rateLimit.freeRetries !== undefined) {
                rateLimitOptions.freeRetries = options.settings.rateLimit.freeRetries;
                rateLimitOptions.minWait = options.settings.rateLimit.minWait;
                rateLimitOptions.maxWait = options.settings.rateLimit.maxWait;
            }
            var bruteforce = new ExpressBrute(store, rateLimitOptions);
            this.app.use(bruteforce.prevent, function (req, res, next) {
                var user = basicAuth(req);
                if (user && user.name === auth.username && user.pass === auth.password) {
                    // Successful authentication, reset rate limiting.
                    req.brute.reset(next);
                }
                else {
                    res.statusCode = 401;
                    res.setHeader('WWW-Authenticate', 'Basic realm="terriajs-server"');
                    res.end('Unauthorized');
                }
            });
        }
        // Serve the bulk of the application as a static web directory.
        var serveWwwRoot = exists(options.wwwroot + '/index.html');
        if (serveWwwRoot) {
            this.app.use(express.static(options.wwwroot));
        }
        // Proxy for servers that don't support CORS
        var bypassUpstreamProxyHostsMap = (options.settings.bypassUpstreamProxyHosts || []).reduce(function (map, host) {
            if (host !== '') {
                map[host.toLowerCase()] = true;
            }
            return map;
        }, {});
        this.endpoint('/proxy', __webpack_require__(/*! ./controllers/proxy */ "./app/core/controllers/proxy.js")({
            proxyableDomains: options.settings.allowProxyFor,
            proxyAllDomains: options.settings.proxyAllDomains,
            proxyAuth: options.proxyAuth,
            proxyPostSizeLimit: options.settings.proxyPostSizeLimit,
            upstreamProxy: options.settings.upstreamProxy,
            bypassUpstreamProxyHosts: bypassUpstreamProxyHostsMap,
            basicAuthentication: options.settings.basicAuthentication,
            blacklistedAddresses: options.settings.blacklistedAddresses
        }));
        var esriTokenAuth = __webpack_require__(/*! ./controllers/esri-token-auth */ "./app/core/controllers/esri-token-auth.js")(options.settings.esriTokenAuth);
        if (esriTokenAuth) {
            this.endpoint('/esri-token-auth', esriTokenAuth);
        }
        this.endpoint('/proj4def', __webpack_require__(/*! ./controllers/proj4lookup */ "./app/core/controllers/proj4lookup.js")); // Proj4def lookup service, to avoid downloading all definitions into the client.
        this.endpoint('/convert', __webpack_require__(/*! ./controllers/convert */ "./app/core/controllers/convert.js")(options).router); // OGR2OGR wrthis.apper to allow supporting file types like Shapefile.
        this.endpoint('/proxyabledomains', __webpack_require__(/*! ./controllers/proxydomains */ "./app/core/controllers/proxydomains.js")({
            proxyableDomains: options.settings.allowProxyFor,
            proxyAllDomains: !!options.settings.proxyAllDomains,
        }));
        this.endpoint('/serverconfig', __webpack_require__(/*! ./controllers/serverconfig */ "./app/core/controllers/serverconfig.js")(options));
        var errorPage = __webpack_require__(/*! ./errorpage */ "./app/core/errorpage.ts");
        var show404 = serveWwwRoot && exists(options.wwwroot + '/404.html');
        var error404 = errorPage.error404(show404, options.wwwroot, serveWwwRoot);
        var show500 = serveWwwRoot && exists(options.wwwroot + '/500.html');
        var error500 = errorPage.error500(show500, options.wwwroot);
        var initPaths = options.settings.initPaths || [];
        if (serveWwwRoot) {
            initPaths.push(path.join(options.wwwroot, 'init'));
        }
        this.app.use('/init', __webpack_require__(/*! ./controllers/initfile */ "./app/core/controllers/initfile.js")(initPaths, error404, options.configDir));
        var feedbackService = __webpack_require__(/*! ./controllers/feedback */ "./app/core/controllers/feedback.js")(options.settings.feedback);
        if (feedbackService) {
            this.endpoint('/feedback', feedbackService);
        }
        var shareService = __webpack_require__(/*! ./controllers/share */ "./app/core/controllers/share.js")(options.settings.shareUrlPrefixes, options.settings.newShareUrlPrefix, options.hostName, options.port);
        if (shareService) {
            this.endpoint('/share', shareService);
        }
        this.app.use(error404);
        this.app.use(error500);
        var server = this.app;
        var osh = options.settings.https;
        if (osh && osh.key && osh.cert) {
            console.log('Launching in HTTPS mode.');
            var https = __webpack_require__(/*! https */ "https");
            server = https.createServer({
                key: fs.readFileSync(osh.key),
                cert: fs.readFileSync(osh.cert)
            }, this.app);
        }
        process.on('uncaughtException', function (err) {
            console.error(err.stack ? err.stack : err);
            process.exit(1);
        });
        return server;
    }
    static log(message, worker1only) {
        if (!worker1only || cluster.isWorker && cluster.worker.id === 1) {
            console.log(message);
        }
    }
    static endpoint(path, router) {
        if (this.options.verbose) {
            this.log('http://' + this.options.hostName + ':' + this.options.port + '/api/v1' + path, true);
        }
        if (path !== 'proxyabledomains') {
            // deprecated this.endpoint that isn't part of V1
            this.app.use('/api/v1' + path, router);
        }
        // deprecated this.endpoint at `/`
        this.app.use(path, router);
    }
}
module.exports = configureserver;


/***/ }),

/***/ "./app/core/controllers/convert.js":
/*!*****************************************!*\
  !*** ./app/core/controllers/convert.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* jshint node: true */

var express = __webpack_require__(/*! express */ "express");
var fs = __webpack_require__(/*! fs */ "fs");
var ogr2ogr = __webpack_require__(/*! terriajs-ogr2ogr */ "terriajs-ogr2ogr");
var request = __webpack_require__(/*! request */ "request");
var formidable = __webpack_require__(/*! formidable */ "formidable");

var convert = {};

convert.testGdal = function() {
    // test doing 'something' with an empty GeoJSON object. It will either fail with ENOENT, or fail with OGR2OGR output.
    ogr2ogr({}).exec(function(error) {
        if ((error !== undefined) && error.message.match(/ENOENT/)) {
            console.log('Convert warning: ogr2ogr (gdal) is not installed or inaccessible, so the format conversion service will fail.');
        } else {
            // GDAL is installed ok.
        }
    });
};

function tooBigError(request, response) {
    response.header('Connection', 'close'); // stop the client from sending additional data.
    response.status(413) // Payload Too Large
            .send('This file is too big to convert. Maximum allowed size: ' + convert.maxConversionSize + ' bytes');
    console.log('Convert: uploaded file exceeds limit of ' + convert.maxConversionSize + ' bytes. Aborting.');
}

// Extract file name and path out of the provided HTTP POST form
function parseForm(req, res, callback) {
    var form = new formidable.IncomingForm();
    form.on('progress', function(bytesReceived, bytesExpected) {
        // Allow double because bytesReceived is the entire form, not just the file.
        if (bytesReceived > convert.maxConversionSize * 2) {
            var result = tooBigError(req, res);

            // remove any files already uploaded
            (form.openedFiles || []).forEach(function(file) {
                try {
                    fs.unlink(file.path);
                } catch(e) {
                }
            });

            return result;
        }
    });
    form.parse(req, function(err, fields, files) {
        if (fields.input_url !== undefined) {
            if (fields.input_url.indexOf('http') === 0) {
                callback(fields.input_url, fields.input_url, req, res);
            }
        } else if (files.input_file !== undefined) {
            if (files.input_file.size <= convert.maxConversionSize) {
                callback(files.input_file.path, files.input_file.name, req, res);
            } else {
                fs.unlink(files.input_file.path); // we have to delete the upload ourselves.
                return tooBigError(req, res);
            }
        }
    });
}

// Pass a stream to the OGR2OGR library, returning a GeoJSON result.
function convertStream(stream, req, res, hint, fpath) {
    var ogr = ogr2ogr(stream, hint)
                    .skipfailures()
                    .options(['-t_srs', 'EPSG:4326']);

    ogr.exec(function (er, data) {
        if (er) {
            console.error('Convert error: ' + er);
        }
        if (data !== undefined) {
            res.status(200).send(JSON.stringify(data));
        } else {
            res.status(415). // Unsupported Media Type
                send('Unable to convert this data file. For a list of formats supported by Terria, see http://www.gdal.org/ogr_formats.html .');
        }
        if (fpath) {
            fs.unlink(fpath); // clean up the temporary file on disk
        }
    });
}

function handleContent (fpath, fname, req, res) {
    if (!fpath) {
        return res.status(400).send('No file provided to convert.');
    }
    console.log('Convert: receiving file named ', fname);

    var hint = '';
    //simple hint for now, might need to crack zip files going forward
    if (fname.match(/\.zip$/)) {
        hint = 'shp';
    }
    if (fpath.indexOf('http') === 0) {
        var httpStream, abort = false;
        // Read file content by opening the URL given to us
        httpStream = request.get({url: fpath});
        httpStream.on('response', function(response) {
            var request = this, len = 0;
            convertStream(response, req, res, hint);
            response.on('data', function (chunk) {
                len += chunk.length;
                if (!abort && len > convert.maxConversionSize) {
                    tooBigError(request, res);
                    abort = true;
                    httpStream.abort(); // avoid fetching the entire file once we know it's too big. We'll probably get one or two chunks too many.
                    response.destroy();
                }
            });
            response.on('end', function() {
                console.log('Convert: received file of ' + len + ' bytes' + (abort ? ' (which we\'re discarding).' : '.'));
            });
        });
    } else {
        // Read file content embedded directly in POST data
        convertStream(fs.createReadStream(fpath), req, res, hint, fpath);
    }
}

// provide conversion to geojson service
// reguires install of gdal on server:
//   sudo apt-get install gdal-bin
convert.router = express.Router().post('/',  function(req, res) {
    parseForm(req, res, handleContent);
});


module.exports = function(options) {
    if (options) {
        convert.maxConversionSize = options.settings.maxConversionSize || 1000000;
    }
    return convert;
};

/***/ }),

/***/ "./app/core/controllers/esri-token-auth.js":
/*!*************************************************!*\
  !*** ./app/core/controllers/esri-token-auth.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* jshint node: true, esnext: true */

var router = __webpack_require__(/*! express */ "express").Router();
var request = __webpack_require__(/*! request */ "request");
var bodyParser = __webpack_require__(/*! body-parser */ "body-parser");
var url = __webpack_require__(/*! url */ "url");

module.exports = function(options) {
    if (!options || !options.servers) {
        return;
    }

    // The maximum size of the JSON data.
    let postSizeLimit = options.postSizeLimit || '1024';

    let tokenServers = parseUrls(options.servers);
    tokenServers = validateServerConfig(tokenServers);

    router.use(bodyParser.json({limit:postSizeLimit, type:'application/json'}));
    router.post('/', function(req, res, next) {
        let parameters = req.body;

        if (!parameters.url) {
            return res.status(400).send('No URL specified.');
        }

        let targetUrl = parseUrl(parameters.url);
        if (!targetUrl || (targetUrl.length === 0) || (typeof targetUrl !== 'string')) {
            return res.status(400).send('Invalid URL specified.');
        }

        let tokenServer = tokenServers[targetUrl];
        if (!tokenServer) {
            return res.status(400).send('Unsupported URL specified.');
        }

        request({
            url: tokenServer.tokenUrl,
            method: 'POST',
            headers: {
                'User-Agent': 'TerriaJSESRITokenAuth',
            },
            form:{
                username: tokenServer.username,
                password: tokenServer.password,
                f: 'JSON'
            }
        }, function(error, response, body) {
            try {
                res.set('Content-Type', 'application/json');

                if (response.statusCode !== 200) {
                    return res.status(502).send('Token server failed.');
                } else {
                    let value = JSON.parse(response.body);
                    return res.status(200).send(JSON.stringify(value));
                }
            }
            catch (error) {
                return res.status(500).send('Error processing server response.');
            }
        });
    });

    return router;
};

function parseUrls(servers) {
    let result = {};

    Object.keys(servers).forEach(server => {
        let parsedUrl = parseUrl(server)
        if (parsedUrl) {
            result[parsedUrl] = servers[server];
        }
        else {
            console.error('Invalid configuration. The URL: \'' + server + '\' is not valid.');
        }
    });

    return result;
}

function parseUrl(urlString) {
    try {
        return url.format(url.parse(urlString));
    }
    catch (error) {
        return '';
    }
}

function validateServerConfig(servers)
{
    let result = {};

    Object.keys(servers).forEach(url => {
        let server = servers[url];
        if (server.username && server.password && server.tokenUrl) {
            result[url] = server;

            // Note: We should really only validate URLs that are HTTPS to save us from ourselves, but the current
            // servers we need to support don't support HTTPS :( so the best that we can do is warn against it.
            if (!isHttps(server.tokenUrl)) {
                console.error('All communications should be TLS but the URL \'' + server.tokenUrl + '\' does not use https.');
            }
        } else {
            console.error('Bad Configuration. \'' + url + '\' does not supply all of the required properties.');
        }
    });

    return result;
}

function isHttps(urlString){
    try {
        return (url.parse(urlString).protocol === 'https:')
    }
    catch (error)
    {
        return false;
    }
}


/***/ }),

/***/ "./app/core/controllers/feedback.js":
/*!******************************************!*\
  !*** ./app/core/controllers/feedback.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* jshint node: true */


var bodyParser = __webpack_require__(/*! body-parser */ "body-parser");
var router = __webpack_require__(/*! express */ "express").Router();
var url = __webpack_require__(/*! url */ "url");
var request = __webpack_require__(/*! request */ "request");

module.exports = function(options) {
    if (!options || !options.issuesUrl || !options.accessToken) {
        return;
    }

    var parsedCreateIssueUrl = url.parse(options.issuesUrl, true);
    parsedCreateIssueUrl.query.access_token = options.accessToken;
    var createIssueUrl = url.format(parsedCreateIssueUrl);

    router.use(bodyParser.json());
    router.post('/', function(req, res, next) {
        var parameters = req.body;

        request({
            url: createIssueUrl,
            method: 'POST',
            headers: {
                'User-Agent': options.userAgent || 'TerriaBot (TerriaJS Feedback)',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                title: parameters.title ? parameters.title : 'User Feedback',
                body: formatBody(req, parameters, options.additionalParameters)
            })
        }, function(error, response, body) {
            res.set('Content-Type', 'application/json');
            if (response.statusCode < 200 || response.statusCode >= 300) {
                res.status(response.statusCode).send(JSON.stringify({result: 'FAILED'}));
            } else {
                res.status(200).send(JSON.stringify({result: 'SUCCESS'}));
            }
        });

    });

    return router;
};

function formatBody(request, parameters, additionalParameters) {
    var result = '';

    result += parameters.comment ? parameters.comment : 'No comment provided';
    result += '\n### User details\n';
    result += '* Name: '          + (parameters.name ? parameters.name : 'Not provided') + '\n';
    result += '* Email Address: ' + (parameters.email ? parameters.email : 'Not provided') + '\n';
    result += '* IP Address: '    + request.ip + '\n';
    result += '* User Agent: '    + request.header('User-Agent') + '\n';
    result += '* Referrer: '      + request.header('Referrer') + '\n';
    result += '* Share URL: '     + (parameters.shareLink ? parameters.shareLink : 'Not provided') + '\n';
    if (additionalParameters) {
        additionalParameters.forEach((parameter) => {
            result += `* ${parameter.descriptiveLabel}: ${parameters[parameter.name] || 'Not provided'}\n`;
        });
    }

    return result;
}


/***/ }),

/***/ "./app/core/controllers/initfile.js":
/*!******************************************!*\
  !*** ./app/core/controllers/initfile.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* jshint node: true */

var express = __webpack_require__(/*! express */ "express");
var router = __webpack_require__(/*! express */ "express").Router();
var exists = __webpack_require__(/*! ../exists */ "./app/core/exists.ts");
var path = __webpack_require__(/*! path */ "path");
/**
 * Special handling for /init/foo.json requests: look in initPaths, not just wwwroot/init
 * @param  {String[]} initPaths      Paths to look in, can be relative.
 * @param  {function} error404       Error page handler.
 * @param  {String} configFileBase   Directory to resolve relative paths from.
 * @return {Router}
 */
module.exports = function(initPaths, error404, configFileBase) {
    initPaths.forEach(function(initPath) {
        router.use(express.static(path.resolve(configFileBase, initPath)));
    });
    return router;
};

/***/ }),

/***/ "./app/core/controllers/proj4lookup.js":
/*!*********************************************!*\
  !*** ./app/core/controllers/proj4lookup.js ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* jshint node: true */

var express = __webpack_require__(/*! express */ "express");
var router = express.Router();

var proj4 = __webpack_require__(/*! proj4 */ "proj4");

//TODO: check if this loads the file into each core and if so then,
__webpack_require__(/*! proj4js-defs/epsg */ "proj4js-defs/epsg")(proj4);


//provide REST service for proj4 definition strings
router.get('/:crs', function(req, res, next) {
    var epsg = proj4.defs[req.params.crs.toUpperCase()];
    if (epsg !== undefined) {
        res.status(200).send(epsg);
    } else {
        res.status(404).send('No proj4 definition available for this CRS.');
    }
});

module.exports = router;

/***/ }),

/***/ "./app/core/controllers/proxy.js":
/*!***************************************!*\
  !*** ./app/core/controllers/proxy.js ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* jshint node: true */


var basicAuth = __webpack_require__(/*! basic-auth */ "basic-auth");
var express = __webpack_require__(/*! express */ "express");
var defaultRequest = __webpack_require__(/*! request */ "request");
var url = __webpack_require__(/*! url */ "url");
var bodyParser = __webpack_require__(/*! body-parser */ "body-parser");
var rangeCheck = __webpack_require__(/*! range_check */ "range_check");

var DO_NOT_PROXY_REGEX = /^(?:Host|X-Forwarded-Host|Proxy-Connection|Connection|Keep-Alive|Transfer-Encoding|TE|Trailer|Proxy-Authorization|Proxy-Authenticate|Upgrade|Expires|pragma|Strict-Transport-Security)$/i;
var PROTOCOL_REGEX = /^\w+:\//;
var DURATION_REGEX = /^([\d.]+)(ms|s|m|h|d|w|y)$/;
var DURATION_UNITS = {
    ms: 1.0 / 1000,
    s: 1.0,
    m: 60.0,
    h: 60.0 * 60.0,
    d: 24.0 * 60.0 * 60.0,
    w: 7.0 * 24.0 * 60.0 * 60.0,
    y: 365 * 24.0 * 60.0 * 60.0
};
/** Age to override cache instructions with for proxied files */
var DEFAULT_MAX_AGE_SECONDS = 1209600; // two weeks

/**
 * Creates an express middleware that proxies calls to '/proxy/http://example' to 'http://example', while forcing them
 * to be cached by the browser and overrwriting CORS headers. A cache duration can be added with a URL like
 * /proxy/_5m/http://example which causes 'Cache-Control: public,max-age=300' to be added to the response headers.
 *
 * @param {Object} options
 * @param {Array[String]} options.proxyableDomains An array of domains to be proxied
 * @param {boolean} options.proxyAllDomains A boolean indicating whether or not we should proxy ALL domains - overrides
 *                      the configuration in options.proxyDomains
 * @param {String} options.proxyAuth A map of domains to tokens that will be passed to those domains via basic auth
 *                      when proxying through them.
 * @param {String} options.upstreamProxy Url of a standard upstream proxy that will be used to retrieve data.
 * @param {String} options.bypassUpstreamProxyHosts An object of hosts (as strings) to 'true' values.
 * @param {String} options.proxyPostSizeLimit The maximum size of a POST request that the proxy will allow through,
                        in bytes if no unit is specified, or some reasonable unit like 'kb' for kilobytes or 'mb' for megabytes.
 *
 * @returns {*} A middleware that can be used with express.
 */
module.exports = function(options) {
    var request = options.request || defaultRequest; //overridable for tests
    var proxyAllDomains = options.proxyAllDomains;
    var proxyDomains = options.proxyableDomains || [];
    var proxyAuth = options.proxyAuth || {};
    var proxyPostSizeLimit = options.proxyPostSizeLimit || '102400';
    
    // If you change this, also change the same list in serverconfig.json.example.
    // This page is helpful: https://en.wikipedia.org/wiki/Reserved_IP_addresses
    var blacklistedAddresses = options.blacklistedAddresses || [
        // loopback addresses
        '127.0.0.0/8',
        '::1/128',
        // link local addresses
        '169.254.0.0/16',
        'fe80::/10',
        // private network addresses
        '10.0.0.0/8',
        '172.16.0.0/12',
        '192.168.0.0/16',
        'fc00::/7',
        // other
        '0.0.0.0/8',
        '100.64.0.0/10',
        '192.0.0.0/24',
        '192.0.2.0/24',
        '198.18.0.0/15',
        '192.88.99.0/24',
        '198.51.100.0/24',
        '203.0.113.0/24',
        '224.0.0.0/4',
        '240.0.0.0/4',
        '255.255.255.255/32',
        '::/128',
        '2001:db8::/32',
        'ff00::/8'
    ];

    //Non CORS hosts and domains we proxy to
    function proxyAllowedHost(host) {
        // Exclude hosts that are really IP addresses and are in our blacklist.
        if (rangeCheck.inRange(host, blacklistedAddresses)) {
            return false;
        }

        if (proxyAllDomains) {
            return true;
        }

        host = host.toLowerCase();
        //check that host is from one of these domains
        for (var i = 0; i < proxyDomains.length; i++) {
            if (host.indexOf(proxyDomains[i], host.length - proxyDomains[i].length) !== -1) {
                return true;
            }
        }
        return false;
    }

    function doProxy(req, res, next, retryWithoutAuth, callback) {
        var remoteUrlString = req.url.substring(1);

        if (!remoteUrlString || remoteUrlString.length === 0) {
            return res.status(400).send('No url specified.');
        }

        // Does the proxy URL include a max age?
        var maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS;
        if (remoteUrlString[0] === '_') {
            var slashIndex = remoteUrlString.indexOf('/');
            if (slashIndex < 0) {
                return res.status(400).send('No url specified.');
            }

            var maxAgeString = remoteUrlString.substring(1, slashIndex);
            remoteUrlString = remoteUrlString.substring(slashIndex + 1);

            if (remoteUrlString.length === 0) {
                return res.status(400).send('No url specified.');
            }

            // Interpret the max age as a duration in Varnish notation.
            // https://www.varnish-cache.org/docs/trunk/reference/vcl.html#durations
            var parsedMaxAge = DURATION_REGEX.exec(maxAgeString);
            if (!parsedMaxAge || parsedMaxAge.length < 3) {
                return res.status(400).send('Invalid duration.');
            }

            var value = parseFloat(parsedMaxAge[1]);
            if (value !== value) {
                return res.status(400).send('Invalid duration.');
            }

            var unitConversion = DURATION_UNITS[parsedMaxAge[2]];
            if (!unitConversion) {
                return res.status(400).send('Invalid duration unit ' + parsedMaxAge[2]);
            }

            maxAgeSeconds = value * unitConversion;
        }

        // Add http:// if no protocol is specified.
        var protocolMatch = PROTOCOL_REGEX.exec(remoteUrlString);
        if (!protocolMatch || protocolMatch.length < 1) {
            remoteUrlString = 'http://' + remoteUrlString;
        } else {
            var matchedPart = protocolMatch[0];

            // If the protocol portion of the URL only has a single slash after it, the extra slash was probably stripped off by someone
            // along the way (NGINX will do this).  Add it back.
            if (remoteUrlString[matchedPart.length] !== '/') {
                remoteUrlString = matchedPart + '/' + remoteUrlString.substring(matchedPart.length);
            }
        }

        var remoteUrl = url.parse(remoteUrlString);

        // Copy the query string
        remoteUrl.search = url.parse(req.url).search;

        if (!remoteUrl.protocol) {
            remoteUrl.protocol = 'http:';
        }

        var proxy;
        if (options.upstreamProxy && !((options.bypassUpstreamProxyHosts || {})[remoteUrl.host])) {
            proxy = options.upstreamProxy;
        }

        // Are we allowed to proxy for this host?
        if (!proxyAllowedHost(remoteUrl.host)) {
            res.status(403).send('Host is not in list of allowed hosts: ' + remoteUrl.host);
            return;
        }

        // encoding : null means "body" passed to the callback will be raw bytes

        var proxiedRequest;
        req.on('close', function() {
            if (proxiedRequest) {
                proxiedRequest.abort();
            }
        });

        var filteredReqHeaders = filterHeaders(req.headers);
        if (filteredReqHeaders['x-forwarded-for']) {
            filteredReqHeaders['x-forwarded-for'] = filteredReqHeaders['x-forwarded-for'] + ', ' + req.connection.remoteAddress;
        } else {
            filteredReqHeaders['x-forwarded-for'] = req.connection.remoteAddress;
        }

        // Remove the Authorization header if we used it to authenticate the request to terriajs-server.
        if (options.basicAuthentication && options.basicAuthentication.username && options.basicAuthentication.password) {
            delete filteredReqHeaders['authorization'];
        }

        if (!retryWithoutAuth) {
            var authRequired = proxyAuth[remoteUrl.host];
            if (authRequired) {
                if (authRequired.authorization) {
                    // http basic auth.
                    if (!filteredReqHeaders['authorization']) {
                        filteredReqHeaders['authorization'] = authRequired.authorization;
                    }
                }
                if (authRequired.headers) {
                    // a mechanism to pass arbitrary headers.
                    authRequired.headers.forEach(function(header) {
                        filteredReqHeaders[header.name] = header.value;
                    });
                }
            }
        }

        proxiedRequest = callback(remoteUrl, filteredReqHeaders, proxy, maxAgeSeconds);
    }

    function buildReqHandler(httpVerb) {
        function handler(req, res, next) {
            return doProxy(req, res, next, req.retryWithoutAuth, function(remoteUrl, filteredRequestHeaders, proxy, maxAgeSeconds) {
                try {
                    var proxiedRequest = request({
                        method: httpVerb,
                        url: url.format(remoteUrl),
                        headers: filteredRequestHeaders,
                        encoding: null,
                        proxy: proxy,
                        body: req.body,
                        followRedirect: function(response) {
                            var location = response.headers.location;
                            if (location && location.length > 0) {
                                var parsed = url.parse(location);
                                if (proxyAllowedHost(parsed.host)) {
                                    // redirect is ok
                                    return true;
                                }
                            }
                            // redirect is forbidden
                            return false;
                        }
                    }).on('socket', function(socket) {
                        socket.once('lookup', function(err, address, family, host) {
                            if (rangeCheck.inRange(address, blacklistedAddresses)) {
                                res.status(403).send('IP address is not allowed: ' + address);
                                res.end();
                                proxiedRequest.abort();
                            }
                        });
                    }).on('error', function(err) {
                        console.error(err);

                        // Ideally we would return an error to the client, but if headers have already been sent,
                        // attempting to set a status code here will fail. So in that case, we'll just end the response,
                        // for lack of a better option.
                        if (res.headersSent) {
                            res.end();
                        } else {
                            res.status(500).send('Proxy error');
                        }
                    }).on('response', function(response) {
                        if (!req.retryWithoutAuth && response.statusCode === 403 && proxyAuth[remoteUrl.host]) {
                            // We automatically added an authentication header to this request (e.g. from proxyauth.json),
                            // but got back a 403, indicating our credentials didn't authorize access to this resource.
                            // Try again without credentials in order to give the user the opportunity to supply
                            // their own.
                            req.retryWithoutAuth = true;
                            return handler(req, res, next);
                        }

                        res.status(response.statusCode);
                        res.header(processHeaders(response.headers, maxAgeSeconds));
                        response.on('data', function(chunk) {
                            res.write(chunk);
                        });
                        response.on('end', function() {
                            res.end();
                        });
                    });
                } catch (e) {
                    console.error(e.stack);
                    res.status(500).send('Proxy error');
                }

                return proxiedRequest;
            });
        }

        return handler;
    }

    var router = express.Router();
    router.get('/*', buildReqHandler('GET'));
    router.post('/*', bodyParser.raw({type: function() { return true;}, limit: proxyPostSizeLimit}), buildReqHandler('POST'));

    return router;
};

/**
 * Filters headers that are not matched by {@link DO_NOT_PROXY_REGEX} out of an object containing headers. This does not
 * mutate the original list.
 *
 * @param headers The headers to filter
 * @returns {Object} A new object with the filtered headers.
 */
function filterHeaders(headers) {
    var result = {};
    // filter out headers that are listed in the regex above
    Object.keys(headers).forEach(function(name) {
        if (!DO_NOT_PROXY_REGEX.test(name)) {
            result[name] = headers[name];
        }
    });

    return result;
}

/**
 * Filters out headers that shouldn't be proxied, overrides caching so files are retained for {@link DEFAULT_MAX_AGE_SECONDS},
 * and sets CORS headers to allow all origins
 *
 * @param headers The original object of headers. This is not mutated.
 * @param maxAgeSeconds the amount of time in seconds to cache for. This will override what the original server
 *          specified because we know better than they do.
 * @returns {Object} The new headers object.
 */
function processHeaders(headers, maxAgeSeconds) {
    var result = filterHeaders(headers);

    result['Cache-Control'] = 'public,max-age=' + maxAgeSeconds;
    result['Access-Control-Allow-Origin'] = '*';

    return result;
}


/***/ }),

/***/ "./app/core/controllers/proxydomains.js":
/*!**********************************************!*\
  !*** ./app/core/controllers/proxydomains.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* jshint node: true */

var router = __webpack_require__(/*! express */ "express").Router();

module.exports = function(options) {
    router.get('/', function(req, res, next) {
        res.status(200).send(options);
    });
    return router;
};

/***/ }),

/***/ "./app/core/controllers/serverconfig.js":
/*!**********************************************!*\
  !*** ./app/core/controllers/serverconfig.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* jshint node: true, esnext: true */

var express = __webpack_require__(/*! express */ "express");

// Expose a whitelisted set of configuration attributes to the world. This definitely doesn't include authorisation tokens, local file paths, etc.
// It mirrors the structure of the real config file.
module.exports = function(options) {
    var router = express.Router();
    var settings = Object.assign({}, options.settings), safeSettings = {};
    var safeAttributes = ['allowProxyFor', 'maxConversionSize', 'newShareUrlPrefix', 'proxyAllDomains'];
    safeAttributes.forEach(key => safeSettings[key] = settings[key]);
    safeSettings.version = __webpack_require__(/*! ../../../package.json */ "./package.json").version;
    if (typeof settings.shareUrlPrefixes === 'object') {
        safeSettings.shareUrlPrefixes = {};
        Object.keys(settings.shareUrlPrefixes).forEach(function(key) {
            safeSettings.shareUrlPrefixes[key] = { service: settings.shareUrlPrefixes[key].service };
        });
    }
    if (settings.feedback && settings.feedback.additionalParameters) {
        safeSettings.additionalFeedbackParameters = settings.feedback.additionalParameters;
    }

    router.get('/', function(req, res, next) {
        res.status(200).send(safeSettings);
    });
    return router;
};


/***/ }),

/***/ "./app/core/controllers/share.js":
/*!***************************************!*\
  !*** ./app/core/controllers/share.js ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* jshint node: true, esnext: true */


var bodyParser = __webpack_require__(/*! body-parser */ "body-parser");
var requestp = __webpack_require__(/*! request-promise */ "request-promise");
var rperrors = __webpack_require__(/*! request-promise/errors */ "request-promise/errors");

var gistAPI = 'https://api.github.com/gists';
var googleUrlShortenerAPI = 'https://www.googleapis.com/urlshortener/v1';

var prefixSeparator = '-'; // change the regex below if you change this
var splitPrefixRe = /^(([^-]+)-)?(.*)$/;

//You can test like this with httpie:
//echo '{ "test": "me" }' | http post localhost:3001/api/v1/share
function makeGist(serviceOptions, body) {
    var gistFile = {};
    gistFile[serviceOptions.gistFilename || 'usercatalog.json'] = { content: body };

    var headers = {
        'User-Agent': serviceOptions.userAgent || 'TerriaJS-Server',
        'Accept': 'application/vnd.github.v3+json'
    };
    if (serviceOptions.accessToken !== undefined) {
        headers['Authorization'] = 'token ' + serviceOptions.accessToken;
    }
    return requestp({
        url: gistAPI,
        method: 'POST',
        headers: headers,
        json: true,
        body: {
            files: gistFile,
            description: (serviceOptions.gistDescription || 'User-created catalog'),
            public: false
        }, transform: function(body, response) {
            if (response.statusCode === 201) {
                console.log('Created ID ' + response.body.id + ' using Gist service');
                return response.body.id;
            } else {
                return response;
            }
        }
    });
}

// Test: http localhost:3001/api/v1/share/g-98e01625db07a78d23b42c3dbe08fe20
function resolveGist(serviceOptions, id) {
    var headers = {
        'User-Agent': serviceOptions.userAgent || 'TerriaJS-Server',
        'Accept': 'application/vnd.github.v3+json'
    };
    if (serviceOptions.accessToken !== undefined) {
        headers['Authorization'] = 'token ' + serviceOptions.accessToken;
    }
    return requestp({
        url: gistAPI + '/' + id,
        headers: headers,
        json: true,
        transform: function(body, response) {
            if (response.statusCode >= 300) {
                return response;
            } else {
                return body.files[Object.keys(body.files)[0]].content; // find the contents of the first file in the gist
            }
        }
    });
}
/*
  Generate short ID by hashing body, converting to base62 then truncating.
 */
function shortId(body, length) {
    var hmac = __webpack_require__(/*! crypto */ "crypto").createHmac('sha1', body).digest();
    var base62 = __webpack_require__(/*! base-x */ "base-x")('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
    var fullkey = base62.encode(hmac);
    return fullkey.slice(0, length); // if length undefined, return the whole thing
}

var _S3;

function S3(serviceOptions) {
    if (_S3) {
        return _S3;
    } else {
        var aws = __webpack_require__(/*! aws-sdk */ "aws-sdk");
        aws.config.setPromisesDependency(__webpack_require__(/*! when */ "when").Promise);
        aws.config.update({
            region: serviceOptions.region
        });
        // if no credentials provided, we assume that they're being provided as environment variables or in a file
        if (serviceOptions.accessKeyId) {
            aws.config.update({
                accessKeyId: serviceOptions.accessKeyId,
                secretAccessKey: serviceOptions.secretAccessKey
            });
        }
        _S3 = new aws.S3();
        return _S3;
    }
}

// We append some pseudo-dir prefixes into the actual object ID to avoid thousands of objects in a single pseudo-directory.
// MyRaNdoMkey => M/y/MyRaNdoMkey
const idToObject = (id) => id.replace(/^(.)(.)/, '$1/$2/$1$2');

function saveS3(serviceOptions, body) {
    var id = shortId(body, serviceOptions.keyLength);
    const params = {
        Bucket: serviceOptions.bucket,
        Key: idToObject(id),
        Body: body
    };

    return S3(serviceOptions).putObject(params).promise()
        .then(function(result) {
            console.log('Saved key ' + id + ' to S3 bucket ' + params.Bucket + ':' + params.Key + '. Etag: ' + result.ETag);
            return id;
        }).catch(function(e) {
            console.error(e);
            return e;
        });
}

function resolveS3(serviceOptions, id) {
    const params = {
        Bucket: serviceOptions.bucket,
        Key: idToObject(id)
    };
    return S3(serviceOptions).getObject(params).promise()
    .then(function(data) {
        return data.Body;
    }).catch(function(e) {
        throw {
            response: e,
            error: e.message
        };
    });
}


// Test: http localhost:3001/api/v1/share/q3nxPd
function resolveGoogleUrl(serviceOptions, id) {
    var shortUrl = 'http://goo.gl/' + id;
    console.log(shortUrl);
    return requestp({
        url: googleUrlShortenerAPI + '/url?key=' + serviceOptions.apikey + '&shortUrl=' + shortUrl,
        headers: {
            'User-Agent': serviceOptions.userAgent || 'TerriaJS-Server',
        },
        json: true,
        transform: function(body, response) {
            if (response.statusCode >= 300) {
                return response;
            } else {
                // Our Google URLs look like "http://nationalmap.gov.au/#share=%7B...%7D" but there might be other URL parameters before or after
                // We just want the encoded JSON (%7B..%7D), not the whole URL.
                return decodeURIComponent(body.longUrl.match(/(%7B.*%7D)(&.*)$/)[1]);
            }
        }
    });
}

module.exports = function(shareUrlPrefixes, newShareUrlPrefix, hostName, port) {
    if (!shareUrlPrefixes) {
        return;
    }

    var router = __webpack_require__(/*! express */ "express").Router();
    router.use(bodyParser.text({type: '*/*'}));

    // Requested creation of a new short URL.
    router.post('/', function(req, res, next) {
        if (newShareUrlPrefix === undefined || !shareUrlPrefixes[newShareUrlPrefix]) {
            return res.status(404).json({ message: "This server has not been configured to generate new share URLs." });
        }
        var serviceOptions = shareUrlPrefixes[newShareUrlPrefix];
        var minter = {
            'gist': makeGist,
            's3': saveS3
            }[serviceOptions.service.toLowerCase()];

        minter(serviceOptions, req.body).then(function(id) {
            id = newShareUrlPrefix + prefixSeparator + id;
            var resPath = req.baseUrl + '/' + id;
            // these properties won't behave correctly unless "trustProxy: true" is set in user's options file.
            // they may not behave correctly (especially port) when behind multiple levels of proxy
            var resUrl =
                req.protocol + '://' +
                req.hostname +
                (req.header('X-Forwarded-Port') || port) +
                resPath;
            res .location(resUrl)
                .status(201)
                .json({ id: id, path: resPath, url: resUrl });
        }).catch(rperrors.TransformError, function (reason) {
            console.error(JSON.stringify(reason, null, 2));
            res.status(500).json({ message: reason.cause.message });
        }).catch(function(reason) {
            console.warn(JSON.stringify(reason, null, 2));
            res.status(500) // probably safest if we always return a consistent error code
                .json({ message: reason.error });
        });
    });

    // Resolve an existing ID. We break off the prefix and use it to work out which resolver to use.
    router.get('/:id', function(req, res, next) {
        var prefix = req.params.id.match(splitPrefixRe)[2] || '';
        var id = req.params.id.match(splitPrefixRe)[3];
        var resolver;

        var serviceOptions = shareUrlPrefixes[prefix];
        if (!serviceOptions) {
            console.error('Share: Unknown prefix to resolve "' + prefix + '", id "' + id + '"');
            return res.status(400).send('Unknown share prefix "' + prefix + '"');
        } else {
            resolver = {
                'gist': resolveGist,
                'googleurlshortener': resolveGoogleUrl,
                's3': resolveS3
            }[serviceOptions.service.toLowerCase()];
        }
        resolver(serviceOptions, id).then(function(content) {
            res.send(content);
        }).catch(rperrors.TransformError, function (reason) {
            console.error(JSON.stringify(reason, null, 2));
            res.status(500).send(reason.cause.message);
        }).catch(function(reason) {
            console.warn(JSON.stringify(reason.response, null, 2));
            res.status(404) // probably safest if we always return 404 rather than whatever the upstream provider sets.
                .send(reason.error);
        });
    });
    return router;
};


/***/ }),

/***/ "./app/core/database.ts":
/*!******************************!*\
  !*** ./app/core/database.ts ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

class database {
    constructor(type, host, username, password, connection) {
        this.type = type;
        this.host = host;
        this.username = username;
        this.password = password;
        this.connection = connection;
    }
    getStatus() {
        return this.connection.state;
    }
}
module.exports = database;


/***/ }),

/***/ "./app/core/databases/mysql/mysql.js":
/*!*******************************************!*\
  !*** ./app/core/databases/mysql/mysql.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var mysql = __webpack_require__(/*! mysql */ "mysql");
var config = __webpack_require__(/*! ../../../config.json */ "./app/config.json");

var con = mysql.createConnection({
	host: config.database.host,
	user: config.database.username,
	password: config.database.password
});

con.connect(function(err) {
	if (err) throw err;
	console.log("Database established. Status: " + con.state);
});

module.exports = con;

/***/ }),

/***/ "./app/core/errorpage.ts":
/*!*******************************!*\
  !*** ./app/core/errorpage.ts ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports.error404 = function (show404, wwwroot, serveWwwRoot) {
    return function (req, res, next) {
        if (show404) {
            res.status(404).sendFile(wwwroot + '/404.html');
        }
        else if (serveWwwRoot) {
            // Redirect unknown pages back home.
            res.redirect(303, '/');
        }
        else {
            res.status(404).send('No TerriaJS website here.');
        }
    };
};
module.exports.error500 = function (show500, wwwroot) {
    return function (error, req, res, next) {
        console.error(error);
        if (show500) {
            res.status(500).sendFile(wwwroot + '/500.html');
        }
        else {
            res.status(500).send('500: Internal Server Error');
        }
    };
};


/***/ }),

/***/ "./app/core/exists.ts":
/*!****************************!*\
  !*** ./app/core/exists.ts ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var fs = __webpack_require__(/*! fs */ "fs");
module.exports = function exists(pathName) {
    try {
        fs.statSync(pathName);
        return true;
    }
    catch (e) {
        return false;
    }
};


/***/ }),

/***/ "./app/core/serveroptions.ts":
/*!***********************************!*\
  !*** ./app/core/serveroptions.ts ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var exists = __webpack_require__(/*! ./exists */ "./app/core/exists.ts");
var fs = __webpack_require__(/*! fs */ "fs");
var json5 = __webpack_require__(/*! json5 */ "json5");
var path = __webpack_require__(/*! path */ "path");
class serveroptions {
    getFilePath(fileName, warn) {
        if (exists(fileName)) {
            return fileName;
        }
        else if (warn) {
            console.warn("Warning: Can\'t open '" + fileName + "'.");
        }
    }
    getConfigFile(argFileName, defaultFileName) {
        return argFileName ? this.getFilePath(argFileName, true) : this.getFilePath(defaultFileName, true);
    }
    /**
     * Gets a config file using require, logging a warning and defaulting to a backup value in the event of a failure.
     *
     * @param filePath The path to look for the config file.
     * @param configFileType What kind of config file is this? E.g. config, auth etc.
     * @param failureConsequence The consequence of using the defaultValue when this file fails to load - this will be logged
     *        as part of the warning
     * @returns {*} The config, either from the filePath or a default.
     */
    getConfig(filePath, configFileType, failureConsequence, quiet) {
        var config;
        try {
            var fileContents = fs.readFileSync(filePath, 'utf8');
            // Strip comments formatted as lines starting with a #, before parsing as JSON5. #-initial comments are deprecated, will be removed in version 3.
            config = json5.parse(fileContents.replace(/^\s*#.*$/mg, ''));
            if (!quiet) {
                console.log('Using ' + configFileType + ' file "' + fs.realpathSync(filePath) + '".');
            }
        }
        catch (e) {
            if (!quiet) {
                var loggedFilePath = filePath ? ' "' + filePath + '"' : '';
                if (!(loggedFilePath === '' && configFileType === 'proxyAuth')) {
                    console.warn('Warning: Can\'t open ' + configFileType + ' file' + loggedFilePath + '. ' + failureConsequence + '.\n');
                }
            }
            config = {};
        }
        return config;
    }
    loadCommandLine() {
        var yargs = __webpack_require__(/*! yargs */ "yargs")
            .usage('$0 [options] [path/to/wwwroot]')
            .strict()
            .options({
            'port': {
                'description': 'Port to listen on.                [default: 3001]',
                number: true,
            },
            'public': {
                'type': 'boolean',
                'default': true,
                'description': 'Run a public server that listens on all interfaces.'
            },
            'config-file': {
                'description': 'File containing settings such as allowed domains to proxy. See serverconfig.json.example'
            },
            'proxy-auth': {
                'description': 'File containing auth information for proxied domains. See proxyauth.json.example'
            },
            'verbose': {
                'description': 'Produce more output and logging.',
                'type': 'boolean',
                'default': false
            },
            'help': {
                'alias': 'h',
                'type': 'boolean',
                'description': 'Show this help.'
            }
        });
        if (yargs.argv.help) {
            yargs.showHelp();
            process.exit();
        }
        // Yargs unhelpfully turns "--option foo --option bar" into { option: ["foo", "bar"] }.
        // Hence replace arrays with the rightmost value. This matters when `npm run` has options
        // built into it, and the user wants to override them with `npm run -- --port 3005` or something.
        // Yargs also seems to have setters, hence why we have to make a shallow copy.
        var argv = Object.assign({}, yargs.argv);
        Object.keys(argv).forEach(function (k) {
            if (k !== '_' && Array.isArray(argv[k])) {
                argv[k] = argv[k][argv[k].length - 1];
            }
        });
        return argv;
    }
    init(quiet) {
        var argv = this.loadCommandLine();
        this.listenHost = argv.public ? undefined : 'localhost';
        this.configFile = this.getConfigFile(argv.configFile, 'serverconfig.json');
        this.settings = this.getConfig(this.configFile, 'config', 'ALL proxy requests will be accepted.', quiet);
        this.proxyAuthFile = this.getConfigFile(argv.proxyAuth, 'proxyauth.json');
        this.proxyAuth = this.getConfig(this.proxyAuthFile, 'proxyAuth', 'Proxying to servers that require authentication will fail', quiet);
        if (!this.proxyAuth || Object.keys(this.proxyAuth).length === 0) {
            this.proxyAuth = this.settings.proxyAuth || {};
        }
        this.port = argv.port || this.settings.port || 3001;
        this.wwwroot = argv._.length > 0 ? argv._[0] : process.cwd() + '/wwwroot';
        this.configDir = argv.configFile ? path.dirname(argv.configFile) : '.';
        this.verbose = argv.verbose;
        this.hostName = this.listenHost || this.settings.hostName || 'localhost';
        this.settings.proxyAllDomains = this.settings.proxyAllDomains || typeof this.settings.allowProxyFor === 'undefined';
    }
}
module.exports = serveroptions;


/***/ }),

/***/ "./package.json":
/*!**********************!*\
  !*** ./package.json ***!
  \**********************/
/*! exports provided: name, version, description, license, engines, repository, dependencies, config, devDependencies, scripts, default */
/***/ (function(module) {

module.exports = {"name":"terriajs-map","version":"0.0.1","description":"Geospatial catalog explorer based on TerriaJS.","license":"Apache-2.0","engines":{"node":">= 5.1.0","npm":">= 3.0.0"},"repository":{"type":"git","url":"http://github.com/TerriaJS/TerriaMap"},"dependencies":{"@types/node":"^10.12.18","terriajs-server":"^2.7.4","webpack":"^4.28.2"},"config":{"awsProfile":"terria","awsS3PackagesPath":"s3://terria-apps/map","awsRegion":"ap-southeast-2","awsEc2InstanceType":"t2.small","awsEc2ImageId":"ami-0d9ca8d416482590e","awsKeyName":"terria-kring","awsS3ServerConfigOverridePath":"s3://terria-apps/map/privateserverconfig-2016-08-31.json","awsS3ClientConfigOverridePath":"s3://terria-apps/map/privateclientconfig-2018-11-19.json","docker":{"name":"data61/terria-terriamap","include":"wwwroot node_modules devserverconfig.json index.js package.json version.js"}},"devDependencies":{"@webpack-cli/migrate":"^0.1.2","babel-eslint":"^7.0.0","babel-loader":"^7.0.0","babel-plugin-jsx-control-statements":"^3.2.8","babel-preset-env":"^1.6.1","babel-preset-react":"^6.5.0","css-loader":"^0.28.0","ejs":"^2.5.2","eslint":"^4.9.0","eslint-plugin-jsx-control-statements":"^2.2.0","eslint-plugin-react":"^7.2.1","extract-text-webpack-plugin":"^3.0.0","file-loader":"^1.1.5","fs-extra":"^4.0.0","generate-terriajs-schema":"^1.3.0","gulp":"^3.9.1","gulp-util":"^3.0.7","json5":"^0.5.0","mini-css-extract-plugin":"^0.5.0","mysql":"^2.16.0","node-notifier":"^5.1.2","node-sass":"^4.0.0","prop-types":"^15.6.0","raw-loader":"^0.5.1","react":"^16.3.2","react-dom":"^16.3.2","redbox-react":"^1.3.6","resolve-url-loader":"^2.0.2","sass-loader":"^6.0.3","semver":"^5.0.0","style-loader":"^0.19.1","svg-sprite-loader":"^3.4.0","terriajs":"6.3.6","terriajs-catalog-editor":"^0.2.0","terriajs-cesium":"1.51.0","terriajs-schema":"latest","ts-loader":"^5.3.2","typescript":"^3.2.2","typings-for-css-modules-loader":"^1.7.0","urijs":"^1.18.12","url-loader":"^0.5.7","webpack-node-externals":"^1.7.2","yargs":"^11.0.0"},"scripts":{"gulp-frontend":"gulp build-frontend","gulp-backend":"gulp build-backend","start-frontend":"./node_modules/.bin/webpack-dev-server --config webpack-frontend.config.js --open","start":"bash start-framework.sh --config-file serverconfig.json --public false app","stop":"bash stop-framework.sh","docker-build-local":"node ./deploy/docker/create-docker-context-for-node-components.js --build --push --tag auto --local","docker-build-prod":"node ./deploy/docker/create-docker-context-for-node-components.js --build --push --tag auto","docker-build-ci":"node ./deploy/docker/create-docker-context-for-node-components.js --build","postinstall":"echo 'Installation successful. What to do next:\\n  npm start       # Starts the server on port 3001\\n  gulp watch      # Builds TerriaMap and dependencies, and rebuilds if files change.'","hot":"webpack-dev-server --inline --config buildprocess/webpack.config.hot.js --hot --host 0.0.0.0","deploy":"rm -rf node_modules && npm install && npm run deploy-without-reinstall","deploy-without-reinstall":"gulp clean && gulp release && npm run deploy-current","deploy-current":"npm run get-deploy-overrides && gulp make-package --serverConfigOverride ./privateserverconfig.json --clientConfigOverride ./wwwroot/privateconfig.json && cd deploy/aws && ./stack create && cd ../..","get-deploy-overrides":"aws s3 --profile $npm_package_config_awsProfile cp $npm_package_config_awsS3ServerConfigOverridePath ./privateserverconfig.json && aws s3 --profile $npm_package_config_awsProfile cp $npm_package_config_awsS3ClientConfigOverridePath ./wwwroot/privateconfig.json"}};

/***/ })

};;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9hcHAvY29yZS9hcHAudHMiLCJ3ZWJwYWNrOi8vLy4vYXBwL2NvcmUvY29uZmlndXJlZGF0YWJhc2UudHMiLCJ3ZWJwYWNrOi8vLy4vYXBwL2NvcmUvY29uZmlndXJlc2VydmVyLnRzIiwid2VicGFjazovLy8uL2FwcC9jb3JlL2NvbnRyb2xsZXJzL2NvbnZlcnQuanMiLCJ3ZWJwYWNrOi8vLy4vYXBwL2NvcmUvY29udHJvbGxlcnMvZXNyaS10b2tlbi1hdXRoLmpzIiwid2VicGFjazovLy8uL2FwcC9jb3JlL2NvbnRyb2xsZXJzL2ZlZWRiYWNrLmpzIiwid2VicGFjazovLy8uL2FwcC9jb3JlL2NvbnRyb2xsZXJzL2luaXRmaWxlLmpzIiwid2VicGFjazovLy8uL2FwcC9jb3JlL2NvbnRyb2xsZXJzL3Byb2o0bG9va3VwLmpzIiwid2VicGFjazovLy8uL2FwcC9jb3JlL2NvbnRyb2xsZXJzL3Byb3h5LmpzIiwid2VicGFjazovLy8uL2FwcC9jb3JlL2NvbnRyb2xsZXJzL3Byb3h5ZG9tYWlucy5qcyIsIndlYnBhY2s6Ly8vLi9hcHAvY29yZS9jb250cm9sbGVycy9zZXJ2ZXJjb25maWcuanMiLCJ3ZWJwYWNrOi8vLy4vYXBwL2NvcmUvY29udHJvbGxlcnMvc2hhcmUuanMiLCJ3ZWJwYWNrOi8vLy4vYXBwL2NvcmUvZGF0YWJhc2UudHMiLCJ3ZWJwYWNrOi8vLy4vYXBwL2NvcmUvZGF0YWJhc2VzL215c3FsL215c3FsLmpzIiwid2VicGFjazovLy8uL2FwcC9jb3JlL2Vycm9ycGFnZS50cyIsIndlYnBhY2s6Ly8vLi9hcHAvY29yZS9leGlzdHMudHMiLCJ3ZWJwYWNrOi8vLy4vYXBwL2NvcmUvc2VydmVyb3B0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHdGQUF3RjtBQUN4RixxRkFBcUY7QUFDckYsMkVBQTJFO0FBQzNFLDhDQUE4QztBQUU5QyxJQUFJLEVBQUUsR0FB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cmNlc0NvbnRlbnQiOlsiLy8gVXNpbmcgcmVxdWlyZSBhcyBpdCBpcyBzaW1wbGVyIGluc3RlYWQgb2YgdHlwZXNjcmlwdCdzIGltcG9ydC9leHBvcnQgZGVyaXZlZCBzeW50YXguIFxuLy8gU2VlIHR5cGVzY3JpcHQncyBcImV4cG9ydCA9IGFuZCBpbXBvcnQgPSByZXF1aXJlKClcIiBtb2R1bGVzIGRvY3VtZW50YXRpb24gc2VjdGlvbi4gXG4vLyBEb2N1bWVudGF0aW9uOiBodHRwczovL3d3dy50eXBlc2NyaXB0bGFuZy5vcmcvZG9jcy9oYW5kYm9vay9tb2R1bGVzLmh0bWxcbi8vIFRoaXMgd29ya3Mgd2VsbCB3aXRoIHRoZSBleGlzdGluZyBjb2RlYmFzZS5cblxudmFyIGZzID0gcmVxdWlyZSgnZnMnKTtcbnZhciBjbHVzdGVyID0gcmVxdWlyZSgnY2x1c3RlcicpO1xudmFyIGV4aXN0cyA9IHJlcXVpcmUoJy4vZXhpc3RzJyk7XG52YXIgc2VydmVyb3B0aW9ucyA9IHJlcXVpcmUoJy4vc2VydmVyb3B0aW9ucycpO1xudmFyIGNvbmZpZ3VyZXNlcnZlciA9IHJlcXVpcmUoJy4vY29uZmlndXJlc2VydmVyJyk7XG52YXIgY29uZmlndXJlZGF0YWJhc2UgPSByZXF1aXJlKCcuL2NvbmZpZ3VyZWRhdGFiYXNlJyk7XG5cbmNsYXNzIGFwcCB7XG5cbiAgICAvLyBGcmFtZXdvcmsgQVBJcyB3aWxsIGJlIGRvY3VtZW50ZWQgaW4gdGhlIGZ1dHVyZS5cbiAgICBwdWJsaWMgb3B0aW9uczogYW55OyBcbiAgICBwdWJsaWMgc2VydmVyOiBhbnk7XG4gICAgcHVibGljIGRiOiBhbnk7XG4gICAgcHVibGljIGxvYWRlcjogYW55OyAvLyBNb2R1bGUgbG9hZGVyXG4gICAgcHVibGljIHBhbmVsOiBhbnk7IC8vIFBhbmVsIHJlbmRlcmVyXG5cbiAgICBwdWJsaWMgaW5pdCgpIHtcblxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBuZXcgc2VydmVyb3B0aW9ucygpO1xuICAgICAgICB0aGlzLm9wdGlvbnMuaW5pdCh0cnVlKTtcblxuICAgICAgICBpZiAoY2x1c3Rlci5pc01hc3Rlcikge1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyAoJ1RlcnJpYUpTIFNlcnZlciAnICsgcmVxdWlyZSgnLi4vLi4vcGFja2FnZS5qc29uJykudmVyc2lvbik7IC8vIFRoZSBtYXN0ZXIgcHJvY2VzcyBqdXN0IHNwaW5zIHVwIGEgZmV3IHdvcmtlcnMgYW5kIHF1aXRzLlxuXG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYygndGVycmlhanMucGlkJykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndhcm4oJ1RlcnJpYUpTLVNlcnZlciBzZWVtcyB0byBiZSBydW5uaW5nIGFscmVhZHkuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLnBvcnRJblVzZSh0aGlzLm9wdGlvbnMucG9ydCwgdGhpcy5vcHRpb25zLmxpc3Rlbkhvc3QpO1xuXG4gICAgICAgICAgICBpZih0aGlzLm9wdGlvbnMubGlzdGVuSG9zdCAhPT0gJ2xvY2FsaG9zdCcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJ1bk1hc3RlcigpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0U2VydmVyKHRoaXMub3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25uZWN0RGF0YWJhc2UoKTtcbiAgICAgICAgICAgIH0gICAgIFxuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBXZSdyZSBhIGZvcmtlZCBwcm9jZXNzLlxuICAgICAgICAgICAgdGhpcy5zdGFydFNlcnZlcih0aGlzLm9wdGlvbnMpO1xuICAgICAgICAgICAgdGhpcy5jb25uZWN0RGF0YWJhc2UoKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHVibGljIHBvcnRJblVzZShwb3J0LCBob3N0KSB7XG5cbiAgICAgICAgdmFyIHNlcnZlciA9IHJlcXVpcmUoJ25ldCcpLmNyZWF0ZVNlcnZlcigpO1xuXG4gICAgICAgIHNlcnZlci5saXN0ZW4ocG9ydCwgaG9zdCk7XG4gICAgICAgIHNlcnZlci5vbignZXJyb3InLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnUG9ydCAnICsgcG9ydCArICcgaXMgaW4gdXNlLiBFeGl0IHNlcnZlciB1c2luZyBwb3J0IDMwMDEgYW5kIHRyeSBhZ2Fpbi4nKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICBzZXJ2ZXIub24oJ2xpc3RlbmluZycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlcnZlci5jbG9zZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgfVxuXG4gICAgcHVibGljIGVycm9yKG1lc3NhZ2UpIHtcblxuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvcjogJyArIG1lc3NhZ2UpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgd2FybihtZXNzYWdlKSB7XG5cbiAgICAgICAgY29uc29sZS53YXJuKCdXYXJuaW5nOiAnICsgbWVzc2FnZSk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgaGFuZGxlRXhpdCgpIHtcblxuICAgICAgICBjb25zb2xlLmxvZygnKFRlcnJpYUpTLVNlcnZlciBleGl0aW5nLiknKTtcbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoJ3RlcnJpYWpzLnBpZCcpKSB7XG4gICAgICAgICAgICBmcy51bmxpbmtTeW5jKCd0ZXJyaWFqcy5waWQnKTtcbiAgICAgICAgfVxuICAgICAgICBwcm9jZXNzLmV4aXQoMCk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgcnVuTWFzdGVyKCkge1xuXG4gICAgICAgIHZhciBjcHVDb3VudCA9IHJlcXVpcmUoJ29zJykuY3B1cygpLmxlbmd0aDtcblxuICAgICAgICAvLyBMZXQncyBlcXVhdGUgbm9uLXB1YmxpYywgbG9jYWxob3N0IG1vZGUgd2l0aCBcInNpbmdsZS1jcHUsIGRvbid0IHJlc3RhcnRcIi5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5saXN0ZW5Ib3N0ID09PSAnbG9jYWxob3N0Jykge1xuICAgICAgICAgICAgY3B1Q291bnQgPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coJ1NlcnZpbmcgZGlyZWN0b3J5IFwiJyArIHRoaXMub3B0aW9ucy53d3dyb290ICsgJ1wiIG9uIHBvcnQgJyArIHRoaXMub3B0aW9ucy5wb3J0ICsgJyB0byAnICsgKHRoaXMub3B0aW9ucy5saXN0ZW5Ib3N0ID8gdGhpcy5vcHRpb25zLmxpc3Rlbkhvc3Q6ICd0aGUgd29ybGQnKSArICcuJyk7XG4gICAgICAgIHJlcXVpcmUoJy4vY29udHJvbGxlcnMvY29udmVydCcpKCkudGVzdEdkYWwoKTtcblxuICAgICAgICBpZiAoIWV4aXN0cyh0aGlzLm9wdGlvbnMud3d3cm9vdCkpIHtcbiAgICAgICAgICAgIHRoaXMud2FybignXCInICsgdGhpcy5vcHRpb25zLnd3d3Jvb3QgKyAnXCIgZG9lcyBub3QgZXhpc3QuJyk7XG4gICAgICAgIH0gZWxzZSBpZiAoIWV4aXN0cyh0aGlzLm9wdGlvbnMud3d3cm9vdCArICcvaW5kZXguaHRtbCcpKSB7XG4gICAgICAgICAgICB0aGlzLndhcm4oJ1wiJyArIHRoaXMub3B0aW9ucy53d3dyb290ICsgJ1wiIGlzIG5vdCBhIFRlcnJpYUpTIHd3d3Jvb3QgZGlyZWN0b3J5LicpO1xuICAgICAgICB9IGVsc2UgaWYgKCFleGlzdHModGhpcy5vcHRpb25zLnd3d3Jvb3QgKyAnL2J1aWxkJykpIHtcbiAgICAgICAgICAgIHRoaXMud2FybignXCInICsgdGhpcy5vcHRpb25zLnd3d3Jvb3QgKyAnXCIgaGFzIG5vdCBiZWVuIGJ1aWx0LiBZb3Ugc2hvdWxkIGRvIHRoaXM6XFxuXFxuJyArXG4gICAgICAgICAgICAgICAgJz4gY2QgJyArIHRoaXMub3B0aW9ucy53d3dyb290ICsgJy8uLlxcbicgK1xuICAgICAgICAgICAgICAgICc+IGd1bHBcXG4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLnNldHRpbmdzLmFsbG93UHJveHlGb3IgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLndhcm4oJ1RoZSBjb25maWd1cmF0aW9uIGRvZXMgbm90IGNvbnRhaW4gYSBcImFsbG93UHJveHlGb3JcIiBsaXN0LiAgVGhlIHNlcnZlciB3aWxsIHByb3h5IF9hbnlfIHJlcXVlc3QuJyk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm9jZXNzLm9uKCdTSUdURVJNJywgdGhpcy5oYW5kbGVFeGl0KTtcblxuICAgICAgICAvLyBMaXN0ZW4gZm9yIGR5aW5nIHdvcmtlcnNcbiAgICAgICAgY2x1c3Rlci5vbignZXhpdCcsIGZ1bmN0aW9uICh3b3JrZXIpIHtcbiAgICAgICAgICAgIGlmICghd29ya2VyLnN1aWNpZGUpIHtcbiAgICAgICAgICAgICAgICAvLyBSZXBsYWNlIHRoZSBkZWFkIHdvcmtlciBpZiBub3QgYSBzdGFydHVwIGVycm9yIGxpa2UgcG9ydCBpbiB1c2UuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5saXN0ZW5Ib3N0ID09PSAnbG9jYWxob3N0Jykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnV29ya2VyICcgKyB3b3JrZXIuaWQgKyAnIGRpZWQuIE5vdCByZXBsYWNpbmcgaXQgYXMgd2VcXCdyZSBydW5uaW5nIGluIG5vbi1wdWJsaWMgbW9kZS4nKTsgICAgXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1dvcmtlciAnICsgd29ya2VyLmlkICsgJyBkaWVkLiBSZXBsYWNpbmcgaXQuJyk7XG4gICAgICAgICAgICAgICAgICAgIGNsdXN0ZXIuZm9yaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgZnMud3JpdGVGaWxlU3luYygndGVycmlhanMucGlkJywgcHJvY2Vzcy5waWQudG9TdHJpbmcoKSk7XG5cbiAgICAgICAgY29uc29sZS5sb2coJyhUZXJyaWFKUy1TZXJ2ZXIgcnVubmluZyB3aXRoIHBpZCAnICsgcHJvY2Vzcy5waWQgKyAnKScpO1xuICAgICAgICBjb25zb2xlLmxvZygnTGF1bmNoaW5nICcgKyAgY3B1Q291bnQgKyAnIHdvcmtlciBwcm9jZXNzZXMuJyk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGEgd29ya2VyIGZvciBlYWNoIENQVVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNwdUNvdW50OyBpICs9IDEpIHtcbiAgICAgICAgICAgIGNsdXN0ZXIuZm9yaygpO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc3RhcnRTZXJ2ZXIob3B0aW9ucykge1xuXG4gICAgICAgIHRoaXMuc2VydmVyID0gY29uZmlndXJlc2VydmVyLnN0YXJ0KG9wdGlvbnMpOyAvLyBTZXQgc2VydmVyIGNvbmZpZ3VyYXRpb25zIGFuZCBnZW5lcmF0ZSBzZXJ2ZXIuIFdlIHJlcGxhY2UgYXBwIGhlcmUgd2l0aCB0aGUgYWN0dWFsIGFwcGxpY2F0aW9uIHNlcnZlciBmb3IgcHJvcGVyIG5hbWluZyBjb252ZW50aW9ucy5cbiAgICAgICAgXG4gICAgICAgIHRoaXMuc2VydmVyLmxpc3RlbihvcHRpb25zLnBvcnQsIG9wdGlvbnMubGlzdGVuSG9zdCwgKCkgPT4gY29uc29sZS5sb2coYFRlcnJpYSBmcmFtZXdvcmsgcnVubmluZyBvbiAke29wdGlvbnMucG9ydH0hYCkpOyAvLyBTdGFydCBIVFRQL3Mgc2VydmVyIHdpdGggZXhwcmVzc2pzIG1pZGRsZXdhcmUuXG5cbiAgICB9XG5cbiAgICBwdWJsaWMgY29ubmVjdERhdGFiYXNlKCkge1xuXG4gICAgICAgIHRoaXMuZGIgPSBjb25maWd1cmVkYXRhYmFzZS5zdGFydCgpOyAvLyBSdW4gZGF0YWJhc2UgY29uZmlndXJhdGlvbiBhbmQgZ2V0IGRhdGFiYXNlIG9iamVjdCBmb3IgdGhlIGZyYW1ld29yay5cblxuICAgIH1cblxufVxuXG5leHBvcnQgPSBhcHA7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBkYXRhYmFzZSA9IHJlcXVpcmUoJy4vZGF0YWJhc2UnKTtcbnZhciBjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWcuanNvbicpOyBcblxuLy8gVGhpcyBpcyBhIHN0YXRpYyBjbGFzcyB3aXRoIHN0YXRpYyBwcm9wZXJ0aWVzIHRvIGNvbmZpZ3VyZSB0aGUgZGF0YWJhc2UuIFxuLy8gQ3JlYXRlcyBhbmQgcmV0dXJucyBhIHNpbmdsZSBkYXRhYmFzZSBvYmplY3Qgd2l0aCBjb25uZWN0aW9uIHByb3BlcnR5LlxuLy8gSXQgZG9lcyBub3QgbmVlZCB0byBiZSBpbnN0YW50aWF0ZWQuIFxuY2xhc3MgY29uZmlndXJlZGF0YWJhc2Uge1xuXG5cdHN0YXRpYyBzdGFydCgpOiBhbnkge1xuXG5cdFx0dmFyIGNvbm5lY3Rpb247XG5cblx0XHRzd2l0Y2goY29uZmlnLmRhdGFiYXNlLnR5cGUpIHtcblx0XHRjYXNlICdteXNxbCc6XG5cdFx0XHRjb25uZWN0aW9uID0gcmVxdWlyZSgnLi9kYXRhYmFzZXMvbXlzcWwvbXlzcWwuanMnKTtcblx0XHQvKiBPdGhlciBkYXRhYmFzZSBleGFtcGxlXG5cdFx0Y2FzZSAnbXNzcWwnOlxuXHRcdFx0dGVycmlhZGIgPSByZXF1aXJlKCcuL2RhdGFiYXNlcy9tc3NxbC9tc3NxbC5qcycpO1xuXHRcdCovXG5cdFx0LyogT3RoZXIgZGF0YWJhc2UgZXhhbXBsZVxuXHRcdGNhc2UgJ21vbmdvZGInOlxuXHRcdFx0dGVycmlhZGIgPSByZXF1aXJlKCcuL2RhdGFiYXNlcy9tb25nb2RiL21vbmdvZGIuanMnKTtcblx0XHQqL1xuXHRcdC8qIEN1c3RvbSBleGFtcGxlXG5cdFx0Y2FzZSAnY3VzdG9tZGInOlxuXHRcdFx0dGVycmlhZGIgPSByZXF1aXJlKCcuL2RhdGFiYXNlcy9jdXN0b21kYi9jdXN0b21kYi5qcycpO1xuXHRcdCovXG5cdFx0ZGVmYXVsdDogXG5cdFx0XHRjb25uZWN0aW9uID0gcmVxdWlyZSgnLi9kYXRhYmFzZXMvbXlzcWwvbXlzcWwuanMnKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbmV3IGRhdGFiYXNlKGNvbmZpZy5kYXRhYmFzZS50eXBlLCBjb25maWcuZGF0YWJhc2UuaG9zdCwgY29uZmlnLmRhdGFiYXNlLnVzZXJuYW1lLCBjb25maWcuZGF0YWJhc2UucGFzc3dvcmQsIGNvbm5lY3Rpb24pOyAvLyBSZXR1cm4gZGF0YWJhc2Ugb2JqZWN0XG5cblx0fVxuXG59XG5cbmV4cG9ydCA9IGNvbmZpZ3VyZWRhdGFiYXNlOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIGV4cHJlc3MgPSByZXF1aXJlKCdleHByZXNzJyk7XG52YXIgY29tcHJlc3Npb24gPSByZXF1aXJlKCdjb21wcmVzc2lvbicpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgY29ycyA9IHJlcXVpcmUoJ2NvcnMnKTtcbnZhciBjbHVzdGVyID0gcmVxdWlyZSgnY2x1c3RlcicpO1xudmFyIGV4aXN0cyA9IHJlcXVpcmUoJy4vZXhpc3RzJyk7XG52YXIgYmFzaWNBdXRoID0gcmVxdWlyZSgnYmFzaWMtYXV0aCcpO1xudmFyIGZzID0gcmVxdWlyZSgnZnMnKTtcbnZhciBFeHByZXNzQnJ1dGUgPSByZXF1aXJlKCdleHByZXNzLWJydXRlJyk7XG5cbi8vIFRoaXMgaXMgYSBzdGF0aWMgY2xhc3Mgd2l0aCBzdGF0aWMgcHJvcGVydGllcyB0byBjb25maWd1cmUgdGhlIHNlcnZlci4gXG4vLyBDcmVhdGVzIGFuZCByZXR1cm5zIGEgc2luZ2xlIGV4cHJlc3Mgc2VydmVyLlxuLy8gSXQgZG9lcyBub3QgbmVlZCB0byBiZSBpbnN0YW50aWF0ZWQuIFxuY2xhc3MgY29uZmlndXJlc2VydmVyIHtcblxuICAgIHB1YmxpYyBzdGF0aWMgYXBwOiBhbnk7XG4gICAgcHVibGljIHN0YXRpYyBvcHRpb25zOiBhbnk7XG5cbiAgICBzdGF0aWMgc3RhcnQob3B0aW9ucyk6IGFueSB7XG5cbiAgICAgICAgLy8gZXZlbnR1YWxseSB0aGlzIG1pbWUgdHlwZSBjb25maWd1cmF0aW9uIHdpbGwgbmVlZCB0byBjaGFuZ2VcbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3Zpc2lvbm1lZGlhL3NlbmQvY29tbWl0L2QyY2I1NDY1OGNlNjU5NDhiMGVkNmU1ZmI1ZGU2OWQwMjJiZWY5NDFcbiAgICAgICAgdmFyIG1pbWUgPSBleHByZXNzLnN0YXRpYy5taW1lO1xuICAgICAgICBtaW1lLmRlZmluZSh7XG4gICAgICAgICAgICAndGhpcy5hcHBsaWNhdGlvbi9qc29uJyA6IFsnY3ptbCcsICdqc29uJywgJ2dlb2pzb24nXSxcbiAgICAgICAgICAgICd0ZXh0L3BsYWluJyA6IFsnZ2xzbCddXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgICAgICAgLy8gaW5pdGlhbGlzZSB0aGlzLmFwcCB3aXRoIHN0YW5kYXJkIG1pZGRsZXdhcmVzXG4gICAgICAgIHRoaXMuYXBwID0gZXhwcmVzcygpO1xuICAgICAgICB0aGlzLmFwcC51c2UoY29tcHJlc3Npb24oKSk7XG4gICAgICAgIHRoaXMuYXBwLnVzZShjb3JzKCkpO1xuICAgICAgICB0aGlzLmFwcC5kaXNhYmxlKCdldGFnJyk7XG5cbiAgICAgICAgLy9yb3V0ZXMuaW5pdCh0aGlzLmFwcCwgdGhpcy5vcHRpb25zKTsgLy8gV2UgY29uZmlndXJlIHRoZSBzZXJ2ZXIgYnkgcnVubmluZyB0aGUgcm91dGVzIGNsYXNzLlxuXG4gICAgICAgIGlmIChvcHRpb25zLnZlcmJvc2UpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwLnVzZShyZXF1aXJlKCdtb3JnYW4nKSgnZGV2JykpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnNldHRpbmdzLnRydXN0UHJveHkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLmFwcC5zZXQoJ3RydXN0IHByb3h5Jywgb3B0aW9ucy5zZXR0aW5ncy50cnVzdFByb3h5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvcHRpb25zLnZlcmJvc2UpIHtcbiAgICAgICAgICAgIHRoaXMubG9nKCdMaXN0ZW5pbmcgb24gdGhlc2UgdGhpcy5lbmRwb2ludHM6JywgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmVuZHBvaW50KCcvcGluZycsIGZ1bmN0aW9uKHJlcSwgcmVzKXtcbiAgICAgICAgICByZXMuc3RhdHVzKDIwMCkuc2VuZCgnT0snKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gV2UgZG8gdGhpcyBhZnRlciB0aGUgL3Bpbmcgc2VydmljZSBhYm92ZSBzbyB0aGF0IHBpbmcgY2FuIGJlIHVzZWQgdW5hdXRoZW50aWNhdGVkIGFuZCB3aXRob3V0IFRMUyBmb3IgaGVhbHRoIGNoZWNrcy5cblxuICAgICAgICBpZiAob3B0aW9ucy5zZXR0aW5ncy5yZWRpcmVjdFRvSHR0cHMpIHtcbiAgICAgICAgICAgIHZhciBodHRwQWxsb3dlZEhvc3RzID0gb3B0aW9ucy5zZXR0aW5ncy5odHRwQWxsb3dlZEhvc3RzIHx8IFtcImxvY2FsaG9zdFwiXTtcbiAgICAgICAgICAgIHRoaXMuYXBwLnVzZShmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICAgICAgICAgICAgICAgIGlmIChodHRwQWxsb3dlZEhvc3RzLmluZGV4T2YocmVxLmhvc3RuYW1lKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHJlcS5wcm90b2NvbCAhPT0gJ2h0dHBzJykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdXJsID0gJ2h0dHBzOi8vJyArIHJlcS5ob3N0bmFtZSArIHJlcS51cmw7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5yZWRpcmVjdCgzMDEsIHVybCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGF1dGggPSBvcHRpb25zLnNldHRpbmdzLmJhc2ljQXV0aGVudGljYXRpb247XG5cbiAgICAgICAgaWYgKGF1dGggJiYgYXV0aC51c2VybmFtZSAmJiBhdXRoLnBhc3N3b3JkKSB7XG4gICAgICAgICAgICB2YXIgc3RvcmUgPSBuZXcgRXhwcmVzc0JydXRlLk1lbW9yeVN0b3JlKCk7XG4gICAgICAgICAgICB2YXIgcmF0ZUxpbWl0T3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICBmcmVlUmV0cmllczogMixcbiAgICAgICAgICAgICAgICBtaW5XYWl0OiAyMDAsXG4gICAgICAgICAgICAgICAgbWF4V2FpdDogNjAwMDAsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc2V0dGluZ3MucmF0ZUxpbWl0ICYmIG9wdGlvbnMuc2V0dGluZ3MucmF0ZUxpbWl0LmZyZWVSZXRyaWVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByYXRlTGltaXRPcHRpb25zLmZyZWVSZXRyaWVzID0gb3B0aW9ucy5zZXR0aW5ncy5yYXRlTGltaXQuZnJlZVJldHJpZXM7XG4gICAgICAgICAgICAgICAgcmF0ZUxpbWl0T3B0aW9ucy5taW5XYWl0ID0gb3B0aW9ucy5zZXR0aW5ncy5yYXRlTGltaXQubWluV2FpdDtcbiAgICAgICAgICAgICAgICByYXRlTGltaXRPcHRpb25zLm1heFdhaXQgPSBvcHRpb25zLnNldHRpbmdzLnJhdGVMaW1pdC5tYXhXYWl0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGJydXRlZm9yY2UgPSBuZXcgRXhwcmVzc0JydXRlKHN0b3JlLCByYXRlTGltaXRPcHRpb25zKTtcbiAgICAgICAgICAgIHRoaXMuYXBwLnVzZShicnV0ZWZvcmNlLnByZXZlbnQsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHVzZXIgPSBiYXNpY0F1dGgocmVxKTtcbiAgICAgICAgICAgICAgICBpZiAodXNlciAmJiB1c2VyLm5hbWUgPT09IGF1dGgudXNlcm5hbWUgJiYgdXNlci5wYXNzID09PSBhdXRoLnBhc3N3b3JkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFN1Y2Nlc3NmdWwgYXV0aGVudGljYXRpb24sIHJlc2V0IHJhdGUgbGltaXRpbmcuXG4gICAgICAgICAgICAgICAgICAgIHJlcS5icnV0ZS5yZXNldChuZXh0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMTtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignV1dXLUF1dGhlbnRpY2F0ZScsICdCYXNpYyByZWFsbT1cInRlcnJpYWpzLXNlcnZlclwiJyk7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5lbmQoJ1VuYXV0aG9yaXplZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2VydmUgdGhlIGJ1bGsgb2YgdGhlIGFwcGxpY2F0aW9uIGFzIGEgc3RhdGljIHdlYiBkaXJlY3RvcnkuXG4gICAgICAgIHZhciBzZXJ2ZVd3d1Jvb3QgPSBleGlzdHMob3B0aW9ucy53d3dyb290ICsgJy9pbmRleC5odG1sJyk7XG4gICAgICAgIGlmIChzZXJ2ZVd3d1Jvb3QpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwLnVzZShleHByZXNzLnN0YXRpYyhvcHRpb25zLnd3d3Jvb3QpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByb3h5IGZvciBzZXJ2ZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBDT1JTXG4gICAgICAgIHZhciBieXBhc3NVcHN0cmVhbVByb3h5SG9zdHNNYXAgPSAob3B0aW9ucy5zZXR0aW5ncy5ieXBhc3NVcHN0cmVhbVByb3h5SG9zdHMgfHwgW10pLnJlZHVjZShmdW5jdGlvbihtYXAsIGhvc3QpIHtcbiAgICAgICAgICAgICAgICBpZiAoaG9zdCAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFwW2hvc3QudG9Mb3dlckNhc2UoKV0gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbWFwO1xuICAgICAgICAgICAgfSwge30pO1xuXG4gICAgICAgIHRoaXMuZW5kcG9pbnQoJy9wcm94eScsIHJlcXVpcmUoJy4vY29udHJvbGxlcnMvcHJveHknKSh7XG4gICAgICAgICAgICBwcm94eWFibGVEb21haW5zOiBvcHRpb25zLnNldHRpbmdzLmFsbG93UHJveHlGb3IsXG4gICAgICAgICAgICBwcm94eUFsbERvbWFpbnM6IG9wdGlvbnMuc2V0dGluZ3MucHJveHlBbGxEb21haW5zLFxuICAgICAgICAgICAgcHJveHlBdXRoOiBvcHRpb25zLnByb3h5QXV0aCxcbiAgICAgICAgICAgIHByb3h5UG9zdFNpemVMaW1pdDogb3B0aW9ucy5zZXR0aW5ncy5wcm94eVBvc3RTaXplTGltaXQsXG4gICAgICAgICAgICB1cHN0cmVhbVByb3h5OiBvcHRpb25zLnNldHRpbmdzLnVwc3RyZWFtUHJveHksXG4gICAgICAgICAgICBieXBhc3NVcHN0cmVhbVByb3h5SG9zdHM6IGJ5cGFzc1Vwc3RyZWFtUHJveHlIb3N0c01hcCxcbiAgICAgICAgICAgIGJhc2ljQXV0aGVudGljYXRpb246IG9wdGlvbnMuc2V0dGluZ3MuYmFzaWNBdXRoZW50aWNhdGlvbixcbiAgICAgICAgICAgIGJsYWNrbGlzdGVkQWRkcmVzc2VzOiBvcHRpb25zLnNldHRpbmdzLmJsYWNrbGlzdGVkQWRkcmVzc2VzXG4gICAgICAgIH0pKTtcblxuICAgICAgICB2YXIgZXNyaVRva2VuQXV0aCA9IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvZXNyaS10b2tlbi1hdXRoJykob3B0aW9ucy5zZXR0aW5ncy5lc3JpVG9rZW5BdXRoKTtcbiAgICAgICAgaWYgKGVzcmlUb2tlbkF1dGgpIHtcbiAgICAgICAgICAgIHRoaXMuZW5kcG9pbnQoJy9lc3JpLXRva2VuLWF1dGgnLCBlc3JpVG9rZW5BdXRoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZW5kcG9pbnQoJy9wcm9qNGRlZicsIHJlcXVpcmUoJy4vY29udHJvbGxlcnMvcHJvajRsb29rdXAnKSk7ICAgICAgICAgICAgLy8gUHJvajRkZWYgbG9va3VwIHNlcnZpY2UsIHRvIGF2b2lkIGRvd25sb2FkaW5nIGFsbCBkZWZpbml0aW9ucyBpbnRvIHRoZSBjbGllbnQuXG4gICAgICAgIHRoaXMuZW5kcG9pbnQoJy9jb252ZXJ0JywgcmVxdWlyZSgnLi9jb250cm9sbGVycy9jb252ZXJ0Jykob3B0aW9ucykucm91dGVyKTsgLy8gT0dSMk9HUiB3cnRoaXMuYXBwZXIgdG8gYWxsb3cgc3VwcG9ydGluZyBmaWxlIHR5cGVzIGxpa2UgU2hhcGVmaWxlLlxuICAgICAgICB0aGlzLmVuZHBvaW50KCcvcHJveHlhYmxlZG9tYWlucycsIHJlcXVpcmUoJy4vY29udHJvbGxlcnMvcHJveHlkb21haW5zJykoeyAgIC8vIFJldHVybnMgSlNPTiBsaXN0IG9mIGRvbWFpbnMgd2UncmUgd2lsbGluZyB0byBwcm94eSBmb3JcbiAgICAgICAgICAgIHByb3h5YWJsZURvbWFpbnM6IG9wdGlvbnMuc2V0dGluZ3MuYWxsb3dQcm94eUZvcixcbiAgICAgICAgICAgIHByb3h5QWxsRG9tYWluczogISFvcHRpb25zLnNldHRpbmdzLnByb3h5QWxsRG9tYWlucyxcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmVuZHBvaW50KCcvc2VydmVyY29uZmlnJywgcmVxdWlyZSgnLi9jb250cm9sbGVycy9zZXJ2ZXJjb25maWcnKShvcHRpb25zKSk7XG5cbiAgICAgICAgdmFyIGVycm9yUGFnZSA9IHJlcXVpcmUoJy4vZXJyb3JwYWdlJyk7XG4gICAgICAgIHZhciBzaG93NDA0ID0gc2VydmVXd3dSb290ICYmIGV4aXN0cyhvcHRpb25zLnd3d3Jvb3QgKyAnLzQwNC5odG1sJyk7XG4gICAgICAgIHZhciBlcnJvcjQwNCA9IGVycm9yUGFnZS5lcnJvcjQwNChzaG93NDA0LCBvcHRpb25zLnd3d3Jvb3QsIHNlcnZlV3d3Um9vdCk7XG4gICAgICAgIHZhciBzaG93NTAwID0gc2VydmVXd3dSb290ICYmIGV4aXN0cyhvcHRpb25zLnd3d3Jvb3QgKyAnLzUwMC5odG1sJyk7XG4gICAgICAgIHZhciBlcnJvcjUwMCA9IGVycm9yUGFnZS5lcnJvcjUwMChzaG93NTAwLCBvcHRpb25zLnd3d3Jvb3QpO1xuICAgICAgICB2YXIgaW5pdFBhdGhzID0gb3B0aW9ucy5zZXR0aW5ncy5pbml0UGF0aHMgfHwgW107XG5cbiAgICAgICAgaWYgKHNlcnZlV3d3Um9vdCkge1xuICAgICAgICAgICAgaW5pdFBhdGhzLnB1c2gocGF0aC5qb2luKG9wdGlvbnMud3d3cm9vdCwgJ2luaXQnKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmFwcC51c2UoJy9pbml0JywgcmVxdWlyZSgnLi9jb250cm9sbGVycy9pbml0ZmlsZScpKGluaXRQYXRocywgZXJyb3I0MDQsIG9wdGlvbnMuY29uZmlnRGlyKSk7XG5cbiAgICAgICAgdmFyIGZlZWRiYWNrU2VydmljZSA9IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvZmVlZGJhY2snKShvcHRpb25zLnNldHRpbmdzLmZlZWRiYWNrKTtcbiAgICAgICAgaWYgKGZlZWRiYWNrU2VydmljZSkge1xuICAgICAgICAgICAgdGhpcy5lbmRwb2ludCgnL2ZlZWRiYWNrJywgZmVlZGJhY2tTZXJ2aWNlKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdmFyIHNoYXJlU2VydmljZSA9IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvc2hhcmUnKShvcHRpb25zLnNldHRpbmdzLnNoYXJlVXJsUHJlZml4ZXMsIG9wdGlvbnMuc2V0dGluZ3MubmV3U2hhcmVVcmxQcmVmaXgsIG9wdGlvbnMuaG9zdE5hbWUsIG9wdGlvbnMucG9ydCk7XG4gICAgICAgIGlmIChzaGFyZVNlcnZpY2UpIHtcbiAgICAgICAgICAgIHRoaXMuZW5kcG9pbnQoJy9zaGFyZScsIHNoYXJlU2VydmljZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmFwcC51c2UoZXJyb3I0MDQpO1xuICAgICAgICB0aGlzLmFwcC51c2UoZXJyb3I1MDApO1xuICAgICAgICB2YXIgc2VydmVyID0gdGhpcy5hcHA7XG4gICAgICAgIHZhciBvc2ggPSBvcHRpb25zLnNldHRpbmdzLmh0dHBzO1xuICAgICAgICBpZiAob3NoICYmIG9zaC5rZXkgJiYgb3NoLmNlcnQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdMYXVuY2hpbmcgaW4gSFRUUFMgbW9kZS4nKTtcbiAgICAgICAgICAgIHZhciBodHRwcyA9IHJlcXVpcmUoJ2h0dHBzJyk7XG4gICAgICAgICAgICBzZXJ2ZXIgPSBodHRwcy5jcmVhdGVTZXJ2ZXIoe1xuICAgICAgICAgICAgICAgIGtleTogZnMucmVhZEZpbGVTeW5jKG9zaC5rZXkpLFxuICAgICAgICAgICAgICAgIGNlcnQ6IGZzLnJlYWRGaWxlU3luYyhvc2guY2VydClcbiAgICAgICAgICAgIH0sIHRoaXMuYXBwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb2Nlc3Mub24oJ3VuY2F1Z2h0RXhjZXB0aW9uJywgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayA/IGVyci5zdGFjayA6IGVycik7XG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBzZXJ2ZXI7XG5cbiAgICB9XG5cbiAgICBzdGF0aWMgbG9nKG1lc3NhZ2UsIHdvcmtlcjFvbmx5KSB7XG5cbiAgICAgICAgaWYgKCF3b3JrZXIxb25seSB8fCBjbHVzdGVyLmlzV29ya2VyICYmIGNsdXN0ZXIud29ya2VyLmlkID09PSAxKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgc3RhdGljIGVuZHBvaW50KHBhdGgscm91dGVyKSB7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy52ZXJib3NlKSB7XG4gICAgICAgICAgICB0aGlzLmxvZygnaHR0cDovLycgKyB0aGlzLm9wdGlvbnMuaG9zdE5hbWUgKyAnOicgKyB0aGlzLm9wdGlvbnMucG9ydCArICcvYXBpL3YxJyArIHBhdGgsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYXRoICE9PSAncHJveHlhYmxlZG9tYWlucycpIHtcbiAgICAgICAgICAgIC8vIGRlcHJlY2F0ZWQgdGhpcy5lbmRwb2ludCB0aGF0IGlzbid0IHBhcnQgb2YgVjFcbiAgICAgICAgICAgIHRoaXMuYXBwLnVzZSgnL2FwaS92MScgKyBwYXRoLCByb3V0ZXIpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGRlcHJlY2F0ZWQgdGhpcy5lbmRwb2ludCBhdCBgL2BcbiAgICAgICAgdGhpcy5hcHAudXNlKHBhdGgsIHJvdXRlcik7XG5cbiAgICB9XG5cbn1cblxuZXhwb3J0ID0gY29uZmlndXJlc2VydmVyOyIsIi8qIGpzaGludCBub2RlOiB0cnVlICovXG5cInVzZSBzdHJpY3RcIjtcbnZhciBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpO1xudmFyIGZzID0gcmVxdWlyZSgnZnMnKTtcbnZhciBvZ3Iyb2dyID0gcmVxdWlyZSgndGVycmlhanMtb2dyMm9ncicpO1xudmFyIHJlcXVlc3QgPSByZXF1aXJlKCdyZXF1ZXN0Jyk7XG52YXIgZm9ybWlkYWJsZSA9IHJlcXVpcmUoJ2Zvcm1pZGFibGUnKTtcblxudmFyIGNvbnZlcnQgPSB7fTtcblxuY29udmVydC50ZXN0R2RhbCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIHRlc3QgZG9pbmcgJ3NvbWV0aGluZycgd2l0aCBhbiBlbXB0eSBHZW9KU09OIG9iamVjdC4gSXQgd2lsbCBlaXRoZXIgZmFpbCB3aXRoIEVOT0VOVCwgb3IgZmFpbCB3aXRoIE9HUjJPR1Igb3V0cHV0LlxuICAgIG9ncjJvZ3Ioe30pLmV4ZWMoZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgaWYgKChlcnJvciAhPT0gdW5kZWZpbmVkKSAmJiBlcnJvci5tZXNzYWdlLm1hdGNoKC9FTk9FTlQvKSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0NvbnZlcnQgd2FybmluZzogb2dyMm9nciAoZ2RhbCkgaXMgbm90IGluc3RhbGxlZCBvciBpbmFjY2Vzc2libGUsIHNvIHRoZSBmb3JtYXQgY29udmVyc2lvbiBzZXJ2aWNlIHdpbGwgZmFpbC4nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEdEQUwgaXMgaW5zdGFsbGVkIG9rLlxuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG5mdW5jdGlvbiB0b29CaWdFcnJvcihyZXF1ZXN0LCByZXNwb25zZSkge1xuICAgIHJlc3BvbnNlLmhlYWRlcignQ29ubmVjdGlvbicsICdjbG9zZScpOyAvLyBzdG9wIHRoZSBjbGllbnQgZnJvbSBzZW5kaW5nIGFkZGl0aW9uYWwgZGF0YS5cbiAgICByZXNwb25zZS5zdGF0dXMoNDEzKSAvLyBQYXlsb2FkIFRvbyBMYXJnZVxuICAgICAgICAgICAgLnNlbmQoJ1RoaXMgZmlsZSBpcyB0b28gYmlnIHRvIGNvbnZlcnQuIE1heGltdW0gYWxsb3dlZCBzaXplOiAnICsgY29udmVydC5tYXhDb252ZXJzaW9uU2l6ZSArICcgYnl0ZXMnKTtcbiAgICBjb25zb2xlLmxvZygnQ29udmVydDogdXBsb2FkZWQgZmlsZSBleGNlZWRzIGxpbWl0IG9mICcgKyBjb252ZXJ0Lm1heENvbnZlcnNpb25TaXplICsgJyBieXRlcy4gQWJvcnRpbmcuJyk7XG59XG5cbi8vIEV4dHJhY3QgZmlsZSBuYW1lIGFuZCBwYXRoIG91dCBvZiB0aGUgcHJvdmlkZWQgSFRUUCBQT1NUIGZvcm1cbmZ1bmN0aW9uIHBhcnNlRm9ybShyZXEsIHJlcywgY2FsbGJhY2spIHtcbiAgICB2YXIgZm9ybSA9IG5ldyBmb3JtaWRhYmxlLkluY29taW5nRm9ybSgpO1xuICAgIGZvcm0ub24oJ3Byb2dyZXNzJywgZnVuY3Rpb24oYnl0ZXNSZWNlaXZlZCwgYnl0ZXNFeHBlY3RlZCkge1xuICAgICAgICAvLyBBbGxvdyBkb3VibGUgYmVjYXVzZSBieXRlc1JlY2VpdmVkIGlzIHRoZSBlbnRpcmUgZm9ybSwgbm90IGp1c3QgdGhlIGZpbGUuXG4gICAgICAgIGlmIChieXRlc1JlY2VpdmVkID4gY29udmVydC5tYXhDb252ZXJzaW9uU2l6ZSAqIDIpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB0b29CaWdFcnJvcihyZXEsIHJlcyk7XG5cbiAgICAgICAgICAgIC8vIHJlbW92ZSBhbnkgZmlsZXMgYWxyZWFkeSB1cGxvYWRlZFxuICAgICAgICAgICAgKGZvcm0ub3BlbmVkRmlsZXMgfHwgW10pLmZvckVhY2goZnVuY3Rpb24oZmlsZSkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGZzLnVubGluayhmaWxlLnBhdGgpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgZm9ybS5wYXJzZShyZXEsIGZ1bmN0aW9uKGVyciwgZmllbGRzLCBmaWxlcykge1xuICAgICAgICBpZiAoZmllbGRzLmlucHV0X3VybCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAoZmllbGRzLmlucHV0X3VybC5pbmRleE9mKCdodHRwJykgPT09IDApIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhmaWVsZHMuaW5wdXRfdXJsLCBmaWVsZHMuaW5wdXRfdXJsLCByZXEsIHJlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoZmlsZXMuaW5wdXRfZmlsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAoZmlsZXMuaW5wdXRfZmlsZS5zaXplIDw9IGNvbnZlcnQubWF4Q29udmVyc2lvblNpemUpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhmaWxlcy5pbnB1dF9maWxlLnBhdGgsIGZpbGVzLmlucHV0X2ZpbGUubmFtZSwgcmVxLCByZXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmcy51bmxpbmsoZmlsZXMuaW5wdXRfZmlsZS5wYXRoKTsgLy8gd2UgaGF2ZSB0byBkZWxldGUgdGhlIHVwbG9hZCBvdXJzZWx2ZXMuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvb0JpZ0Vycm9yKHJlcSwgcmVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG4vLyBQYXNzIGEgc3RyZWFtIHRvIHRoZSBPR1IyT0dSIGxpYnJhcnksIHJldHVybmluZyBhIEdlb0pTT04gcmVzdWx0LlxuZnVuY3Rpb24gY29udmVydFN0cmVhbShzdHJlYW0sIHJlcSwgcmVzLCBoaW50LCBmcGF0aCkge1xuICAgIHZhciBvZ3IgPSBvZ3Iyb2dyKHN0cmVhbSwgaGludClcbiAgICAgICAgICAgICAgICAgICAgLnNraXBmYWlsdXJlcygpXG4gICAgICAgICAgICAgICAgICAgIC5vcHRpb25zKFsnLXRfc3JzJywgJ0VQU0c6NDMyNiddKTtcblxuICAgIG9nci5leGVjKGZ1bmN0aW9uIChlciwgZGF0YSkge1xuICAgICAgICBpZiAoZXIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvbnZlcnQgZXJyb3I6ICcgKyBlcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmVzLnN0YXR1cygyMDApLnNlbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzLnN0YXR1cyg0MTUpLiAvLyBVbnN1cHBvcnRlZCBNZWRpYSBUeXBlXG4gICAgICAgICAgICAgICAgc2VuZCgnVW5hYmxlIHRvIGNvbnZlcnQgdGhpcyBkYXRhIGZpbGUuIEZvciBhIGxpc3Qgb2YgZm9ybWF0cyBzdXBwb3J0ZWQgYnkgVGVycmlhLCBzZWUgaHR0cDovL3d3dy5nZGFsLm9yZy9vZ3JfZm9ybWF0cy5odG1sIC4nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZnBhdGgpIHtcbiAgICAgICAgICAgIGZzLnVubGluayhmcGF0aCk7IC8vIGNsZWFuIHVwIHRoZSB0ZW1wb3JhcnkgZmlsZSBvbiBkaXNrXG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlQ29udGVudCAoZnBhdGgsIGZuYW1lLCByZXEsIHJlcykge1xuICAgIGlmICghZnBhdGgpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5zZW5kKCdObyBmaWxlIHByb3ZpZGVkIHRvIGNvbnZlcnQuJyk7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCdDb252ZXJ0OiByZWNlaXZpbmcgZmlsZSBuYW1lZCAnLCBmbmFtZSk7XG5cbiAgICB2YXIgaGludCA9ICcnO1xuICAgIC8vc2ltcGxlIGhpbnQgZm9yIG5vdywgbWlnaHQgbmVlZCB0byBjcmFjayB6aXAgZmlsZXMgZ29pbmcgZm9yd2FyZFxuICAgIGlmIChmbmFtZS5tYXRjaCgvXFwuemlwJC8pKSB7XG4gICAgICAgIGhpbnQgPSAnc2hwJztcbiAgICB9XG4gICAgaWYgKGZwYXRoLmluZGV4T2YoJ2h0dHAnKSA9PT0gMCkge1xuICAgICAgICB2YXIgaHR0cFN0cmVhbSwgYWJvcnQgPSBmYWxzZTtcbiAgICAgICAgLy8gUmVhZCBmaWxlIGNvbnRlbnQgYnkgb3BlbmluZyB0aGUgVVJMIGdpdmVuIHRvIHVzXG4gICAgICAgIGh0dHBTdHJlYW0gPSByZXF1ZXN0LmdldCh7dXJsOiBmcGF0aH0pO1xuICAgICAgICBodHRwU3RyZWFtLm9uKCdyZXNwb25zZScsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgcmVxdWVzdCA9IHRoaXMsIGxlbiA9IDA7XG4gICAgICAgICAgICBjb252ZXJ0U3RyZWFtKHJlc3BvbnNlLCByZXEsIHJlcywgaGludCk7XG4gICAgICAgICAgICByZXNwb25zZS5vbignZGF0YScsIGZ1bmN0aW9uIChjaHVuaykge1xuICAgICAgICAgICAgICAgIGxlbiArPSBjaHVuay5sZW5ndGg7XG4gICAgICAgICAgICAgICAgaWYgKCFhYm9ydCAmJiBsZW4gPiBjb252ZXJ0Lm1heENvbnZlcnNpb25TaXplKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvb0JpZ0Vycm9yKHJlcXVlc3QsIHJlcyk7XG4gICAgICAgICAgICAgICAgICAgIGFib3J0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgaHR0cFN0cmVhbS5hYm9ydCgpOyAvLyBhdm9pZCBmZXRjaGluZyB0aGUgZW50aXJlIGZpbGUgb25jZSB3ZSBrbm93IGl0J3MgdG9vIGJpZy4gV2UnbGwgcHJvYmFibHkgZ2V0IG9uZSBvciB0d28gY2h1bmtzIHRvbyBtYW55LlxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZS5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXNwb25zZS5vbignZW5kJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0NvbnZlcnQ6IHJlY2VpdmVkIGZpbGUgb2YgJyArIGxlbiArICcgYnl0ZXMnICsgKGFib3J0ID8gJyAod2hpY2ggd2VcXCdyZSBkaXNjYXJkaW5nKS4nIDogJy4nKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gUmVhZCBmaWxlIGNvbnRlbnQgZW1iZWRkZWQgZGlyZWN0bHkgaW4gUE9TVCBkYXRhXG4gICAgICAgIGNvbnZlcnRTdHJlYW0oZnMuY3JlYXRlUmVhZFN0cmVhbShmcGF0aCksIHJlcSwgcmVzLCBoaW50LCBmcGF0aCk7XG4gICAgfVxufVxuXG4vLyBwcm92aWRlIGNvbnZlcnNpb24gdG8gZ2VvanNvbiBzZXJ2aWNlXG4vLyByZWd1aXJlcyBpbnN0YWxsIG9mIGdkYWwgb24gc2VydmVyOlxuLy8gICBzdWRvIGFwdC1nZXQgaW5zdGFsbCBnZGFsLWJpblxuY29udmVydC5yb3V0ZXIgPSBleHByZXNzLlJvdXRlcigpLnBvc3QoJy8nLCAgZnVuY3Rpb24ocmVxLCByZXMpIHtcbiAgICBwYXJzZUZvcm0ocmVxLCByZXMsIGhhbmRsZUNvbnRlbnQpO1xufSk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgY29udmVydC5tYXhDb252ZXJzaW9uU2l6ZSA9IG9wdGlvbnMuc2V0dGluZ3MubWF4Q29udmVyc2lvblNpemUgfHwgMTAwMDAwMDtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnZlcnQ7XG59OyIsIi8qIGpzaGludCBub2RlOiB0cnVlLCBlc25leHQ6IHRydWUgKi9cblwidXNlIHN0cmljdFwiO1xudmFyIHJvdXRlciA9IHJlcXVpcmUoJ2V4cHJlc3MnKS5Sb3V0ZXIoKTtcbnZhciByZXF1ZXN0ID0gcmVxdWlyZSgncmVxdWVzdCcpO1xudmFyIGJvZHlQYXJzZXIgPSByZXF1aXJlKCdib2R5LXBhcnNlcicpO1xudmFyIHVybCA9IHJlcXVpcmUoJ3VybCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICBpZiAoIW9wdGlvbnMgfHwgIW9wdGlvbnMuc2VydmVycykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVGhlIG1heGltdW0gc2l6ZSBvZiB0aGUgSlNPTiBkYXRhLlxuICAgIGxldCBwb3N0U2l6ZUxpbWl0ID0gb3B0aW9ucy5wb3N0U2l6ZUxpbWl0IHx8ICcxMDI0JztcblxuICAgIGxldCB0b2tlblNlcnZlcnMgPSBwYXJzZVVybHMob3B0aW9ucy5zZXJ2ZXJzKTtcbiAgICB0b2tlblNlcnZlcnMgPSB2YWxpZGF0ZVNlcnZlckNvbmZpZyh0b2tlblNlcnZlcnMpO1xuXG4gICAgcm91dGVyLnVzZShib2R5UGFyc2VyLmpzb24oe2xpbWl0OnBvc3RTaXplTGltaXQsIHR5cGU6J2FwcGxpY2F0aW9uL2pzb24nfSkpO1xuICAgIHJvdXRlci5wb3N0KCcvJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgICAgICAgbGV0IHBhcmFtZXRlcnMgPSByZXEuYm9keTtcblxuICAgICAgICBpZiAoIXBhcmFtZXRlcnMudXJsKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLnNlbmQoJ05vIFVSTCBzcGVjaWZpZWQuJyk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdGFyZ2V0VXJsID0gcGFyc2VVcmwocGFyYW1ldGVycy51cmwpO1xuICAgICAgICBpZiAoIXRhcmdldFVybCB8fCAodGFyZ2V0VXJsLmxlbmd0aCA9PT0gMCkgfHwgKHR5cGVvZiB0YXJnZXRVcmwgIT09ICdzdHJpbmcnKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5zZW5kKCdJbnZhbGlkIFVSTCBzcGVjaWZpZWQuJyk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdG9rZW5TZXJ2ZXIgPSB0b2tlblNlcnZlcnNbdGFyZ2V0VXJsXTtcbiAgICAgICAgaWYgKCF0b2tlblNlcnZlcikge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5zZW5kKCdVbnN1cHBvcnRlZCBVUkwgc3BlY2lmaWVkLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVxdWVzdCh7XG4gICAgICAgICAgICB1cmw6IHRva2VuU2VydmVyLnRva2VuVXJsLFxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgJ1VzZXItQWdlbnQnOiAnVGVycmlhSlNFU1JJVG9rZW5BdXRoJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmb3JtOntcbiAgICAgICAgICAgICAgICB1c2VybmFtZTogdG9rZW5TZXJ2ZXIudXNlcm5hbWUsXG4gICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHRva2VuU2VydmVyLnBhc3N3b3JkLFxuICAgICAgICAgICAgICAgIGY6ICdKU09OJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbihlcnJvciwgcmVzcG9uc2UsIGJvZHkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmVzLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcblxuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXNDb2RlICE9PSAyMDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAyKS5zZW5kKCdUb2tlbiBzZXJ2ZXIgZmFpbGVkLicpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IEpTT04ucGFyc2UocmVzcG9uc2UuYm9keSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuc2VuZChKU09OLnN0cmluZ2lmeSh2YWx1ZSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuc2VuZCgnRXJyb3IgcHJvY2Vzc2luZyBzZXJ2ZXIgcmVzcG9uc2UuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJvdXRlcjtcbn07XG5cbmZ1bmN0aW9uIHBhcnNlVXJscyhzZXJ2ZXJzKSB7XG4gICAgbGV0IHJlc3VsdCA9IHt9O1xuXG4gICAgT2JqZWN0LmtleXMoc2VydmVycykuZm9yRWFjaChzZXJ2ZXIgPT4ge1xuICAgICAgICBsZXQgcGFyc2VkVXJsID0gcGFyc2VVcmwoc2VydmVyKVxuICAgICAgICBpZiAocGFyc2VkVXJsKSB7XG4gICAgICAgICAgICByZXN1bHRbcGFyc2VkVXJsXSA9IHNlcnZlcnNbc2VydmVyXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ludmFsaWQgY29uZmlndXJhdGlvbi4gVGhlIFVSTDogXFwnJyArIHNlcnZlciArICdcXCcgaXMgbm90IHZhbGlkLicpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBwYXJzZVVybCh1cmxTdHJpbmcpIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gdXJsLmZvcm1hdCh1cmwucGFyc2UodXJsU3RyaW5nKSk7XG4gICAgfVxuICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZVNlcnZlckNvbmZpZyhzZXJ2ZXJzKVxue1xuICAgIGxldCByZXN1bHQgPSB7fTtcblxuICAgIE9iamVjdC5rZXlzKHNlcnZlcnMpLmZvckVhY2godXJsID0+IHtcbiAgICAgICAgbGV0IHNlcnZlciA9IHNlcnZlcnNbdXJsXTtcbiAgICAgICAgaWYgKHNlcnZlci51c2VybmFtZSAmJiBzZXJ2ZXIucGFzc3dvcmQgJiYgc2VydmVyLnRva2VuVXJsKSB7XG4gICAgICAgICAgICByZXN1bHRbdXJsXSA9IHNlcnZlcjtcblxuICAgICAgICAgICAgLy8gTm90ZTogV2Ugc2hvdWxkIHJlYWxseSBvbmx5IHZhbGlkYXRlIFVSTHMgdGhhdCBhcmUgSFRUUFMgdG8gc2F2ZSB1cyBmcm9tIG91cnNlbHZlcywgYnV0IHRoZSBjdXJyZW50XG4gICAgICAgICAgICAvLyBzZXJ2ZXJzIHdlIG5lZWQgdG8gc3VwcG9ydCBkb24ndCBzdXBwb3J0IEhUVFBTIDooIHNvIHRoZSBiZXN0IHRoYXQgd2UgY2FuIGRvIGlzIHdhcm4gYWdhaW5zdCBpdC5cbiAgICAgICAgICAgIGlmICghaXNIdHRwcyhzZXJ2ZXIudG9rZW5VcmwpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignQWxsIGNvbW11bmljYXRpb25zIHNob3VsZCBiZSBUTFMgYnV0IHRoZSBVUkwgXFwnJyArIHNlcnZlci50b2tlblVybCArICdcXCcgZG9lcyBub3QgdXNlIGh0dHBzLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignQmFkIENvbmZpZ3VyYXRpb24uIFxcJycgKyB1cmwgKyAnXFwnIGRvZXMgbm90IHN1cHBseSBhbGwgb2YgdGhlIHJlcXVpcmVkIHByb3BlcnRpZXMuJyk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGlzSHR0cHModXJsU3RyaW5nKXtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gKHVybC5wYXJzZSh1cmxTdHJpbmcpLnByb3RvY29sID09PSAnaHR0cHM6JylcbiAgICB9XG4gICAgY2F0Y2ggKGVycm9yKVxuICAgIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBub2RlOiB0cnVlICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBib2R5UGFyc2VyID0gcmVxdWlyZSgnYm9keS1wYXJzZXInKTtcbnZhciByb3V0ZXIgPSByZXF1aXJlKCdleHByZXNzJykuUm91dGVyKCk7XG52YXIgdXJsID0gcmVxdWlyZSgndXJsJyk7XG52YXIgcmVxdWVzdCA9IHJlcXVpcmUoJ3JlcXVlc3QnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgaWYgKCFvcHRpb25zIHx8ICFvcHRpb25zLmlzc3Vlc1VybCB8fCAhb3B0aW9ucy5hY2Nlc3NUb2tlbikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHBhcnNlZENyZWF0ZUlzc3VlVXJsID0gdXJsLnBhcnNlKG9wdGlvbnMuaXNzdWVzVXJsLCB0cnVlKTtcbiAgICBwYXJzZWRDcmVhdGVJc3N1ZVVybC5xdWVyeS5hY2Nlc3NfdG9rZW4gPSBvcHRpb25zLmFjY2Vzc1Rva2VuO1xuICAgIHZhciBjcmVhdGVJc3N1ZVVybCA9IHVybC5mb3JtYXQocGFyc2VkQ3JlYXRlSXNzdWVVcmwpO1xuXG4gICAgcm91dGVyLnVzZShib2R5UGFyc2VyLmpzb24oKSk7XG4gICAgcm91dGVyLnBvc3QoJy8nLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICAgICAgICB2YXIgcGFyYW1ldGVycyA9IHJlcS5ib2R5O1xuXG4gICAgICAgIHJlcXVlc3Qoe1xuICAgICAgICAgICAgdXJsOiBjcmVhdGVJc3N1ZVVybCxcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICdVc2VyLUFnZW50Jzogb3B0aW9ucy51c2VyQWdlbnQgfHwgJ1RlcnJpYUJvdCAoVGVycmlhSlMgRmVlZGJhY2spJyxcbiAgICAgICAgICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL3ZuZC5naXRodWIudjMranNvbidcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgdGl0bGU6IHBhcmFtZXRlcnMudGl0bGUgPyBwYXJhbWV0ZXJzLnRpdGxlIDogJ1VzZXIgRmVlZGJhY2snLFxuICAgICAgICAgICAgICAgIGJvZHk6IGZvcm1hdEJvZHkocmVxLCBwYXJhbWV0ZXJzLCBvcHRpb25zLmFkZGl0aW9uYWxQYXJhbWV0ZXJzKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyb3IsIHJlc3BvbnNlLCBib2R5KSB7XG4gICAgICAgICAgICByZXMuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1c0NvZGUgPCAyMDAgfHwgcmVzcG9uc2Uuc3RhdHVzQ29kZSA+PSAzMDApIHtcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzKHJlc3BvbnNlLnN0YXR1c0NvZGUpLnNlbmQoSlNPTi5zdHJpbmdpZnkoe3Jlc3VsdDogJ0ZBSUxFRCd9KSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoMjAwKS5zZW5kKEpTT04uc3RyaW5naWZ5KHtyZXN1bHQ6ICdTVUNDRVNTJ30pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxuICAgIHJldHVybiByb3V0ZXI7XG59O1xuXG5mdW5jdGlvbiBmb3JtYXRCb2R5KHJlcXVlc3QsIHBhcmFtZXRlcnMsIGFkZGl0aW9uYWxQYXJhbWV0ZXJzKSB7XG4gICAgdmFyIHJlc3VsdCA9ICcnO1xuXG4gICAgcmVzdWx0ICs9IHBhcmFtZXRlcnMuY29tbWVudCA/IHBhcmFtZXRlcnMuY29tbWVudCA6ICdObyBjb21tZW50IHByb3ZpZGVkJztcbiAgICByZXN1bHQgKz0gJ1xcbiMjIyBVc2VyIGRldGFpbHNcXG4nO1xuICAgIHJlc3VsdCArPSAnKiBOYW1lOiAnICAgICAgICAgICsgKHBhcmFtZXRlcnMubmFtZSA/IHBhcmFtZXRlcnMubmFtZSA6ICdOb3QgcHJvdmlkZWQnKSArICdcXG4nO1xuICAgIHJlc3VsdCArPSAnKiBFbWFpbCBBZGRyZXNzOiAnICsgKHBhcmFtZXRlcnMuZW1haWwgPyBwYXJhbWV0ZXJzLmVtYWlsIDogJ05vdCBwcm92aWRlZCcpICsgJ1xcbic7XG4gICAgcmVzdWx0ICs9ICcqIElQIEFkZHJlc3M6ICcgICAgKyByZXF1ZXN0LmlwICsgJ1xcbic7XG4gICAgcmVzdWx0ICs9ICcqIFVzZXIgQWdlbnQ6ICcgICAgKyByZXF1ZXN0LmhlYWRlcignVXNlci1BZ2VudCcpICsgJ1xcbic7XG4gICAgcmVzdWx0ICs9ICcqIFJlZmVycmVyOiAnICAgICAgKyByZXF1ZXN0LmhlYWRlcignUmVmZXJyZXInKSArICdcXG4nO1xuICAgIHJlc3VsdCArPSAnKiBTaGFyZSBVUkw6ICcgICAgICsgKHBhcmFtZXRlcnMuc2hhcmVMaW5rID8gcGFyYW1ldGVycy5zaGFyZUxpbmsgOiAnTm90IHByb3ZpZGVkJykgKyAnXFxuJztcbiAgICBpZiAoYWRkaXRpb25hbFBhcmFtZXRlcnMpIHtcbiAgICAgICAgYWRkaXRpb25hbFBhcmFtZXRlcnMuZm9yRWFjaCgocGFyYW1ldGVyKSA9PiB7XG4gICAgICAgICAgICByZXN1bHQgKz0gYCogJHtwYXJhbWV0ZXIuZGVzY3JpcHRpdmVMYWJlbH06ICR7cGFyYW1ldGVyc1twYXJhbWV0ZXIubmFtZV0gfHwgJ05vdCBwcm92aWRlZCd9XFxuYDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbiIsIi8qIGpzaGludCBub2RlOiB0cnVlICovXG4ndXNlIHN0cmljdCc7XG52YXIgZXhwcmVzcyA9IHJlcXVpcmUoJ2V4cHJlc3MnKTtcbnZhciByb3V0ZXIgPSByZXF1aXJlKCdleHByZXNzJykuUm91dGVyKCk7XG52YXIgZXhpc3RzID0gcmVxdWlyZSgnLi4vZXhpc3RzJyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbi8qKlxuICogU3BlY2lhbCBoYW5kbGluZyBmb3IgL2luaXQvZm9vLmpzb24gcmVxdWVzdHM6IGxvb2sgaW4gaW5pdFBhdGhzLCBub3QganVzdCB3d3dyb290L2luaXRcbiAqIEBwYXJhbSAge1N0cmluZ1tdfSBpbml0UGF0aHMgICAgICBQYXRocyB0byBsb29rIGluLCBjYW4gYmUgcmVsYXRpdmUuXG4gKiBAcGFyYW0gIHtmdW5jdGlvbn0gZXJyb3I0MDQgICAgICAgRXJyb3IgcGFnZSBoYW5kbGVyLlxuICogQHBhcmFtICB7U3RyaW5nfSBjb25maWdGaWxlQmFzZSAgIERpcmVjdG9yeSB0byByZXNvbHZlIHJlbGF0aXZlIHBhdGhzIGZyb20uXG4gKiBAcmV0dXJuIHtSb3V0ZXJ9XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5pdFBhdGhzLCBlcnJvcjQwNCwgY29uZmlnRmlsZUJhc2UpIHtcbiAgICBpbml0UGF0aHMuZm9yRWFjaChmdW5jdGlvbihpbml0UGF0aCkge1xuICAgICAgICByb3V0ZXIudXNlKGV4cHJlc3Muc3RhdGljKHBhdGgucmVzb2x2ZShjb25maWdGaWxlQmFzZSwgaW5pdFBhdGgpKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJvdXRlcjtcbn07IiwiLyoganNoaW50IG5vZGU6IHRydWUgKi9cblwidXNlIHN0cmljdFwiO1xudmFyIGV4cHJlc3MgPSByZXF1aXJlKCdleHByZXNzJyk7XG52YXIgcm91dGVyID0gZXhwcmVzcy5Sb3V0ZXIoKTtcblxudmFyIHByb2o0ID0gcmVxdWlyZSgncHJvajQnKTtcblxuLy9UT0RPOiBjaGVjayBpZiB0aGlzIGxvYWRzIHRoZSBmaWxlIGludG8gZWFjaCBjb3JlIGFuZCBpZiBzbyB0aGVuLFxucmVxdWlyZSgncHJvajRqcy1kZWZzL2Vwc2cnKShwcm9qNCk7XG5cblxuLy9wcm92aWRlIFJFU1Qgc2VydmljZSBmb3IgcHJvajQgZGVmaW5pdGlvbiBzdHJpbmdzXG5yb3V0ZXIuZ2V0KCcvOmNycycsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgdmFyIGVwc2cgPSBwcm9qNC5kZWZzW3JlcS5wYXJhbXMuY3JzLnRvVXBwZXJDYXNlKCldO1xuICAgIGlmIChlcHNnICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmVzLnN0YXR1cygyMDApLnNlbmQoZXBzZyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmVzLnN0YXR1cyg0MDQpLnNlbmQoJ05vIHByb2o0IGRlZmluaXRpb24gYXZhaWxhYmxlIGZvciB0aGlzIENSUy4nKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSByb3V0ZXI7IiwiLyoganNoaW50IG5vZGU6IHRydWUgKi9cblwidXNlIHN0cmljdFwiO1xuXG52YXIgYmFzaWNBdXRoID0gcmVxdWlyZSgnYmFzaWMtYXV0aCcpO1xudmFyIGV4cHJlc3MgPSByZXF1aXJlKCdleHByZXNzJyk7XG52YXIgZGVmYXVsdFJlcXVlc3QgPSByZXF1aXJlKCdyZXF1ZXN0Jyk7XG52YXIgdXJsID0gcmVxdWlyZSgndXJsJyk7XG52YXIgYm9keVBhcnNlciA9IHJlcXVpcmUoJ2JvZHktcGFyc2VyJyk7XG52YXIgcmFuZ2VDaGVjayA9IHJlcXVpcmUoJ3JhbmdlX2NoZWNrJyk7XG5cbnZhciBET19OT1RfUFJPWFlfUkVHRVggPSAvXig/Okhvc3R8WC1Gb3J3YXJkZWQtSG9zdHxQcm94eS1Db25uZWN0aW9ufENvbm5lY3Rpb258S2VlcC1BbGl2ZXxUcmFuc2Zlci1FbmNvZGluZ3xURXxUcmFpbGVyfFByb3h5LUF1dGhvcml6YXRpb258UHJveHktQXV0aGVudGljYXRlfFVwZ3JhZGV8RXhwaXJlc3xwcmFnbWF8U3RyaWN0LVRyYW5zcG9ydC1TZWN1cml0eSkkL2k7XG52YXIgUFJPVE9DT0xfUkVHRVggPSAvXlxcdys6XFwvLztcbnZhciBEVVJBVElPTl9SRUdFWCA9IC9eKFtcXGQuXSspKG1zfHN8bXxofGR8d3x5KSQvO1xudmFyIERVUkFUSU9OX1VOSVRTID0ge1xuICAgIG1zOiAxLjAgLyAxMDAwLFxuICAgIHM6IDEuMCxcbiAgICBtOiA2MC4wLFxuICAgIGg6IDYwLjAgKiA2MC4wLFxuICAgIGQ6IDI0LjAgKiA2MC4wICogNjAuMCxcbiAgICB3OiA3LjAgKiAyNC4wICogNjAuMCAqIDYwLjAsXG4gICAgeTogMzY1ICogMjQuMCAqIDYwLjAgKiA2MC4wXG59O1xuLyoqIEFnZSB0byBvdmVycmlkZSBjYWNoZSBpbnN0cnVjdGlvbnMgd2l0aCBmb3IgcHJveGllZCBmaWxlcyAqL1xudmFyIERFRkFVTFRfTUFYX0FHRV9TRUNPTkRTID0gMTIwOTYwMDsgLy8gdHdvIHdlZWtzXG5cbi8qKlxuICogQ3JlYXRlcyBhbiBleHByZXNzIG1pZGRsZXdhcmUgdGhhdCBwcm94aWVzIGNhbGxzIHRvICcvcHJveHkvaHR0cDovL2V4YW1wbGUnIHRvICdodHRwOi8vZXhhbXBsZScsIHdoaWxlIGZvcmNpbmcgdGhlbVxuICogdG8gYmUgY2FjaGVkIGJ5IHRoZSBicm93c2VyIGFuZCBvdmVycndyaXRpbmcgQ09SUyBoZWFkZXJzLiBBIGNhY2hlIGR1cmF0aW9uIGNhbiBiZSBhZGRlZCB3aXRoIGEgVVJMIGxpa2VcbiAqIC9wcm94eS9fNW0vaHR0cDovL2V4YW1wbGUgd2hpY2ggY2F1c2VzICdDYWNoZS1Db250cm9sOiBwdWJsaWMsbWF4LWFnZT0zMDAnIHRvIGJlIGFkZGVkIHRvIHRoZSByZXNwb25zZSBoZWFkZXJzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcGFyYW0ge0FycmF5W1N0cmluZ119IG9wdGlvbnMucHJveHlhYmxlRG9tYWlucyBBbiBhcnJheSBvZiBkb21haW5zIHRvIGJlIHByb3hpZWRcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy5wcm94eUFsbERvbWFpbnMgQSBib29sZWFuIGluZGljYXRpbmcgd2hldGhlciBvciBub3Qgd2Ugc2hvdWxkIHByb3h5IEFMTCBkb21haW5zIC0gb3ZlcnJpZGVzXG4gKiAgICAgICAgICAgICAgICAgICAgICB0aGUgY29uZmlndXJhdGlvbiBpbiBvcHRpb25zLnByb3h5RG9tYWluc1xuICogQHBhcmFtIHtTdHJpbmd9IG9wdGlvbnMucHJveHlBdXRoIEEgbWFwIG9mIGRvbWFpbnMgdG8gdG9rZW5zIHRoYXQgd2lsbCBiZSBwYXNzZWQgdG8gdGhvc2UgZG9tYWlucyB2aWEgYmFzaWMgYXV0aFxuICogICAgICAgICAgICAgICAgICAgICAgd2hlbiBwcm94eWluZyB0aHJvdWdoIHRoZW0uXG4gKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy51cHN0cmVhbVByb3h5IFVybCBvZiBhIHN0YW5kYXJkIHVwc3RyZWFtIHByb3h5IHRoYXQgd2lsbCBiZSB1c2VkIHRvIHJldHJpZXZlIGRhdGEuXG4gKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy5ieXBhc3NVcHN0cmVhbVByb3h5SG9zdHMgQW4gb2JqZWN0IG9mIGhvc3RzIChhcyBzdHJpbmdzKSB0byAndHJ1ZScgdmFsdWVzLlxuICogQHBhcmFtIHtTdHJpbmd9IG9wdGlvbnMucHJveHlQb3N0U2l6ZUxpbWl0IFRoZSBtYXhpbXVtIHNpemUgb2YgYSBQT1NUIHJlcXVlc3QgdGhhdCB0aGUgcHJveHkgd2lsbCBhbGxvdyB0aHJvdWdoLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW4gYnl0ZXMgaWYgbm8gdW5pdCBpcyBzcGVjaWZpZWQsIG9yIHNvbWUgcmVhc29uYWJsZSB1bml0IGxpa2UgJ2tiJyBmb3Iga2lsb2J5dGVzIG9yICdtYicgZm9yIG1lZ2FieXRlcy5cbiAqXG4gKiBAcmV0dXJucyB7Kn0gQSBtaWRkbGV3YXJlIHRoYXQgY2FuIGJlIHVzZWQgd2l0aCBleHByZXNzLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxdWVzdCA9IG9wdGlvbnMucmVxdWVzdCB8fCBkZWZhdWx0UmVxdWVzdDsgLy9vdmVycmlkYWJsZSBmb3IgdGVzdHNcbiAgICB2YXIgcHJveHlBbGxEb21haW5zID0gb3B0aW9ucy5wcm94eUFsbERvbWFpbnM7XG4gICAgdmFyIHByb3h5RG9tYWlucyA9IG9wdGlvbnMucHJveHlhYmxlRG9tYWlucyB8fCBbXTtcbiAgICB2YXIgcHJveHlBdXRoID0gb3B0aW9ucy5wcm94eUF1dGggfHwge307XG4gICAgdmFyIHByb3h5UG9zdFNpemVMaW1pdCA9IG9wdGlvbnMucHJveHlQb3N0U2l6ZUxpbWl0IHx8ICcxMDI0MDAnO1xuICAgIFxuICAgIC8vIElmIHlvdSBjaGFuZ2UgdGhpcywgYWxzbyBjaGFuZ2UgdGhlIHNhbWUgbGlzdCBpbiBzZXJ2ZXJjb25maWcuanNvbi5leGFtcGxlLlxuICAgIC8vIFRoaXMgcGFnZSBpcyBoZWxwZnVsOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9SZXNlcnZlZF9JUF9hZGRyZXNzZXNcbiAgICB2YXIgYmxhY2tsaXN0ZWRBZGRyZXNzZXMgPSBvcHRpb25zLmJsYWNrbGlzdGVkQWRkcmVzc2VzIHx8IFtcbiAgICAgICAgLy8gbG9vcGJhY2sgYWRkcmVzc2VzXG4gICAgICAgICcxMjcuMC4wLjAvOCcsXG4gICAgICAgICc6OjEvMTI4JyxcbiAgICAgICAgLy8gbGluayBsb2NhbCBhZGRyZXNzZXNcbiAgICAgICAgJzE2OS4yNTQuMC4wLzE2JyxcbiAgICAgICAgJ2ZlODA6Oi8xMCcsXG4gICAgICAgIC8vIHByaXZhdGUgbmV0d29yayBhZGRyZXNzZXNcbiAgICAgICAgJzEwLjAuMC4wLzgnLFxuICAgICAgICAnMTcyLjE2LjAuMC8xMicsXG4gICAgICAgICcxOTIuMTY4LjAuMC8xNicsXG4gICAgICAgICdmYzAwOjovNycsXG4gICAgICAgIC8vIG90aGVyXG4gICAgICAgICcwLjAuMC4wLzgnLFxuICAgICAgICAnMTAwLjY0LjAuMC8xMCcsXG4gICAgICAgICcxOTIuMC4wLjAvMjQnLFxuICAgICAgICAnMTkyLjAuMi4wLzI0JyxcbiAgICAgICAgJzE5OC4xOC4wLjAvMTUnLFxuICAgICAgICAnMTkyLjg4Ljk5LjAvMjQnLFxuICAgICAgICAnMTk4LjUxLjEwMC4wLzI0JyxcbiAgICAgICAgJzIwMy4wLjExMy4wLzI0JyxcbiAgICAgICAgJzIyNC4wLjAuMC80JyxcbiAgICAgICAgJzI0MC4wLjAuMC80JyxcbiAgICAgICAgJzI1NS4yNTUuMjU1LjI1NS8zMicsXG4gICAgICAgICc6Oi8xMjgnLFxuICAgICAgICAnMjAwMTpkYjg6Oi8zMicsXG4gICAgICAgICdmZjAwOjovOCdcbiAgICBdO1xuXG4gICAgLy9Ob24gQ09SUyBob3N0cyBhbmQgZG9tYWlucyB3ZSBwcm94eSB0b1xuICAgIGZ1bmN0aW9uIHByb3h5QWxsb3dlZEhvc3QoaG9zdCkge1xuICAgICAgICAvLyBFeGNsdWRlIGhvc3RzIHRoYXQgYXJlIHJlYWxseSBJUCBhZGRyZXNzZXMgYW5kIGFyZSBpbiBvdXIgYmxhY2tsaXN0LlxuICAgICAgICBpZiAocmFuZ2VDaGVjay5pblJhbmdlKGhvc3QsIGJsYWNrbGlzdGVkQWRkcmVzc2VzKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb3h5QWxsRG9tYWlucykge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBob3N0ID0gaG9zdC50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAvL2NoZWNrIHRoYXQgaG9zdCBpcyBmcm9tIG9uZSBvZiB0aGVzZSBkb21haW5zXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJveHlEb21haW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaG9zdC5pbmRleE9mKHByb3h5RG9tYWluc1tpXSwgaG9zdC5sZW5ndGggLSBwcm94eURvbWFpbnNbaV0ubGVuZ3RoKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZG9Qcm94eShyZXEsIHJlcywgbmV4dCwgcmV0cnlXaXRob3V0QXV0aCwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHJlbW90ZVVybFN0cmluZyA9IHJlcS51cmwuc3Vic3RyaW5nKDEpO1xuXG4gICAgICAgIGlmICghcmVtb3RlVXJsU3RyaW5nIHx8IHJlbW90ZVVybFN0cmluZy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuc2VuZCgnTm8gdXJsIHNwZWNpZmllZC4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERvZXMgdGhlIHByb3h5IFVSTCBpbmNsdWRlIGEgbWF4IGFnZT9cbiAgICAgICAgdmFyIG1heEFnZVNlY29uZHMgPSBERUZBVUxUX01BWF9BR0VfU0VDT05EUztcbiAgICAgICAgaWYgKHJlbW90ZVVybFN0cmluZ1swXSA9PT0gJ18nKSB7XG4gICAgICAgICAgICB2YXIgc2xhc2hJbmRleCA9IHJlbW90ZVVybFN0cmluZy5pbmRleE9mKCcvJyk7XG4gICAgICAgICAgICBpZiAoc2xhc2hJbmRleCA8IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLnNlbmQoJ05vIHVybCBzcGVjaWZpZWQuJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBtYXhBZ2VTdHJpbmcgPSByZW1vdGVVcmxTdHJpbmcuc3Vic3RyaW5nKDEsIHNsYXNoSW5kZXgpO1xuICAgICAgICAgICAgcmVtb3RlVXJsU3RyaW5nID0gcmVtb3RlVXJsU3RyaW5nLnN1YnN0cmluZyhzbGFzaEluZGV4ICsgMSk7XG5cbiAgICAgICAgICAgIGlmIChyZW1vdGVVcmxTdHJpbmcubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5zZW5kKCdObyB1cmwgc3BlY2lmaWVkLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJbnRlcnByZXQgdGhlIG1heCBhZ2UgYXMgYSBkdXJhdGlvbiBpbiBWYXJuaXNoIG5vdGF0aW9uLlxuICAgICAgICAgICAgLy8gaHR0cHM6Ly93d3cudmFybmlzaC1jYWNoZS5vcmcvZG9jcy90cnVuay9yZWZlcmVuY2UvdmNsLmh0bWwjZHVyYXRpb25zXG4gICAgICAgICAgICB2YXIgcGFyc2VkTWF4QWdlID0gRFVSQVRJT05fUkVHRVguZXhlYyhtYXhBZ2VTdHJpbmcpO1xuICAgICAgICAgICAgaWYgKCFwYXJzZWRNYXhBZ2UgfHwgcGFyc2VkTWF4QWdlLmxlbmd0aCA8IDMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLnNlbmQoJ0ludmFsaWQgZHVyYXRpb24uJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHBhcnNlRmxvYXQocGFyc2VkTWF4QWdlWzFdKTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLnNlbmQoJ0ludmFsaWQgZHVyYXRpb24uJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB1bml0Q29udmVyc2lvbiA9IERVUkFUSU9OX1VOSVRTW3BhcnNlZE1heEFnZVsyXV07XG4gICAgICAgICAgICBpZiAoIXVuaXRDb252ZXJzaW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5zZW5kKCdJbnZhbGlkIGR1cmF0aW9uIHVuaXQgJyArIHBhcnNlZE1heEFnZVsyXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG1heEFnZVNlY29uZHMgPSB2YWx1ZSAqIHVuaXRDb252ZXJzaW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIGh0dHA6Ly8gaWYgbm8gcHJvdG9jb2wgaXMgc3BlY2lmaWVkLlxuICAgICAgICB2YXIgcHJvdG9jb2xNYXRjaCA9IFBST1RPQ09MX1JFR0VYLmV4ZWMocmVtb3RlVXJsU3RyaW5nKTtcbiAgICAgICAgaWYgKCFwcm90b2NvbE1hdGNoIHx8IHByb3RvY29sTWF0Y2gubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgcmVtb3RlVXJsU3RyaW5nID0gJ2h0dHA6Ly8nICsgcmVtb3RlVXJsU3RyaW5nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIG1hdGNoZWRQYXJ0ID0gcHJvdG9jb2xNYXRjaFswXTtcblxuICAgICAgICAgICAgLy8gSWYgdGhlIHByb3RvY29sIHBvcnRpb24gb2YgdGhlIFVSTCBvbmx5IGhhcyBhIHNpbmdsZSBzbGFzaCBhZnRlciBpdCwgdGhlIGV4dHJhIHNsYXNoIHdhcyBwcm9iYWJseSBzdHJpcHBlZCBvZmYgYnkgc29tZW9uZVxuICAgICAgICAgICAgLy8gYWxvbmcgdGhlIHdheSAoTkdJTlggd2lsbCBkbyB0aGlzKS4gIEFkZCBpdCBiYWNrLlxuICAgICAgICAgICAgaWYgKHJlbW90ZVVybFN0cmluZ1ttYXRjaGVkUGFydC5sZW5ndGhdICE9PSAnLycpIHtcbiAgICAgICAgICAgICAgICByZW1vdGVVcmxTdHJpbmcgPSBtYXRjaGVkUGFydCArICcvJyArIHJlbW90ZVVybFN0cmluZy5zdWJzdHJpbmcobWF0Y2hlZFBhcnQubGVuZ3RoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZW1vdGVVcmwgPSB1cmwucGFyc2UocmVtb3RlVXJsU3RyaW5nKTtcblxuICAgICAgICAvLyBDb3B5IHRoZSBxdWVyeSBzdHJpbmdcbiAgICAgICAgcmVtb3RlVXJsLnNlYXJjaCA9IHVybC5wYXJzZShyZXEudXJsKS5zZWFyY2g7XG5cbiAgICAgICAgaWYgKCFyZW1vdGVVcmwucHJvdG9jb2wpIHtcbiAgICAgICAgICAgIHJlbW90ZVVybC5wcm90b2NvbCA9ICdodHRwOic7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcHJveHk7XG4gICAgICAgIGlmIChvcHRpb25zLnVwc3RyZWFtUHJveHkgJiYgISgob3B0aW9ucy5ieXBhc3NVcHN0cmVhbVByb3h5SG9zdHMgfHwge30pW3JlbW90ZVVybC5ob3N0XSkpIHtcbiAgICAgICAgICAgIHByb3h5ID0gb3B0aW9ucy51cHN0cmVhbVByb3h5O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXJlIHdlIGFsbG93ZWQgdG8gcHJveHkgZm9yIHRoaXMgaG9zdD9cbiAgICAgICAgaWYgKCFwcm94eUFsbG93ZWRIb3N0KHJlbW90ZVVybC5ob3N0KSkge1xuICAgICAgICAgICAgcmVzLnN0YXR1cyg0MDMpLnNlbmQoJ0hvc3QgaXMgbm90IGluIGxpc3Qgb2YgYWxsb3dlZCBob3N0czogJyArIHJlbW90ZVVybC5ob3N0KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGVuY29kaW5nIDogbnVsbCBtZWFucyBcImJvZHlcIiBwYXNzZWQgdG8gdGhlIGNhbGxiYWNrIHdpbGwgYmUgcmF3IGJ5dGVzXG5cbiAgICAgICAgdmFyIHByb3hpZWRSZXF1ZXN0O1xuICAgICAgICByZXEub24oJ2Nsb3NlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAocHJveGllZFJlcXVlc3QpIHtcbiAgICAgICAgICAgICAgICBwcm94aWVkUmVxdWVzdC5hYm9ydCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZmlsdGVyZWRSZXFIZWFkZXJzID0gZmlsdGVySGVhZGVycyhyZXEuaGVhZGVycyk7XG4gICAgICAgIGlmIChmaWx0ZXJlZFJlcUhlYWRlcnNbJ3gtZm9yd2FyZGVkLWZvciddKSB7XG4gICAgICAgICAgICBmaWx0ZXJlZFJlcUhlYWRlcnNbJ3gtZm9yd2FyZGVkLWZvciddID0gZmlsdGVyZWRSZXFIZWFkZXJzWyd4LWZvcndhcmRlZC1mb3InXSArICcsICcgKyByZXEuY29ubmVjdGlvbi5yZW1vdGVBZGRyZXNzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmlsdGVyZWRSZXFIZWFkZXJzWyd4LWZvcndhcmRlZC1mb3InXSA9IHJlcS5jb25uZWN0aW9uLnJlbW90ZUFkZHJlc3M7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW1vdmUgdGhlIEF1dGhvcml6YXRpb24gaGVhZGVyIGlmIHdlIHVzZWQgaXQgdG8gYXV0aGVudGljYXRlIHRoZSByZXF1ZXN0IHRvIHRlcnJpYWpzLXNlcnZlci5cbiAgICAgICAgaWYgKG9wdGlvbnMuYmFzaWNBdXRoZW50aWNhdGlvbiAmJiBvcHRpb25zLmJhc2ljQXV0aGVudGljYXRpb24udXNlcm5hbWUgJiYgb3B0aW9ucy5iYXNpY0F1dGhlbnRpY2F0aW9uLnBhc3N3b3JkKSB7XG4gICAgICAgICAgICBkZWxldGUgZmlsdGVyZWRSZXFIZWFkZXJzWydhdXRob3JpemF0aW9uJ107XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXJldHJ5V2l0aG91dEF1dGgpIHtcbiAgICAgICAgICAgIHZhciBhdXRoUmVxdWlyZWQgPSBwcm94eUF1dGhbcmVtb3RlVXJsLmhvc3RdO1xuICAgICAgICAgICAgaWYgKGF1dGhSZXF1aXJlZCkge1xuICAgICAgICAgICAgICAgIGlmIChhdXRoUmVxdWlyZWQuYXV0aG9yaXphdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAvLyBodHRwIGJhc2ljIGF1dGguXG4gICAgICAgICAgICAgICAgICAgIGlmICghZmlsdGVyZWRSZXFIZWFkZXJzWydhdXRob3JpemF0aW9uJ10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcmVkUmVxSGVhZGVyc1snYXV0aG9yaXphdGlvbiddID0gYXV0aFJlcXVpcmVkLmF1dGhvcml6YXRpb247XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGF1dGhSZXF1aXJlZC5oZWFkZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGEgbWVjaGFuaXNtIHRvIHBhc3MgYXJiaXRyYXJ5IGhlYWRlcnMuXG4gICAgICAgICAgICAgICAgICAgIGF1dGhSZXF1aXJlZC5oZWFkZXJzLmZvckVhY2goZnVuY3Rpb24oaGVhZGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZFJlcUhlYWRlcnNbaGVhZGVyLm5hbWVdID0gaGVhZGVyLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcm94aWVkUmVxdWVzdCA9IGNhbGxiYWNrKHJlbW90ZVVybCwgZmlsdGVyZWRSZXFIZWFkZXJzLCBwcm94eSwgbWF4QWdlU2Vjb25kcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYnVpbGRSZXFIYW5kbGVyKGh0dHBWZXJiKSB7XG4gICAgICAgIGZ1bmN0aW9uIGhhbmRsZXIocmVxLCByZXMsIG5leHQpIHtcbiAgICAgICAgICAgIHJldHVybiBkb1Byb3h5KHJlcSwgcmVzLCBuZXh0LCByZXEucmV0cnlXaXRob3V0QXV0aCwgZnVuY3Rpb24ocmVtb3RlVXJsLCBmaWx0ZXJlZFJlcXVlc3RIZWFkZXJzLCBwcm94eSwgbWF4QWdlU2Vjb25kcykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwcm94aWVkUmVxdWVzdCA9IHJlcXVlc3Qoe1xuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBodHRwVmVyYixcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogdXJsLmZvcm1hdChyZW1vdGVVcmwpLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogZmlsdGVyZWRSZXF1ZXN0SGVhZGVycyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuY29kaW5nOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJveHk6IHByb3h5LFxuICAgICAgICAgICAgICAgICAgICAgICAgYm9keTogcmVxLmJvZHksXG4gICAgICAgICAgICAgICAgICAgICAgICBmb2xsb3dSZWRpcmVjdDogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbG9jYXRpb24gPSByZXNwb25zZS5oZWFkZXJzLmxvY2F0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsb2NhdGlvbiAmJiBsb2NhdGlvbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwYXJzZWQgPSB1cmwucGFyc2UobG9jYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJveHlBbGxvd2VkSG9zdChwYXJzZWQuaG9zdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlZGlyZWN0IGlzIG9rXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZWRpcmVjdCBpcyBmb3JiaWRkZW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pLm9uKCdzb2NrZXQnLCBmdW5jdGlvbihzb2NrZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5vbmNlKCdsb29rdXAnLCBmdW5jdGlvbihlcnIsIGFkZHJlc3MsIGZhbWlseSwgaG9zdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyYW5nZUNoZWNrLmluUmFuZ2UoYWRkcmVzcywgYmxhY2tsaXN0ZWRBZGRyZXNzZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoNDAzKS5zZW5kKCdJUCBhZGRyZXNzIGlzIG5vdCBhbGxvd2VkOiAnICsgYWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5lbmQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJveGllZFJlcXVlc3QuYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSkub24oJ2Vycm9yJywgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElkZWFsbHkgd2Ugd291bGQgcmV0dXJuIGFuIGVycm9yIHRvIHRoZSBjbGllbnQsIGJ1dCBpZiBoZWFkZXJzIGhhdmUgYWxyZWFkeSBiZWVuIHNlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhdHRlbXB0aW5nIHRvIHNldCBhIHN0YXR1cyBjb2RlIGhlcmUgd2lsbCBmYWlsLiBTbyBpbiB0aGF0IGNhc2UsIHdlJ2xsIGp1c3QgZW5kIHRoZSByZXNwb25zZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZvciBsYWNrIG9mIGEgYmV0dGVyIG9wdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXMuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMuZW5kKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoNTAwKS5zZW5kKCdQcm94eSBlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KS5vbigncmVzcG9uc2UnLCBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXEucmV0cnlXaXRob3V0QXV0aCAmJiByZXNwb25zZS5zdGF0dXNDb2RlID09PSA0MDMgJiYgcHJveHlBdXRoW3JlbW90ZVVybC5ob3N0XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIGF1dG9tYXRpY2FsbHkgYWRkZWQgYW4gYXV0aGVudGljYXRpb24gaGVhZGVyIHRvIHRoaXMgcmVxdWVzdCAoZS5nLiBmcm9tIHByb3h5YXV0aC5qc29uKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBidXQgZ290IGJhY2sgYSA0MDMsIGluZGljYXRpbmcgb3VyIGNyZWRlbnRpYWxzIGRpZG4ndCBhdXRob3JpemUgYWNjZXNzIHRvIHRoaXMgcmVzb3VyY2UuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVHJ5IGFnYWluIHdpdGhvdXQgY3JlZGVudGlhbHMgaW4gb3JkZXIgdG8gZ2l2ZSB0aGUgdXNlciB0aGUgb3Bwb3J0dW5pdHkgdG8gc3VwcGx5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlaXIgb3duLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcS5yZXRyeVdpdGhvdXRBdXRoID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaGFuZGxlcihyZXEsIHJlcywgbmV4dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMocmVzcG9uc2Uuc3RhdHVzQ29kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMuaGVhZGVyKHByb2Nlc3NIZWFkZXJzKHJlc3BvbnNlLmhlYWRlcnMsIG1heEFnZVNlY29uZHMpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlLm9uKCdkYXRhJywgZnVuY3Rpb24oY2h1bmspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMud3JpdGUoY2h1bmspO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZS5vbignZW5kJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnN0YXR1cyg1MDApLnNlbmQoJ1Byb3h5IGVycm9yJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3hpZWRSZXF1ZXN0O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaGFuZGxlcjtcbiAgICB9XG5cbiAgICB2YXIgcm91dGVyID0gZXhwcmVzcy5Sb3V0ZXIoKTtcbiAgICByb3V0ZXIuZ2V0KCcvKicsIGJ1aWxkUmVxSGFuZGxlcignR0VUJykpO1xuICAgIHJvdXRlci5wb3N0KCcvKicsIGJvZHlQYXJzZXIucmF3KHt0eXBlOiBmdW5jdGlvbigpIHsgcmV0dXJuIHRydWU7fSwgbGltaXQ6IHByb3h5UG9zdFNpemVMaW1pdH0pLCBidWlsZFJlcUhhbmRsZXIoJ1BPU1QnKSk7XG5cbiAgICByZXR1cm4gcm91dGVyO1xufTtcblxuLyoqXG4gKiBGaWx0ZXJzIGhlYWRlcnMgdGhhdCBhcmUgbm90IG1hdGNoZWQgYnkge0BsaW5rIERPX05PVF9QUk9YWV9SRUdFWH0gb3V0IG9mIGFuIG9iamVjdCBjb250YWluaW5nIGhlYWRlcnMuIFRoaXMgZG9lcyBub3RcbiAqIG11dGF0ZSB0aGUgb3JpZ2luYWwgbGlzdC5cbiAqXG4gKiBAcGFyYW0gaGVhZGVycyBUaGUgaGVhZGVycyB0byBmaWx0ZXJcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IG9iamVjdCB3aXRoIHRoZSBmaWx0ZXJlZCBoZWFkZXJzLlxuICovXG5mdW5jdGlvbiBmaWx0ZXJIZWFkZXJzKGhlYWRlcnMpIHtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgLy8gZmlsdGVyIG91dCBoZWFkZXJzIHRoYXQgYXJlIGxpc3RlZCBpbiB0aGUgcmVnZXggYWJvdmVcbiAgICBPYmplY3Qua2V5cyhoZWFkZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgaWYgKCFET19OT1RfUFJPWFlfUkVHRVgudGVzdChuYW1lKSkge1xuICAgICAgICAgICAgcmVzdWx0W25hbWVdID0gaGVhZGVyc1tuYW1lXTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBGaWx0ZXJzIG91dCBoZWFkZXJzIHRoYXQgc2hvdWxkbid0IGJlIHByb3hpZWQsIG92ZXJyaWRlcyBjYWNoaW5nIHNvIGZpbGVzIGFyZSByZXRhaW5lZCBmb3Ige0BsaW5rIERFRkFVTFRfTUFYX0FHRV9TRUNPTkRTfSxcbiAqIGFuZCBzZXRzIENPUlMgaGVhZGVycyB0byBhbGxvdyBhbGwgb3JpZ2luc1xuICpcbiAqIEBwYXJhbSBoZWFkZXJzIFRoZSBvcmlnaW5hbCBvYmplY3Qgb2YgaGVhZGVycy4gVGhpcyBpcyBub3QgbXV0YXRlZC5cbiAqIEBwYXJhbSBtYXhBZ2VTZWNvbmRzIHRoZSBhbW91bnQgb2YgdGltZSBpbiBzZWNvbmRzIHRvIGNhY2hlIGZvci4gVGhpcyB3aWxsIG92ZXJyaWRlIHdoYXQgdGhlIG9yaWdpbmFsIHNlcnZlclxuICogICAgICAgICAgc3BlY2lmaWVkIGJlY2F1c2Ugd2Uga25vdyBiZXR0ZXIgdGhhbiB0aGV5IGRvLlxuICogQHJldHVybnMge09iamVjdH0gVGhlIG5ldyBoZWFkZXJzIG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gcHJvY2Vzc0hlYWRlcnMoaGVhZGVycywgbWF4QWdlU2Vjb25kcykge1xuICAgIHZhciByZXN1bHQgPSBmaWx0ZXJIZWFkZXJzKGhlYWRlcnMpO1xuXG4gICAgcmVzdWx0WydDYWNoZS1Db250cm9sJ10gPSAncHVibGljLG1heC1hZ2U9JyArIG1heEFnZVNlY29uZHM7XG4gICAgcmVzdWx0WydBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nXSA9ICcqJztcblxuICAgIHJldHVybiByZXN1bHQ7XG59XG4iLCIvKiBqc2hpbnQgbm9kZTogdHJ1ZSAqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIHJvdXRlciA9IHJlcXVpcmUoJ2V4cHJlc3MnKS5Sb3V0ZXIoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgcm91dGVyLmdldCgnLycsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgICAgIHJlcy5zdGF0dXMoMjAwKS5zZW5kKG9wdGlvbnMpO1xuICAgIH0pO1xuICAgIHJldHVybiByb3V0ZXI7XG59OyIsIi8qIGpzaGludCBub2RlOiB0cnVlLCBlc25leHQ6IHRydWUgKi9cblwidXNlIHN0cmljdFwiO1xudmFyIGV4cHJlc3MgPSByZXF1aXJlKCdleHByZXNzJyk7XG5cbi8vIEV4cG9zZSBhIHdoaXRlbGlzdGVkIHNldCBvZiBjb25maWd1cmF0aW9uIGF0dHJpYnV0ZXMgdG8gdGhlIHdvcmxkLiBUaGlzIGRlZmluaXRlbHkgZG9lc24ndCBpbmNsdWRlIGF1dGhvcmlzYXRpb24gdG9rZW5zLCBsb2NhbCBmaWxlIHBhdGhzLCBldGMuXG4vLyBJdCBtaXJyb3JzIHRoZSBzdHJ1Y3R1cmUgb2YgdGhlIHJlYWwgY29uZmlnIGZpbGUuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICB2YXIgcm91dGVyID0gZXhwcmVzcy5Sb3V0ZXIoKTtcbiAgICB2YXIgc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLnNldHRpbmdzKSwgc2FmZVNldHRpbmdzID0ge307XG4gICAgdmFyIHNhZmVBdHRyaWJ1dGVzID0gWydhbGxvd1Byb3h5Rm9yJywgJ21heENvbnZlcnNpb25TaXplJywgJ25ld1NoYXJlVXJsUHJlZml4JywgJ3Byb3h5QWxsRG9tYWlucyddO1xuICAgIHNhZmVBdHRyaWJ1dGVzLmZvckVhY2goa2V5ID0+IHNhZmVTZXR0aW5nc1trZXldID0gc2V0dGluZ3Nba2V5XSk7XG4gICAgc2FmZVNldHRpbmdzLnZlcnNpb24gPSByZXF1aXJlKCcuLi8uLi8uLi9wYWNrYWdlLmpzb24nKS52ZXJzaW9uO1xuICAgIGlmICh0eXBlb2Ygc2V0dGluZ3Muc2hhcmVVcmxQcmVmaXhlcyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgc2FmZVNldHRpbmdzLnNoYXJlVXJsUHJlZml4ZXMgPSB7fTtcbiAgICAgICAgT2JqZWN0LmtleXMoc2V0dGluZ3Muc2hhcmVVcmxQcmVmaXhlcykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgIHNhZmVTZXR0aW5ncy5zaGFyZVVybFByZWZpeGVzW2tleV0gPSB7IHNlcnZpY2U6IHNldHRpbmdzLnNoYXJlVXJsUHJlZml4ZXNba2V5XS5zZXJ2aWNlIH07XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoc2V0dGluZ3MuZmVlZGJhY2sgJiYgc2V0dGluZ3MuZmVlZGJhY2suYWRkaXRpb25hbFBhcmFtZXRlcnMpIHtcbiAgICAgICAgc2FmZVNldHRpbmdzLmFkZGl0aW9uYWxGZWVkYmFja1BhcmFtZXRlcnMgPSBzZXR0aW5ncy5mZWVkYmFjay5hZGRpdGlvbmFsUGFyYW1ldGVycztcbiAgICB9XG5cbiAgICByb3V0ZXIuZ2V0KCcvJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgICAgICAgcmVzLnN0YXR1cygyMDApLnNlbmQoc2FmZVNldHRpbmdzKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcm91dGVyO1xufTtcbiIsIi8qIGpzaGludCBub2RlOiB0cnVlLCBlc25leHQ6IHRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIGJvZHlQYXJzZXIgPSByZXF1aXJlKCdib2R5LXBhcnNlcicpO1xudmFyIHJlcXVlc3RwID0gcmVxdWlyZSgncmVxdWVzdC1wcm9taXNlJyk7XG52YXIgcnBlcnJvcnMgPSByZXF1aXJlKCdyZXF1ZXN0LXByb21pc2UvZXJyb3JzJyk7XG5cbnZhciBnaXN0QVBJID0gJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vZ2lzdHMnO1xudmFyIGdvb2dsZVVybFNob3J0ZW5lckFQSSA9ICdodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS91cmxzaG9ydGVuZXIvdjEnO1xuXG52YXIgcHJlZml4U2VwYXJhdG9yID0gJy0nOyAvLyBjaGFuZ2UgdGhlIHJlZ2V4IGJlbG93IGlmIHlvdSBjaGFuZ2UgdGhpc1xudmFyIHNwbGl0UHJlZml4UmUgPSAvXigoW14tXSspLSk/KC4qKSQvO1xuXG4vL1lvdSBjYW4gdGVzdCBsaWtlIHRoaXMgd2l0aCBodHRwaWU6XG4vL2VjaG8gJ3sgXCJ0ZXN0XCI6IFwibWVcIiB9JyB8IGh0dHAgcG9zdCBsb2NhbGhvc3Q6MzAwMS9hcGkvdjEvc2hhcmVcbmZ1bmN0aW9uIG1ha2VHaXN0KHNlcnZpY2VPcHRpb25zLCBib2R5KSB7XG4gICAgdmFyIGdpc3RGaWxlID0ge307XG4gICAgZ2lzdEZpbGVbc2VydmljZU9wdGlvbnMuZ2lzdEZpbGVuYW1lIHx8ICd1c2VyY2F0YWxvZy5qc29uJ10gPSB7IGNvbnRlbnQ6IGJvZHkgfTtcblxuICAgIHZhciBoZWFkZXJzID0ge1xuICAgICAgICAnVXNlci1BZ2VudCc6IHNlcnZpY2VPcHRpb25zLnVzZXJBZ2VudCB8fCAnVGVycmlhSlMtU2VydmVyJyxcbiAgICAgICAgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi92bmQuZ2l0aHViLnYzK2pzb24nXG4gICAgfTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMuYWNjZXNzVG9rZW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBoZWFkZXJzWydBdXRob3JpemF0aW9uJ10gPSAndG9rZW4gJyArIHNlcnZpY2VPcHRpb25zLmFjY2Vzc1Rva2VuO1xuICAgIH1cbiAgICByZXR1cm4gcmVxdWVzdHAoe1xuICAgICAgICB1cmw6IGdpc3RBUEksXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgICBqc29uOiB0cnVlLFxuICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICBmaWxlczogZ2lzdEZpbGUsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogKHNlcnZpY2VPcHRpb25zLmdpc3REZXNjcmlwdGlvbiB8fCAnVXNlci1jcmVhdGVkIGNhdGFsb2cnKSxcbiAgICAgICAgICAgIHB1YmxpYzogZmFsc2VcbiAgICAgICAgfSwgdHJhbnNmb3JtOiBmdW5jdGlvbihib2R5LCByZXNwb25zZSkge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1c0NvZGUgPT09IDIwMSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdDcmVhdGVkIElEICcgKyByZXNwb25zZS5ib2R5LmlkICsgJyB1c2luZyBHaXN0IHNlcnZpY2UnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuYm9keS5pZDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8vIFRlc3Q6IGh0dHAgbG9jYWxob3N0OjMwMDEvYXBpL3YxL3NoYXJlL2ctOThlMDE2MjVkYjA3YTc4ZDIzYjQyYzNkYmUwOGZlMjBcbmZ1bmN0aW9uIHJlc29sdmVHaXN0KHNlcnZpY2VPcHRpb25zLCBpZCkge1xuICAgIHZhciBoZWFkZXJzID0ge1xuICAgICAgICAnVXNlci1BZ2VudCc6IHNlcnZpY2VPcHRpb25zLnVzZXJBZ2VudCB8fCAnVGVycmlhSlMtU2VydmVyJyxcbiAgICAgICAgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi92bmQuZ2l0aHViLnYzK2pzb24nXG4gICAgfTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMuYWNjZXNzVG9rZW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBoZWFkZXJzWydBdXRob3JpemF0aW9uJ10gPSAndG9rZW4gJyArIHNlcnZpY2VPcHRpb25zLmFjY2Vzc1Rva2VuO1xuICAgIH1cbiAgICByZXR1cm4gcmVxdWVzdHAoe1xuICAgICAgICB1cmw6IGdpc3RBUEkgKyAnLycgKyBpZCxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgICAganNvbjogdHJ1ZSxcbiAgICAgICAgdHJhbnNmb3JtOiBmdW5jdGlvbihib2R5LCByZXNwb25zZSkge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1c0NvZGUgPj0gMzAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYm9keS5maWxlc1tPYmplY3Qua2V5cyhib2R5LmZpbGVzKVswXV0uY29udGVudDsgLy8gZmluZCB0aGUgY29udGVudHMgb2YgdGhlIGZpcnN0IGZpbGUgaW4gdGhlIGdpc3RcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufVxuLypcbiAgR2VuZXJhdGUgc2hvcnQgSUQgYnkgaGFzaGluZyBib2R5LCBjb252ZXJ0aW5nIHRvIGJhc2U2MiB0aGVuIHRydW5jYXRpbmcuXG4gKi9cbmZ1bmN0aW9uIHNob3J0SWQoYm9keSwgbGVuZ3RoKSB7XG4gICAgdmFyIGhtYWMgPSByZXF1aXJlKCdjcnlwdG8nKS5jcmVhdGVIbWFjKCdzaGExJywgYm9keSkuZGlnZXN0KCk7XG4gICAgdmFyIGJhc2U2MiA9IHJlcXVpcmUoXCJiYXNlLXhcIikoJzAxMjM0NTY3ODlhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ekFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaJyk7XG4gICAgdmFyIGZ1bGxrZXkgPSBiYXNlNjIuZW5jb2RlKGhtYWMpO1xuICAgIHJldHVybiBmdWxsa2V5LnNsaWNlKDAsIGxlbmd0aCk7IC8vIGlmIGxlbmd0aCB1bmRlZmluZWQsIHJldHVybiB0aGUgd2hvbGUgdGhpbmdcbn1cblxudmFyIF9TMztcblxuZnVuY3Rpb24gUzMoc2VydmljZU9wdGlvbnMpIHtcbiAgICBpZiAoX1MzKSB7XG4gICAgICAgIHJldHVybiBfUzM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGF3cyA9IHJlcXVpcmUoJ2F3cy1zZGsnKTtcbiAgICAgICAgYXdzLmNvbmZpZy5zZXRQcm9taXNlc0RlcGVuZGVuY3kocmVxdWlyZSgnd2hlbicpLlByb21pc2UpO1xuICAgICAgICBhd3MuY29uZmlnLnVwZGF0ZSh7XG4gICAgICAgICAgICByZWdpb246IHNlcnZpY2VPcHRpb25zLnJlZ2lvblxuICAgICAgICB9KTtcbiAgICAgICAgLy8gaWYgbm8gY3JlZGVudGlhbHMgcHJvdmlkZWQsIHdlIGFzc3VtZSB0aGF0IHRoZXkncmUgYmVpbmcgcHJvdmlkZWQgYXMgZW52aXJvbm1lbnQgdmFyaWFibGVzIG9yIGluIGEgZmlsZVxuICAgICAgICBpZiAoc2VydmljZU9wdGlvbnMuYWNjZXNzS2V5SWQpIHtcbiAgICAgICAgICAgIGF3cy5jb25maWcudXBkYXRlKHtcbiAgICAgICAgICAgICAgICBhY2Nlc3NLZXlJZDogc2VydmljZU9wdGlvbnMuYWNjZXNzS2V5SWQsXG4gICAgICAgICAgICAgICAgc2VjcmV0QWNjZXNzS2V5OiBzZXJ2aWNlT3B0aW9ucy5zZWNyZXRBY2Nlc3NLZXlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIF9TMyA9IG5ldyBhd3MuUzMoKTtcbiAgICAgICAgcmV0dXJuIF9TMztcbiAgICB9XG59XG5cbi8vIFdlIGFwcGVuZCBzb21lIHBzZXVkby1kaXIgcHJlZml4ZXMgaW50byB0aGUgYWN0dWFsIG9iamVjdCBJRCB0byBhdm9pZCB0aG91c2FuZHMgb2Ygb2JqZWN0cyBpbiBhIHNpbmdsZSBwc2V1ZG8tZGlyZWN0b3J5LlxuLy8gTXlSYU5kb01rZXkgPT4gTS95L015UmFOZG9Na2V5XG5jb25zdCBpZFRvT2JqZWN0ID0gKGlkKSA9PiBpZC5yZXBsYWNlKC9eKC4pKC4pLywgJyQxLyQyLyQxJDInKTtcblxuZnVuY3Rpb24gc2F2ZVMzKHNlcnZpY2VPcHRpb25zLCBib2R5KSB7XG4gICAgdmFyIGlkID0gc2hvcnRJZChib2R5LCBzZXJ2aWNlT3B0aW9ucy5rZXlMZW5ndGgpO1xuICAgIGNvbnN0IHBhcmFtcyA9IHtcbiAgICAgICAgQnVja2V0OiBzZXJ2aWNlT3B0aW9ucy5idWNrZXQsXG4gICAgICAgIEtleTogaWRUb09iamVjdChpZCksXG4gICAgICAgIEJvZHk6IGJvZHlcbiAgICB9O1xuXG4gICAgcmV0dXJuIFMzKHNlcnZpY2VPcHRpb25zKS5wdXRPYmplY3QocGFyYW1zKS5wcm9taXNlKClcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnU2F2ZWQga2V5ICcgKyBpZCArICcgdG8gUzMgYnVja2V0ICcgKyBwYXJhbXMuQnVja2V0ICsgJzonICsgcGFyYW1zLktleSArICcuIEV0YWc6ICcgKyByZXN1bHQuRVRhZyk7XG4gICAgICAgICAgICByZXR1cm4gaWQ7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICByZXR1cm4gZTtcbiAgICAgICAgfSk7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVTMyhzZXJ2aWNlT3B0aW9ucywgaWQpIHtcbiAgICBjb25zdCBwYXJhbXMgPSB7XG4gICAgICAgIEJ1Y2tldDogc2VydmljZU9wdGlvbnMuYnVja2V0LFxuICAgICAgICBLZXk6IGlkVG9PYmplY3QoaWQpXG4gICAgfTtcbiAgICByZXR1cm4gUzMoc2VydmljZU9wdGlvbnMpLmdldE9iamVjdChwYXJhbXMpLnByb21pc2UoKVxuICAgIC50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIGRhdGEuQm9keTtcbiAgICB9KS5jYXRjaChmdW5jdGlvbihlKSB7XG4gICAgICAgIHRocm93IHtcbiAgICAgICAgICAgIHJlc3BvbnNlOiBlLFxuICAgICAgICAgICAgZXJyb3I6IGUubWVzc2FnZVxuICAgICAgICB9O1xuICAgIH0pO1xufVxuXG5cbi8vIFRlc3Q6IGh0dHAgbG9jYWxob3N0OjMwMDEvYXBpL3YxL3NoYXJlL3EzbnhQZFxuZnVuY3Rpb24gcmVzb2x2ZUdvb2dsZVVybChzZXJ2aWNlT3B0aW9ucywgaWQpIHtcbiAgICB2YXIgc2hvcnRVcmwgPSAnaHR0cDovL2dvby5nbC8nICsgaWQ7XG4gICAgY29uc29sZS5sb2coc2hvcnRVcmwpO1xuICAgIHJldHVybiByZXF1ZXN0cCh7XG4gICAgICAgIHVybDogZ29vZ2xlVXJsU2hvcnRlbmVyQVBJICsgJy91cmw/a2V5PScgKyBzZXJ2aWNlT3B0aW9ucy5hcGlrZXkgKyAnJnNob3J0VXJsPScgKyBzaG9ydFVybCxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ1VzZXItQWdlbnQnOiBzZXJ2aWNlT3B0aW9ucy51c2VyQWdlbnQgfHwgJ1RlcnJpYUpTLVNlcnZlcicsXG4gICAgICAgIH0sXG4gICAgICAgIGpzb246IHRydWUsXG4gICAgICAgIHRyYW5zZm9ybTogZnVuY3Rpb24oYm9keSwgcmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXNDb2RlID49IDMwMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gT3VyIEdvb2dsZSBVUkxzIGxvb2sgbGlrZSBcImh0dHA6Ly9uYXRpb25hbG1hcC5nb3YuYXUvI3NoYXJlPSU3Qi4uLiU3RFwiIGJ1dCB0aGVyZSBtaWdodCBiZSBvdGhlciBVUkwgcGFyYW1ldGVycyBiZWZvcmUgb3IgYWZ0ZXJcbiAgICAgICAgICAgICAgICAvLyBXZSBqdXN0IHdhbnQgdGhlIGVuY29kZWQgSlNPTiAoJTdCLi4lN0QpLCBub3QgdGhlIHdob2xlIFVSTC5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KGJvZHkubG9uZ1VybC5tYXRjaCgvKCU3Qi4qJTdEKSgmLiopJC8pWzFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNoYXJlVXJsUHJlZml4ZXMsIG5ld1NoYXJlVXJsUHJlZml4LCBob3N0TmFtZSwgcG9ydCkge1xuICAgIGlmICghc2hhcmVVcmxQcmVmaXhlcykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHJvdXRlciA9IHJlcXVpcmUoJ2V4cHJlc3MnKS5Sb3V0ZXIoKTtcbiAgICByb3V0ZXIudXNlKGJvZHlQYXJzZXIudGV4dCh7dHlwZTogJyovKid9KSk7XG5cbiAgICAvLyBSZXF1ZXN0ZWQgY3JlYXRpb24gb2YgYSBuZXcgc2hvcnQgVVJMLlxuICAgIHJvdXRlci5wb3N0KCcvJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgICAgICAgaWYgKG5ld1NoYXJlVXJsUHJlZml4ID09PSB1bmRlZmluZWQgfHwgIXNoYXJlVXJsUHJlZml4ZXNbbmV3U2hhcmVVcmxQcmVmaXhdKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBtZXNzYWdlOiBcIlRoaXMgc2VydmVyIGhhcyBub3QgYmVlbiBjb25maWd1cmVkIHRvIGdlbmVyYXRlIG5ldyBzaGFyZSBVUkxzLlwiIH0pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9IHNoYXJlVXJsUHJlZml4ZXNbbmV3U2hhcmVVcmxQcmVmaXhdO1xuICAgICAgICB2YXIgbWludGVyID0ge1xuICAgICAgICAgICAgJ2dpc3QnOiBtYWtlR2lzdCxcbiAgICAgICAgICAgICdzMyc6IHNhdmVTM1xuICAgICAgICAgICAgfVtzZXJ2aWNlT3B0aW9ucy5zZXJ2aWNlLnRvTG93ZXJDYXNlKCldO1xuXG4gICAgICAgIG1pbnRlcihzZXJ2aWNlT3B0aW9ucywgcmVxLmJvZHkpLnRoZW4oZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgIGlkID0gbmV3U2hhcmVVcmxQcmVmaXggKyBwcmVmaXhTZXBhcmF0b3IgKyBpZDtcbiAgICAgICAgICAgIHZhciByZXNQYXRoID0gcmVxLmJhc2VVcmwgKyAnLycgKyBpZDtcbiAgICAgICAgICAgIC8vIHRoZXNlIHByb3BlcnRpZXMgd29uJ3QgYmVoYXZlIGNvcnJlY3RseSB1bmxlc3MgXCJ0cnVzdFByb3h5OiB0cnVlXCIgaXMgc2V0IGluIHVzZXIncyBvcHRpb25zIGZpbGUuXG4gICAgICAgICAgICAvLyB0aGV5IG1heSBub3QgYmVoYXZlIGNvcnJlY3RseSAoZXNwZWNpYWxseSBwb3J0KSB3aGVuIGJlaGluZCBtdWx0aXBsZSBsZXZlbHMgb2YgcHJveHlcbiAgICAgICAgICAgIHZhciByZXNVcmwgPVxuICAgICAgICAgICAgICAgIHJlcS5wcm90b2NvbCArICc6Ly8nICtcbiAgICAgICAgICAgICAgICByZXEuaG9zdG5hbWUgK1xuICAgICAgICAgICAgICAgIChyZXEuaGVhZGVyKCdYLUZvcndhcmRlZC1Qb3J0JykgfHwgcG9ydCkgK1xuICAgICAgICAgICAgICAgIHJlc1BhdGg7XG4gICAgICAgICAgICByZXMgLmxvY2F0aW9uKHJlc1VybClcbiAgICAgICAgICAgICAgICAuc3RhdHVzKDIwMSlcbiAgICAgICAgICAgICAgICAuanNvbih7IGlkOiBpZCwgcGF0aDogcmVzUGF0aCwgdXJsOiByZXNVcmwgfSk7XG4gICAgICAgIH0pLmNhdGNoKHJwZXJyb3JzLlRyYW5zZm9ybUVycm9yLCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKEpTT04uc3RyaW5naWZ5KHJlYXNvbiwgbnVsbCwgMikpO1xuICAgICAgICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBtZXNzYWdlOiByZWFzb24uY2F1c2UubWVzc2FnZSB9KTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oSlNPTi5zdHJpbmdpZnkocmVhc29uLCBudWxsLCAyKSk7XG4gICAgICAgICAgICByZXMuc3RhdHVzKDUwMCkgLy8gcHJvYmFibHkgc2FmZXN0IGlmIHdlIGFsd2F5cyByZXR1cm4gYSBjb25zaXN0ZW50IGVycm9yIGNvZGVcbiAgICAgICAgICAgICAgICAuanNvbih7IG1lc3NhZ2U6IHJlYXNvbi5lcnJvciB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvLyBSZXNvbHZlIGFuIGV4aXN0aW5nIElELiBXZSBicmVhayBvZmYgdGhlIHByZWZpeCBhbmQgdXNlIGl0IHRvIHdvcmsgb3V0IHdoaWNoIHJlc29sdmVyIHRvIHVzZS5cbiAgICByb3V0ZXIuZ2V0KCcvOmlkJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgICAgICAgdmFyIHByZWZpeCA9IHJlcS5wYXJhbXMuaWQubWF0Y2goc3BsaXRQcmVmaXhSZSlbMl0gfHwgJyc7XG4gICAgICAgIHZhciBpZCA9IHJlcS5wYXJhbXMuaWQubWF0Y2goc3BsaXRQcmVmaXhSZSlbM107XG4gICAgICAgIHZhciByZXNvbHZlcjtcblxuICAgICAgICB2YXIgc2VydmljZU9wdGlvbnMgPSBzaGFyZVVybFByZWZpeGVzW3ByZWZpeF07XG4gICAgICAgIGlmICghc2VydmljZU9wdGlvbnMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1NoYXJlOiBVbmtub3duIHByZWZpeCB0byByZXNvbHZlIFwiJyArIHByZWZpeCArICdcIiwgaWQgXCInICsgaWQgKyAnXCInKTtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuc2VuZCgnVW5rbm93biBzaGFyZSBwcmVmaXggXCInICsgcHJlZml4ICsgJ1wiJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXNvbHZlciA9IHtcbiAgICAgICAgICAgICAgICAnZ2lzdCc6IHJlc29sdmVHaXN0LFxuICAgICAgICAgICAgICAgICdnb29nbGV1cmxzaG9ydGVuZXInOiByZXNvbHZlR29vZ2xlVXJsLFxuICAgICAgICAgICAgICAgICdzMyc6IHJlc29sdmVTM1xuICAgICAgICAgICAgfVtzZXJ2aWNlT3B0aW9ucy5zZXJ2aWNlLnRvTG93ZXJDYXNlKCldO1xuICAgICAgICB9XG4gICAgICAgIHJlc29sdmVyKHNlcnZpY2VPcHRpb25zLCBpZCkudGhlbihmdW5jdGlvbihjb250ZW50KSB7XG4gICAgICAgICAgICByZXMuc2VuZChjb250ZW50KTtcbiAgICAgICAgfSkuY2F0Y2gocnBlcnJvcnMuVHJhbnNmb3JtRXJyb3IsIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoSlNPTi5zdHJpbmdpZnkocmVhc29uLCBudWxsLCAyKSk7XG4gICAgICAgICAgICByZXMuc3RhdHVzKDUwMCkuc2VuZChyZWFzb24uY2F1c2UubWVzc2FnZSk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKEpTT04uc3RyaW5naWZ5KHJlYXNvbi5yZXNwb25zZSwgbnVsbCwgMikpO1xuICAgICAgICAgICAgcmVzLnN0YXR1cyg0MDQpIC8vIHByb2JhYmx5IHNhZmVzdCBpZiB3ZSBhbHdheXMgcmV0dXJuIDQwNCByYXRoZXIgdGhhbiB3aGF0ZXZlciB0aGUgdXBzdHJlYW0gcHJvdmlkZXIgc2V0cy5cbiAgICAgICAgICAgICAgICAuc2VuZChyZWFzb24uZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcm91dGVyO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuY2xhc3MgZGF0YWJhc2Uge1xuXG5cdHB1YmxpYyB0eXBlOiBzdHJpbmc7XG5cdHB1YmxpYyBob3N0OiBzdHJpbmc7XG5cdHByaXZhdGUgdXNlcm5hbWU6IHN0cmluZztcblx0cHJpdmF0ZSBwYXNzd29yZDogc3RyaW5nO1xuXHRwdWJsaWMgY29ubmVjdGlvbjogYW55O1xuXG5cdGNvbnN0cnVjdG9yKHR5cGU6IHN0cmluZywgaG9zdDogc3RyaW5nLCB1c2VybmFtZTogc3RyaW5nLCBwYXNzd29yZDogc3RyaW5nLCBjb25uZWN0aW9uOiBhbnkpIHtcblx0XHR0aGlzLnR5cGUgPSB0eXBlO1xuXHRcdHRoaXMuaG9zdCA9IGhvc3Q7XG5cdFx0dGhpcy51c2VybmFtZSA9IHVzZXJuYW1lO1xuXHRcdHRoaXMucGFzc3dvcmQgPSBwYXNzd29yZDtcblx0XHR0aGlzLmNvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xuXHR9XG5cblx0Z2V0U3RhdHVzKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLmNvbm5lY3Rpb24uc3RhdGU7XG5cdH1cblxufVxuXG5leHBvcnQgPSBkYXRhYmFzZTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBteXNxbCA9IHJlcXVpcmUoJ215c3FsJyk7XG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi4vLi4vLi4vY29uZmlnLmpzb24nKTtcblxudmFyIGNvbiA9IG15c3FsLmNyZWF0ZUNvbm5lY3Rpb24oe1xuXHRob3N0OiBjb25maWcuZGF0YWJhc2UuaG9zdCxcblx0dXNlcjogY29uZmlnLmRhdGFiYXNlLnVzZXJuYW1lLFxuXHRwYXNzd29yZDogY29uZmlnLmRhdGFiYXNlLnBhc3N3b3JkXG59KTtcblxuY29uLmNvbm5lY3QoZnVuY3Rpb24oZXJyKSB7XG5cdGlmIChlcnIpIHRocm93IGVycjtcblx0Y29uc29sZS5sb2coXCJEYXRhYmFzZSBlc3RhYmxpc2hlZC4gU3RhdHVzOiBcIiArIGNvbi5zdGF0ZSk7XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBjb247IiwibW9kdWxlLmV4cG9ydHMuZXJyb3I0MDQgPSBmdW5jdGlvbihzaG93NDA0LCB3d3dyb290LCBzZXJ2ZVd3d1Jvb3QpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgICAgIGlmIChzaG93NDA0KSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzKDQwNCkuc2VuZEZpbGUod3d3cm9vdCArICcvNDA0Lmh0bWwnKTtcbiAgICAgICAgfSBlbHNlIGlmIChzZXJ2ZVd3d1Jvb3QpIHtcbiAgICAgICAgICAgIC8vIFJlZGlyZWN0IHVua25vd24gcGFnZXMgYmFjayBob21lLlxuICAgICAgICAgICAgcmVzLnJlZGlyZWN0KDMwMywgJy8nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXMoNDA0KS5zZW5kKCdObyBUZXJyaWFKUyB3ZWJzaXRlIGhlcmUuJyk7XG4gICAgICAgIH1cbiAgICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMuZXJyb3I1MDAgPSBmdW5jdGlvbihzaG93NTAwLCB3d3dyb290KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGVycm9yLCByZXEsIHJlcywgbmV4dCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgaWYgKHNob3c1MDApIHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXMoNTAwKS5zZW5kRmlsZSh3d3dyb290ICsgJy81MDAuaHRtbCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzLnN0YXR1cyg1MDApLnNlbmQoJzUwMDogSW50ZXJuYWwgU2VydmVyIEVycm9yJyk7XG4gICAgICAgIH1cbiAgICB9O1xufTtcbiIsInZhciBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5cbmV4cG9ydCA9IGZ1bmN0aW9uIGV4aXN0cyhwYXRoTmFtZSkge1xuICAgIHRyeSB7XG4gICAgICAgIGZzLnN0YXRTeW5jKHBhdGhOYW1lKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBleGlzdHMgPSByZXF1aXJlKCcuL2V4aXN0cycpO1xudmFyIGZzID0gcmVxdWlyZSgnZnMnKTtcbnZhciBqc29uNSA9IHJlcXVpcmUoJ2pzb241Jyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcblxuY2xhc3Mgc2VydmVyb3B0aW9ucyB7XG5cbiAgICBwdWJsaWMgbGlzdGVuSG9zdDogYW55O1xuICAgIHB1YmxpYyBjb25maWdGaWxlOiBhbnk7XG4gICAgcHVibGljIHNldHRpbmdzOiBhbnk7XG4gICAgcHVibGljIHByb3h5QXV0aEZpbGU6IGFueTtcbiAgICBwdWJsaWMgcHJveHlBdXRoOiBhbnk7XG4gICAgcHVibGljIHBvcnQ6IG51bWJlcjtcbiAgICBwdWJsaWMgd3d3cm9vdDogYW55O1xuICAgIHB1YmxpYyBjb25maWdEaXI6IGFueTtcbiAgICBwdWJsaWMgdmVyYm9zZTogYW55O1xuICAgIHB1YmxpYyBob3N0TmFtZTogYW55O1xuXG4gICAgZ2V0RmlsZVBhdGgoZmlsZU5hbWUsIHdhcm4pIHtcbiAgICAgICAgaWYgKGV4aXN0cyhmaWxlTmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWxlTmFtZTtcbiAgICAgICAgfSBlbHNlIGlmICh3YXJuKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJXYXJuaW5nOiBDYW5cXCd0IG9wZW4gJ1wiICsgZmlsZU5hbWUgKyBcIicuXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0Q29uZmlnRmlsZShhcmdGaWxlTmFtZSwgZGVmYXVsdEZpbGVOYW1lKTogYW55IHtcbiAgICAgICAgcmV0dXJuIGFyZ0ZpbGVOYW1lID8gIHRoaXMuZ2V0RmlsZVBhdGgoYXJnRmlsZU5hbWUsIHRydWUpIDogdGhpcy5nZXRGaWxlUGF0aChkZWZhdWx0RmlsZU5hbWUsIHRydWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgYSBjb25maWcgZmlsZSB1c2luZyByZXF1aXJlLCBsb2dnaW5nIGEgd2FybmluZyBhbmQgZGVmYXVsdGluZyB0byBhIGJhY2t1cCB2YWx1ZSBpbiB0aGUgZXZlbnQgb2YgYSBmYWlsdXJlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGZpbGVQYXRoIFRoZSBwYXRoIHRvIGxvb2sgZm9yIHRoZSBjb25maWcgZmlsZS5cbiAgICAgKiBAcGFyYW0gY29uZmlnRmlsZVR5cGUgV2hhdCBraW5kIG9mIGNvbmZpZyBmaWxlIGlzIHRoaXM/IEUuZy4gY29uZmlnLCBhdXRoIGV0Yy5cbiAgICAgKiBAcGFyYW0gZmFpbHVyZUNvbnNlcXVlbmNlIFRoZSBjb25zZXF1ZW5jZSBvZiB1c2luZyB0aGUgZGVmYXVsdFZhbHVlIHdoZW4gdGhpcyBmaWxlIGZhaWxzIHRvIGxvYWQgLSB0aGlzIHdpbGwgYmUgbG9nZ2VkXG4gICAgICogICAgICAgIGFzIHBhcnQgb2YgdGhlIHdhcm5pbmdcbiAgICAgKiBAcmV0dXJucyB7Kn0gVGhlIGNvbmZpZywgZWl0aGVyIGZyb20gdGhlIGZpbGVQYXRoIG9yIGEgZGVmYXVsdC5cbiAgICAgKi9cbiAgICBnZXRDb25maWcoZmlsZVBhdGgsIGNvbmZpZ0ZpbGVUeXBlLCBmYWlsdXJlQ29uc2VxdWVuY2UsIHF1aWV0KTogYW55IHtcbiAgICAgICAgdmFyIGNvbmZpZztcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIGZpbGVDb250ZW50cyA9IGZzLnJlYWRGaWxlU3luYyhmaWxlUGF0aCwgJ3V0ZjgnKTtcbiAgICAgICAgICAgIC8vIFN0cmlwIGNvbW1lbnRzIGZvcm1hdHRlZCBhcyBsaW5lcyBzdGFydGluZyB3aXRoIGEgIywgYmVmb3JlIHBhcnNpbmcgYXMgSlNPTjUuICMtaW5pdGlhbCBjb21tZW50cyBhcmUgZGVwcmVjYXRlZCwgd2lsbCBiZSByZW1vdmVkIGluIHZlcnNpb24gMy5cbiAgICAgICAgICAgIGNvbmZpZyA9IGpzb241LnBhcnNlKGZpbGVDb250ZW50cy5yZXBsYWNlKC9eXFxzKiMuKiQvbWcsJycpKTtcbiAgICAgICAgICAgIGlmICghcXVpZXQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnVXNpbmcgJyArIGNvbmZpZ0ZpbGVUeXBlICsgJyBmaWxlIFwiJyArIGZzLnJlYWxwYXRoU3luYyhmaWxlUGF0aCkgKyAnXCIuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGlmICghcXVpZXQpIHtcbiAgICAgICAgICAgICAgICB2YXIgbG9nZ2VkRmlsZVBhdGggPSBmaWxlUGF0aCA/ICcgXCInICsgZmlsZVBhdGggKyAnXCInIDogJyc7XG4gICAgICAgICAgICAgICAgaWYgKCEobG9nZ2VkRmlsZVBhdGggPT09ICcnICYmIGNvbmZpZ0ZpbGVUeXBlID09PSAncHJveHlBdXRoJykpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdXYXJuaW5nOiBDYW5cXCd0IG9wZW4gJyArIGNvbmZpZ0ZpbGVUeXBlICsgJyBmaWxlJyArIGxvZ2dlZEZpbGVQYXRoICsgJy4gJyArIGZhaWx1cmVDb25zZXF1ZW5jZSArICcuXFxuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uZmlnID0ge307XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY29uZmlnOyAgICAgICAgXG4gICAgfVxuXG4gICAgbG9hZENvbW1hbmRMaW5lKCkge1xuICAgICAgICB2YXIgeWFyZ3MgPSByZXF1aXJlKCd5YXJncycpXG4gICAgICAgICAgICAudXNhZ2UoJyQwIFtvcHRpb25zXSBbcGF0aC90by93d3dyb290XScpXG4gICAgICAgICAgICAuc3RyaWN0KClcbiAgICAgICAgICAgIC5vcHRpb25zKHtcbiAgICAgICAgICAgICdwb3J0JyA6IHtcbiAgICAgICAgICAgICAgICAnZGVzY3JpcHRpb24nIDogJ1BvcnQgdG8gbGlzdGVuIG9uLiAgICAgICAgICAgICAgICBbZGVmYXVsdDogMzAwMV0nLFxuICAgICAgICAgICAgICAgIG51bWJlcjogdHJ1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAncHVibGljJyA6IHtcbiAgICAgICAgICAgICAgICAndHlwZScgOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgJ2RlZmF1bHQnIDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAnZGVzY3JpcHRpb24nIDogJ1J1biBhIHB1YmxpYyBzZXJ2ZXIgdGhhdCBsaXN0ZW5zIG9uIGFsbCBpbnRlcmZhY2VzLidcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnY29uZmlnLWZpbGUnIDoge1xuICAgICAgICAgICAgICAgICdkZXNjcmlwdGlvbicgOiAnRmlsZSBjb250YWluaW5nIHNldHRpbmdzIHN1Y2ggYXMgYWxsb3dlZCBkb21haW5zIHRvIHByb3h5LiBTZWUgc2VydmVyY29uZmlnLmpzb24uZXhhbXBsZSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAncHJveHktYXV0aCcgOiB7XG4gICAgICAgICAgICAgICAgJ2Rlc2NyaXB0aW9uJyA6ICdGaWxlIGNvbnRhaW5pbmcgYXV0aCBpbmZvcm1hdGlvbiBmb3IgcHJveGllZCBkb21haW5zLiBTZWUgcHJveHlhdXRoLmpzb24uZXhhbXBsZSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAndmVyYm9zZSc6IHtcbiAgICAgICAgICAgICAgICAnZGVzY3JpcHRpb24nOiAnUHJvZHVjZSBtb3JlIG91dHB1dCBhbmQgbG9nZ2luZy4nLFxuICAgICAgICAgICAgICAgICd0eXBlJzogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgICdkZWZhdWx0JzogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnaGVscCcgOiB7XG4gICAgICAgICAgICAgICAgJ2FsaWFzJyA6ICdoJyxcbiAgICAgICAgICAgICAgICAndHlwZScgOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgJ2Rlc2NyaXB0aW9uJyA6ICdTaG93IHRoaXMgaGVscC4nXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICh5YXJncy5hcmd2LmhlbHApIHtcbiAgICAgICAgICAgIHlhcmdzLnNob3dIZWxwKCk7XG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFlhcmdzIHVuaGVscGZ1bGx5IHR1cm5zIFwiLS1vcHRpb24gZm9vIC0tb3B0aW9uIGJhclwiIGludG8geyBvcHRpb246IFtcImZvb1wiLCBcImJhclwiXSB9LlxuICAgICAgICAvLyBIZW5jZSByZXBsYWNlIGFycmF5cyB3aXRoIHRoZSByaWdodG1vc3QgdmFsdWUuIFRoaXMgbWF0dGVycyB3aGVuIGBucG0gcnVuYCBoYXMgb3B0aW9uc1xuICAgICAgICAvLyBidWlsdCBpbnRvIGl0LCBhbmQgdGhlIHVzZXIgd2FudHMgdG8gb3ZlcnJpZGUgdGhlbSB3aXRoIGBucG0gcnVuIC0tIC0tcG9ydCAzMDA1YCBvciBzb21ldGhpbmcuXG4gICAgICAgIC8vIFlhcmdzIGFsc28gc2VlbXMgdG8gaGF2ZSBzZXR0ZXJzLCBoZW5jZSB3aHkgd2UgaGF2ZSB0byBtYWtlIGEgc2hhbGxvdyBjb3B5LlxuICAgICAgICB2YXIgYXJndiA9IE9iamVjdC5hc3NpZ24oe30sIHlhcmdzLmFyZ3YpO1xuICAgICAgICBPYmplY3Qua2V5cyhhcmd2KS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcbiAgICAgICAgICAgIGlmIChrICE9PSAnXycgJiYgQXJyYXkuaXNBcnJheShhcmd2W2tdKSkge1xuICAgICAgICAgICAgICAgIGFyZ3Zba10gPSBhcmd2W2tdW2FyZ3Zba10ubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBhcmd2O1xuICAgIH1cblxuICAgIGluaXQocXVpZXQ6IGJvb2xlYW4pIHtcblxuICAgICAgICB2YXIgYXJndiA9IHRoaXMubG9hZENvbW1hbmRMaW5lKCk7XG5cbiAgICAgICAgdGhpcy5saXN0ZW5Ib3N0ID0gYXJndi5wdWJsaWMgPyB1bmRlZmluZWQgOiAnbG9jYWxob3N0JztcbiAgICAgICAgdGhpcy5jb25maWdGaWxlID0gdGhpcy5nZXRDb25maWdGaWxlKGFyZ3YuY29uZmlnRmlsZSwgJ3NlcnZlcmNvbmZpZy5qc29uJyk7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSB0aGlzLmdldENvbmZpZyh0aGlzLmNvbmZpZ0ZpbGUsICdjb25maWcnLCAnQUxMIHByb3h5IHJlcXVlc3RzIHdpbGwgYmUgYWNjZXB0ZWQuJywgcXVpZXQpO1xuICAgICAgICB0aGlzLnByb3h5QXV0aEZpbGUgPSB0aGlzLmdldENvbmZpZ0ZpbGUoYXJndi5wcm94eUF1dGgsICdwcm94eWF1dGguanNvbicpO1xuICAgICAgICB0aGlzLnByb3h5QXV0aCA9IHRoaXMuZ2V0Q29uZmlnKHRoaXMucHJveHlBdXRoRmlsZSwgJ3Byb3h5QXV0aCcsICdQcm94eWluZyB0byBzZXJ2ZXJzIHRoYXQgcmVxdWlyZSBhdXRoZW50aWNhdGlvbiB3aWxsIGZhaWwnLCBxdWlldCk7XG4gICAgICAgIFxuICAgICAgICBpZiAoIXRoaXMucHJveHlBdXRoIHx8IE9iamVjdC5rZXlzKHRoaXMucHJveHlBdXRoKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMucHJveHlBdXRoID0gdGhpcy5zZXR0aW5ncy5wcm94eUF1dGggfHwge307XG4gICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgdGhpcy5wb3J0ID0gYXJndi5wb3J0IHx8IHRoaXMuc2V0dGluZ3MucG9ydCB8fCAzMDAxO1xuICAgICAgICB0aGlzLnd3d3Jvb3QgPSBhcmd2Ll8ubGVuZ3RoID4gMCA/IGFyZ3YuX1swXSA6IHByb2Nlc3MuY3dkKCkgKyAnL3d3d3Jvb3QnO1xuICAgICAgICB0aGlzLmNvbmZpZ0RpciA9IGFyZ3YuY29uZmlnRmlsZSA/IHBhdGguZGlybmFtZSAoYXJndi5jb25maWdGaWxlKSA6ICcuJztcbiAgICAgICAgdGhpcy52ZXJib3NlID0gYXJndi52ZXJib3NlO1xuICAgICAgICB0aGlzLmhvc3ROYW1lID0gdGhpcy5saXN0ZW5Ib3N0IHx8IHRoaXMuc2V0dGluZ3MuaG9zdE5hbWUgfHwgJ2xvY2FsaG9zdCc7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MucHJveHlBbGxEb21haW5zID0gdGhpcy5zZXR0aW5ncy5wcm94eUFsbERvbWFpbnMgfHwgdHlwZW9mIHRoaXMuc2V0dGluZ3MuYWxsb3dQcm94eUZvciA9PT0gJ3VuZGVmaW5lZCc7XG5cbiAgICB9XG5cbn1cblxuZXhwb3J0ID0gc2VydmVyb3B0aW9uczsiXSwic291cmNlUm9vdCI6IiJ9