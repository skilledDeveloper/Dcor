/**********************************************************
	Dcor.js - JavaScript function decoration based on AOP
	
	A simple JavaScript library for decorating functions with common and useful cross-cutting concerns like 
	logging, authorization, caching, etc. 
	It is heavily based on closures and functional aspects of JavaScript.

	Alan Zavari 
	May 2014
	
	Note: While the library has been tested in browser, 
	      it's not tested on Node.js yet.
		  
	Dcor predefined aspects:
		logged: Allows logging function calls along with the passed arguments and the return values
		secured: Secures a function by ignoring (or breaking) unauthorized calls 
		cached: Stores the function return value to cache (memory) and use it for later calls
		performanceLogged: Measures the runtime duration of the function
		singleton: Makes the function singleton. All future instances will be the same.
		safeConstructor: Protects constructor functions against NOT using `new`. Any call will be considered as an instantiation. 
		async: Makes synchronous functions asynchronous to prevent UI blocking
		
***********************************************************/

(function (global, exporter) {

    // export
    if (typeof module !== 'undefined') {
        module.exports = exporter(); //Node.js
    } else {
        global.Dcor = exporter(); //browser
    }

})(this, function () {
    var undefined, //Guard against variable named "undefined" being declared in global context.
    Dcor = {
        name: "Dcor.js",
        version: "1.0"
    };

    Dcor.decorate = function (fnNamePattern, decors, namespaces) {
        //TODO: check for duplicate decors
        //no namespaces: global ns
        if (!namespaces || namespaces.length === 0) namespaces = [(function () {
            return this;
        }).call()]; //doesn't work in strict mode

        //iterate over all namespaces 
        namespaces.forEach(function (ns) {
            for (var key in ns) {
                if (key == "localStorage" || key == "sessionStorage" || key == "caches") continue; //prevent causing error when running locally (for testing)
                if (typeof ns[key] == 'function' && ns.hasOwnProperty(key) && key.match(fnNamePattern)) {
                    decors.forEach(function (decor) {
                        appyDecor(ns[key], key, decor, ns);
                        console.log(key);
                    });
                }
            }
        });
    };

    Dcor.dedecorate = null; //TODO: remove decors from functions


    function appyDecor(fn, fnName, decor, ns) {
        fn.__decoratedWith = decor; //for informational purposes
        ns[fnName] = decorFactory(fn, fnName, decor, ns); //overwrite original function with proper wrapper function
        ns[fnName].__fnName = fnName;
        ns[fnName].__fn = fn;
        ns[fnName].__decoratedWith = fn.__decoratedWith;

        //__fnOriginal is always the original function. 
        //it's only used to be passed to callbacks for informational purposes
        if (fn.__fnOriginal) ns[fnName].__fnOriginal = fn.__fnOriginal;
        else {
            ns[fnName].__fnOriginal = fn;
            fn.__fnOriginal = fn; //for the original function itself
        }
    }

    function decorFactory(fn, fnName, decor, ns) {
        if (decor.type === "logged") {
            return function () {
                //logged
                //var result = ns[fnName].__fn.apply(this, arguments);
                var result = fn.apply(this, arguments);
                if (decor.callback) decor.callback(fnName, arguments, result, fn.__fnOriginal.toString(), ns);
                return result;
            };

        } else if (decor.type === "secured") {
            return function () {
                //secured
                if (!decor.callback || (decor.callback && decor.callback(fnName, arguments, null, fn.__fnOriginal.toString(), ns))) return fn.apply(this, arguments); //authorized to run function
            };

        } else if (decor.type === "cached") {
            return function () {
                //cached
                fn.__cache = fn.__cache || {};
                //var argsStr = Array.prototype.slice.call(arguments).join(",");
                var argsStr = ""; //no arguments
                for (var i = 0; i < arguments.length; i++) {
                    if (typeof arguments[i] == "object") argsStr += JSON.stringify(arguments[i]) + ",";
                    else argsStr += arguments[i].toString() + ",";
                }

                if (fn.__cache[argsStr] != null) {
                    if (decor.callback) decor.callback(true, fnName, arguments, fn.__cache[argsStr], fn.__fnOriginal.toString(), ns);
                    return fn.__cache[argsStr];
                } else {
                    var result = fn.apply(this, arguments);
                    if (decor.callback) decor.callback(false, fnName, arguments, result, fn.__fnOriginal.toString(), ns);
                    return fn.__cache[argsStr] = result;
                }
            };

        } else if (decor.type === "performanceLogged") {
            return function () {
                //performanceLogged
                var startTime = (new Date()).getTime(),
                    result = fn.apply(this, arguments),
                    duration = (new Date()).getTime() - startTime;
                if (decor.callback) decor.callback(duration, fnName, arguments, result, fn.__fnOriginal.toString(), ns);
                return result;
            };
        } else if (decor.type === "singleton") {
            return function () {
                //singleton
                if (fn.__singletonInstance) return fn.__singletonInstance;
                fn.__singletonInstance = this;
                return fn.apply(this, arguments);
            };
        } else if (decor.type === "safeConstructor") { //'new' keyword will be used even if the function is called normally
            return function () {
                //safeConstructor
                if (!(this instanceof fn)) //called as a function (without 'new')
                return new(Function.prototype.bind.apply(fn, Array.prototype.concat.apply([null], arguments)));
                else //instanciated with 'new' keyword
                return fn.apply(this, arguments);
            };
        } else if (decor.type === "async") {
            return function () {
                //async
                var that = this,
                    args = arguments;
                setTimeout(function () {
                    var result = fn.apply(that, args);
                    if (decor.callback) decor.callback(fnName, args, result, fn.__fnOriginal.toString(), ns);
                }, 0);
            };
        }
    }

    //easy-access functions with predefined decor types
    Dcor.logged = function (fnNamePattern, decorCallback, namespaces) {
        return Dcor.decorate(fnNamePattern, [{
            type: "logged",
            callback: decorCallback
        }], namespaces);
    };

    Dcor.secured = function (fnNamePattern, decorCallback, namespaces) {
        return Dcor.decorate(fnNamePattern, [{
            type: "secured",
            callback: decorCallback
        }], namespaces);
    };

    Dcor.cached = function (fnNamePattern, decorCallback, namespaces) {
        return Dcor.decorate(fnNamePattern, [{
            type: "cached",
            callback: decorCallback
        }], namespaces);
    };

    Dcor.performanceLogged = function (fnNamePattern, decorCallback, namespaces) {
        return Dcor.decorate(fnNamePattern, [{
            type: "performanceLogged",
            callback: decorCallback
        }], namespaces);
    };

    Dcor.singleton = function (fnNamePattern, decorCallback, namespaces) {
        return Dcor.decorate(fnNamePattern, [{
            type: "singleton",
            callback: decorCallback
        }], namespaces);
    };

    Dcor.safeConstructor = function (fnNamePattern, decorCallback, namespaces) {
        return Dcor.decorate(fnNamePattern, [{
            type: "safeConstructor",
            callback: decorCallback
        }], namespaces);
    };

    Dcor.async = function (fnNamePattern, decorCallback, namespaces) {
        return Dcor.decorate(fnNamePattern, [{
            type: "async",
            callback: decorCallback
        }], namespaces);
    };

    return Dcor;
});
