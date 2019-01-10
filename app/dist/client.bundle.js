/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./app/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./app/index.js":
/*!**********************!*\
  !*** ./app/index.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/* PLUGIN MODULE - Main entry point of the application for webpack bundling */

var fs = __webpack_require__(/*! fs */ "fs");
var cluster = __webpack_require__(/*! cluster */ "cluster");
var exists = __webpack_require__(/*! ./core/exists */ "./app/core/exists.ts");
var app = __webpack_require__(/*! ./core/app */ "./app/core/app.ts");

var framework = new app();
framework.init(); // Start application - At this point the framework should render the initial backgound and backend administration webpages. 

// Example framework calls

// var terriajs = require('terriajs');
// var lib = new terriajs();
// var catalog = lib.catalog;

// framework.loadModule(catalog); // Lazy loading, browser will only load javascript module files that is loaded via this function into the framework and displays it.

/* STATUS: Integration - TerriaJS example usage from TerriaMap

var terriaOptions = {
    baseUrl: 'dist/TerriaJS'
};

import GoogleAnalytics from 'terriajs/lib/Core/GoogleAnalytics';
import ShareDataService from 'terriajs/lib/Models/ShareDataService';
import raiseErrorToUser from 'terriajs/lib/Models/raiseErrorToUser';
import registerAnalytics from 'terriajs/lib/Models/registerAnalytics';
import registerCatalogMembers from 'terriajs/lib/Models/registerCatalogMembers';
import registerCustomComponentTypes from 'terriajs/lib/ReactViews/Custom/registerCustomComponentTypes';
import Terria from 'terriajs/lib/Models/Terria';
import updateApplicationOnHashChange from 'terriajs/lib/ViewModels/updateApplicationOnHashChange';
import updateApplicationOnMessageFromParentWindow from 'terriajs/lib/ViewModels/updateApplicationOnMessageFromParentWindow';
import ViewState from 'terriajs/lib/ReactViewModels/ViewState';
import BingMapsSearchProviderViewModel from 'terriajs/lib/ViewModels/BingMapsSearchProviderViewModel.js';
import GazetteerSearchProviderViewModel from 'terriajs/lib/ViewModels/GazetteerSearchProviderViewModel.js';
import GnafSearchProviderViewModel from 'terriajs/lib/ViewModels/GnafSearchProviderViewModel.js';
import defined from 'terriajs-cesium/Source/Core/defined';
import render from './app/lib/Views/render';

// Register all types of catalog members in the core TerriaJS.  If you only want to register a subset of them
// (i.e. to reduce the size of your application if you don't actually use them all), feel free to copy a subset of
// the code in the registerCatalogMembers function here instead.
registerCatalogMembers();
registerAnalytics();

terriaOptions.analytics = new GoogleAnalytics();

// Construct the TerriaJS application, arrange to show errors to the user, and start it up.
var terria = new Terria(terriaOptions);

// Register custom components in the core TerriaJS.  If you only want to register a subset of them, or to add your own,
// insert your custom version of the code in the registerCustomComponentTypes function here instead.
registerCustomComponentTypes(terria);

// Create the ViewState before terria.start so that errors have somewhere to go.
const viewState = new ViewState({
    terria: terria
});

if (process.env.NODE_ENV === "development") {
    window.viewState = viewState;
}

// If we're running in dev mode, disable the built style sheet as we'll be using the webpack style loader.
// Note that if the first stylesheet stops being nationalmap.css then this will have to change.
if (process.env.NODE_ENV !== "production" && module.hot) {
    document.styleSheets[0].disabled = true;
}

terria.start({
    // If you don't want the user to be able to control catalog loading via the URL, remove the applicationUrl property below
    // as well as the call to "updateApplicationOnHashChange" further down.
    applicationUrl: window.location,
    configUrl: 'config.json',
    shareDataService: new ShareDataService({
        terria: terria
    })
}).otherwise(function(e) {
    raiseErrorToUser(terria, e);
}).always(function() {
    try {
        viewState.searchState.locationSearchProviders = [
            new BingMapsSearchProviderViewModel({
                terria: terria,
                key: terria.configParameters.bingMapsKey
            }),
            new GazetteerSearchProviderViewModel({terria}),
            new GnafSearchProviderViewModel({terria})
        ];

        // Automatically update Terria (load new catalogs, etc.) when the hash part of the URL changes.
        updateApplicationOnHashChange(terria, window);
        updateApplicationOnMessageFromParentWindow(terria, window);

        // Create the various base map options.
        var createAustraliaBaseMapOptions = require('terriajs/lib/ViewModels/createAustraliaBaseMapOptions');
        var createGlobalBaseMapOptions = require('terriajs/lib/ViewModels/createGlobalBaseMapOptions');
        var selectBaseMap = require('terriajs/lib/ViewModels/selectBaseMap');

        var australiaBaseMaps = createAustraliaBaseMapOptions(terria);
        var globalBaseMaps = createGlobalBaseMapOptions(terria, terria.configParameters.bingMapsKey);

        var allBaseMaps = australiaBaseMaps.concat(globalBaseMaps);
        selectBaseMap(terria, allBaseMaps, 'Bing Maps Aerial with Labels', true);

        // Show a modal disclaimer before user can do anything else.
        if (defined(terria.configParameters.globalDisclaimer)) {
            var globalDisclaimer = terria.configParameters.globalDisclaimer;
            var hostname = window.location.hostname;
            if (globalDisclaimer.enableOnLocalhost || hostname.indexOf('localhost') === -1) {
                var message = '';
                // Sometimes we want to show a preamble if the user is viewing a site other than the official production instance.
                // This can be expressed as a devHostRegex ("any site starting with staging.") or a negative prodHostRegex ("any site not ending in .gov.au")
                if (defined(globalDisclaimer.devHostRegex) && hostname.match(globalDisclaimer.devHostRegex) ||
                    defined(globalDisclaimer.prodHostRegex) && !hostname.match(globalDisclaimer.prodHostRegex)) {
                        message += require('./app/lib/Views/DevelopmentDisclaimerPreamble.html');
                }
                message += require('./app/lib/Views/GlobalDisclaimer.html');

                var options = {
                    title: (globalDisclaimer.title !== undefined) ? globalDisclaimer.title : 'Warning',
                    confirmText: (globalDisclaimer.buttonTitle || "Ok"),
                    width: 600,
                    height: 550,
                    message: message,
                    horizontalPadding : 100
                };
                viewState.notifications.push(options);
            }
        }

        render(terria, allBaseMaps, viewState);
    } catch (e) {
        console.error(e);
        console.error(e.stack);
    }
});

*/



/***/ }),

/***/ "aws-sdk":
/*!**************************!*\
  !*** external "aws-sdk" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("aws-sdk");

/***/ }),

/***/ "base-x":
/*!*************************!*\
  !*** external "base-x" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("base-x");

/***/ }),

/***/ "basic-auth":
/*!*****************************!*\
  !*** external "basic-auth" ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("basic-auth");

/***/ }),

/***/ "body-parser":
/*!******************************!*\
  !*** external "body-parser" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("body-parser");

/***/ }),

/***/ "cluster":
/*!**************************!*\
  !*** external "cluster" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("cluster");

/***/ }),

/***/ "compression":
/*!******************************!*\
  !*** external "compression" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("compression");

/***/ }),

/***/ "cors":
/*!***********************!*\
  !*** external "cors" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("cors");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("crypto");

/***/ }),

/***/ "express":
/*!**************************!*\
  !*** external "express" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("express");

/***/ }),

/***/ "express-brute":
/*!********************************!*\
  !*** external "express-brute" ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("express-brute");

/***/ }),

/***/ "formidable":
/*!*****************************!*\
  !*** external "formidable" ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("formidable");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("https");

/***/ }),

/***/ "json5":
/*!************************!*\
  !*** external "json5" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("json5");

/***/ }),

/***/ "morgan":
/*!*************************!*\
  !*** external "morgan" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("morgan");

/***/ }),

/***/ "mysql":
/*!************************!*\
  !*** external "mysql" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("mysql");

/***/ }),

/***/ "net":
/*!**********************!*\
  !*** external "net" ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("net");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("os");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),

/***/ "proj4":
/*!************************!*\
  !*** external "proj4" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("proj4");

/***/ }),

/***/ "proj4js-defs/epsg":
/*!************************************!*\
  !*** external "proj4js-defs/epsg" ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("proj4js-defs/epsg");

/***/ }),

/***/ "range_check":
/*!******************************!*\
  !*** external "range_check" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("range_check");

/***/ }),

/***/ "request":
/*!**************************!*\
  !*** external "request" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("request");

/***/ }),

/***/ "request-promise":
/*!**********************************!*\
  !*** external "request-promise" ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("request-promise");

/***/ }),

/***/ "request-promise/errors":
/*!*****************************************!*\
  !*** external "request-promise/errors" ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("request-promise/errors");

/***/ }),

/***/ "terriajs-ogr2ogr":
/*!***********************************!*\
  !*** external "terriajs-ogr2ogr" ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("terriajs-ogr2ogr");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("url");

/***/ }),

/***/ "when":
/*!***********************!*\
  !*** external "when" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("when");

/***/ }),

/***/ "yargs":
/*!************************!*\
  !*** external "yargs" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("yargs");

/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vYXBwL2luZGV4LmpzIiwid2VicGFjazovLy9leHRlcm5hbCBcImF3cy1zZGtcIiIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJiYXNlLXhcIiIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJiYXNpYy1hdXRoXCIiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIFwiYm9keS1wYXJzZXJcIiIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJjbHVzdGVyXCIiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIFwiY29tcHJlc3Npb25cIiIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJjb3JzXCIiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIFwiY3J5cHRvXCIiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIFwiZXhwcmVzc1wiIiwid2VicGFjazovLy9leHRlcm5hbCBcImV4cHJlc3MtYnJ1dGVcIiIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJmb3JtaWRhYmxlXCIiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIFwiZnNcIiIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJodHRwc1wiIiwid2VicGFjazovLy9leHRlcm5hbCBcImpzb241XCIiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIFwibW9yZ2FuXCIiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIFwibXlzcWxcIiIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJuZXRcIiIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJvc1wiIiwid2VicGFjazovLy9leHRlcm5hbCBcInBhdGhcIiIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJwcm9qNFwiIiwid2VicGFjazovLy9leHRlcm5hbCBcInByb2o0anMtZGVmcy9lcHNnXCIiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIFwicmFuZ2VfY2hlY2tcIiIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJyZXF1ZXN0XCIiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIFwicmVxdWVzdC1wcm9taXNlXCIiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIFwicmVxdWVzdC1wcm9taXNlL2Vycm9yc1wiIiwid2VicGFjazovLy9leHRlcm5hbCBcInRlcnJpYWpzLW9ncjJvZ3JcIiIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJ1cmxcIiIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJ3aGVuXCIiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIFwieWFyZ3NcIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxrREFBMEMsZ0NBQWdDO0FBQzFFO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0VBQXdELGtCQUFrQjtBQUMxRTtBQUNBLHlEQUFpRCxjQUFjO0FBQy9EOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpREFBeUMsaUNBQWlDO0FBQzFFLHdIQUFnSCxtQkFBbUIsRUFBRTtBQUNySTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1DQUEyQiwwQkFBMEIsRUFBRTtBQUN2RCx5Q0FBaUMsZUFBZTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4REFBc0QsK0RBQStEOztBQUVySDtBQUNBOzs7QUFHQTtBQUNBOzs7Ozs7Ozs7Ozs7O0FDbEZhOztBQUViOztBQUVBLFNBQVMsbUJBQU8sQ0FBQyxjQUFJO0FBQ3JCLGNBQWMsbUJBQU8sQ0FBQyx3QkFBUztBQUMvQixhQUFhLG1CQUFPLENBQUMsMkNBQWU7QUFDcEMsVUFBVSxtQkFBTyxDQUFDLHFDQUFZOztBQUU5QjtBQUNBLGlCQUFpQjs7QUFFakI7O0FBRUE7QUFDQTtBQUNBOztBQUVBLGlDQUFpQzs7QUFFakM7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLENBQUM7O0FBRUQ7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsQ0FBQztBQUNEO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2Isa0RBQWtELE9BQU87QUFDekQsNkNBQTZDLE9BQU87QUFDcEQ7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLENBQUM7O0FBRUQ7Ozs7Ozs7Ozs7Ozs7QUM3SUEsb0M7Ozs7Ozs7Ozs7O0FDQUEsbUM7Ozs7Ozs7Ozs7O0FDQUEsdUM7Ozs7Ozs7Ozs7O0FDQUEsd0M7Ozs7Ozs7Ozs7O0FDQUEsb0M7Ozs7Ozs7Ozs7O0FDQUEsd0M7Ozs7Ozs7Ozs7O0FDQUEsaUM7Ozs7Ozs7Ozs7O0FDQUEsbUM7Ozs7Ozs7Ozs7O0FDQUEsb0M7Ozs7Ozs7Ozs7O0FDQUEsMEM7Ozs7Ozs7Ozs7O0FDQUEsdUM7Ozs7Ozs7Ozs7O0FDQUEsK0I7Ozs7Ozs7Ozs7O0FDQUEsa0M7Ozs7Ozs7Ozs7O0FDQUEsa0M7Ozs7Ozs7Ozs7O0FDQUEsbUM7Ozs7Ozs7Ozs7O0FDQUEsa0M7Ozs7Ozs7Ozs7O0FDQUEsZ0M7Ozs7Ozs7Ozs7O0FDQUEsK0I7Ozs7Ozs7Ozs7O0FDQUEsaUM7Ozs7Ozs7Ozs7O0FDQUEsa0M7Ozs7Ozs7Ozs7O0FDQUEsOEM7Ozs7Ozs7Ozs7O0FDQUEsd0M7Ozs7Ozs7Ozs7O0FDQUEsb0M7Ozs7Ozs7Ozs7O0FDQUEsNEM7Ozs7Ozs7Ozs7O0FDQUEsbUQ7Ozs7Ozs7Ozs7O0FDQUEsNkM7Ozs7Ozs7Ozs7O0FDQUEsZ0M7Ozs7Ozs7Ozs7O0FDQUEsaUM7Ozs7Ozs7Ozs7O0FDQUEsa0MiLCJmaWxlIjoiY2xpZW50LmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGdldHRlciB9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuIFx0XHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbiBcdFx0fVxuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuIFx0fTtcblxuIFx0Ly8gY3JlYXRlIGEgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XG4gXHQvLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbiBcdC8vIG1vZGUgJiAyOiBtZXJnZSBhbGwgcHJvcGVydGllcyBvZiB2YWx1ZSBpbnRvIHRoZSBuc1xuIFx0Ly8gbW9kZSAmIDQ6IHJldHVybiB2YWx1ZSB3aGVuIGFscmVhZHkgbnMgb2JqZWN0XG4gXHQvLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnQgPSBmdW5jdGlvbih2YWx1ZSwgbW9kZSkge1xuIFx0XHRpZihtb2RlICYgMSkgdmFsdWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKHZhbHVlKTtcbiBcdFx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcbiBcdFx0aWYoKG1vZGUgJiA0KSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmIHZhbHVlLl9fZXNNb2R1bGUpIHJldHVybiB2YWx1ZTtcbiBcdFx0dmFyIG5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG5zLCAnZGVmYXVsdCcsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHZhbHVlIH0pO1xuIFx0XHRpZihtb2RlICYgMiAmJiB0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIGZvcih2YXIga2V5IGluIHZhbHVlKSBfX3dlYnBhY2tfcmVxdWlyZV9fLmQobnMsIGtleSwgZnVuY3Rpb24oa2V5KSB7IHJldHVybiB2YWx1ZVtrZXldOyB9LmJpbmQobnVsbCwga2V5KSk7XG4gXHRcdHJldHVybiBucztcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSBcIi4vYXBwL2luZGV4LmpzXCIpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiBQTFVHSU4gTU9EVUxFIC0gTWFpbiBlbnRyeSBwb2ludCBvZiB0aGUgYXBwbGljYXRpb24gZm9yIHdlYnBhY2sgYnVuZGxpbmcgKi9cblxudmFyIGZzID0gcmVxdWlyZSgnZnMnKTtcbnZhciBjbHVzdGVyID0gcmVxdWlyZSgnY2x1c3RlcicpO1xudmFyIGV4aXN0cyA9IHJlcXVpcmUoJy4vY29yZS9leGlzdHMnKTtcbnZhciBhcHAgPSByZXF1aXJlKCcuL2NvcmUvYXBwJyk7XG5cbnZhciBmcmFtZXdvcmsgPSBuZXcgYXBwKCk7XG5mcmFtZXdvcmsuaW5pdCgpOyAvLyBTdGFydCBhcHBsaWNhdGlvbiAtIEF0IHRoaXMgcG9pbnQgdGhlIGZyYW1ld29yayBzaG91bGQgcmVuZGVyIHRoZSBpbml0aWFsIGJhY2tnb3VuZCBhbmQgYmFja2VuZCBhZG1pbmlzdHJhdGlvbiB3ZWJwYWdlcy4gXG5cbi8vIEV4YW1wbGUgZnJhbWV3b3JrIGNhbGxzXG5cbi8vIHZhciB0ZXJyaWFqcyA9IHJlcXVpcmUoJ3RlcnJpYWpzJyk7XG4vLyB2YXIgbGliID0gbmV3IHRlcnJpYWpzKCk7XG4vLyB2YXIgY2F0YWxvZyA9IGxpYi5jYXRhbG9nO1xuXG4vLyBmcmFtZXdvcmsubG9hZE1vZHVsZShjYXRhbG9nKTsgLy8gTGF6eSBsb2FkaW5nLCBicm93c2VyIHdpbGwgb25seSBsb2FkIGphdmFzY3JpcHQgbW9kdWxlIGZpbGVzIHRoYXQgaXMgbG9hZGVkIHZpYSB0aGlzIGZ1bmN0aW9uIGludG8gdGhlIGZyYW1ld29yayBhbmQgZGlzcGxheXMgaXQuXG5cbi8qIFNUQVRVUzogSW50ZWdyYXRpb24gLSBUZXJyaWFKUyBleGFtcGxlIHVzYWdlIGZyb20gVGVycmlhTWFwXG5cbnZhciB0ZXJyaWFPcHRpb25zID0ge1xuICAgIGJhc2VVcmw6ICdkaXN0L1RlcnJpYUpTJ1xufTtcblxuaW1wb3J0IEdvb2dsZUFuYWx5dGljcyBmcm9tICd0ZXJyaWFqcy9saWIvQ29yZS9Hb29nbGVBbmFseXRpY3MnO1xuaW1wb3J0IFNoYXJlRGF0YVNlcnZpY2UgZnJvbSAndGVycmlhanMvbGliL01vZGVscy9TaGFyZURhdGFTZXJ2aWNlJztcbmltcG9ydCByYWlzZUVycm9yVG9Vc2VyIGZyb20gJ3RlcnJpYWpzL2xpYi9Nb2RlbHMvcmFpc2VFcnJvclRvVXNlcic7XG5pbXBvcnQgcmVnaXN0ZXJBbmFseXRpY3MgZnJvbSAndGVycmlhanMvbGliL01vZGVscy9yZWdpc3RlckFuYWx5dGljcyc7XG5pbXBvcnQgcmVnaXN0ZXJDYXRhbG9nTWVtYmVycyBmcm9tICd0ZXJyaWFqcy9saWIvTW9kZWxzL3JlZ2lzdGVyQ2F0YWxvZ01lbWJlcnMnO1xuaW1wb3J0IHJlZ2lzdGVyQ3VzdG9tQ29tcG9uZW50VHlwZXMgZnJvbSAndGVycmlhanMvbGliL1JlYWN0Vmlld3MvQ3VzdG9tL3JlZ2lzdGVyQ3VzdG9tQ29tcG9uZW50VHlwZXMnO1xuaW1wb3J0IFRlcnJpYSBmcm9tICd0ZXJyaWFqcy9saWIvTW9kZWxzL1RlcnJpYSc7XG5pbXBvcnQgdXBkYXRlQXBwbGljYXRpb25Pbkhhc2hDaGFuZ2UgZnJvbSAndGVycmlhanMvbGliL1ZpZXdNb2RlbHMvdXBkYXRlQXBwbGljYXRpb25Pbkhhc2hDaGFuZ2UnO1xuaW1wb3J0IHVwZGF0ZUFwcGxpY2F0aW9uT25NZXNzYWdlRnJvbVBhcmVudFdpbmRvdyBmcm9tICd0ZXJyaWFqcy9saWIvVmlld01vZGVscy91cGRhdGVBcHBsaWNhdGlvbk9uTWVzc2FnZUZyb21QYXJlbnRXaW5kb3cnO1xuaW1wb3J0IFZpZXdTdGF0ZSBmcm9tICd0ZXJyaWFqcy9saWIvUmVhY3RWaWV3TW9kZWxzL1ZpZXdTdGF0ZSc7XG5pbXBvcnQgQmluZ01hcHNTZWFyY2hQcm92aWRlclZpZXdNb2RlbCBmcm9tICd0ZXJyaWFqcy9saWIvVmlld01vZGVscy9CaW5nTWFwc1NlYXJjaFByb3ZpZGVyVmlld01vZGVsLmpzJztcbmltcG9ydCBHYXpldHRlZXJTZWFyY2hQcm92aWRlclZpZXdNb2RlbCBmcm9tICd0ZXJyaWFqcy9saWIvVmlld01vZGVscy9HYXpldHRlZXJTZWFyY2hQcm92aWRlclZpZXdNb2RlbC5qcyc7XG5pbXBvcnQgR25hZlNlYXJjaFByb3ZpZGVyVmlld01vZGVsIGZyb20gJ3RlcnJpYWpzL2xpYi9WaWV3TW9kZWxzL0duYWZTZWFyY2hQcm92aWRlclZpZXdNb2RlbC5qcyc7XG5pbXBvcnQgZGVmaW5lZCBmcm9tICd0ZXJyaWFqcy1jZXNpdW0vU291cmNlL0NvcmUvZGVmaW5lZCc7XG5pbXBvcnQgcmVuZGVyIGZyb20gJy4vYXBwL2xpYi9WaWV3cy9yZW5kZXInO1xuXG4vLyBSZWdpc3RlciBhbGwgdHlwZXMgb2YgY2F0YWxvZyBtZW1iZXJzIGluIHRoZSBjb3JlIFRlcnJpYUpTLiAgSWYgeW91IG9ubHkgd2FudCB0byByZWdpc3RlciBhIHN1YnNldCBvZiB0aGVtXG4vLyAoaS5lLiB0byByZWR1Y2UgdGhlIHNpemUgb2YgeW91ciBhcHBsaWNhdGlvbiBpZiB5b3UgZG9uJ3QgYWN0dWFsbHkgdXNlIHRoZW0gYWxsKSwgZmVlbCBmcmVlIHRvIGNvcHkgYSBzdWJzZXQgb2Zcbi8vIHRoZSBjb2RlIGluIHRoZSByZWdpc3RlckNhdGFsb2dNZW1iZXJzIGZ1bmN0aW9uIGhlcmUgaW5zdGVhZC5cbnJlZ2lzdGVyQ2F0YWxvZ01lbWJlcnMoKTtcbnJlZ2lzdGVyQW5hbHl0aWNzKCk7XG5cbnRlcnJpYU9wdGlvbnMuYW5hbHl0aWNzID0gbmV3IEdvb2dsZUFuYWx5dGljcygpO1xuXG4vLyBDb25zdHJ1Y3QgdGhlIFRlcnJpYUpTIGFwcGxpY2F0aW9uLCBhcnJhbmdlIHRvIHNob3cgZXJyb3JzIHRvIHRoZSB1c2VyLCBhbmQgc3RhcnQgaXQgdXAuXG52YXIgdGVycmlhID0gbmV3IFRlcnJpYSh0ZXJyaWFPcHRpb25zKTtcblxuLy8gUmVnaXN0ZXIgY3VzdG9tIGNvbXBvbmVudHMgaW4gdGhlIGNvcmUgVGVycmlhSlMuICBJZiB5b3Ugb25seSB3YW50IHRvIHJlZ2lzdGVyIGEgc3Vic2V0IG9mIHRoZW0sIG9yIHRvIGFkZCB5b3VyIG93bixcbi8vIGluc2VydCB5b3VyIGN1c3RvbSB2ZXJzaW9uIG9mIHRoZSBjb2RlIGluIHRoZSByZWdpc3RlckN1c3RvbUNvbXBvbmVudFR5cGVzIGZ1bmN0aW9uIGhlcmUgaW5zdGVhZC5cbnJlZ2lzdGVyQ3VzdG9tQ29tcG9uZW50VHlwZXModGVycmlhKTtcblxuLy8gQ3JlYXRlIHRoZSBWaWV3U3RhdGUgYmVmb3JlIHRlcnJpYS5zdGFydCBzbyB0aGF0IGVycm9ycyBoYXZlIHNvbWV3aGVyZSB0byBnby5cbmNvbnN0IHZpZXdTdGF0ZSA9IG5ldyBWaWV3U3RhdGUoe1xuICAgIHRlcnJpYTogdGVycmlhXG59KTtcblxuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSBcImRldmVsb3BtZW50XCIpIHtcbiAgICB3aW5kb3cudmlld1N0YXRlID0gdmlld1N0YXRlO1xufVxuXG4vLyBJZiB3ZSdyZSBydW5uaW5nIGluIGRldiBtb2RlLCBkaXNhYmxlIHRoZSBidWlsdCBzdHlsZSBzaGVldCBhcyB3ZSdsbCBiZSB1c2luZyB0aGUgd2VicGFjayBzdHlsZSBsb2FkZXIuXG4vLyBOb3RlIHRoYXQgaWYgdGhlIGZpcnN0IHN0eWxlc2hlZXQgc3RvcHMgYmVpbmcgbmF0aW9uYWxtYXAuY3NzIHRoZW4gdGhpcyB3aWxsIGhhdmUgdG8gY2hhbmdlLlxuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIiAmJiBtb2R1bGUuaG90KSB7XG4gICAgZG9jdW1lbnQuc3R5bGVTaGVldHNbMF0uZGlzYWJsZWQgPSB0cnVlO1xufVxuXG50ZXJyaWEuc3RhcnQoe1xuICAgIC8vIElmIHlvdSBkb24ndCB3YW50IHRoZSB1c2VyIHRvIGJlIGFibGUgdG8gY29udHJvbCBjYXRhbG9nIGxvYWRpbmcgdmlhIHRoZSBVUkwsIHJlbW92ZSB0aGUgYXBwbGljYXRpb25VcmwgcHJvcGVydHkgYmVsb3dcbiAgICAvLyBhcyB3ZWxsIGFzIHRoZSBjYWxsIHRvIFwidXBkYXRlQXBwbGljYXRpb25Pbkhhc2hDaGFuZ2VcIiBmdXJ0aGVyIGRvd24uXG4gICAgYXBwbGljYXRpb25Vcmw6IHdpbmRvdy5sb2NhdGlvbixcbiAgICBjb25maWdVcmw6ICdjb25maWcuanNvbicsXG4gICAgc2hhcmVEYXRhU2VydmljZTogbmV3IFNoYXJlRGF0YVNlcnZpY2Uoe1xuICAgICAgICB0ZXJyaWE6IHRlcnJpYVxuICAgIH0pXG59KS5vdGhlcndpc2UoZnVuY3Rpb24oZSkge1xuICAgIHJhaXNlRXJyb3JUb1VzZXIodGVycmlhLCBlKTtcbn0pLmFsd2F5cyhmdW5jdGlvbigpIHtcbiAgICB0cnkge1xuICAgICAgICB2aWV3U3RhdGUuc2VhcmNoU3RhdGUubG9jYXRpb25TZWFyY2hQcm92aWRlcnMgPSBbXG4gICAgICAgICAgICBuZXcgQmluZ01hcHNTZWFyY2hQcm92aWRlclZpZXdNb2RlbCh7XG4gICAgICAgICAgICAgICAgdGVycmlhOiB0ZXJyaWEsXG4gICAgICAgICAgICAgICAga2V5OiB0ZXJyaWEuY29uZmlnUGFyYW1ldGVycy5iaW5nTWFwc0tleVxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgR2F6ZXR0ZWVyU2VhcmNoUHJvdmlkZXJWaWV3TW9kZWwoe3RlcnJpYX0pLFxuICAgICAgICAgICAgbmV3IEduYWZTZWFyY2hQcm92aWRlclZpZXdNb2RlbCh7dGVycmlhfSlcbiAgICAgICAgXTtcblxuICAgICAgICAvLyBBdXRvbWF0aWNhbGx5IHVwZGF0ZSBUZXJyaWEgKGxvYWQgbmV3IGNhdGFsb2dzLCBldGMuKSB3aGVuIHRoZSBoYXNoIHBhcnQgb2YgdGhlIFVSTCBjaGFuZ2VzLlxuICAgICAgICB1cGRhdGVBcHBsaWNhdGlvbk9uSGFzaENoYW5nZSh0ZXJyaWEsIHdpbmRvdyk7XG4gICAgICAgIHVwZGF0ZUFwcGxpY2F0aW9uT25NZXNzYWdlRnJvbVBhcmVudFdpbmRvdyh0ZXJyaWEsIHdpbmRvdyk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSB2YXJpb3VzIGJhc2UgbWFwIG9wdGlvbnMuXG4gICAgICAgIHZhciBjcmVhdGVBdXN0cmFsaWFCYXNlTWFwT3B0aW9ucyA9IHJlcXVpcmUoJ3RlcnJpYWpzL2xpYi9WaWV3TW9kZWxzL2NyZWF0ZUF1c3RyYWxpYUJhc2VNYXBPcHRpb25zJyk7XG4gICAgICAgIHZhciBjcmVhdGVHbG9iYWxCYXNlTWFwT3B0aW9ucyA9IHJlcXVpcmUoJ3RlcnJpYWpzL2xpYi9WaWV3TW9kZWxzL2NyZWF0ZUdsb2JhbEJhc2VNYXBPcHRpb25zJyk7XG4gICAgICAgIHZhciBzZWxlY3RCYXNlTWFwID0gcmVxdWlyZSgndGVycmlhanMvbGliL1ZpZXdNb2RlbHMvc2VsZWN0QmFzZU1hcCcpO1xuXG4gICAgICAgIHZhciBhdXN0cmFsaWFCYXNlTWFwcyA9IGNyZWF0ZUF1c3RyYWxpYUJhc2VNYXBPcHRpb25zKHRlcnJpYSk7XG4gICAgICAgIHZhciBnbG9iYWxCYXNlTWFwcyA9IGNyZWF0ZUdsb2JhbEJhc2VNYXBPcHRpb25zKHRlcnJpYSwgdGVycmlhLmNvbmZpZ1BhcmFtZXRlcnMuYmluZ01hcHNLZXkpO1xuXG4gICAgICAgIHZhciBhbGxCYXNlTWFwcyA9IGF1c3RyYWxpYUJhc2VNYXBzLmNvbmNhdChnbG9iYWxCYXNlTWFwcyk7XG4gICAgICAgIHNlbGVjdEJhc2VNYXAodGVycmlhLCBhbGxCYXNlTWFwcywgJ0JpbmcgTWFwcyBBZXJpYWwgd2l0aCBMYWJlbHMnLCB0cnVlKTtcblxuICAgICAgICAvLyBTaG93IGEgbW9kYWwgZGlzY2xhaW1lciBiZWZvcmUgdXNlciBjYW4gZG8gYW55dGhpbmcgZWxzZS5cbiAgICAgICAgaWYgKGRlZmluZWQodGVycmlhLmNvbmZpZ1BhcmFtZXRlcnMuZ2xvYmFsRGlzY2xhaW1lcikpIHtcbiAgICAgICAgICAgIHZhciBnbG9iYWxEaXNjbGFpbWVyID0gdGVycmlhLmNvbmZpZ1BhcmFtZXRlcnMuZ2xvYmFsRGlzY2xhaW1lcjtcbiAgICAgICAgICAgIHZhciBob3N0bmFtZSA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZTtcbiAgICAgICAgICAgIGlmIChnbG9iYWxEaXNjbGFpbWVyLmVuYWJsZU9uTG9jYWxob3N0IHx8IGhvc3RuYW1lLmluZGV4T2YoJ2xvY2FsaG9zdCcpID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHZhciBtZXNzYWdlID0gJyc7XG4gICAgICAgICAgICAgICAgLy8gU29tZXRpbWVzIHdlIHdhbnQgdG8gc2hvdyBhIHByZWFtYmxlIGlmIHRoZSB1c2VyIGlzIHZpZXdpbmcgYSBzaXRlIG90aGVyIHRoYW4gdGhlIG9mZmljaWFsIHByb2R1Y3Rpb24gaW5zdGFuY2UuXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBjYW4gYmUgZXhwcmVzc2VkIGFzIGEgZGV2SG9zdFJlZ2V4IChcImFueSBzaXRlIHN0YXJ0aW5nIHdpdGggc3RhZ2luZy5cIikgb3IgYSBuZWdhdGl2ZSBwcm9kSG9zdFJlZ2V4IChcImFueSBzaXRlIG5vdCBlbmRpbmcgaW4gLmdvdi5hdVwiKVxuICAgICAgICAgICAgICAgIGlmIChkZWZpbmVkKGdsb2JhbERpc2NsYWltZXIuZGV2SG9zdFJlZ2V4KSAmJiBob3N0bmFtZS5tYXRjaChnbG9iYWxEaXNjbGFpbWVyLmRldkhvc3RSZWdleCkgfHxcbiAgICAgICAgICAgICAgICAgICAgZGVmaW5lZChnbG9iYWxEaXNjbGFpbWVyLnByb2RIb3N0UmVnZXgpICYmICFob3N0bmFtZS5tYXRjaChnbG9iYWxEaXNjbGFpbWVyLnByb2RIb3N0UmVnZXgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlICs9IHJlcXVpcmUoJy4vYXBwL2xpYi9WaWV3cy9EZXZlbG9wbWVudERpc2NsYWltZXJQcmVhbWJsZS5odG1sJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG1lc3NhZ2UgKz0gcmVxdWlyZSgnLi9hcHAvbGliL1ZpZXdzL0dsb2JhbERpc2NsYWltZXIuaHRtbCcpO1xuXG4gICAgICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAoZ2xvYmFsRGlzY2xhaW1lci50aXRsZSAhPT0gdW5kZWZpbmVkKSA/IGdsb2JhbERpc2NsYWltZXIudGl0bGUgOiAnV2FybmluZycsXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpcm1UZXh0OiAoZ2xvYmFsRGlzY2xhaW1lci5idXR0b25UaXRsZSB8fCBcIk9rXCIpLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogNjAwLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IDU1MCxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgaG9yaXpvbnRhbFBhZGRpbmcgOiAxMDBcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHZpZXdTdGF0ZS5ub3RpZmljYXRpb25zLnB1c2gob3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZW5kZXIodGVycmlhLCBhbGxCYXNlTWFwcywgdmlld1N0YXRlKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayk7XG4gICAgfVxufSk7XG5cbiovXG5cbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImF3cy1zZGtcIik7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiYmFzZS14XCIpOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImJhc2ljLWF1dGhcIik7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiYm9keS1wYXJzZXJcIik7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiY2x1c3RlclwiKTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJjb21wcmVzc2lvblwiKTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJjb3JzXCIpOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImNyeXB0b1wiKTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJleHByZXNzXCIpOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImV4cHJlc3MtYnJ1dGVcIik7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiZm9ybWlkYWJsZVwiKTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJmc1wiKTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJodHRwc1wiKTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJqc29uNVwiKTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJtb3JnYW5cIik7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwibXlzcWxcIik7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwibmV0XCIpOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIm9zXCIpOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcInBhdGhcIik7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwicHJvajRcIik7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwicHJvajRqcy1kZWZzL2Vwc2dcIik7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwicmFuZ2VfY2hlY2tcIik7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwicmVxdWVzdFwiKTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJyZXF1ZXN0LXByb21pc2VcIik7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwicmVxdWVzdC1wcm9taXNlL2Vycm9yc1wiKTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJ0ZXJyaWFqcy1vZ3Iyb2dyXCIpOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcInVybFwiKTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJ3aGVuXCIpOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcInlhcmdzXCIpOyJdLCJzb3VyY2VSb290IjoiIn0=