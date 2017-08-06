/*
	© 2016 NetSuite Inc.
	User may not copy, modify, distribute, or re-bundle or otherwise make available this code;
	provided, however, if you are an authorized user with a NetSuite account or log-in, you
	may use this code subject to the terms that govern your access and use.
*/

__sc_ssplibraries_t0 = new Date().getTime(); 
release_metadata = {"name":"SuiteCommerce Advanced Vinson","bundle_id":"","baselabel":"SCA_Vinson","version":"Vinson","datelabel":"2016.00.00","buildno":"0"}
/**
 * @license almond 0.3.0 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

(function () {
    var root = this;
    var previousUnderscore = root._;
    var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;
    var push = ArrayProto.push, slice = ArrayProto.slice, concat = ArrayProto.concat, toString = ObjProto.toString, hasOwnProperty = ObjProto.hasOwnProperty;
    var nativeIsArray = Array.isArray, nativeKeys = Object.keys, nativeBind = FuncProto.bind;
    var _ = function (obj) {
        if (obj instanceof _)
            return obj;
        if (!(this instanceof _))
            return new _(obj);
        this._wrapped = obj;
    };
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = _;
        }
        exports._ = _;
    } else {
        root._ = _;
    }
    _.VERSION = '1.7.0';
    var createCallback = function (func, context, argCount) {
        if (context === void 0)
            return func;
        switch (argCount == null ? 3 : argCount) {
        case 1:
            return function (value) {
                return func.call(context, value);
            };
        case 2:
            return function (value, other) {
                return func.call(context, value, other);
            };
        case 3:
            return function (value, index, collection) {
                return func.call(context, value, index, collection);
            };
        case 4:
            return function (accumulator, value, index, collection) {
                return func.call(context, accumulator, value, index, collection);
            };
        }
        return function () {
            return func.apply(context, arguments);
        };
    };
    _.iteratee = function (value, context, argCount) {
        if (value == null)
            return _.identity;
        if (_.isFunction(value))
            return createCallback(value, context, argCount);
        if (_.isObject(value))
            return _.matches(value);
        return _.property(value);
    };
    _.each = _.forEach = function (obj, iteratee, context) {
        if (obj == null)
            return obj;
        iteratee = createCallback(iteratee, context);
        var i, length = obj.length;
        if (length === +length) {
            for (i = 0; i < length; i++) {
                iteratee(obj[i], i, obj);
            }
        } else {
            var keys = _.keys(obj);
            for (i = 0, length = keys.length; i < length; i++) {
                iteratee(obj[keys[i]], keys[i], obj);
            }
        }
        return obj;
    };
    _.map = _.collect = function (obj, iteratee, context) {
        if (obj == null)
            return [];
        iteratee = _.iteratee(iteratee, context);
        var keys = obj.length !== +obj.length && _.keys(obj), length = (keys || obj).length, results = Array(length), currentKey;
        for (var index = 0; index < length; index++) {
            currentKey = keys ? keys[index] : index;
            results[index] = iteratee(obj[currentKey], currentKey, obj);
        }
        return results;
    };
    var reduceError = 'Reduce of empty array with no initial value';
    _.reduce = _.foldl = _.inject = function (obj, iteratee, memo, context) {
        if (obj == null)
            obj = [];
        iteratee = createCallback(iteratee, context, 4);
        var keys = obj.length !== +obj.length && _.keys(obj), length = (keys || obj).length, index = 0, currentKey;
        if (arguments.length < 3) {
            if (!length)
                throw new TypeError(reduceError);
            memo = obj[keys ? keys[index++] : index++];
        }
        for (; index < length; index++) {
            currentKey = keys ? keys[index] : index;
            memo = iteratee(memo, obj[currentKey], currentKey, obj);
        }
        return memo;
    };
    _.reduceRight = _.foldr = function (obj, iteratee, memo, context) {
        if (obj == null)
            obj = [];
        iteratee = createCallback(iteratee, context, 4);
        var keys = obj.length !== +obj.length && _.keys(obj), index = (keys || obj).length, currentKey;
        if (arguments.length < 3) {
            if (!index)
                throw new TypeError(reduceError);
            memo = obj[keys ? keys[--index] : --index];
        }
        while (index--) {
            currentKey = keys ? keys[index] : index;
            memo = iteratee(memo, obj[currentKey], currentKey, obj);
        }
        return memo;
    };
    _.find = _.detect = function (obj, predicate, context) {
        var result;
        predicate = _.iteratee(predicate, context);
        _.some(obj, function (value, index, list) {
            if (predicate(value, index, list)) {
                result = value;
                return true;
            }
        });
        return result;
    };
    _.filter = _.select = function (obj, predicate, context) {
        var results = [];
        if (obj == null)
            return results;
        predicate = _.iteratee(predicate, context);
        _.each(obj, function (value, index, list) {
            if (predicate(value, index, list))
                results.push(value);
        });
        return results;
    };
    _.reject = function (obj, predicate, context) {
        return _.filter(obj, _.negate(_.iteratee(predicate)), context);
    };
    _.every = _.all = function (obj, predicate, context) {
        if (obj == null)
            return true;
        predicate = _.iteratee(predicate, context);
        var keys = obj.length !== +obj.length && _.keys(obj), length = (keys || obj).length, index, currentKey;
        for (index = 0; index < length; index++) {
            currentKey = keys ? keys[index] : index;
            if (!predicate(obj[currentKey], currentKey, obj))
                return false;
        }
        return true;
    };
    _.some = _.any = function (obj, predicate, context) {
        if (obj == null)
            return false;
        predicate = _.iteratee(predicate, context);
        var keys = obj.length !== +obj.length && _.keys(obj), length = (keys || obj).length, index, currentKey;
        for (index = 0; index < length; index++) {
            currentKey = keys ? keys[index] : index;
            if (predicate(obj[currentKey], currentKey, obj))
                return true;
        }
        return false;
    };
    _.contains = _.include = function (obj, target) {
        if (obj == null)
            return false;
        if (obj.length !== +obj.length)
            obj = _.values(obj);
        return _.indexOf(obj, target) >= 0;
    };
    _.invoke = function (obj, method) {
        var args = slice.call(arguments, 2);
        var isFunc = _.isFunction(method);
        return _.map(obj, function (value) {
            return (isFunc ? method : value[method]).apply(value, args);
        });
    };
    _.pluck = function (obj, key) {
        return _.map(obj, _.property(key));
    };
    _.where = function (obj, attrs) {
        return _.filter(obj, _.matches(attrs));
    };
    _.findWhere = function (obj, attrs) {
        return _.find(obj, _.matches(attrs));
    };
    _.max = function (obj, iteratee, context) {
        var result = -Infinity, lastComputed = -Infinity, value, computed;
        if (iteratee == null && obj != null) {
            obj = obj.length === +obj.length ? obj : _.values(obj);
            for (var i = 0, length = obj.length; i < length; i++) {
                value = obj[i];
                if (value > result) {
                    result = value;
                }
            }
        } else {
            iteratee = _.iteratee(iteratee, context);
            _.each(obj, function (value, index, list) {
                computed = iteratee(value, index, list);
                if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
                    result = value;
                    lastComputed = computed;
                }
            });
        }
        return result;
    };
    _.min = function (obj, iteratee, context) {
        var result = Infinity, lastComputed = Infinity, value, computed;
        if (iteratee == null && obj != null) {
            obj = obj.length === +obj.length ? obj : _.values(obj);
            for (var i = 0, length = obj.length; i < length; i++) {
                value = obj[i];
                if (value < result) {
                    result = value;
                }
            }
        } else {
            iteratee = _.iteratee(iteratee, context);
            _.each(obj, function (value, index, list) {
                computed = iteratee(value, index, list);
                if (computed < lastComputed || computed === Infinity && result === Infinity) {
                    result = value;
                    lastComputed = computed;
                }
            });
        }
        return result;
    };
    _.shuffle = function (obj) {
        var set = obj && obj.length === +obj.length ? obj : _.values(obj);
        var length = set.length;
        var shuffled = Array(length);
        for (var index = 0, rand; index < length; index++) {
            rand = _.random(0, index);
            if (rand !== index)
                shuffled[index] = shuffled[rand];
            shuffled[rand] = set[index];
        }
        return shuffled;
    };
    _.sample = function (obj, n, guard) {
        if (n == null || guard) {
            if (obj.length !== +obj.length)
                obj = _.values(obj);
            return obj[_.random(obj.length - 1)];
        }
        return _.shuffle(obj).slice(0, Math.max(0, n));
    };
    _.sortBy = function (obj, iteratee, context) {
        iteratee = _.iteratee(iteratee, context);
        return _.pluck(_.map(obj, function (value, index, list) {
            return {
                value: value,
                index: index,
                criteria: iteratee(value, index, list)
            };
        }).sort(function (left, right) {
            var a = left.criteria;
            var b = right.criteria;
            if (a !== b) {
                if (a > b || a === void 0)
                    return 1;
                if (a < b || b === void 0)
                    return -1;
            }
            return left.index - right.index;
        }), 'value');
    };
    var group = function (behavior) {
        return function (obj, iteratee, context) {
            var result = {};
            iteratee = _.iteratee(iteratee, context);
            _.each(obj, function (value, index) {
                var key = iteratee(value, index, obj);
                behavior(result, value, key);
            });
            return result;
        };
    };
    _.groupBy = group(function (result, value, key) {
        if (_.has(result, key))
            result[key].push(value);
        else
            result[key] = [value];
    });
    _.indexBy = group(function (result, value, key) {
        result[key] = value;
    });
    _.countBy = group(function (result, value, key) {
        if (_.has(result, key))
            result[key]++;
        else
            result[key] = 1;
    });
    _.sortedIndex = function (array, obj, iteratee, context) {
        iteratee = _.iteratee(iteratee, context, 1);
        var value = iteratee(obj);
        var low = 0, high = array.length;
        while (low < high) {
            var mid = low + high >>> 1;
            if (iteratee(array[mid]) < value)
                low = mid + 1;
            else
                high = mid;
        }
        return low;
    };
    _.toArray = function (obj) {
        if (!obj)
            return [];
        if (_.isArray(obj))
            return slice.call(obj);
        if (obj.length === +obj.length)
            return _.map(obj, _.identity);
        return _.values(obj);
    };
    _.size = function (obj) {
        if (obj == null)
            return 0;
        return obj.length === +obj.length ? obj.length : _.keys(obj).length;
    };
    _.partition = function (obj, predicate, context) {
        predicate = _.iteratee(predicate, context);
        var pass = [], fail = [];
        _.each(obj, function (value, key, obj) {
            (predicate(value, key, obj) ? pass : fail).push(value);
        });
        return [
            pass,
            fail
        ];
    };
    _.first = _.head = _.take = function (array, n, guard) {
        if (array == null)
            return void 0;
        if (n == null || guard)
            return array[0];
        if (n < 0)
            return [];
        return slice.call(array, 0, n);
    };
    _.initial = function (array, n, guard) {
        return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
    };
    _.last = function (array, n, guard) {
        if (array == null)
            return void 0;
        if (n == null || guard)
            return array[array.length - 1];
        return slice.call(array, Math.max(array.length - n, 0));
    };
    _.rest = _.tail = _.drop = function (array, n, guard) {
        return slice.call(array, n == null || guard ? 1 : n);
    };
    _.compact = function (array) {
        return _.filter(array, _.identity);
    };
    var flatten = function (input, shallow, strict, output) {
        if (shallow && _.every(input, _.isArray)) {
            return concat.apply(output, input);
        }
        for (var i = 0, length = input.length; i < length; i++) {
            var value = input[i];
            if (!_.isArray(value) && !_.isArguments(value)) {
                if (!strict)
                    output.push(value);
            } else if (shallow) {
                push.apply(output, value);
            } else {
                flatten(value, shallow, strict, output);
            }
        }
        return output;
    };
    _.flatten = function (array, shallow) {
        return flatten(array, shallow, false, []);
    };
    _.without = function (array) {
        return _.difference(array, slice.call(arguments, 1));
    };
    _.uniq = _.unique = function (array, isSorted, iteratee, context) {
        if (array == null)
            return [];
        if (!_.isBoolean(isSorted)) {
            context = iteratee;
            iteratee = isSorted;
            isSorted = false;
        }
        if (iteratee != null)
            iteratee = _.iteratee(iteratee, context);
        var result = [];
        var seen = [];
        for (var i = 0, length = array.length; i < length; i++) {
            var value = array[i];
            if (isSorted) {
                if (!i || seen !== value)
                    result.push(value);
                seen = value;
            } else if (iteratee) {
                var computed = iteratee(value, i, array);
                if (_.indexOf(seen, computed) < 0) {
                    seen.push(computed);
                    result.push(value);
                }
            } else if (_.indexOf(result, value) < 0) {
                result.push(value);
            }
        }
        return result;
    };
    _.union = function () {
        return _.uniq(flatten(arguments, true, true, []));
    };
    _.intersection = function (array) {
        if (array == null)
            return [];
        var result = [];
        var argsLength = arguments.length;
        for (var i = 0, length = array.length; i < length; i++) {
            var item = array[i];
            if (_.contains(result, item))
                continue;
            for (var j = 1; j < argsLength; j++) {
                if (!_.contains(arguments[j], item))
                    break;
            }
            if (j === argsLength)
                result.push(item);
        }
        return result;
    };
    _.difference = function (array) {
        var rest = flatten(slice.call(arguments, 1), true, true, []);
        return _.filter(array, function (value) {
            return !_.contains(rest, value);
        });
    };
    _.zip = function (array) {
        if (array == null)
            return [];
        var length = _.max(arguments, 'length').length;
        var results = Array(length);
        for (var i = 0; i < length; i++) {
            results[i] = _.pluck(arguments, i);
        }
        return results;
    };
    _.object = function (list, values) {
        if (list == null)
            return {};
        var result = {};
        for (var i = 0, length = list.length; i < length; i++) {
            if (values) {
                result[list[i]] = values[i];
            } else {
                result[list[i][0]] = list[i][1];
            }
        }
        return result;
    };
    _.indexOf = function (array, item, isSorted) {
        if (array == null)
            return -1;
        var i = 0, length = array.length;
        if (isSorted) {
            if (typeof isSorted == 'number') {
                i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
            } else {
                i = _.sortedIndex(array, item);
                return array[i] === item ? i : -1;
            }
        }
        for (; i < length; i++)
            if (array[i] === item)
                return i;
        return -1;
    };
    _.lastIndexOf = function (array, item, from) {
        if (array == null)
            return -1;
        var idx = array.length;
        if (typeof from == 'number') {
            idx = from < 0 ? idx + from + 1 : Math.min(idx, from + 1);
        }
        while (--idx >= 0)
            if (array[idx] === item)
                return idx;
        return -1;
    };
    _.range = function (start, stop, step) {
        if (arguments.length <= 1) {
            stop = start || 0;
            start = 0;
        }
        step = step || 1;
        var length = Math.max(Math.ceil((stop - start) / step), 0);
        var range = Array(length);
        for (var idx = 0; idx < length; idx++, start += step) {
            range[idx] = start;
        }
        return range;
    };
    var Ctor = function () {
    };
    _.bind = function (func, context) {
        var args, bound;
        if (nativeBind && func.bind === nativeBind)
            return nativeBind.apply(func, slice.call(arguments, 1));
        if (!_.isFunction(func))
            throw new TypeError('Bind must be called on a function');
        args = slice.call(arguments, 2);
        bound = function () {
            if (!(this instanceof bound))
                return func.apply(context, args.concat(slice.call(arguments)));
            Ctor.prototype = func.prototype;
            var self = new Ctor();
            Ctor.prototype = null;
            var result = func.apply(self, args.concat(slice.call(arguments)));
            if (_.isObject(result))
                return result;
            return self;
        };
        return bound;
    };
    _.partial = function (func) {
        var boundArgs = slice.call(arguments, 1);
        return function () {
            var position = 0;
            var args = boundArgs.slice();
            for (var i = 0, length = args.length; i < length; i++) {
                if (args[i] === _)
                    args[i] = arguments[position++];
            }
            while (position < arguments.length)
                args.push(arguments[position++]);
            return func.apply(this, args);
        };
    };
    _.bindAll = function (obj) {
        var i, length = arguments.length, key;
        if (length <= 1)
            throw new Error('bindAll must be passed function names');
        for (i = 1; i < length; i++) {
            key = arguments[i];
            obj[key] = _.bind(obj[key], obj);
        }
        return obj;
    };
    _.memoize = function (func, hasher) {
        var memoize = function (key) {
            var cache = memoize.cache;
            var address = hasher ? hasher.apply(this, arguments) : key;
            if (!_.has(cache, address))
                cache[address] = func.apply(this, arguments);
            return cache[address];
        };
        memoize.cache = {};
        return memoize;
    };
    _.delay = function (func, wait) {
        var args = slice.call(arguments, 2);
        return setTimeout(function () {
            return func.apply(null, args);
        }, wait);
    };
    _.defer = function (func) {
        return _.delay.apply(_, [
            func,
            1
        ].concat(slice.call(arguments, 1)));
    };
    _.throttle = function (func, wait, options) {
        var context, args, result;
        var timeout = null;
        var previous = 0;
        if (!options)
            options = {};
        var later = function () {
            previous = options.leading === false ? 0 : _.now();
            timeout = null;
            result = func.apply(context, args);
            if (!timeout)
                context = args = null;
        };
        return function () {
            var now = _.now();
            if (!previous && options.leading === false)
                previous = now;
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0 || remaining > wait) {
                clearTimeout(timeout);
                timeout = null;
                previous = now;
                result = func.apply(context, args);
                if (!timeout)
                    context = args = null;
            } else if (!timeout && options.trailing !== false) {
                timeout = setTimeout(later, remaining);
            }
            return result;
        };
    };
    _.debounce = function (func, wait, immediate) {
        var timeout, args, context, timestamp, result;
        var later = function () {
            var last = _.now() - timestamp;
            if (last < wait && last > 0) {
                timeout = setTimeout(later, wait - last);
            } else {
                timeout = null;
                if (!immediate) {
                    result = func.apply(context, args);
                    if (!timeout)
                        context = args = null;
                }
            }
        };
        return function () {
            context = this;
            args = arguments;
            timestamp = _.now();
            var callNow = immediate && !timeout;
            if (!timeout)
                timeout = setTimeout(later, wait);
            if (callNow) {
                result = func.apply(context, args);
                context = args = null;
            }
            return result;
        };
    };
    _.wrap = function (func, wrapper) {
        return _.partial(wrapper, func);
    };
    _.negate = function (predicate) {
        return function () {
            return !predicate.apply(this, arguments);
        };
    };
    _.compose = function () {
        var args = arguments;
        var start = args.length - 1;
        return function () {
            var i = start;
            var result = args[start].apply(this, arguments);
            while (i--)
                result = args[i].call(this, result);
            return result;
        };
    };
    _.after = function (times, func) {
        return function () {
            if (--times < 1) {
                return func.apply(this, arguments);
            }
        };
    };
    _.before = function (times, func) {
        var memo;
        return function () {
            if (--times > 0) {
                memo = func.apply(this, arguments);
            } else {
                func = null;
            }
            return memo;
        };
    };
    _.once = _.partial(_.before, 2);
    _.keys = function (obj) {
        if (!_.isObject(obj))
            return [];
        if (nativeKeys)
            return nativeKeys(obj);
        var keys = [];
        for (var key in obj)
            if (_.has(obj, key))
                keys.push(key);
        return keys;
    };
    _.values = function (obj) {
        var keys = _.keys(obj);
        var length = keys.length;
        var values = Array(length);
        for (var i = 0; i < length; i++) {
            values[i] = obj[keys[i]];
        }
        return values;
    };
    _.pairs = function (obj) {
        var keys = _.keys(obj);
        var length = keys.length;
        var pairs = Array(length);
        for (var i = 0; i < length; i++) {
            pairs[i] = [
                keys[i],
                obj[keys[i]]
            ];
        }
        return pairs;
    };
    _.invert = function (obj) {
        var result = {};
        var keys = _.keys(obj);
        for (var i = 0, length = keys.length; i < length; i++) {
            result[obj[keys[i]]] = keys[i];
        }
        return result;
    };
    _.functions = _.methods = function (obj) {
        var names = [];
        for (var key in obj) {
            if (_.isFunction(obj[key]))
                names.push(key);
        }
        return names.sort();
    };
    _.extend = function (obj) {
        if (!_.isObject(obj))
            return obj;
        var source, prop;
        for (var i = 1, length = arguments.length; i < length; i++) {
            source = arguments[i];
            for (prop in source) {
                if (hasOwnProperty.call(source, prop)) {
                    obj[prop] = source[prop];
                }
            }
        }
        return obj;
    };
    _.pick = function (obj, iteratee, context) {
        var result = {}, key;
        if (obj == null)
            return result;
        if (_.isFunction(iteratee)) {
            iteratee = createCallback(iteratee, context);
            for (key in obj) {
                var value = obj[key];
                if (iteratee(value, key, obj))
                    result[key] = value;
            }
        } else {
            var keys = concat.apply([], slice.call(arguments, 1));
            obj = new Object(obj);
            for (var i = 0, length = keys.length; i < length; i++) {
                key = keys[i];
                if (key in obj)
                    result[key] = obj[key];
            }
        }
        return result;
    };
    _.omit = function (obj, iteratee, context) {
        if (_.isFunction(iteratee)) {
            iteratee = _.negate(iteratee);
        } else {
            var keys = _.map(concat.apply([], slice.call(arguments, 1)), String);
            iteratee = function (value, key) {
                return !_.contains(keys, key);
            };
        }
        return _.pick(obj, iteratee, context);
    };
    _.defaults = function (obj) {
        if (!_.isObject(obj))
            return obj;
        for (var i = 1, length = arguments.length; i < length; i++) {
            var source = arguments[i];
            for (var prop in source) {
                if (obj[prop] === void 0)
                    obj[prop] = source[prop];
            }
        }
        return obj;
    };
    _.clone = function (obj) {
        if (!_.isObject(obj))
            return obj;
        return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
    };
    _.tap = function (obj, interceptor) {
        interceptor(obj);
        return obj;
    };
    var eq = function (a, b, aStack, bStack) {
        if (a === b)
            return a !== 0 || 1 / a === 1 / b;
        if (a == null || b == null)
            return a === b;
        if (a instanceof _)
            a = a._wrapped;
        if (b instanceof _)
            b = b._wrapped;
        var className = toString.call(a);
        if (className !== toString.call(b))
            return false;
        switch (className) {
        case '[object RegExp]':
        case '[object String]':
            return '' + a === '' + b;
        case '[object Number]':
            if (+a !== +a)
                return +b !== +b;
            return +a === 0 ? 1 / +a === 1 / b : +a === +b;
        case '[object Date]':
        case '[object Boolean]':
            return +a === +b;
        }
        if (typeof a != 'object' || typeof b != 'object')
            return false;
        var length = aStack.length;
        while (length--) {
            if (aStack[length] === a)
                return bStack[length] === b;
        }
        var aCtor = a.constructor, bCtor = b.constructor;
        if (aCtor !== bCtor && 'constructor' in a && 'constructor' in b && !(_.isFunction(aCtor) && aCtor instanceof aCtor && _.isFunction(bCtor) && bCtor instanceof bCtor)) {
            return false;
        }
        aStack.push(a);
        bStack.push(b);
        var size, result;
        if (className === '[object Array]') {
            size = a.length;
            result = size === b.length;
            if (result) {
                while (size--) {
                    if (!(result = eq(a[size], b[size], aStack, bStack)))
                        break;
                }
            }
        } else {
            var keys = _.keys(a), key;
            size = keys.length;
            result = _.keys(b).length === size;
            if (result) {
                while (size--) {
                    key = keys[size];
                    if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack)))
                        break;
                }
            }
        }
        aStack.pop();
        bStack.pop();
        return result;
    };
    _.isEqual = function (a, b) {
        return eq(a, b, [], []);
    };
    _.isEmpty = function (obj) {
        if (obj == null)
            return true;
        if (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))
            return obj.length === 0;
        for (var key in obj)
            if (_.has(obj, key))
                return false;
        return true;
    };
    _.isElement = function (obj) {
        return !!(obj && obj.nodeType === 1);
    };
    _.isArray = nativeIsArray || function (obj) {
        return toString.call(obj) === '[object Array]';
    };
    _.isObject = function (obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    };
    _.each([
        'Arguments',
        'Function',
        'String',
        'Number',
        'Date',
        'RegExp'
    ], function (name) {
        _['is' + name] = function (obj) {
            return toString.call(obj) === '[object ' + name + ']';
        };
    });
    if (!_.isArguments(arguments)) {
        _.isArguments = function (obj) {
            return _.has(obj, 'callee');
        };
    }
    if (typeof /./ !== 'function') {
        _.isFunction = function (obj) {
            return typeof obj == 'function' || false;
        };
    }
    _.isFinite = function (obj) {
        return isFinite(obj) && !isNaN(parseFloat(obj));
    };
    _.isNaN = function (obj) {
        return _.isNumber(obj) && obj !== +obj;
    };
    _.isBoolean = function (obj) {
        return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
    };
    _.isNull = function (obj) {
        return obj === null;
    };
    _.isUndefined = function (obj) {
        return obj === void 0;
    };
    _.has = function (obj, key) {
        return obj != null && hasOwnProperty.call(obj, key);
    };
    _.noConflict = function () {
        root._ = previousUnderscore;
        return this;
    };
    _.identity = function (value) {
        return value;
    };
    _.constant = function (value) {
        return function () {
            return value;
        };
    };
    _.noop = function () {
    };
    _.property = function (key) {
        return function (obj) {
            return obj[key];
        };
    };
    _.matches = function (attrs) {
        var pairs = _.pairs(attrs), length = pairs.length;
        return function (obj) {
            if (obj == null)
                return !length;
            obj = new Object(obj);
            for (var i = 0; i < length; i++) {
                var pair = pairs[i], key = pair[0];
                if (pair[1] !== obj[key] || !(key in obj))
                    return false;
            }
            return true;
        };
    };
    _.times = function (n, iteratee, context) {
        var accum = Array(Math.max(0, n));
        iteratee = createCallback(iteratee, context, 1);
        for (var i = 0; i < n; i++)
            accum[i] = iteratee(i);
        return accum;
    };
    _.random = function (min, max) {
        if (max == null) {
            max = min;
            min = 0;
        }
        return min + Math.floor(Math.random() * (max - min + 1));
    };
    _.now = Date.now || function () {
        return new Date().getTime();
    };
    var escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        '\'': '&#x27;',
        '`': '&#x60;'
    };
    var unescapeMap = _.invert(escapeMap);
    var createEscaper = function (map) {
        var escaper = function (match) {
            return map[match];
        };
        var source = '(?:' + _.keys(map).join('|') + ')';
        var testRegexp = RegExp(source);
        var replaceRegexp = RegExp(source, 'g');
        return function (string) {
            string = string == null ? '' : '' + string;
            return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
        };
    };
    _.escape = createEscaper(escapeMap);
    _.unescape = createEscaper(unescapeMap);
    _.result = function (object, property) {
        if (object == null)
            return void 0;
        var value = object[property];
        return _.isFunction(value) ? object[property]() : value;
    };
    var idCounter = 0;
    _.uniqueId = function (prefix) {
        var id = ++idCounter + '';
        return prefix ? prefix + id : id;
    };
    _.templateSettings = {
        evaluate: /<%([\s\S]+?)%>/g,
        interpolate: /<%=([\s\S]+?)%>/g,
        escape: /<%-([\s\S]+?)%>/g
    };
    var noMatch = /(.)^/;
    var escapes = {
        '\'': '\'',
        '\\': '\\',
        '\r': 'r',
        '\n': 'n',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
    };
    var escaper = /\\|'|\r|\n|\u2028|\u2029/g;
    var escapeChar = function (match) {
        return '\\' + escapes[match];
    };
    _.template = function (text, settings, oldSettings) {
        if (!settings && oldSettings)
            settings = oldSettings;
        settings = _.defaults({}, settings, _.templateSettings);
        var matcher = RegExp([
            (settings.escape || noMatch).source,
            (settings.interpolate || noMatch).source,
            (settings.evaluate || noMatch).source
        ].join('|') + '|$', 'g');
        var index = 0;
        var source = '__p+=\'';
        text.replace(matcher, function (match, escape, interpolate, evaluate, offset) {
            source += text.slice(index, offset).replace(escaper, escapeChar);
            index = offset + match.length;
            if (escape) {
                source += '\'+\n((__t=(' + escape + '))==null?\'\':_.escape(__t))+\n\'';
            } else if (interpolate) {
                source += '\'+\n((__t=(' + interpolate + '))==null?\'\':__t)+\n\'';
            } else if (evaluate) {
                source += '\';\n' + evaluate + '\n__p+=\'';
            }
            return match;
        });
        source += '\';\n';
        if (!settings.variable)
            source = 'with(obj||{}){\n' + source + '}\n';
        source = 'var __t,__p=\'\',__j=Array.prototype.join,' + 'print=function(){__p+=__j.call(arguments,\'\');};\n' + source + 'return __p;\n';
        try {
            var render = new Function(settings.variable || 'obj', '_', source);
        } catch (e) {
            e.source = source;
            throw e;
        }
        var template = function (data) {
            return render.call(this, data, _);
        };
        var argument = settings.variable || 'obj';
        template.source = 'function(' + argument + '){\n' + source + '}';
        return template;
    };
    _.chain = function (obj) {
        var instance = _(obj);
        instance._chain = true;
        return instance;
    };
    var result = function (obj) {
        return this._chain ? _(obj).chain() : obj;
    };
    _.mixin = function (obj) {
        _.each(_.functions(obj), function (name) {
            var func = _[name] = obj[name];
            _.prototype[name] = function () {
                var args = [this._wrapped];
                push.apply(args, arguments);
                return result.call(this, func.apply(_, args));
            };
        });
    };
    _.mixin(_);
    _.each([
        'pop',
        'push',
        'reverse',
        'shift',
        'sort',
        'splice',
        'unshift'
    ], function (name) {
        var method = ArrayProto[name];
        _.prototype[name] = function () {
            var obj = this._wrapped;
            method.apply(obj, arguments);
            if ((name === 'shift' || name === 'splice') && obj.length === 0)
                delete obj[0];
            return result.call(this, obj);
        };
    });
    _.each([
        'concat',
        'join',
        'slice'
    ], function (name) {
        var method = ArrayProto[name];
        _.prototype[name] = function () {
            return result.call(this, method.apply(this._wrapped, arguments));
        };
    });
    _.prototype.value = function () {
        return this._wrapped;
    };
    if (typeof define === 'function' && define.amd) {
        define('underscore', [], function () {
            return _;
        });
    }
}.call(this));
define('Events', ['underscore'], function (_) {
    'use strict';
    var slice = Array.prototype.slice, eventSplitter = /\s+/;
    var Events = {
        on: function (events, callback, context) {
            var calls, event, node, tail, list;
            if (!callback) {
                return this;
            }
            events = events.split(eventSplitter);
            calls = this._callbacks || (this._callbacks = {});
            while (!!(event = events.shift())) {
                list = calls[event];
                node = list ? list.tail : {};
                node.next = tail = {};
                node.context = context;
                node.callback = callback;
                calls[event] = {
                    tail: tail,
                    next: list ? list.next : node
                };
            }
            return this;
        },
        off: function (events, callback, context) {
            var event, calls, node, tail, cb, ctx;
            if (!(calls = this._callbacks)) {
                return;
            }
            if (!(events || callback || context)) {
                delete this._callbacks;
                return this;
            }
            events = events ? events.split(eventSplitter) : _.keys(calls);
            while (!!(event = events.shift())) {
                node = calls[event];
                delete calls[event];
                if (!node || !(callback || context)) {
                    continue;
                }
                tail = node.tail;
                while ((node = node.next) !== tail) {
                    cb = node.callback;
                    ctx = node.context;
                    if (callback && cb !== callback || context && ctx !== context) {
                        this.on(event, cb, ctx);
                    }
                }
            }
            return this;
        },
        trigger: function (events) {
            var event, node, calls, tail, args, all, rest;
            if (!(calls = this._callbacks)) {
                return this;
            }
            all = calls.all;
            events = events.split(eventSplitter);
            rest = slice.call(arguments, 1);
            while (!!(event = events.shift())) {
                if (!!(node = calls[event])) {
                    tail = node.tail;
                    while ((node = node.next) !== tail) {
                        node.callback.apply(node.context || this, rest);
                    }
                }
                if (!!(node = all)) {
                    tail = node.tail;
                    args = [event].concat(rest);
                    while ((node = node.next) !== tail) {
                        node.callback.apply(node.context || this, args);
                    }
                }
            }
            return this;
        }
    };
    Events.bind = Events.on;
    Events.unbind = Events.off;
    return Events;
});
var container = null, session = null, customer = null, context = null, order = null;
switch (nlapiGetContext().getExecutionContext()) {
case 'suitelet':
    context = nlapiGetContext();
    break;
case 'webstore':
case 'webservices':
case 'webapplication':
    container = nlapiGetWebContainer();
    session = container.getShoppingSession();
    customer = session.getCustomer();
    context = nlapiGetContext();
    order = session.getOrder();
    break;
default:
    break;
}
define('Models.Init', function () {
    'use strict';
    return {
        container: container,
        session: session,
        customer: customer,
        context: context,
        order: order
    };
});
define('Utils', [
    'Models.Init',
    'underscore'
], function (ModelsInit, _) {
    'use strict';
    function _getColumnLabel(column) {
        var formula = column.getFormula();
        if (formula) {
            return column.getLabel() || column.getName();
        } else {
            return column.getName();
        }
    }
    var Utils = {
        isDateType: function (field) {
            return field === 'trandate' || field === 'createddate' || field === 'datecreated';
        },
        transformDateFormat: function (format) {
            return format.toUpperCase().replace('MONTH', 'MMMM').replace('MON', 'MMM');
        },
        transformTimeFormat: function (format) {
            return format.toUpperCase().replace('FMHH', 'hh').replace('FMMI', 'MM').replace('hh24', 'HH').replace('AM', 'A');
        },
        mapSearchResult: function mapSearchResult(columns, apiElement) {
            var element = {};
            columns.forEach(function (column) {
                var col = column.searchColumn, name = col.getName(), text = apiElement.getText(name, col.getJoin(), col.getSummary()), value = apiElement.getValue(name, col.getJoin(), col.getSummary()), has_function = col.getFunction(), fieldName = column.fieldName, is_datetype = Utils.isDateType(fieldName);
                element[fieldName] = is_datetype && !has_function ? nlapiStringToDate(value) : value;
                if (text) {
                    element[fieldName + '_text'] = text;
                }
            });
            return element;
        },
        mapSearchResults: function mapSearchResults(searchColumns, searchResults) {
            if (!searchColumns || !searchResults) {
                return [];
            }
            var nameToCol = {}, columns = [];
            _.each(searchColumns, function (col) {
                var name = _getColumnLabel(col);
                columns.push({ searchColumn: col });
                nameToCol[name] = (nameToCol[name] || 0) + 1;
            });
            _.each(columns, function (column) {
                var searchColumn = column.searchColumn, isANameClash = nameToCol[_getColumnLabel(searchColumn)] > 1, coulumnJoim = searchColumn.getJoin();
                column.fieldName = _getColumnLabel(searchColumn);
                if (isANameClash && coulumnJoim) {
                    column.fieldName += '_' + coulumnJoim;
                }
            });
            return searchResults.map(function (apiElement) {
                return Utils.mapSearchResult(columns, apiElement);
            });
        },
        mapLoadResult: function mapLoadResult(columns, record) {
            var record_info = {};
            columns.forEach(function (name) {
                var value = record.getFieldValue(name);
                if (name === 'image' && !!value) {
                    var imageRecord = nlapiLoadFile(value);
                    if (!!imageRecord) {
                        record_info[name] = imageRecord.getURL();
                    } else {
                        record_info[name] = '';
                    }
                } else {
                    record_info[name] = value;
                }
            });
            return record_info;
        },
        loadAndMapSearch: function loadAndMapSearch(searchName, filters) {
            var savedSearch;
            filters = filters || [];
            try {
                savedSearch = nlapiLoadSearch(null, searchName);
            } catch (err) {
                console.log('Unable to load search ' + searchName, err);
                return [];
            }
            var searchResults = nlapiSearchRecord(null, searchName, filters);
            return Utils.mapSearchResults(savedSearch.getColumns(), searchResults);
        },
        mapOptions: function mapOptions(record_options) {
            var options_rows = record_options.split('\x04');
            var options_items = options_rows.map(function (row) {
                return row.split('\x03');
            });
            var options = {};
            options_items.forEach(function (item) {
                options[item[0]] = {
                    name: item[0],
                    desc: item[2],
                    value: item[3]
                };
            });
            return options;
        },
        makeid: function makeid(maxLength) {
            return Math.random().toString(36).substring(2, maxLength + 2 || 5);
        },
        getMolecule: function getMolecule(request) {
            var regex = /https:\/\/system(.*)\.netsuite\.com/;
            var molecule = request.getURL().match(regex);
            return molecule && molecule[1] || '';
        },
        formatReceiptCurrency: function formatReceiptCurrency(value) {
            var parsedValue = parseFloat(value);
            if (parsedValue < 0) {
                if (value.substring) {
                    return '($ ' + value.substring(1) + ')';
                }
                return '($ ' + value.toFixed(2).substring(1) + ')';
            }
            return '$ ' + parsedValue.toFixed(2);
        },
        sanitizeString: function (text) {
            return text ? text.replace(/<br>/g, '\n').replace(/</g, '&lt;').replace(/\>/g, '&gt;') : '';
        },
        formatCurrency: function (value, symbol) {
            var value_float = parseFloat(value);
            if (isNaN(value_float)) {
                value_float = parseFloat(0);
            }
            var negative = value_float < 0;
            value_float = Math.abs(value_float);
            value_float = parseInt((value_float + 0.005) * 100, 10) / 100;
            var value_string = value_float.toString(), groupseparator = ',', decimalseparator = '.', negativeprefix = '(', negativesuffix = ')', settings = SC && SC.ENVIRONMENT && SC.ENVIRONMENT.siteSettings ? SC.ENVIRONMENT.siteSettings : {};
            if (window.hasOwnProperty('groupseparator')) {
                groupseparator = window.groupseparator;
            } else if (settings.hasOwnProperty('groupseparator')) {
                groupseparator = settings.groupseparator;
            }
            if (window.hasOwnProperty('decimalseparator')) {
                decimalseparator = window.decimalseparator;
            } else if (settings.hasOwnProperty('decimalseparator')) {
                decimalseparator = settings.decimalseparator;
            }
            if (window.hasOwnProperty('negativeprefix')) {
                negativeprefix = window.negativeprefix;
            } else if (settings.hasOwnProperty('negativeprefix')) {
                negativeprefix = settings.negativeprefix;
            }
            if (window.hasOwnProperty('negativesuffix')) {
                negativesuffix = window.negativesuffix;
            } else if (settings.hasOwnProperty('negativesuffix')) {
                negativesuffix = settings.negativesuffix;
            }
            value_string = value_string.replace('.', decimalseparator);
            var decimal_position = value_string.indexOf(decimalseparator);
            if (!~decimal_position) {
                value_string += decimalseparator + '00';
                decimal_position = value_string.indexOf(decimalseparator);
            } else if (value_string.indexOf(decimalseparator) === value_string.length - 2) {
                value_string += '0';
            }
            var thousand_string = '';
            for (var i = value_string.length - 1; i >= 0; i--) {
                thousand_string = (i > 0 && i < decimal_position && (decimal_position - i) % 3 === 0 ? groupseparator : '') + value_string[i] + thousand_string;
            }
            if (!symbol) {
                if (typeof ModelsInit.session !== 'undefined' && ModelsInit.session.getShopperCurrency) {
                    try {
                        symbol = ModelsInit.session.getShopperCurrency().symbol;
                    } catch (e) {
                    }
                } else if (settings.shopperCurrency) {
                    symbol = settings.shopperCurrency.symbol;
                } else if (SC && SC.ENVIRONMENT && SC.ENVIRONMENT.currentCurrency) {
                    symbol = SC.ENVIRONMENT.currentCurrency.symbol;
                }
                if (!symbol) {
                    symbol = '$';
                }
            }
            value_string = symbol + thousand_string;
            return negative ? negativeprefix + value_string + negativesuffix : value_string;
        },
        isDepartmentMandatory: function () {
            return this.isFeatureEnabled('DEPARTMENTS');
        },
        isLocationMandatory: function () {
            return this.isFeatureEnabled('LOCATIONS');
        },
        isClassMandatory: function () {
            return this.isFeatureEnabled('CLASSES');
        },
        isFeatureEnabled: function (feature) {
            return ModelsInit.context.getFeature(feature);
        },
        _isAccountingPreferenceEnabled: function (preference) {
            var accountingPreferences = nlapiLoadConfiguration('accountingpreferences');
            return accountingPreferences.getFieldValue(preference) === 'T';
        },
        toCurrency: function (amount) {
            var r = parseFloat(amount);
            return isNaN(r) ? 0 : r;
        },
        recordTypeExists: function (record_type_name) {
            try {
                nlapiCreateRecord(record_type_name);
            } catch (error) {
                return false;
            }
            return true;
        },
        recordTypeHasField: function (record_type_name, field_name) {
            try {
                nlapiLookupField(record_type_name, 1, field_name);
                return true;
            } catch (error) {
                return false;
            }
        },
        getTransactionType: function (internalid) {
            try {
                return nlapiLookupField('transaction', internalid, 'recordtype');
            } catch (error) {
                return '';
            }
        },
        getItemOptionsObject: function (options_string) {
            var options_object = [];
            if (options_string && options_string !== '- None -') {
                var split_char_3 = String.fromCharCode(3), split_char_4 = String.fromCharCode(4);
                _.each(options_string.split(split_char_4), function (option_line) {
                    option_line = option_line.split(split_char_3);
                    options_object.push({
                        id: option_line[0],
                        name: option_line[2],
                        value: option_line[3],
                        displayvalue: option_line[4],
                        mandatory: option_line[1]
                    });
                });
            }
            return options_object;
        },
        setPaymentMethodToResult: function (record, result) {
            var paymentmethod = {
                    type: record.getFieldValue('paymethtype'),
                    primary: true,
                    name: record.getFieldText('paymentmethod')
                }, ccnumber = record.getFieldValue('ccnumber');
            if (ccnumber) {
                paymentmethod.type = 'creditcard';
                paymentmethod.creditcard = {
                    ccnumber: ccnumber,
                    ccexpiredate: record.getFieldValue('ccexpiredate'),
                    ccname: record.getFieldValue('ccname'),
                    internalid: record.getFieldValue('creditcard'),
                    paymentmethod: {
                        ispaypal: 'F',
                        name: record.getFieldText('paymentmethod'),
                        creditcard: 'T',
                        internalid: record.getFieldValue('paymentmethod')
                    }
                };
            }
            if (record.getFieldValue('ccstreet')) {
                paymentmethod.ccstreet = record.getFieldValue('ccstreet');
            }
            if (record.getFieldValue('cczipcode')) {
                paymentmethod.cczipcode = record.getFieldValue('cczipcode');
            }
            if (record.getFieldValue('terms')) {
                paymentmethod.type = 'invoice';
                paymentmethod.purchasenumber = record.getFieldValue('otherrefnum');
                paymentmethod.paymentterms = {
                    internalid: record.getFieldValue('terms'),
                    name: record.getFieldText('terms')
                };
            }
            result.paymentmethods = [paymentmethod];
        },
        getPathFromObject: function (object, path, default_value) {
            if (!path) {
                return object;
            } else if (object) {
                var tokens = path.split('.'), prev = object, n = 0;
                while (!_.isUndefined(prev) && n < tokens.length) {
                    prev = prev[tokens[n++]];
                }
                if (!_.isUndefined(prev)) {
                    return prev;
                }
            }
            return default_value;
        },
        setPathFromObject: function (object, path, value) {
            if (!path) {
                return;
            } else if (!object) {
                return;
            }
            var tokens = path.split('.'), prev = object;
            for (var token_idx = 0; token_idx < tokens.length - 1; ++token_idx) {
                var current_token = tokens[token_idx];
                if (_.isUndefined(prev[current_token])) {
                    prev[current_token] = {};
                }
                prev = prev[current_token];
            }
            prev[_.last(tokens)] = value;
        }
    };
    return Utils;
});
define('Console', ['underscore'], function (_) {
    'use strict';
    if (typeof console === 'undefined') {
        console = {};
    }
    var maxDetailsLength = 3995, maxTitleLength = 95;
    function basicClone(value) {
        var t = typeof value;
        if (t === 'function') {
            return 'function';
        } else if (!value || t !== 'object') {
            return value;
        } else {
            var o = {};
            Object.keys(value).forEach(function (key) {
                var val = value[key];
                var t2 = typeof val;
                if (t2 === 'string' || t2 === 'number' || t2 === 'boolean') {
                    o[key] = val;
                } else {
                    o[key] = t2;
                }
            });
            return o;
        }
    }
    function stringify(value) {
        if (value && value.toJSON) {
            return value.toJSON();
        } else {
            value = basicClone(value);
            return JSON.stringify(value);
        }
    }
    var console_methods = 'assert clear count debug dir dirxml exception group groupCollapsed groupEnd info log profile profileEnd table time timeEnd trace warn'.split(' '), idx = console_methods.length, noop = function () {
        };
    while (--idx >= 0) {
        var method = console_methods[idx];
        if (typeof console[method] === 'undefined') {
            console[method] = noop;
        }
    }
    if (typeof console.memory === 'undefined') {
        console.memory = {};
    }
    _.each({
        'log': 'DEBUG',
        'info': 'AUDIT',
        'error': 'EMERGENCY',
        'warn': 'ERROR'
    }, function (value, key) {
        console[key] = function () {
            var title, details;
            if (arguments.length > 1) {
                title = arguments[0];
                title = typeof title === 'object' ? stringify(title) : title;
                details = arguments[1];
                details = typeof details === 'object' ? stringify(details) : details;
            } else {
                title = '';
                details = arguments[0] || 'null';
            }
            if (details && details.length > maxDetailsLength) {
                details = details.match(new RegExp('.{1,' + maxDetailsLength + '}', 'g'));
            } else {
                details = [details];
            }
            _.each(details, function (detail, key, list) {
                var newTitle = list.length > 1 ? title.substring(0, maxTitleLength) + '(' + (key + 1) + ')' : title;
                nlapiLogExecution(value, newTitle, detail);
            });
        };
    });
    _.extend(console, {
        timeEntries: [],
        time: function (text) {
            if (typeof text === 'string') {
                console.timeEntries[text] = Date.now();
            }
        },
        timeEnd: function (text) {
            if (typeof text === 'string') {
                if (!arguments.length) {
                    console.warn('TypeError:', 'Not enough arguments');
                } else {
                    if (typeof console.timeEntries[text] !== 'undefined') {
                        console.log(text + ':', Date.now() - console.timeEntries[text] + 'ms');
                        delete console.timeEntries[text];
                    }
                }
            }
        }
    });
    return console;
});
define('Configuration', [
    'Utils',
    'underscore',
    'Models.Init',
    'Console'
], function (Utils, _, ModelsInit) {
    'use strict';
    function mergeConfigurationObjects(target, source) {
        if (!_.isObject(target)) {
            return source;
        }
        if (_.isArray(source) && _.isArray(target)) {
            target.length = source.length;
        }
        _.each(source, function (value, key) {
            if (key in target) {
                target[key] = mergeConfigurationObjects(target[key], value);
            } else {
                target[key] = value;
            }
        });
        return target;
    }
    SC.Configuration = {
        get: function (path, defaultValue) {
            return Utils.getPathFromObject(this, path, defaultValue);
        }
    };
    var domain = session.getSiteSettings(['touchpoints']).touchpoints.home.match(/^http(s?)\:\/\/([^\/?#]+)(?:[\/?#]|$)/i)[2];
    SC.Configuration = mergeConfigurationObjects(SC.Configuration, typeof ConfigurationManifestDefaults === 'undefined' ? {} : ConfigurationManifestDefaults);
    if (Utils.recordTypeExists('customrecord_ns_sc_configuration')) {
        var siteid = session.getSiteSettings(['siteid']).siteid, config_key = domain ? siteid + '|' + domain : siteid + '|all', search = nlapiCreateSearch('customrecord_ns_sc_configuration', [new nlobjSearchFilter('custrecord_ns_scc_key', null, 'is', config_key)], [new nlobjSearchColumn('custrecord_ns_scc_value')]), result = search.runSearch().getResults(0, 1000);
        var configuration = result.length && JSON.parse(result[result.length - 1].getValue('custrecord_ns_scc_value')) || {};
        SC.Configuration = mergeConfigurationObjects(SC.Configuration, configuration);
    }
    SC.Configuration.hosts = [];
    if (SC.Configuration.multiDomain && SC.Configuration.multiDomain.hosts && SC.Configuration.multiDomain.hosts.languages) {
        _.each(SC.Configuration.multiDomain.hosts.languages, function (language) {
            var storedHost = _.find(SC.Configuration.hosts, function (host) {
                return host.title === language.host;
            });
            function getLanguageObj() {
                return {
                    title: language.title,
                    host: language.domain,
                    locale: language.locale
                };
            }
            if (!storedHost) {
                SC.Configuration.hosts.push({
                    title: language.host,
                    languages: [getLanguageObj()],
                    currencies: _.filter(SC.Configuration.multiDomain.hosts.currencies, function (currency) {
                        return currency.host === language.host;
                    })
                });
            } else {
                storedHost.languages.push(getLanguageObj());
            }
        });
    }
    SC.Configuration.categories = ModelsInit.context.getSetting('FEATURE', 'COMMERCECATEGORIES') === 'T' ? SC.Configuration.categories : false;
    if (typeof __sc_ssplibraries_t0 !== 'undefined') {
        SC.Configuration.__sc_ssplibraries_time = new Date().getTime() - __sc_ssplibraries_t0;
    }
    return SC.Configuration;
});
var SC = {};
define('Application', [
    'underscore',
    'Events',
    'Models.Init',
    'Utils',
    'Configuration',
    'Console'
], function (_, Events, ModelsInit, Utils) {
    'use strict';
    var Application = _.extend({
        init: function () {
        },
        Utils: Utils,
        getEnvironment: function (request) {
            var isSecure = request.getURL().indexOf('https:') === 0;
            SC.Configuration.cms.useCMS = !isSecure && SC.Configuration.cms.useCMS && ModelsInit.context.getSetting('FEATURE', 'ADVANCEDSITEMANAGEMENT') === 'T';
            var siteSettings = ModelsInit.session.getSiteSettings([
                    'currencies',
                    'languages'
                ]), result = {
                    baseUrl: ModelsInit.session.getAbsoluteUrl(isSecure ? 'checkout' : 'shopping', '/{{file}}'),
                    currentHostString: Application.getHost(),
                    availableHosts: SC.Configuration.hosts || [],
                    availableLanguages: siteSettings.languages || [],
                    availableCurrencies: siteSettings.currencies || [],
                    companyId: ModelsInit.context.getCompany(),
                    casesManagementEnabled: ModelsInit.context.getSetting('FEATURE', 'SUPPORT') === 'T',
                    giftCertificatesEnabled: ModelsInit.context.getSetting('FEATURE', 'GIFTCERTIFICATES') === 'T',
                    currencyCodeSpecifiedOnUrl: '',
                    useCMS: SC.Configuration.cms.useCMS
                };
            if (result.availableHosts.length && !isSecure) {
                var pushLanguage = function (language) {
                    result.availableLanguages.push(_.extend({}, language, available_languages_object[language.locale]));
                };
                var pushCurrency = function (currency) {
                    result.availableCurrencies.push(_.extend({}, currency, available_currencies_object[currency.code]));
                };
                for (var i = 0; i < result.availableHosts.length; i++) {
                    var host = result.availableHosts[i];
                    if (host.languages && host.languages.length) {
                        for (var n = 0; n < host.languages.length; n++) {
                            var language = host.languages[n];
                            if (language.host === result.currentHostString) {
                                result = _.extend(result, {
                                    currentHost: host,
                                    currentLanguage: language
                                });
                                var available_languages_object = _.object(_.pluck(result.availableLanguages, 'locale'), result.availableLanguages);
                                result.availableLanguages = [];
                                _.each(host.languages, pushLanguage);
                                break;
                            }
                        }
                    }
                    if (result.currentHost) {
                        var available_currencies_object = _.object(_.pluck(result.availableCurrencies, 'code'), result.availableCurrencies);
                        result.availableCurrencies = [];
                        _.each(host.currencies, pushCurrency);
                        break;
                    }
                }
            }
            var currency_codes = _.pluck(result.availableCurrencies, 'code');
            if (request.getParameter('cur') && ~currency_codes.indexOf(request.getParameter('cur'))) {
                result.currentCurrency = _.find(result.availableCurrencies, function (currency) {
                    return currency.code === request.getParameter('cur');
                });
                result.currencyCodeSpecifiedOnUrl = result.currentCurrency.code;
            } else if (ModelsInit.session.getShopperCurrency().code && ~currency_codes.indexOf(ModelsInit.session.getShopperCurrency().code)) {
                result.currentCurrency = _.find(result.availableCurrencies, function (currency) {
                    return currency.code === ModelsInit.session.getShopperCurrency().code;
                });
                result.currencyCodeSpecifiedOnUrl = result.currentCurrency.code;
            } else if (result.availableCurrencies && result.availableCurrencies.length) {
                result.currentCurrency = _.find(result.availableCurrencies, function (currency) {
                    result.currencyCodeSpecifiedOnUrl = currency.code;
                    return currency.isdefault === 'T';
                });
            }
            result.currentCurrency && ModelsInit.session.setShopperCurrency(result.currentCurrency.internalid);
            result.currentCurrency = _.find(result.availableCurrencies, function (currency) {
                return currency.code === ModelsInit.session.getShopperCurrency().code;
            });
            if (!result.currentLanguage) {
                var shopper_preferences = ModelsInit.session.getShopperPreferences(), shopper_locale = shopper_preferences.language.locale, locales = _.pluck(result.availableLanguages, 'locale');
                if (request.getParameter('lang') && ~locales.indexOf(request.getParameter('lang'))) {
                    result.currentLanguage = _.find(result.availableLanguages, function (language) {
                        return language.locale === request.getParameter('lang');
                    });
                } else if (shopper_locale && ~locales.indexOf(shopper_locale)) {
                    result.currentLanguage = _.find(result.availableLanguages, function (language) {
                        return language.locale === shopper_locale;
                    });
                } else if (result.availableLanguages && result.availableLanguages.length) {
                    result.currentLanguage = _.find(result.availableLanguages, function (language) {
                        return language.isdefault === 'T';
                    });
                }
            }
            result.currentLanguage && ModelsInit.session.setShopperLanguageLocale(result.currentLanguage.locale);
            result.currentPriceLevel = ModelsInit.session.getShopperPriceLevel().internalid ? ModelsInit.session.getShopperPriceLevel().internalid : ModelsInit.session.getSiteSettings(['defaultpricelevel']).defaultpricelevel;
            return result;
        },
        getPermissions: function () {
            var purchases_permissions = [
                    ModelsInit.context.getPermission('TRAN_SALESORD'),
                    ModelsInit.context.getPermission('TRAN_CUSTINVC'),
                    ModelsInit.context.getPermission('TRAN_CASHSALE')
                ], purchases_returns_permissions = [
                    ModelsInit.context.getPermission('TRAN_RTNAUTH'),
                    ModelsInit.context.getPermission('TRAN_CUSTCRED')
                ];
            return {
                transactions: {
                    tranCashSale: ModelsInit.context.getPermission('TRAN_CASHSALE'),
                    tranCustCred: ModelsInit.context.getPermission('TRAN_CUSTCRED'),
                    tranCustDep: ModelsInit.context.getPermission('TRAN_CUSTDEP'),
                    tranCustPymt: ModelsInit.context.getPermission('TRAN_CUSTPYMT'),
                    tranStatement: ModelsInit.context.getPermission('TRAN_STATEMENT'),
                    tranCustInvc: ModelsInit.context.getPermission('TRAN_CUSTINVC'),
                    tranItemShip: ModelsInit.context.getPermission('TRAN_ITEMSHIP'),
                    tranSalesOrd: ModelsInit.context.getPermission('TRAN_SALESORD'),
                    tranEstimate: ModelsInit.context.getPermission('TRAN_ESTIMATE'),
                    tranRtnAuth: ModelsInit.context.getPermission('TRAN_RTNAUTH'),
                    tranDepAppl: ModelsInit.context.getPermission('TRAN_DEPAPPL'),
                    tranSalesOrdFulfill: ModelsInit.context.getPermission('TRAN_SALESORDFULFILL'),
                    tranFind: ModelsInit.context.getPermission('TRAN_FIND'),
                    tranPurchases: _.max(purchases_permissions),
                    tranPurchasesReturns: _.max(purchases_returns_permissions)
                },
                lists: {
                    regtAcctRec: ModelsInit.context.getPermission('REGT_ACCTREC'),
                    regtNonPosting: ModelsInit.context.getPermission('REGT_NONPOSTING'),
                    listCase: ModelsInit.context.getPermission('LIST_CASE'),
                    listContact: ModelsInit.context.getPermission('LIST_CONTACT'),
                    listCustJob: ModelsInit.context.getPermission('LIST_CUSTJOB'),
                    listCompany: ModelsInit.context.getPermission('LIST_COMPANY'),
                    listIssue: ModelsInit.context.getPermission('LIST_ISSUE'),
                    listCustProfile: ModelsInit.context.getPermission('LIST_CUSTPROFILE'),
                    listExport: ModelsInit.context.getPermission('LIST_EXPORT'),
                    listFind: ModelsInit.context.getPermission('LIST_FIND'),
                    listCrmMessage: ModelsInit.context.getPermission('LIST_CRMMESSAGE')
                }
            };
        },
        getHost: function () {
            return request.getURL().match(/http(s?):\/\/([^\/]*)\//)[2];
        },
        sendContent: function (content, options) {
            options = _.extend({
                status: 200,
                cache: false
            }, options || {});
            Application.trigger('before:Application.sendContent', content, options);
            response.setHeader('Custom-Header-Status', parseInt(options.status, 10).toString());
            var content_type = false;
            if (_.isArray(content) || _.isObject(content)) {
                content_type = 'JSON';
                content = JSON.stringify(content);
            }
            if (request.getParameter('jsonp_callback')) {
                content_type = 'JAVASCRIPT';
                content = request.getParameter('jsonp_callback') + '(' + content + ');';
            }
            if (options.cache) {
                response.setCDNCacheable(options.cache);
            }
            content_type && response.setContentType(content_type);
            response.write(content);
            Application.trigger('after:Application.sendContent', content, options);
        },
        processError: function (e) {
            var status = 500, code = 'ERR_UNEXPECTED', message = 'error';
            if (e instanceof nlobjError) {
                code = e.getCode();
                message = e.getDetails();
                status = badRequestError.status;
            } else if (_.isObject(e) && !_.isUndefined(e.status)) {
                status = e.status;
                code = e.code;
                message = e.message;
            } else {
                var error = nlapiCreateError(e);
                code = error.getCode();
                message = error.getDetails() !== '' ? error.getDetails() : error.getCode();
            }
            if (code === 'INSUFFICIENT_PERMISSION') {
                status = forbiddenError.status;
                code = forbiddenError.code;
                message = forbiddenError.message;
            }
            var content = {
                errorStatusCode: parseInt(status, 10).toString(),
                errorCode: code,
                errorMessage: message
            };
            if (e.errorDetails) {
                content.errorDetails = e.errorDetails;
            }
            return content;
        },
        sendError: function (e) {
            Application.trigger('before:Application.sendError', e);
            var content = Application.processError(e), content_type = 'JSON';
            response.setHeader('Custom-Header-Status', content.errorStatusCode);
            if (request.getParameter('jsonp_callback')) {
                content_type = 'JAVASCRIPT';
                content = request.getParameter('jsonp_callback') + '(' + JSON.stringify(content) + ');';
            } else {
                content = JSON.stringify(content);
            }
            response.setContentType(content_type);
            response.write(content);
            Application.trigger('after:Application.sendError', e);
        },
        getPaginatedSearchResults: function (options) {
            options = options || {};
            var results_per_page = options.results_per_page || SC.Configuration.suitescriptResultsPerPage, page = options.page || 1, columns = options.columns || [], filters = options.filters || [], record_type = options.record_type, range_start = page * results_per_page - results_per_page, range_end = page * results_per_page, do_real_count = _.any(columns, function (column) {
                    return column.getSummary();
                }), result = {
                    page: page,
                    recordsPerPage: results_per_page,
                    records: []
                };
            if (!do_real_count || options.column_count) {
                var column_count = options.column_count || new nlobjSearchColumn('internalid', null, 'count'), count_result = nlapiSearchRecord(record_type, null, filters, [column_count]);
                result.totalRecordsFound = parseInt(count_result[0].getValue(column_count), 10);
            }
            if (do_real_count || result.totalRecordsFound > 0 && result.totalRecordsFound > range_start) {
                var search = nlapiCreateSearch(record_type, filters, columns).runSearch();
                result.records = search.getResults(range_start, range_end);
                if (do_real_count && !options.column_count) {
                    result.totalRecordsFound = search.getResults(0, 1000).length;
                }
            }
            return result;
        },
        getAllSearchResults: function (record_type, filters, columns) {
            var search = nlapiCreateSearch(record_type, filters, columns);
            search.setIsPublic(true);
            var searchRan = search.runSearch(), bolStop = false, intMaxReg = 1000, intMinReg = 0, result = [];
            while (!bolStop && ModelsInit.context.getRemainingUsage() > 10) {
                var extras = searchRan.getResults(intMinReg, intMaxReg);
                result = Application.searchUnion(result, extras);
                intMinReg = intMaxReg;
                intMaxReg += 1000;
                if (extras.length < 1000) {
                    bolStop = true;
                }
            }
            return result;
        },
        addFilterSite: function (filters) {
            var search_filter_array = this.getSearchFilterArray();
            search_filter_array.length && filters.push(new nlobjSearchFilter('website', null, 'anyof', search_filter_array));
        },
        addFilterItem: function (filters) {
            var search_filter_array = this.getSearchFilterArray();
            search_filter_array.length && filters.push(new nlobjSearchFilter('website', 'item', 'anyof', search_filter_array));
        },
        getSearchFilterArray: function () {
            var site_id = ModelsInit.session.getSiteSettings(['siteid']).siteid, filter_site = SC.Configuration.filterSite, search_filter_array = [];
            if (ModelsInit.context.getFeature('MULTISITE') && site_id && filter_site.option && 'all' !== filter_site.option) {
                if (filter_site.option === 'siteIds' && filter_site.ids) {
                    search_filter_array = filter_site.ids;
                }
                search_filter_array.push(site_id, '@NONE@');
            }
            return _.uniq(search_filter_array);
        },
        searchUnion: function (target, array) {
            return target.concat(array);
        }
    }, Events);
    return Application;
});
var badRequestError = {
        status: 400,
        code: 'ERR_BAD_REQUEST',
        message: 'Bad Request'
    }, unauthorizedError = {
        status: 401,
        code: 'ERR_USER_NOT_LOGGED_IN',
        message: 'Not logged In'
    }, sessionTimedOutError = {
        status: 401,
        code: 'ERR_USER_SESSION_TIMED_OUT',
        message: 'User session timed out'
    }, forbiddenError = {
        status: 403,
        code: 'ERR_INSUFFICIENT_PERMISSIONS',
        message: 'Insufficient permissions'
    }, notFoundError = {
        status: 404,
        code: 'ERR_RECORD_NOT_FOUND',
        message: 'Not found'
    }, methodNotAllowedError = {
        status: 405,
        code: 'ERR_METHOD_NOT_ALLOWED',
        message: 'Sorry, you are not allowed to perform this action.'
    }, invalidItemsFieldsAdvancedName = {
        status: 500,
        code: 'ERR_INVALID_ITEMS_FIELDS_ADVANCED_NAME',
        message: 'Please check if the fieldset is created.'
    };
define('Backbone.Validation', [], function () {
    var Backbone = {};
    Backbone.Validation = function (_) {
        'use strict';
        var defaultOptions = {
            forceUpdate: false,
            selector: 'name',
            labelFormatter: 'sentenceCase',
            valid: Function.prototype,
            invalid: Function.prototype
        };
        var formatFunctions = {
            formatLabel: function (attrName, model) {
                return defaultLabelFormatters[defaultOptions.labelFormatter](attrName, model);
            },
            format: function () {
                var args = Array.prototype.slice.call(arguments), text = args.shift();
                return text.replace(/\{(\d+)\}/g, function (match, number) {
                    return typeof args[number] !== 'undefined' ? args[number] : match;
                });
            }
        };
        var flatten = function (obj, into, prefix) {
            into = into || {};
            prefix = prefix || '';
            _.each(obj, function (val, key) {
                if (obj.hasOwnProperty(key)) {
                    if (val && typeof val === 'object' && !(val instanceof Date || val instanceof RegExp)) {
                        flatten(val, into, prefix + key + '.');
                    } else {
                        into[prefix + key] = val;
                    }
                }
            });
            return into;
        };
        var Validation = function () {
            var getValidatedAttrs = function (model) {
                return _.reduce(_.keys(model.validation || {}), function (memo, key) {
                    memo[key] = void 0;
                    return memo;
                }, {});
            };
            var getValidators = function (model, attr) {
                var attrValidationSet = model.validation ? model.validation[attr] || {} : {};
                if (_.isFunction(attrValidationSet) || _.isString(attrValidationSet)) {
                    attrValidationSet = { fn: attrValidationSet };
                }
                if (!_.isArray(attrValidationSet)) {
                    attrValidationSet = [attrValidationSet];
                }
                return _.reduce(attrValidationSet, function (memo, attrValidation) {
                    _.each(_.without(_.keys(attrValidation), 'msg'), function (validator) {
                        memo.push({
                            fn: defaultValidators[validator],
                            val: attrValidation[validator],
                            msg: attrValidation.msg
                        });
                    });
                    return memo;
                }, []);
            };
            var validateAttr = function (model, attr, value, computed) {
                return _.reduce(getValidators(model, attr), function (memo, validator) {
                    var ctx = _.extend({}, formatFunctions, defaultValidators), result = validator.fn.call(ctx, value, attr, validator.val, model, computed);
                    if (result === false || memo === false) {
                        return false;
                    }
                    if (result && !memo) {
                        return validator.msg || result;
                    }
                    return memo;
                }, '');
            };
            var validateModel = function (model, attrs) {
                var error, invalidAttrs = {}, isValid = true, computed = _.clone(attrs), flattened = flatten(attrs);
                _.each(flattened, function (val, attr) {
                    error = validateAttr(model, attr, val, computed);
                    if (error) {
                        invalidAttrs[attr] = error;
                        isValid = false;
                    }
                });
                return {
                    invalidAttrs: invalidAttrs,
                    isValid: isValid
                };
            };
            var mixin = function (view, options) {
                return {
                    preValidate: function (attr, value) {
                        return validateAttr(this, attr, value, _.extend({}, this.attributes));
                    },
                    isValid: function (option) {
                        var flattened = flatten(this.attributes);
                        if (_.isString(option)) {
                            return !validateAttr(this, option, flattened[option], _.extend({}, this.attributes));
                        }
                        if (_.isArray(option)) {
                            return _.reduce(option, function (memo, attr) {
                                return memo && !validateAttr(this, attr, flattened[attr], _.extend({}, this.attributes));
                            }, true, this);
                        }
                        if (option === true) {
                            this.validate();
                        }
                        return this.validation ? this._isValid : true;
                    },
                    validate: function (attrs, setOptions) {
                        var model = this, validateAll = !attrs, opt = _.extend({}, options, setOptions), validatedAttrs = getValidatedAttrs(model), allAttrs = _.extend({}, validatedAttrs, model.attributes, attrs), changedAttrs = flatten(attrs || allAttrs), result = validateModel(model, allAttrs);
                        model._isValid = result.isValid;
                        _.each(validatedAttrs, function (val, attr) {
                            var invalid = result.invalidAttrs.hasOwnProperty(attr);
                            if (!invalid) {
                                opt.valid(view, attr, opt.selector);
                            }
                        });
                        _.each(validatedAttrs, function (val, attr) {
                            var invalid = result.invalidAttrs.hasOwnProperty(attr), changed = changedAttrs.hasOwnProperty(attr);
                            if (invalid && (changed || validateAll)) {
                                opt.invalid(view, attr, result.invalidAttrs[attr], opt.selector);
                            }
                        });
                        if (!opt.forceUpdate && _.intersection(_.keys(result.invalidAttrs), _.keys(changedAttrs)).length > 0) {
                            return result.invalidAttrs;
                        }
                    }
                };
            };
            var bindModel = function (view, model, options) {
                _.extend(model, mixin(view, options));
            };
            var unbindModel = function (model) {
                delete model.validate;
                delete model.preValidate;
                delete model.isValid;
            };
            var collectionAdd = function (model) {
                bindModel(this.view, model, this.options);
            };
            var collectionRemove = function (model) {
                unbindModel(model);
            };
            return {
                version: '0.8.0',
                configure: function (options) {
                    _.extend(defaultOptions, options);
                },
                bind: function (view, options) {
                    var model = view.model, collection = view.collection;
                    options = _.extend({}, defaultOptions, defaultCallbacks, options);
                    if (typeof model === 'undefined' && typeof collection === 'undefined') {
                        throw 'Before you execute the binding your view must have a model or a collection.\n' + 'See http://thedersen.com/projects/backbone-validation/#using-form-model-validation for more information.';
                    }
                    if (model) {
                        bindModel(view, model, options);
                    } else if (collection) {
                        collection.each(function (model) {
                            bindModel(view, model, options);
                        });
                        collection.bind('add', collectionAdd, {
                            view: view,
                            options: options
                        });
                        collection.bind('remove', collectionRemove);
                    }
                },
                unbind: function (view) {
                    var model = view.model, collection = view.collection;
                    if (model) {
                        unbindModel(view.model);
                    }
                    if (collection) {
                        collection.each(function (model) {
                            unbindModel(model);
                        });
                        collection.unbind('add', collectionAdd);
                        collection.unbind('remove', collectionRemove);
                    }
                },
                mixin: mixin(null, defaultOptions)
            };
        }();
        var defaultCallbacks = Validation.callbacks = {
            valid: function (view, attr, selector) {
                view.$('[' + selector + '~="' + attr + '"]').removeClass('invalid').removeAttr('data-error');
            },
            invalid: function (view, attr, error, selector) {
                view.$('[' + selector + '~="' + attr + '"]').addClass('invalid').attr('data-error', error);
            }
        };
        var defaultPatterns = Validation.patterns = {
            digits: /^\d+$/,
            number: /^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/,
            email: /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i,
            url: /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i
        };
        var defaultMessages = Validation.messages = {
            required: '{0} is required',
            acceptance: '{0} must be accepted',
            min: '{0} must be greater than or equal to {1}',
            max: '{0} must be less than or equal to {1}',
            range: '{0} must be between {1} and {2}',
            length: '{0} must be {1} characters',
            minLength: '{0} must be at least {1} characters',
            maxLength: '{0} must be at most {1} characters',
            rangeLength: '{0} must be between {1} and {2} characters',
            oneOf: '{0} must be one of: {1}',
            equalTo: '{0} must be the same as {1}',
            pattern: '{0} must be a valid {1}'
        };
        var defaultLabelFormatters = Validation.labelFormatters = {
            none: function (attrName) {
                return attrName;
            },
            sentenceCase: function (attrName) {
                return attrName.replace(/(?:^\w|[A-Z]|\b\w)/g, function (match, index) {
                    return index === 0 ? match.toUpperCase() : ' ' + match.toLowerCase();
                }).replace('_', ' ');
            },
            label: function (attrName, model) {
                return model.labels && model.labels[attrName] || defaultLabelFormatters.sentenceCase(attrName, model);
            }
        };
        var defaultValidators = Validation.validators = function () {
            var trim = String.prototype.trim ? function (text) {
                return text === null ? '' : String.prototype.trim.call(text);
            } : function (text) {
                var trimLeft = /^\s+/, trimRight = /\s+$/;
                return text === null ? '' : text.toString().replace(trimLeft, '').replace(trimRight, '');
            };
            var isNumber = function (value) {
                return _.isNumber(value) || _.isString(value) && value.match(defaultPatterns.number);
            };
            var hasValue = function (value) {
                return !(_.isNull(value) || _.isUndefined(value) || _.isString(value) && trim(value) === '');
            };
            return {
                fn: function (value, attr, fn, model, computed) {
                    if (_.isString(fn)) {
                        fn = model[fn];
                    }
                    return fn.call(model, value, attr, computed);
                },
                required: function (value, attr, required, model, computed) {
                    var isRequired = _.isFunction(required) ? required.call(model, value, attr, computed) : required;
                    if (!isRequired && !hasValue(value)) {
                        return false;
                    }
                    if (isRequired && !hasValue(value)) {
                        return this.format(defaultMessages.required, this.formatLabel(attr, model));
                    }
                },
                acceptance: function (value, attr, accept, model) {
                    if (value !== 'true' && (!_.isBoolean(value) || value === false)) {
                        return this.format(defaultMessages.acceptance, this.formatLabel(attr, model));
                    }
                },
                min: function (value, attr, minValue, model) {
                    if (!isNumber(value) || value < minValue) {
                        return this.format(defaultMessages.min, this.formatLabel(attr, model), minValue);
                    }
                },
                max: function (value, attr, maxValue, model) {
                    if (!isNumber(value) || value > maxValue) {
                        return this.format(defaultMessages.max, this.formatLabel(attr, model), maxValue);
                    }
                },
                range: function (value, attr, range, model) {
                    if (!isNumber(value) || value < range[0] || value > range[1]) {
                        return this.format(defaultMessages.range, this.formatLabel(attr, model), range[0], range[1]);
                    }
                },
                length: function (value, attr, length, model) {
                    if (!hasValue(value) || trim(value).length !== length) {
                        return this.format(defaultMessages.length, this.formatLabel(attr, model), length);
                    }
                },
                minLength: function (value, attr, minLength, model) {
                    if (!hasValue(value) || trim(value).length < minLength) {
                        return this.format(defaultMessages.minLength, this.formatLabel(attr, model), minLength);
                    }
                },
                maxLength: function (value, attr, maxLength, model) {
                    if (!hasValue(value) || trim(value).length > maxLength) {
                        return this.format(defaultMessages.maxLength, this.formatLabel(attr, model), maxLength);
                    }
                },
                rangeLength: function (value, attr, range, model) {
                    if (!hasValue(value) || trim(value).length < range[0] || trim(value).length > range[1]) {
                        return this.format(defaultMessages.rangeLength, this.formatLabel(attr, model), range[0], range[1]);
                    }
                },
                oneOf: function (value, attr, values, model) {
                    if (!_.include(values, value)) {
                        return this.format(defaultMessages.oneOf, this.formatLabel(attr, model), values.join(', '));
                    }
                },
                equalTo: function (value, attr, equalTo, model, computed) {
                    if (value !== computed[equalTo]) {
                        return this.format(defaultMessages.equalTo, this.formatLabel(attr, model), this.formatLabel(equalTo, model));
                    }
                },
                pattern: function (value, attr, pattern, model) {
                    if (!hasValue(value) || !value.toString().match(defaultPatterns[pattern] || pattern)) {
                        return this.format(defaultMessages.pattern, this.formatLabel(attr, model), pattern);
                    }
                }
            };
        }();
        return Validation;
    }(_);
    return Backbone.Validation;
});
define('SC.EventWrapper', [
    'Application',
    'Backbone.Validation',
    'underscore'
], function (Application, BackboneValidation, _) {
    'use strict';
    return {
        name: 'SCEventWrapper',
        extend: function (model) {
            if (!model.name && !this.name) {
                throw {
                    status: 400,
                    code: 'ERR_MISSING_MODEL_NAME',
                    message: 'Missing model name.'
                };
            }
            var new_model = {};
            _.extend(new_model, this, model);
            _.each(new_model, function (value, key) {
                if (typeof value === 'function' && key !== 'extend') {
                    new_model[key] = wrapFunctionWithEvents(key, new_model, value);
                }
            });
            return new_model;
        }
    };
    function wrapFunctionWithEvents(methodName, model, fn) {
        return _.wrap(fn, function (func) {
            var args = _.toArray(arguments).slice(1);
            Application.trigger.apply(Application, [
                'before:' + model.name + '.' + methodName,
                this
            ].concat(args));
            var result = func.apply(this, args);
            Application.trigger.apply(Application, [
                'after:' + model.name + '.' + methodName,
                this,
                result
            ].concat(args));
            return result;
        });
    }
});
define('ServiceController.Validations', [
    'underscore',
    'Application',
    'Models.Init'
], function (_, Application, ModelsInit) {
    'use strict';
    return {
        _evaluatePermissions: function (user_permissions, required_permissions, permissions_operator) {
            permissions_operator = permissions_operator || 'and';
            var evaluation = permissions_operator !== 'or';
            if (permissions_operator !== 'and' && permissions_operator !== 'or') {
                console.log('Invalid permissions operator. Allowed values are: or, and');
                return false;
            }
            if (!_.isArray(required_permissions)) {
                console.log('Invalid permissions format in controller', this.name);
                return false;
            }
            _.each(required_permissions, function (perm) {
                var tokens = perm.split('.');
                var partial_evaluation = !(tokens.length === 3 && tokens[2] < 5 && user_permissions && user_permissions[tokens[0]] && user_permissions[tokens[0]][tokens[1]] < tokens[2]);
                if (permissions_operator === 'or') {
                    evaluation = evaluation || partial_evaluation;
                } else {
                    evaluation = evaluation && partial_evaluation;
                }
            });
            return evaluation;
        },
        requirePermissions: function (options) {
            var required_permissions = (options.list || []).concat(options.extraList || []);
            if (!this._evaluatePermissions(Application.getPermissions(), required_permissions, options.operator)) {
                throw forbiddenError;
            }
        },
        requireSecure: function () {
            if (!~this.request.getURL().indexOf('https')) {
                throw methodNotAllowedError;
            }
        },
        requireLoggedInPPS: function () {
            var isRegistrationDisabled = ModelsInit.session.getSiteSettings(['registration']).registration.registrationmandatory === 'T';
            if (!isRegistrationDisabled && SC.Configuration.passwordProtectedSite && !ModelsInit.session.isLoggedIn2()) {
                throw unauthorizedError;
            }
        },
        requireLogin: function () {
            if (!ModelsInit.session.isLoggedIn2()) {
                throw unauthorizedError;
            }
        },
        checkLoggedInCheckout: function () {
            if (~request.getURL().indexOf('https') && !session.isLoggedIn2()) {
                throw unauthorizedError;
            }
        }
    };
});
define('ServiceController', [
    'SC.EventWrapper',
    'Application',
    'Models.Init',
    'ServiceController.Validations',
    'underscore'
], function (SCEventWrapper, Application, ModelsInit, ServiceControllerValidations, _) {
    'use strict';
    return SCEventWrapper.extend({
        name: 'ServiceController',
        getMethod: function () {
            return this.request.getMethod().toLowerCase();
        },
        options: {},
        _deepObjectExtend: function _deepObjectExtend(target, source) {
            for (var prop in source) {
                if (prop in target) {
                    this._deepObjectExtend(target[prop], source[prop]);
                } else {
                    target[prop] = source[prop];
                }
            }
            return target;
        },
        getOptions: function (method) {
            return this._deepObjectExtend(this.options.common || {}, this.options[method] || {});
        },
        validateRequest: function (validation_options) {
            _.each(validation_options, function (validation_option, validation_name) {
                if (_.isFunction(ServiceControllerValidations[validation_name])) {
                    ServiceControllerValidations[validation_name](validation_option);
                }
            });
        },
        handle: function (request, response) {
            this.request = request;
            this.response = response;
            this.method = this.getMethod();
            this.data = JSON.parse(this.request.getBody() || '{}');
            try {
                this.validateRequest(this.getOptions(this.method));
                if (_.isFunction(this[this.method])) {
                    var result = this[this.method]();
                    if (result) {
                        return this.sendContent(result);
                    }
                } else {
                    return this.sendError(methodNotAllowedError);
                }
            } catch (e) {
                return this.sendError(e);
            }
        },
        sendContent: function (content, options) {
            options = _.extend({
                status: 200,
                cache: false
            }, options || {});
            Application.trigger('before:ServiceController.sendContent', content, options);
            this.response.setHeader('Custom-Header-Status', parseInt(options.status, 10).toString());
            var content_type = false;
            if (_.isArray(content) || _.isObject(content)) {
                content_type = 'JSON';
                content = JSON.stringify(content);
            }
            if (this.request.getParameter('jsonp_callback')) {
                content_type = 'JAVASCRIPT';
                content = request.getParameter('jsonp_callback') + '(' + content + ');';
            }
            if (options.cache) {
                this.response.setCDNCacheable(options.cache);
            }
            content_type && this.response.setContentType(content_type);
            this.response.write(content);
            Application.trigger('after:ServiceController.sendContent', content, options);
        },
        processError: function (e) {
            var status = 500, code = 'ERR_UNEXPECTED', message = 'error';
            if (e instanceof nlobjError) {
                code = e.getCode();
                message = e.getDetails();
                status = badRequestError.status;
            } else if (_.isObject(e) && !_.isUndefined(e.status)) {
                status = e.status;
                code = e.code;
                message = e.message;
            } else {
                var error = nlapiCreateError(e);
                code = error.getCode();
                message = error.getDetails() !== '' ? error.getDetails() : error.getCode();
            }
            if (code === 'INSUFFICIENT_PERMISSION') {
                status = forbiddenError.status;
                code = forbiddenError.code;
                message = forbiddenError.message;
            }
            var content = {
                errorStatusCode: parseInt(status, 10).toString(),
                errorCode: code,
                errorMessage: message
            };
            if (e.errorDetails) {
                content.errorDetails = e.errorDetails;
            }
            return content;
        },
        sendError: function (e) {
            _.extend(e, { 'serviceControllerName': this.name });
            Application.trigger('before:ServiceController.sendError', e);
            var content = this.processError(e), content_type = 'JSON';
            this.response.setHeader('Custom-Header-Status', content.errorStatusCode);
            if (this.request.getParameter('jsonp_callback')) {
                content_type = 'JAVASCRIPT';
                content = this.request.getParameter('jsonp_callback') + '(' + JSON.stringify(content) + ');';
            } else {
                content = JSON.stringify(content);
            }
            this.response.setContentType(content_type);
            this.response.write(content);
            Application.trigger('after:ServiceController.sendError', e);
        }
    });
});
define('SC.Model', [
    'SC.EventWrapper',
    'Models.Init',
    'Application',
    'Backbone.Validation',
    'underscore'
], function (SCEventWrapper, ModelsInit, Application, BackboneValidation, _) {
    'use strict';
    var SCModel = SCEventWrapper.extend({
        name: 'SCModel',
        validate: function (data) {
            if (this.validation) {
                var validator = _.extend({
                        validation: this.validation,
                        attributes: data
                    }, BackboneValidation.mixin), invalidAttributes = validator.validate();
                if (!validator.isValid()) {
                    throw {
                        status: 400,
                        code: 'ERR_BAD_REQUEST',
                        message: invalidAttributes
                    };
                }
            }
        }
    });
    return SCModel;
});
define('Profile.Model', [
    'SC.Model',
    'Models.Init',
    'Utils'
], function (SCModel, ModelsInit, Utils) {
    'use strict';
    return SCModel.extend({
        name: 'Profile',
        validation: {
            firstname: {
                required: true,
                msg: 'First Name is required'
            },
            lastname: {
                required: true,
                msg: 'Last Name is required'
            },
            email: {
                required: true,
                pattern: 'email',
                msg: 'Email is required'
            },
            confirm_email: {
                equalTo: 'email',
                msg: 'Emails must match'
            }
        },
        isSecure: request.getURL().indexOf('https') === 0,
        isLoggedIn: ModelsInit.session.isLoggedIn2(),
        get: function () {
            var profile = {};
            if (this.isLoggedIn && this.isSecure) {
                this.fields = this.fields || [
                    'isperson',
                    'email',
                    'internalid',
                    'name',
                    'overduebalance',
                    'phoneinfo',
                    'companyname',
                    'firstname',
                    'lastname',
                    'middlename',
                    'emailsubscribe',
                    'campaignsubscriptions',
                    'paymentterms',
                    'creditlimit',
                    'balance',
                    'creditholdoverride'
                ];
                profile = ModelsInit.customer.getFieldValues(this.fields);
                profile.phone = profile.phoneinfo.phone;
                profile.altphone = profile.phoneinfo.altphone;
                profile.fax = profile.phoneinfo.fax;
                profile.priceLevel = ModelsInit.session.getShopperPriceLevel().internalid ? ModelsInit.session.getShopperPriceLevel().internalid : ModelsInit.session.getSiteSettings(['defaultpricelevel']).defaultpricelevel;
                profile.type = profile.isperson ? 'INDIVIDUAL' : 'COMPANY';
                profile.isGuest = ModelsInit.customer.isGuest() ? 'T' : 'F';
                profile.creditlimit = parseFloat(profile.creditlimit || 0);
                profile.creditlimit_formatted = Utils.formatCurrency(profile.creditlimit);
                profile.balance = parseFloat(profile.balance || 0);
                profile.balance_formatted = Utils.formatCurrency(profile.balance);
                profile.balance_available = profile.creditlimit - profile.balance;
                profile.balance_available_formatted = Utils.formatCurrency(profile.balance_available);
            } else {
                profile = ModelsInit.customer.getFieldValues();
                profile.subsidiary = ModelsInit.session.getShopperSubsidiary();
                profile.language = ModelsInit.session.getShopperLanguageLocale();
                profile.currency = ModelsInit.session.getShopperCurrency();
                profile.isLoggedIn = this.isLoggedIn ? 'T' : 'F';
                profile.isRecognized = session.isRecognized() ? 'T' : 'F';
                profile.isGuest = ModelsInit.customer.isGuest() ? 'T' : 'F';
                profile.priceLevel = ModelsInit.session.getShopperPriceLevel().internalid ? ModelsInit.session.getShopperPriceLevel().internalid : ModelsInit.session.getSiteSettings('defaultpricelevel');
                profile.internalid = nlapiGetUser() + '';
            }
            return profile;
        },
        update: function (data) {
            var login = nlapiGetLogin();
            if (data.current_password && data.password && data.password === data.confirm_password) {
                return login.changePassword(data.current_password, data.password);
            }
            this.currentSettings = ModelsInit.customer.getFieldValues();
            var customerUpdate = { internalid: parseInt(nlapiGetUser(), 10) };
            customerUpdate.firstname = data.firstname;
            if (data.lastname !== '') {
                customerUpdate.lastname = data.lastname;
            }
            if (this.currentSettings.lastname === data.lastname) {
                delete this.validation.lastname;
            }
            customerUpdate.companyname = data.companyname;
            customerUpdate.phoneinfo = {
                altphone: data.altphone,
                phone: data.phone,
                fax: data.fax
            };
            if (data.phone !== '') {
                customerUpdate.phone = data.phone;
            }
            if (this.currentSettings.phone === data.phone) {
                delete this.validation.phone;
            }
            customerUpdate.emailsubscribe = data.emailsubscribe && data.emailsubscribe !== 'F' ? 'T' : 'F';
            if (!(this.currentSettings.companyname === '' || this.currentSettings.isperson || ModelsInit.session.getSiteSettings(['registration']).registration.companyfieldmandatory !== 'T')) {
                this.validation.companyname = {
                    required: true,
                    msg: 'Company Name is required'
                };
            }
            if (!this.currentSettings.isperson) {
                delete this.validation.firstname;
                delete this.validation.lastname;
            }
            if (data.email && data.email !== this.currentSettings.email && data.email === data.confirm_email) {
                if (data.isGuest === 'T') {
                    customerUpdate.email = data.email;
                } else {
                    login.changeEmail(data.current_password, data.email, true);
                }
            }
            data.confirm_email = data.email;
            this.validate(data);
            ModelsInit.customer.updateProfile(customerUpdate);
            if (data.campaignsubscriptions) {
                ModelsInit.customer.updateCampaignSubscriptions(data.campaignsubscriptions);
            }
            return this.get();
        }
    });
});
define('StoreItem.Model', [
    'SC.Model',
    'Models.Init',
    'underscore'
], function (SCModel, ModelsInit, _) {
    'use strict';
    return SCModel.extend({
        name: 'StoreItem',
        preloadItems: function (items, fieldset_name) {
            var self = this, items_by_id = {}, parents_by_id = {};
            items = items || [];
            this.preloadedItems = this.preloadedItems || {};
            items.forEach(function (item) {
                if (!item.id || !item.type || item.type === 'Discount' || item.type === 'OthCharge' || item.type === 'Markup') {
                    return;
                }
                if (!self.getPreloadedItem(item.id, fieldset_name)) {
                    items_by_id[item.id] = {
                        internalid: new String(item.id).toString(),
                        itemtype: item.type,
                        itemfields: SC.Configuration.fieldKeys.itemsFieldsStandardKeys
                    };
                }
            });
            if (!_.size(items_by_id)) {
                return this.preloadedItems;
            }
            var items_details = this.getItemFieldValues(items_by_id, fieldset_name);
            _.each(items_details, function (item) {
                if (item && typeof item.itemid !== 'undefined') {
                    if (item.itemoptions_detail && item.itemoptions_detail.matrixtype === 'child') {
                        parents_by_id[item.itemoptions_detail.parentid] = {
                            internalid: new String(item.itemoptions_detail.parentid).toString(),
                            itemtype: item.itemtype,
                            itemfields: SC.Configuration.fieldKeys.itemsFieldsStandardKeys
                        };
                    }
                    self.setPreloadedItem(item.internalid, item, fieldset_name);
                }
            });
            if (_.size(parents_by_id)) {
                var parents_details = this.getItemFieldValues(parents_by_id, fieldset_name);
                _.each(parents_details, function (item) {
                    if (item && typeof item.itemid !== 'undefined') {
                        self.setPreloadedItem(item.internalid, item, fieldset_name);
                    }
                });
            }
            _.each(this.preloadedItems, function (item) {
                if (item.itemoptions_detail && item.itemoptions_detail.matrixtype === 'child') {
                    item.matrix_parent = self.getPreloadedItem(item.itemoptions_detail.parentid, fieldset_name);
                }
            });
            return this.preloadedItems;
        },
        getItemFieldValues: function (items_by_id, fieldset_name) {
            var item_ids = _.values(items_by_id), is_advanced = ModelsInit.session.getSiteSettings(['sitetype']).sitetype === 'ADVANCED';
            if (is_advanced) {
                try {
                    fieldset_name = _.isUndefined(fieldset_name) ? SC.Configuration.fieldKeys.itemsFieldsAdvancedName : fieldset_name;
                    return ModelsInit.session.getItemFieldValues(fieldset_name, _.pluck(item_ids, 'internalid')).items;
                } catch (e) {
                    throw invalidItemsFieldsAdvancedName;
                }
            } else {
                return ModelsInit.session.getItemFieldValues(item_ids);
            }
        },
        get: function (id, type, fieldset_name) {
            this.preloadedItems = this.preloadedItems || {};
            if (!this.getPreloadedItem(id, fieldset_name)) {
                this.preloadItems([{
                        id: id,
                        type: type
                    }], fieldset_name);
            }
            return this.getPreloadedItem(id, fieldset_name);
        },
        getPreloadedItem: function (id, fieldset_name) {
            return this.preloadedItems[this.getItemKey(id, fieldset_name)];
        },
        setPreloadedItem: function (id, item, fieldset_name) {
            this.preloadedItems[this.getItemKey(id, fieldset_name)] = item;
        },
        getItemKey: function (id, fieldset_name) {
            fieldset_name = _.isUndefined(fieldset_name) ? SC.Configuration.fieldKeys.itemsFieldsAdvancedName : fieldset_name;
            return id + '#' + fieldset_name;
        },
        set: function (item, fieldset_name) {
            this.preloadedItems = this.preloadedItems || {};
            if (item.internalid) {
                this.setPreloadedItem(item.internalid, item, fieldset_name);
            }
        }
    });
});
define('SiteSettings.Model', [
    'SC.Model',
    'Models.Init',
    'underscore',
    'Utils'
], function (SCModel, ModelsInit, _, Utils) {
    'use strict';
    return SCModel.extend({
        name: 'SiteSettings',
        get: function () {
            var i, countries, shipToCountries, settings = ModelsInit.session.getSiteSettings();
            if (settings.shipallcountries === 'F') {
                if (settings.shiptocountries) {
                    shipToCountries = {};
                    for (i = 0; i < settings.shiptocountries.length; i++) {
                        shipToCountries[settings.shiptocountries[i]] = true;
                    }
                }
            }
            var allCountries = ModelsInit.session.getCountries();
            if (shipToCountries) {
                countries = {};
                for (i = 0; i < allCountries.length; i++) {
                    if (shipToCountries[allCountries[i].code]) {
                        countries[allCountries[i].code] = allCountries[i];
                    }
                }
            } else {
                countries = {};
                for (i = 0; i < allCountries.length; i++) {
                    countries[allCountries[i].code] = allCountries[i];
                }
            }
            var allStates = ModelsInit.session.getStates();
            if (allStates) {
                for (i = 0; i < allStates.length; i++) {
                    if (countries[allStates[i].countrycode]) {
                        countries[allStates[i].countrycode].states = allStates[i].states;
                    }
                }
            }
            settings.countries = countries;
            settings.phoneformat = ModelsInit.context.getPreference('phoneformat');
            settings.minpasswordlength = ModelsInit.context.getPreference('minpasswordlength');
            settings.campaignsubscriptions = ModelsInit.context.getFeature('CAMPAIGNSUBSCRIPTIONS');
            settings.analytics.confpagetrackinghtml = _.escape(settings.analytics.confpagetrackinghtml);
            settings.groupseparator = window.groupseparator;
            settings.decimalseparator = window.decimalseparator;
            settings.negativeprefix = window.negativeprefix;
            settings.negativesuffix = window.negativesuffix;
            settings.dateformat = window.dateformat;
            settings.longdateformat = window.longdateformat;
            settings.isMultiShippingRoutesEnabled = SC.Configuration.isMultiShippingEnabled && ModelsInit.context.getSetting('FEATURE', 'MULTISHIPTO') === 'T';
            settings.isSCISIntegrationEnabled = SC.Configuration.isSCISIntegrationEnabled && Utils.recordTypeHasField('salesorder', 'custbody_ns_pos_transaction_status');
            settings.is_logged_in = session.isLoggedIn2();
            settings.shopperCurrency = session.getShopperCurrency();
            settings.touchpoints = this.getTouchPoints();
            delete settings.entrypoints;
            return settings;
        },
        getTouchPoints: function () {
            var touchpoints = ModelsInit.session.getSiteSettings(['touchpoints']).touchpoints;
            if (touchpoints) {
                touchpoints.storelocator = touchpoints.login.replace('is=login', 'is=storelocator');
            }
            return touchpoints;
        }
    });
});
define('ExternalPayment.Model', [
    'SC.Model',
    'underscore',
    'Models.Init',
    'SiteSettings.Model',
    'Utils'
], function (SCModel, _, ModelsInit, SiteSettings, Utils) {
    'use strict';
    return SCModel.extend({
        name: 'ExternalPayment',
        errorCode: [
            'externalPaymentValidationStatusFail',
            'externalPaymentRequestInvalidParameters',
            'externalPaymentMissingImplementation',
            'externalPaymentRecordValidationStatusFail'
        ],
        generateUrl: function (id, record_type) {
            this.siteSettings = this.siteSettings || SiteSettings.get();
            var parameters = [
                'nltranid=' + id,
                'orderId=' + id,
                'n=' + this.siteSettings.siteid,
                'recordType=' + record_type,
                'goToExternalPayment=T'
            ];
            return ModelsInit.session.getAbsoluteUrl('checkout', '/external_payment.ssp?' + parameters.join('&'));
        },
        goToExternalPayment: function (request) {
            var record_type = request.getParameter('recordType'), id = request.getParameter('orderId') || request.getParameter('nltranid'), touchpoint = request.getParameter('touchpoint'), result = { parameters: {} }, record = this._loadRecord(record_type, id);
            if (!this._validateRecordStatus(record)) {
                result.touchpoint = touchpoint;
                result.parameters.errorCode = 'externalPaymentValidationStatusFail';
            } else {
                ModelsInit.context.setSessionObject('external_nltranid_' + id, id);
                result.url = record.getFieldValue('redirecturl');
            }
            return result;
        },
        backFromExternalPayment: function (request) {
            var id = request.getParameter('orderId') || request.getParameter('nltranid'), record_type = request.getParameter('recordType'), touchpoint = request.getParameter('touchpoint'), result = {
                    touchpoint: touchpoint,
                    parameters: {
                        nltranid: id,
                        recordType: record_type,
                        externalPayment: this._isDone(request, record_type) ? 'DONE' : this._isReject(request, record_type) ? 'FAIL' : ''
                    }
                };
            if (!this._preventDefault(request, record_type)) {
                var record = this._loadRecord(record_type, id);
                if (!this._validateRecordStatus(record)) {
                    result.parameters.errorCode = 'externalPaymentRecordValidationStatusFail';
                } else if (!this._validateStatusFromRequest(request, record_type) || !this._validateTransactionId(id)) {
                    result.parameters.errorCode = 'externalPaymentRequestInvalidParameters';
                } else {
                    var method_name = '_updatePaymentMethod' + record_type.toUpperCase();
                    if (_.isFunction(this[method_name])) {
                        this[method_name](record, request);
                    } else {
                        result.parameters.errorCode = 'externalPaymentMissingImplementation';
                    }
                }
            }
            ModelsInit.context.setSessionObject('external_nltranid_' + id, '');
            return result;
        },
        getParametersFromRequest: function (request) {
            var nltranid = parseInt(request.getParameter('nltranid') || request.getParameter('orderId'), 10), record_type = request.getParameter('recordType'), external_payment = request.getParameter('externalPayment'), error_code = request.getParameter('errorCode'), result;
            if ((external_payment === 'DONE' || external_payment === 'FAIL') && !_.isNaN(nltranid) && record_type && Utils.recordTypeExists(record_type)) {
                result = {
                    recordType: record_type,
                    nltranid: nltranid,
                    externalPayment: external_payment,
                    errorCode: error_code ? _.contains(this.errorCode, error_code) ? error_code : 'externalPaymentRequestInvalidParameters' : ''
                };
            }
            return result;
        },
        _updatePaymentMethodCUSTOMERPAYMENT: function (record, request) {
            var record_type = 'customerpayment';
            if (this._isDone(request, record_type)) {
                record.setFieldValue('datafromredirect', this._getDataFromRedirect(request, record_type));
                record.setFieldValue('chargeit', 'T');
                nlapiSubmitRecord(record);
            }
        },
        _updatePaymentMethodSALESORDER: function (record, request) {
            var record_type = 'salesorder';
            if (this._isDone(request, record_type)) {
                record.setFieldValue('datafromredirect', this._getDataFromRedirect(request, record_type));
                record.setFieldValue('getauth', 'T');
                record.setFieldValue('paymentprocessingmode', 'PROCESS');
                nlapiSubmitRecord(record, false, true);
            }
        },
        _isDone: function (request, record_type) {
            var status = this._getStatusFromRequest(request, record_type), status_accept_value = this._getConfiguration(record_type, 'statusAcceptValue', 'ACCEPT'), status_hold_value = this._getConfiguration(record_type, 'statusHoldValue', 'HOLD');
            return status === status_accept_value || status === status_hold_value;
        },
        _isReject: function (request, record_type) {
            var status = this._getStatusFromRequest(request, record_type), status_reject_value = this._getConfiguration(record_type, 'statusRejectValue', 'REJECT');
            return status === status_reject_value;
        },
        _loadRecord: function (record_type, id) {
            return nlapiLoadRecord(record_type, id);
        },
        _validateRecordStatus: function (record) {
            return record.getFieldValue('paymenteventresult') === 'HOLD' && record.getFieldValue('paymenteventholdreason') === 'FORWARD_REQUESTED';
        },
        _getStatusFromRequest: function (request, record_type) {
            return request.getParameter(this._getConfiguration(record_type, 'statusParameterName', 'status'));
        },
        _validateStatusFromRequest: function (request, record_type) {
            var status = this._getStatusFromRequest(request, record_type), status_accept_value = this._getConfiguration(record_type, 'statusAcceptValue', 'ACCEPT'), status_hold_value = this._getConfiguration(record_type, 'statusHoldValue', 'HOLD'), status_reject_value = this._getConfiguration(record_type, 'statusRejectValue', 'REJECT');
            return status === status_accept_value || status === status_hold_value || status === status_reject_value;
        },
        _validateTransactionId: function (nltranid) {
            return ModelsInit.context.getSessionObject('external_nltranid_' + nltranid) === nltranid;
        },
        _getDataFromRedirect: function (request, record_type) {
            var request_parameters = request.getAllParameters(), configration_parameters = this._getConfiguration(record_type, 'parameters', [
                    'tranid',
                    'authcode',
                    'status'
                ]), data_from_redirect = [];
            _.each(_.keys(request_parameters), function (parameter_name) {
                if (_.contains(configration_parameters, parameter_name)) {
                    data_from_redirect.push(parameter_name + '=' + request_parameters[parameter_name]);
                }
            });
            console.log(JSON.stringify(data_from_redirect));
            return data_from_redirect.join('&');
        },
        _preventDefault: function (request, record_type) {
            var prevent_default_value = this._getConfiguration(record_type, 'preventDefaultValue', 'T'), prevent_default_parameter_name = this._getConfiguration(record_type, 'preventDefaultParameterName', 'preventDefault');
            return request.getParameter(prevent_default_parameter_name) === prevent_default_value;
        },
        _getConfiguration: function (record_type, property, default_value) {
            this.siteSettings = this.siteSettings || SiteSettings.get();
            var external_payment_configuration = this.siteSettings.externalPayment || {}, record_configuration = external_payment_configuration[record_type.toUpperCase()] || {};
            if (_.isUndefined(record_configuration[property])) {
                return default_value;
            } else {
                return record_configuration[property];
            }
        }
    });
});
define('LiveOrder.Model', [
    'SC.Model',
    'Application',
    'Profile.Model',
    'StoreItem.Model',
    'Models.Init',
    'SiteSettings.Model',
    'Utils',
    'ExternalPayment.Model',
    'underscore'
], function (SCModel, Application, Profile, StoreItem, ModelsInit, SiteSettings, Utils, ExternalPayment, _) {
    'use strict';
    return SCModel.extend({
        name: 'LiveOrder',
        get: function () {
            var order_fields = this.getFieldValues(), result = {};
            try {
                result.lines = this.getLines(order_fields);
            } catch (e) {
                if (e.code === 'ERR_CHK_ITEM_NOT_FOUND') {
                    return this.get();
                } else {
                    throw e;
                }
            }
            order_fields = this.hidePaymentPageWhenNoBalance(order_fields);
            result.lines_sort = this.getLinesSort();
            result.latest_addition = ModelsInit.context.getSessionObject('latest_addition');
            result.promocodes = this.getPromoCodes(order_fields);
            result.ismultishipto = this.getIsMultiShipTo(order_fields);
            if (result.ismultishipto) {
                result.multishipmethods = this.getMultiShipMethods(result.lines);
                result.shipmethods = [];
                result.shipmethod = null;
                if (result.promocodes && result.promocodes.length) {
                    this.removeAllPromocodesForMST(result.promocodes);
                    return this.get();
                }
            } else {
                result.shipmethods = this.getShipMethods(order_fields);
                result.shipmethod = order_fields.shipmethod ? order_fields.shipmethod.shipmethod : null;
            }
            result.addresses = this.getAddresses(order_fields);
            result.billaddress = order_fields.billaddress ? order_fields.billaddress.internalid : null;
            result.shipaddress = !result.ismultishipto ? order_fields.shipaddress.internalid : null;
            result.paymentmethods = this.getPaymentMethods(order_fields);
            result.isPaypalComplete = ModelsInit.context.getSessionObject('paypal_complete') === 'T';
            result.touchpoints = SiteSettings.getTouchPoints();
            result.agreetermcondition = order_fields.agreetermcondition === 'T';
            result.summary = order_fields.summary;
            result.options = this.getTransactionBodyField();
            result.purchasenumber = order_fields.purchasenumber;
            return result;
        },
        update: function (data) {
            var current_order = this.get();
            if (this.isMultiShippingEnabled) {
                if (this.isSecure && ModelsInit.session.isLoggedIn2()) {
                    ModelsInit.order.setEnableItemLineShipping(!!data.ismultishipto);
                }
                if (data.ismultishipto) {
                    ModelsInit.order.removeShippingAddress();
                    ModelsInit.order.removeShippingMethod();
                    this.removeAllPromocodesForMST(current_order.promocodes);
                    this.splitLines(data, current_order);
                    this.setShippingAddressAndMethod(data, current_order);
                }
            }
            if (!this.isMultiShippingEnabled || !data.ismultishipto) {
                this.setShippingAddress(data, current_order);
                this.setShippingMethod(data, current_order);
                this.setPromoCodes(data, current_order);
            }
            this.setBillingAddress(data, current_order);
            this.setPaymentMethods(data, current_order);
            this.setPurchaseNumber(data, current_order);
            this.setTermsAndConditions(data, current_order);
            this.setTransactionBodyField(data, current_order);
        },
        submit: function () {
            var paypal_address = _.find(ModelsInit.customer.getAddressBook(), function (address) {
                    return !address.phone && address.isvalid === 'T';
                }), confirmation = ModelsInit.order.submit();
            this.removePaypalAddress(paypal_address);
            ModelsInit.context.setSessionObject('paypal_complete', 'F');
            if (this.isMultiShippingEnabled) {
                ModelsInit.order.setEnableItemLineShipping(false);
            }
            this.setPurchaseNumber();
            if (confirmation.statuscode !== 'redirect') {
                confirmation = _.extend(this.getConfirmation(confirmation.internalid), confirmation);
            } else {
                confirmation.redirecturl = ExternalPayment.generateUrl(confirmation.internalid, 'salesorder');
            }
            return confirmation;
        },
        isSecure: request.getURL().indexOf('https') === 0,
        isMultiShippingEnabled: ModelsInit.context.getSetting('FEATURE', 'MULTISHIPTO') === 'T' && SC.Configuration.isMultiShippingEnabled,
        addAddress: function (address, addresses) {
            if (!address) {
                return null;
            }
            addresses = addresses || {};
            if (!address.fullname) {
                address.fullname = address.attention ? address.attention : address.addressee;
            }
            if (!address.company) {
                address.company = address.attention ? address.addressee : null;
            }
            delete address.attention;
            delete address.addressee;
            if (!address.internalid) {
                address.internalid = (address.country || '') + '-' + (address.state || '') + '-' + (address.city || '') + '-' + (address.zip || '') + '-' + (address.addr1 || '') + '-' + (address.addr2 || '') + '-' + (address.fullname || '') + '-' + address.company;
                address.internalid = address.internalid.replace(/\s/g, '-');
            }
            if (address.internalid !== '-------null') {
                addresses[address.internalid] = address;
            }
            return address.internalid;
        },
        hidePaymentPageWhenNoBalance: function (order_fields) {
            if (this.isSecure && ModelsInit.session.isLoggedIn2() && order_fields.payment && ModelsInit.session.getSiteSettings(['checkout']).checkout.hidepaymentpagewhennobalance === 'T' && order_fields.summary.total === 0) {
                ModelsInit.order.removePayment();
                order_fields = this.getFieldValues();
            }
            return order_fields;
        },
        redirectToPayPal: function () {
            var touchpoints = ModelsInit.session.getSiteSettings(['touchpoints']).touchpoints, continue_url = 'https://' + request.getHeader('Host') + touchpoints.checkout, joint = ~continue_url.indexOf('?') ? '&' : '?';
            continue_url = continue_url + joint + 'paypal=DONE&fragment=' + request.getParameter('next_step');
            ModelsInit.session.proceedToCheckout({
                cancelurl: touchpoints.viewcart,
                continueurl: continue_url,
                createorder: 'F',
                type: 'paypalexpress',
                shippingaddrfirst: 'T',
                showpurchaseorder: 'T'
            });
        },
        redirectToPayPalExpress: function () {
            var touchpoints = ModelsInit.session.getSiteSettings(['touchpoints']).touchpoints, continue_url = 'https://' + request.getHeader('Host') + touchpoints.checkout, joint = ~continue_url.indexOf('?') ? '&' : '?';
            continue_url = continue_url + joint + 'paypal=DONE';
            ModelsInit.session.proceedToCheckout({
                cancelurl: touchpoints.viewcart,
                continueurl: continue_url,
                createorder: 'F',
                type: 'paypalexpress'
            });
        },
        getConfirmation: function (internalid) {
            var confirmation = { internalid: internalid };
            try {
                var record = nlapiLoadRecord('salesorder', confirmation.internalid);
                confirmation = this.confirmationCreateResult(record);
            } catch (e) {
                console.warn('Cart Confirmation could not be loaded, reason: ' + JSON.stringify(e));
            }
            return confirmation;
        },
        confirmationCreateResult: function (placed_order) {
            var result = {
                    internalid: placed_order.getId(),
                    tranid: placed_order.getFieldValue('tranid'),
                    summary: {
                        subtotal: Utils.toCurrency(placed_order.getFieldValue('subtotal')),
                        subtotal_formatted: Utils.formatCurrency(placed_order.getFieldValue('subtotal')),
                        taxtotal: Utils.toCurrency(placed_order.getFieldValue('taxtotal')),
                        taxtotal_formatted: Utils.formatCurrency(placed_order.getFieldValue('taxtotal')),
                        shippingcost: Utils.toCurrency(placed_order.getFieldValue('shippingcost')),
                        shippingcost_formatted: Utils.formatCurrency(placed_order.getFieldValue('shippingcost')),
                        handlingcost: Utils.toCurrency(placed_order.getFieldValue('althandlingcost')),
                        handlingcost_formatted: Utils.formatCurrency(placed_order.getFieldValue('althandlingcost')),
                        discounttotal: Utils.toCurrency(placed_order.getFieldValue('discounttotal')),
                        discounttotal_formatted: Utils.formatCurrency(placed_order.getFieldValue('discounttotal')),
                        giftcertapplied: Utils.toCurrency(placed_order.getFieldValue('giftcertapplied')),
                        giftcertapplied_formatted: Utils.formatCurrency(placed_order.getFieldValue('giftcertapplied')),
                        total: Utils.toCurrency(placed_order.getFieldValue('total')),
                        total_formatted: Utils.formatCurrency(placed_order.getFieldValue('total'))
                    }
                }, i = 0;
            result.promocodes = [];
            var promocode = placed_order.getFieldValue('promocode');
            if (promocode) {
                result.promocodes.push({
                    internalid: promocode,
                    code: placed_order.getFieldText('couponcode'),
                    isvalid: true,
                    discountrate_formatted: ''
                });
            }
            for (i = 1; i <= placed_order.getLineItemCount('promotions'); i++) {
                result.promocodes.push({
                    internalid: placed_order.getLineItemValue('promotions', 'couponcode', i),
                    code: placed_order.getLineItemValue('promotions', 'couponcode_display', i),
                    isvalid: placed_order.getLineItemValue('promotions', 'promotionisvalid', i) === 'T',
                    discountrate_formatted: ''
                });
            }
            result.paymentmethods = [];
            for (i = 1; i <= placed_order.getLineItemCount('giftcertredemption'); i++) {
                result.paymentmethods.push({
                    type: 'giftcertificate',
                    giftcertificate: {
                        code: placed_order.getLineItemValue('giftcertredemption', 'authcode_display', i),
                        amountapplied: placed_order.getLineItemValue('giftcertredemption', 'authcodeapplied', i),
                        amountapplied_formatted: Utils.formatCurrency(placed_order.getLineItemValue('giftcertredemption', 'authcodeapplied', i)),
                        amountremaining: placed_order.getLineItemValue('giftcertredemption', 'authcodeamtremaining', i),
                        amountremaining_formatted: Utils.formatCurrency(placed_order.getLineItemValue('giftcertredemption', 'authcodeamtremaining', i)),
                        originalamount: placed_order.getLineItemValue('giftcertredemption', 'giftcertavailable', i),
                        originalamount_formatted: Utils.formatCurrency(placed_order.getLineItemValue('giftcertredemption', 'giftcertavailable', i))
                    }
                });
            }
            result.lines = [];
            for (i = 1; i <= placed_order.getLineItemCount('item'); i++) {
                result.lines.push({
                    item: {
                        internalid: placed_order.getLineItemValue('item', 'item', i),
                        itemDisplay: placed_order.getLineItemValue('item', 'item_display', i)
                    },
                    quantity: parseInt(placed_order.getLineItemValue('item', 'quantity', i), 10),
                    rate: parseInt(placed_order.getLineItemValue('item', 'rate', i), 10),
                    options: placed_order.getLineItemValue('item', 'options', i)
                });
            }
            return result;
        },
        backFromPayPal: function () {
            var customer_values = Profile.get(), bill_address = ModelsInit.order.getBillingAddress(), ship_address = ModelsInit.order.getShippingAddress();
            if (customer_values.isGuest === 'T' && ModelsInit.session.getSiteSettings(['registration']).registration.companyfieldmandatory === 'T') {
                customer_values.companyname = 'Guest Shopper';
                ModelsInit.customer.updateProfile(customer_values);
            }
            if (ship_address.internalid && ship_address.isvalid === 'T' && !bill_address.internalid) {
                ModelsInit.order.setBillingAddress(ship_address.internalid);
            }
            ModelsInit.context.setSessionObject('paypal_complete', 'T');
        },
        removePaypalAddress: function (paypal_address) {
            try {
                if (paypal_address && paypal_address.internalid) {
                    ModelsInit.customer.removeAddress(paypal_address.internalid);
                }
            } catch (e) {
                var error = Application.processError(e);
                console.warn('Error ' + error.errorStatusCode + ': ' + error.errorCode + ' - ' + error.errorMessage);
            }
        },
        addLine: function (line_data) {
            var line_id = ModelsInit.order.addItem({
                internalid: line_data.item.internalid.toString(),
                quantity: _.isNumber(line_data.quantity) ? parseInt(line_data.quantity, 10) : 1,
                options: line_data.options || {}
            });
            if (this.isMultiShippingEnabled) {
                line_data.shipaddress && ModelsInit.order.setItemShippingAddress(line_id, line_data.shipaddress);
                line_data.shipmethod && ModelsInit.order.setItemShippingMethod(line_id, line_data.shipmethod);
            }
            ModelsInit.context.setSessionObject('latest_addition', line_id);
            var lines_sort = this.getLinesSort();
            lines_sort.unshift(line_id);
            this.setLinesSort(lines_sort);
            return line_id;
        },
        addLines: function (lines_data) {
            var items = [];
            _.each(lines_data, function (line_data) {
                var item = {
                    internalid: line_data.item.internalid.toString(),
                    quantity: _.isNumber(line_data.quantity) ? parseInt(line_data.quantity, 10) : 1,
                    options: line_data.options || {}
                };
                items.push(item);
            });
            var lines_ids = ModelsInit.order.addItems(items), latest_addition = _.last(lines_ids).orderitemid, lines_sort = this.getLinesSort();
            lines_sort.unshift(latest_addition);
            this.setLinesSort(lines_sort);
            ModelsInit.context.setSessionObject('latest_addition', latest_addition);
            return lines_ids;
        },
        removeLine: function (line_id) {
            ModelsInit.order.removeItem(line_id);
            var lines_sort = this.getLinesSort();
            lines_sort = _.without(lines_sort, line_id);
            this.setLinesSort(lines_sort);
        },
        updateLine: function (line_id, line_data) {
            var lines_sort = this.getLinesSort(), current_position = _.indexOf(lines_sort, line_id), original_line_object = ModelsInit.order.getItem(line_id, [
                    'quantity',
                    'internalid',
                    'options'
                ]);
            this.removeLine(line_id);
            if (!_.isNumber(line_data.quantity) || line_data.quantity > 0) {
                var new_line_id;
                try {
                    new_line_id = this.addLine(line_data);
                } catch (e) {
                    var roll_back_item = {
                        item: { internalid: parseInt(original_line_object.internalid, 10) },
                        quantity: parseInt(original_line_object.quantity, 10)
                    };
                    if (original_line_object.options && original_line_object.options.length) {
                        roll_back_item.options = {};
                        _.each(original_line_object.options, function (option) {
                            roll_back_item.options[option.id.toLowerCase()] = option.value;
                        });
                    }
                    new_line_id = this.addLine(roll_back_item);
                    e.errorDetails = {
                        status: 'LINE_ROLLBACK',
                        oldLineId: line_id,
                        newLineId: new_line_id
                    };
                    throw e;
                }
                lines_sort = _.without(lines_sort, line_id, new_line_id);
                lines_sort.splice(current_position, 0, new_line_id);
                this.setLinesSort(lines_sort);
            }
        },
        splitLines: function (data, current_order) {
            _.each(data.lines, function (line) {
                if (line.splitquantity) {
                    var splitquantity = typeof line.splitquantity === 'string' ? parseInt(line.splitquantity, 10) : line.splitquantity, original_line = _.find(current_order.lines, function (order_line) {
                            return order_line.internalid === line.internalid;
                        }), remaining = original_line ? original_line.quantity - splitquantity : -1;
                    if (remaining > 0 && splitquantity > 0) {
                        ModelsInit.order.splitItem({
                            'orderitemid': original_line.internalid,
                            'quantities': [
                                splitquantity,
                                remaining
                            ]
                        });
                    }
                }
            });
        },
        getFieldValues: function () {
            var order_field_keys = {}, isCheckout = this.isSecure && ModelsInit.session.isLoggedIn2(), field_keys = isCheckout ? SC.Configuration.orderCheckoutFieldKeys : SC.Configuration.orderShoppingFieldKeys;
            order_field_keys.items = field_keys.items;
            _.each(field_keys.keys, function (key) {
                order_field_keys[key] = null;
            });
            if (this.isMultiShippingEnabled) {
                if (!_.contains(order_field_keys.items, 'shipaddress')) {
                    order_field_keys.items.push('shipaddress');
                }
                if (!_.contains(order_field_keys.items, 'shipmethod')) {
                    order_field_keys.items.push('shipmethod');
                }
                order_field_keys.ismultishipto = null;
            }
            return ModelsInit.order.getFieldValues(order_field_keys, false);
        },
        removeAllPromocodesForMST: function removeAllPromocodesForMST(promocodes_to_remove) {
            this.removeAllPromocodes(promocodes_to_remove);
        },
        removeAllPromocodes: function removeAllPromocodes(promocodes_to_remove) {
            _.each(promocodes_to_remove || [], function (promo) {
                ModelsInit.order.removePromotionCode(promo.code);
            });
        },
        getPromoCodes: function getPromoCodes(order_fields) {
            var result = [];
            if (order_fields.promocodes && order_fields.promocodes.length) {
                _.each(order_fields.promocodes, function (promo_code) {
                    result.push({
                        internalid: promo_code.internalid,
                        code: promo_code.promocode,
                        isvalid: promo_code.isvalid === 'T',
                        discountrate_formatted: ''
                    });
                    if (promo_code.isvalid !== 'T' && false) {
                        ModelsInit.order.removePromotionCode(promo_code.promocode);
                    }
                });
            }
            return result;
        },
        setPromoCodes: function setPromoCodes(data, current_order) {
            this.removeAllPromocodes(current_order.promocodes);
            data.promocodes = data.promocodes || [];
            var valid_promocodes = _.filter(data.promocodes, function (promocode) {
                return promocode.isvalid !== false;
            });
            if (!SC.Configuration.get('promocodes.allowMultiples', true) && valid_promocodes.length > 1) {
                valid_promocodes = [valid_promocodes[0]];
            }
            _.each(valid_promocodes, function (promo) {
                ModelsInit.order.applyPromotionCode(promo.code);
            });
        },
        getMultiShipMethods: function (lines) {
            var multishipmethods = {};
            _.each(lines, function (line) {
                if (line.shipaddress) {
                    multishipmethods[line.shipaddress] = multishipmethods[line.shipaddress] || [];
                    multishipmethods[line.shipaddress].push(line.internalid);
                }
            });
            _.each(_.keys(multishipmethods), function (address) {
                var methods = ModelsInit.order.getAvailableShippingMethods(multishipmethods[address], address);
                _.each(methods, function (method) {
                    method.internalid = method.shipmethod;
                    method.rate_formatted = Utils.formatCurrency(method.rate);
                    delete method.shipmethod;
                });
                multishipmethods[address] = methods;
            });
            return multishipmethods;
        },
        getShipMethods: function (order_fields) {
            var shipmethods = _.map(order_fields.shipmethods, function (shipmethod) {
                var rate = Utils.toCurrency(shipmethod.rate.replace(/^\D+/g, '')) || 0;
                return {
                    internalid: shipmethod.shipmethod,
                    name: shipmethod.name,
                    shipcarrier: shipmethod.shipcarrier,
                    rate: rate,
                    rate_formatted: shipmethod.rate
                };
            });
            return shipmethods;
        },
        getLinesSort: function () {
            return ModelsInit.context.getSessionObject('lines_sort') ? ModelsInit.context.getSessionObject('lines_sort').split(',') : [];
        },
        getPaymentMethods: function (order_fields) {
            var paymentmethods = [], giftcertificates = ModelsInit.order.getAppliedGiftCertificates(), payment = order_fields && order_fields.payment, paypal = payment && _.findWhere(ModelsInit.session.getPaymentMethods(), { ispaypal: 'T' }), credit_card = payment && payment.creditcard;
            if (credit_card && credit_card.paymentmethod && credit_card.paymentmethod.creditcard === 'T') {
                paymentmethods.push({
                    type: 'creditcard',
                    primary: true,
                    creditcard: {
                        internalid: credit_card.internalid || '-temporal-',
                        ccnumber: credit_card.ccnumber,
                        ccname: credit_card.ccname,
                        ccexpiredate: credit_card.expmonth + '/' + credit_card.expyear,
                        ccsecuritycode: credit_card.ccsecuritycode,
                        expmonth: credit_card.expmonth,
                        expyear: credit_card.expyear,
                        paymentmethod: {
                            internalid: credit_card.paymentmethod.internalid,
                            name: credit_card.paymentmethod.name,
                            creditcard: credit_card.paymentmethod.creditcard === 'T',
                            ispaypal: credit_card.paymentmethod.ispaypal === 'T',
                            isexternal: credit_card.paymentmethod.isexternal === 'T',
                            key: credit_card.paymentmethod.key
                        }
                    }
                });
            } else if (paypal && payment.paymentmethod === paypal.internalid) {
                paymentmethods.push({
                    type: 'paypal',
                    primary: true,
                    complete: ModelsInit.context.getSessionObject('paypal_complete') === 'T',
                    internalid: paypal.internalid,
                    name: paypal.name,
                    creditcard: paypal.creditcard === 'T',
                    ispaypal: paypal.ispaypal === 'T',
                    isexternal: paypal.isexternal === 'T',
                    key: paypal.key
                });
            } else if (credit_card && credit_card.paymentmethod && credit_card.paymentmethod.isexternal === 'T') {
                paymentmethods.push({
                    type: 'external_checkout_' + credit_card.paymentmethod.key,
                    primary: true,
                    internalid: credit_card.paymentmethod.internalid,
                    name: credit_card.paymentmethod.name,
                    creditcard: credit_card.paymentmethod.creditcard === 'T',
                    ispaypal: credit_card.paymentmethod.ispaypal === 'T',
                    isexternal: credit_card.paymentmethod.isexternal === 'T',
                    key: credit_card.paymentmethod.key,
                    errorurl: payment.errorurl,
                    thankyouurl: payment.thankyouurl
                });
            } else if (order_fields.payment && order_fields.payment.paymentterms === 'Invoice') {
                var customer_invoice = ModelsInit.customer.getFieldValues([
                    'paymentterms',
                    'creditlimit',
                    'balance',
                    'creditholdoverride'
                ]);
                paymentmethods.push({
                    type: 'invoice',
                    primary: true,
                    paymentterms: customer_invoice.paymentterms,
                    creditlimit: parseFloat(customer_invoice.creditlimit || 0),
                    creditlimit_formatted: Utils.formatCurrency(customer_invoice.creditlimit),
                    balance: parseFloat(customer_invoice.balance || 0),
                    balance_formatted: Utils.formatCurrency(customer_invoice.balance),
                    creditholdoverride: customer_invoice.creditholdoverride
                });
            }
            if (giftcertificates && giftcertificates.length) {
                _.forEach(giftcertificates, function (giftcertificate) {
                    paymentmethods.push({
                        type: 'giftcertificate',
                        giftcertificate: {
                            code: giftcertificate.giftcertcode,
                            amountapplied: Utils.toCurrency(giftcertificate.amountapplied || 0),
                            amountapplied_formatted: Utils.formatCurrency(giftcertificate.amountapplied || 0),
                            amountremaining: Utils.toCurrency(giftcertificate.amountremaining || 0),
                            amountremaining_formatted: Utils.formatCurrency(giftcertificate.amountremaining || 0),
                            originalamount: Utils.toCurrency(giftcertificate.originalamount || 0),
                            originalamount_formatted: Utils.formatCurrency(giftcertificate.originalamount || 0)
                        }
                    });
                });
            }
            return paymentmethods;
        },
        getTransactionBodyField: function () {
            var options = {};
            if (this.isSecure) {
                _.each(ModelsInit.order.getCustomFieldValues(), function (option) {
                    options[option.name] = option.value;
                });
            }
            return options;
        },
        getAddresses: function (order_fields) {
            var self = this, addresses = {}, address_book = ModelsInit.session.isLoggedIn2() && this.isSecure ? ModelsInit.customer.getAddressBook() : [];
            address_book = _.object(_.pluck(address_book, 'internalid'), address_book);
            if (order_fields.ismultishipto === 'T') {
                _.each(order_fields.items || [], function (line) {
                    if (line.shipaddress && !addresses[line.shipaddress]) {
                        self.addAddress(address_book[line.shipaddress], addresses);
                    }
                });
            } else {
                this.addAddress(order_fields.shipaddress, addresses);
            }
            this.addAddress(order_fields.billaddress, addresses);
            return _.values(addresses);
        },
        getLines: function (order_fields) {
            var lines = [];
            if (order_fields.items && order_fields.items.length) {
                var self = this, items_to_preload = [], address_book = ModelsInit.session.isLoggedIn2() && this.isSecure ? ModelsInit.customer.getAddressBook() : [], item_ids_to_clean = [];
                address_book = _.object(_.pluck(address_book, 'internalid'), address_book);
                _.each(order_fields.items, function (original_line) {
                    var total = original_line.promotionamount ? Utils.toCurrency(original_line.promotionamount) : Utils.toCurrency(original_line.amount), discount = Utils.toCurrency(original_line.promotiondiscount) || 0, line_to_add;
                    line_to_add = {
                        internalid: original_line.orderitemid,
                        quantity: original_line.quantity,
                        rate: parseFloat(original_line.rate),
                        rate_formatted: original_line.rate_formatted,
                        amount: Utils.toCurrency(original_line.amount),
                        tax_amount: 0,
                        tax_rate: null,
                        tax_code: null,
                        discount: discount,
                        total: total,
                        item: original_line.internalid,
                        itemtype: original_line.itemtype,
                        options: original_line.options,
                        shipaddress: original_line.shipaddress,
                        shipmethod: original_line.shipmethod
                    };
                    lines.push(line_to_add);
                    if (line_to_add.shipaddress && !address_book[line_to_add.shipaddress]) {
                        line_to_add.shipaddress = null;
                        line_to_add.shipmethod = null;
                        item_ids_to_clean.push(line_to_add.internalid);
                    } else {
                        items_to_preload.push({
                            id: original_line.internalid,
                            type: original_line.itemtype
                        });
                    }
                });
                if (item_ids_to_clean.length) {
                    ModelsInit.order.setItemShippingAddress(item_ids_to_clean, null);
                    ModelsInit.order.setItemShippingMethod(item_ids_to_clean, null);
                }
                var restart = false;
                StoreItem.preloadItems(items_to_preload);
                lines.forEach(function (line) {
                    line.item = StoreItem.get(line.item, line.itemtype);
                    if (!line.item) {
                        self.removeLine(line.internalid);
                        restart = true;
                    } else {
                        line.rate_formatted = Utils.formatCurrency(line.rate);
                        line.amount_formatted = Utils.formatCurrency(line.amount);
                        line.tax_amount_formatted = Utils.formatCurrency(line.tax_amount);
                        line.discount_formatted = Utils.formatCurrency(line.discount);
                        line.total_formatted = Utils.formatCurrency(line.total);
                    }
                });
                if (restart) {
                    throw { code: 'ERR_CHK_ITEM_NOT_FOUND' };
                }
                var lines_sort = this.getLinesSort();
                if (lines_sort.length) {
                    lines = _.sortBy(lines, function (line) {
                        return _.indexOf(lines_sort, line.internalid);
                    });
                } else {
                    this.setLinesSort(_.pluck(lines, 'internalid'));
                }
            }
            return lines;
        },
        getIsMultiShipTo: function (order_fields) {
            return this.isMultiShippingEnabled && order_fields.ismultishipto === 'T';
        },
        setLinesSort: function (lines_sort) {
            return ModelsInit.context.setSessionObject('lines_sort', lines_sort || []);
        },
        setBillingAddress: function (data, current_order) {
            if (data.sameAs) {
                data.billaddress = data.shipaddress;
            }
            if (data.billaddress !== current_order.billaddress) {
                if (data.billaddress) {
                    if (data.billaddress && !~data.billaddress.indexOf('null')) {
                        ModelsInit.order.setBillingAddress(new String(data.billaddress).toString());
                    }
                } else if (this.isSecure) {
                    ModelsInit.order.removeBillingAddress();
                }
            }
        },
        setShippingAddressAndMethod: function (data, current_order) {
            var current_package, packages = {}, item_ids_to_clean = [], original_line;
            _.each(data.lines, function (line) {
                original_line = _.find(current_order.lines, function (order_line) {
                    return order_line.internalid === line.internalid;
                });
                if (original_line && original_line.item && original_line.item.isfulfillable !== false) {
                    if (line.shipaddress) {
                        packages[line.shipaddress] = packages[line.shipaddress] || {
                            shipMethodId: null,
                            itemIds: []
                        };
                        packages[line.shipaddress].itemIds.push(line.internalid);
                        if (!packages[line.shipaddress].shipMethodId && line.shipmethod) {
                            packages[line.shipaddress].shipMethodId = line.shipmethod;
                        }
                    } else {
                        item_ids_to_clean.push(line.internalid);
                    }
                }
            });
            if (item_ids_to_clean.length) {
                ModelsInit.order.setItemShippingAddress(item_ids_to_clean, null);
                ModelsInit.order.setItemShippingMethod(item_ids_to_clean, null);
            }
            _.each(_.keys(packages), function (address_id) {
                current_package = packages[address_id];
                ModelsInit.order.setItemShippingAddress(current_package.itemIds, parseInt(address_id, 10));
                if (current_package.shipMethodId) {
                    ModelsInit.order.setItemShippingMethod(current_package.itemIds, parseInt(current_package.shipMethodId, 10));
                }
            });
        },
        setShippingAddress: function (data, current_order) {
            if (data.shipaddress !== current_order.shipaddress) {
                if (data.shipaddress) {
                    if (this.isSecure && !~data.shipaddress.indexOf('null')) {
                        ModelsInit.order.setShippingAddress(new String(data.shipaddress).toString());
                    } else {
                        var address = _.find(data.addresses, function (address) {
                            return address.internalid === data.shipaddress;
                        });
                        address && ModelsInit.order.estimateShippingCost(address);
                    }
                } else if (this.isSecure) {
                    ModelsInit.order.removeShippingAddress();
                } else {
                    ModelsInit.order.estimateShippingCost({
                        zip: null,
                        country: null
                    });
                    ModelsInit.order.removeShippingMethod();
                }
            }
        },
        setPurchaseNumber: function (data) {
            if (data && data.purchasenumber) {
                ModelsInit.order.setPurchaseNumber(data.purchasenumber);
            } else {
                ModelsInit.order.removePurchaseNumber();
            }
        },
        setPaymentMethods: function (data) {
            var gift_certificate_methods = _.where(data.paymentmethods, { type: 'giftcertificate' }), non_certificate_methods = _.difference(data.paymentmethods, gift_certificate_methods);
            if (this.isSecure && non_certificate_methods && non_certificate_methods.length && ModelsInit.session.isLoggedIn2()) {
                _.each(non_certificate_methods, function (paymentmethod) {
                    if (paymentmethod.type === 'creditcard' && paymentmethod.creditcard) {
                        var credit_card = paymentmethod.creditcard, require_cc_security_code = ModelsInit.session.getSiteSettings(['checkout']).checkout.requireccsecuritycode === 'T', cc_obj = credit_card && {
                                ccnumber: credit_card.ccnumber,
                                ccname: credit_card.ccname,
                                ccexpiredate: credit_card.ccexpiredate,
                                expmonth: credit_card.expmonth,
                                expyear: credit_card.expyear,
                                paymentmethod: {
                                    internalid: credit_card.paymentmethod.internalid,
                                    name: credit_card.paymentmethod.name,
                                    creditcard: credit_card.paymentmethod.creditcard ? 'T' : 'F',
                                    ispaypal: credit_card.paymentmethod.ispaypal ? 'T' : 'F',
                                    key: credit_card.paymentmethod.key
                                }
                            };
                        if (credit_card.internalid !== '-temporal-') {
                            cc_obj.internalid = credit_card.internalid;
                        } else {
                            cc_obj.internalid = null;
                            cc_obj.savecard = 'F';
                        }
                        if (credit_card.ccsecuritycode) {
                            cc_obj.ccsecuritycode = credit_card.ccsecuritycode;
                        }
                        if (!require_cc_security_code || require_cc_security_code && credit_card.ccsecuritycode) {
                            try {
                                if (cc_obj.internalid || !cc_obj.internalid && !~cc_obj.ccnumber.indexOf('*')) {
                                    ModelsInit.order.removePayment();
                                    ModelsInit.order.setPayment({
                                        paymentterms: 'CreditCard',
                                        creditcard: cc_obj,
                                        paymentmethod: cc_obj.paymentmethod.key
                                    });
                                    ModelsInit.context.setSessionObject('paypal_complete', 'F');
                                }
                            } catch (e) {
                                if (e && e.code && e.code === 'ERR_WS_INVALID_PAYMENT') {
                                    ModelsInit.order.removePayment();
                                }
                                throw e;
                            }
                        } else if (require_cc_security_code && !credit_card.ccsecuritycode) {
                            ModelsInit.order.removePayment();
                        }
                    } else if (paymentmethod.type === 'invoice') {
                        ModelsInit.order.removePayment();
                        try {
                            ModelsInit.order.setPayment({ paymentterms: 'Invoice' });
                        } catch (e) {
                            if (e && e.code && e.code === 'ERR_WS_INVALID_PAYMENT') {
                                ModelsInit.order.removePayment();
                            }
                            throw e;
                        }
                        ModelsInit.context.setSessionObject('paypal_complete', 'F');
                    } else if (paymentmethod.type === 'paypal') {
                        if (ModelsInit.context.getSessionObject('paypal_complete') !== 'T') {
                            ModelsInit.order.removePayment();
                            var paypal = _.findWhere(ModelsInit.session.getPaymentMethods(), { ispaypal: 'T' });
                            paypal && ModelsInit.order.setPayment({
                                paymentterms: '',
                                paymentmethod: paypal.key
                            });
                        }
                    } else if (paymentmethod.type && ~paymentmethod.type.indexOf('external_checkout')) {
                        ModelsInit.order.removePayment();
                        ModelsInit.order.setPayment({
                            paymentmethod: paymentmethod.key,
                            thankyouurl: paymentmethod.thankyouurl,
                            errorurl: paymentmethod.errorurl
                        });
                    } else {
                        ModelsInit.order.removePayment();
                    }
                });
            } else if (this.isSecure && ModelsInit.session.isLoggedIn2()) {
                ModelsInit.order.removePayment();
            }
            gift_certificate_methods = _.map(gift_certificate_methods, function (gift_certificate) {
                return gift_certificate.giftcertificate;
            });
            this.setGiftCertificates(gift_certificate_methods);
        },
        setGiftCertificates: function (gift_certificates) {
            ModelsInit.order.removeAllGiftCertificates();
            _.forEach(gift_certificates, function (gift_certificate) {
                ModelsInit.order.applyGiftCertificate(gift_certificate.code);
            });
        },
        setShippingMethod: function (data, current_order) {
            if ((!this.isMultiShippingEnabled || !data.ismultishipto) && this.isSecure && data.shipmethod !== current_order.shipmethod) {
                var shipmethod = _.findWhere(current_order.shipmethods, { internalid: data.shipmethod });
                if (shipmethod) {
                    ModelsInit.order.setShippingMethod({
                        shipmethod: shipmethod.internalid,
                        shipcarrier: shipmethod.shipcarrier
                    });
                } else {
                    ModelsInit.order.removeShippingMethod();
                }
            }
        },
        setTermsAndConditions: function (data) {
            var require_terms_and_conditions = ModelsInit.session.getSiteSettings(['checkout']).checkout.requiretermsandconditions;
            if (require_terms_and_conditions.toString() === 'T' && this.isSecure && !_.isUndefined(data.agreetermcondition)) {
                ModelsInit.order.setTermsAndConditions(data.agreetermcondition);
            }
        },
        setTransactionBodyField: function (data) {
            if (this.isSecure && !_.isEmpty(data.options)) {
                ModelsInit.order.setCustomFieldValues(data.options);
            }
        }
    });
});
define('Address.Model', [
    'SC.Model',
    'Models.Init',
    'Backbone.Validation',
    'underscore'
], function (SCModel, ModelsInit, BackboneValidation, _) {
    'use strict';
    var countries, states = {};
    return SCModel.extend({
        name: 'Address',
        validation: {
            addressee: {
                required: true,
                msg: 'Full Name is required'
            },
            addr1: {
                required: true,
                msg: 'Address is required'
            },
            country: {
                required: true,
                msg: 'Country is required'
            },
            state: function (value, attr, computedState) {
                var selected_country = computedState.country;
                if (selected_country) {
                    if (!states[selected_country]) {
                        states[selected_country] = session.getStates([selected_country]);
                    }
                    if (selected_country && states[selected_country] && !value) {
                        return 'State is required';
                    }
                } else {
                    return 'Country is required';
                }
            },
            city: {
                required: true,
                msg: 'City is required'
            },
            zip: function (value, attr, computedState) {
                var selected_country = computedState.country;
                countries = countries || session.getCountries();
                if (!selected_country && !value || selected_country && countries[selected_country] && countries[selected_country].isziprequired === 'T' && !value) {
                    return 'State is required';
                }
            },
            phone: {
                required: true,
                msg: 'Phone Number is required'
            }
        },
        isValid: function (data) {
            data = this.unwrapAddressee(_.clone(data));
            var validator = _.extend({
                validation: this.validation,
                attributes: data
            }, BackboneValidation.mixin);
            validator.validate();
            return validator.isValid();
        },
        wrapAddressee: function (address) {
            if (address.attention && address.addressee) {
                address.fullname = address.attention;
                address.company = address.addressee;
            } else {
                address.fullname = address.addressee;
                address.company = null;
            }
            delete address.attention;
            delete address.addressee;
            return address;
        },
        unwrapAddressee: function (address) {
            if (address.company && address.company.trim().length > 0) {
                address.attention = address.fullname;
                address.addressee = address.company;
            } else {
                address.addressee = address.fullname;
                address.attention = null;
            }
            delete address.fullname;
            delete address.company;
            delete address.check;
            return address;
        },
        get: function (id) {
            return this.wrapAddressee(ModelsInit.customer.getAddress(id));
        },
        getDefaultBilling: function () {
            return _.find(ModelsInit.customer.getAddressBook(), function (address) {
                return address.defaultbilling === 'T';
            });
        },
        getDefaultShipping: function () {
            return _.find(ModelsInit.customer.getAddressBook(), function (address) {
                return address.defaultshipping === 'T';
            });
        },
        list: function () {
            var self = this;
            return _.map(ModelsInit.customer.getAddressBook(), function (address) {
                return self.wrapAddressee(address);
            });
        },
        update: function (id, data) {
            data = this.unwrapAddressee(data);
            this.validate(data);
            data.internalid = id;
            return ModelsInit.customer.updateAddress(data);
        },
        create: function (data) {
            data = this.unwrapAddressee(data);
            this.validate(data);
            return ModelsInit.customer.addAddress(data);
        },
        remove: function (id) {
            return ModelsInit.customer.removeAddress(id);
        }
    });
});
define('CreditCard.Model', [
    'SC.Model',
    'underscore'
], function (SCModel, _) {
    'use strict';
    return SCModel.extend({
        name: 'CreditCard',
        validation: {
            ccname: {
                required: true,
                msg: 'Name is required'
            },
            paymentmethod: {
                required: true,
                msg: 'Card Type is required'
            },
            ccnumber: {
                required: true,
                msg: 'Card Number is required'
            },
            expmonth: {
                required: true,
                msg: 'Expiration is required'
            },
            expyear: {
                required: true,
                msg: 'Expiration is required'
            }
        },
        get: function (id) {
            return customer.getCreditCard(id);
        },
        getDefault: function () {
            return _.find(customer.getCreditCards(), function (credit_card) {
                return credit_card.ccdefault === 'T';
            });
        },
        list: function () {
            return _.filter(customer.getCreditCards(), function (credit_card) {
                return credit_card.paymentmethod;
            });
        },
        update: function (id, data) {
            this.validate(data);
            data.internalid = id;
            return customer.updateCreditCard(data);
        },
        create: function (data) {
            this.validate(data);
            return customer.addCreditCard(data);
        },
        remove: function (id) {
            return customer.removeCreditCard(id);
        }
    });
});
define('Account.Model', [
    'SC.Model',
    'Application',
    'Models.Init',
    'Profile.Model',
    'LiveOrder.Model',
    'Address.Model',
    'CreditCard.Model',
    'SiteSettings.Model',
    'underscore'
], function (SCModel, Application, ModelsInit, Profile, LiveOrder, Address, CreditCard, SiteSettings, _) {
    'use strict';
    return SCModel.extend({
        name: 'Account',
        login: function (email, password, redirect) {
            ModelsInit.session.login({
                email: email,
                password: password
            });
            var user = Profile.get();
            user.isLoggedIn = ModelsInit.session.isLoggedIn2() ? 'T' : 'F';
            user.isRecognized = ModelsInit.session.isRecognized() ? 'T' : 'F';
            var ret = {
                touchpoints: ModelsInit.session.getSiteSettings(['touchpoints']).touchpoints,
                user: user
            };
            if (!redirect) {
                var Environment = Application.getEnvironment(request), language = Environment && Environment.currentLanguage || {};
                language.url = language.locale && ModelsInit.session.getAbsoluteUrl('checkout', '/languages/' + language.locale + '.js') || '';
                _.extend(ret, {
                    cart: LiveOrder.get(),
                    address: Address.list(),
                    creditcard: CreditCard.list(),
                    language: language,
                    currency: Environment && Environment.currentCurrency || ''
                });
            }
            return ret;
        },
        forgotPassword: function (email) {
            try {
                ModelsInit.session.sendPasswordRetrievalEmail(email);
            } catch (e) {
                var error = Application.processError(e);
                if (error.errorCode !== 'ERR_WS_CUSTOMER_LOGIN') {
                    throw e;
                }
            }
            return { success: true };
        },
        resetPassword: function (params, password) {
            if (!ModelsInit.session.doChangePassword(params, password)) {
                throw new Error('An error has occurred');
            } else {
                return { success: true };
            }
        },
        registerAsGuest: function (user) {
            var site_settings = SiteSettings.get();
            if (site_settings.registration.companyfieldmandatory === 'T') {
                user.companyname = 'Guest Shopper';
            }
            ModelsInit.session.registerGuest(user);
            user = Profile.get();
            user.isLoggedIn = ModelsInit.session.isLoggedIn2() ? 'T' : 'F';
            user.isRecognized = ModelsInit.session.isRecognized() ? 'T' : 'F';
            return {
                touchpoints: ModelsInit.session.getSiteSettings(['touchpoints']).touchpoints,
                user: user,
                cart: LiveOrder.get(),
                address: Address.list(),
                creditcard: CreditCard.list()
            };
        },
        register: function (user_data) {
            if (ModelsInit.customer.isGuest()) {
                var guest_data = ModelsInit.customer.getFieldValues();
                ModelsInit.customer.setLoginCredentials({
                    internalid: guest_data.internalid,
                    email: user_data.email,
                    password: user_data.password
                });
                ModelsInit.session.login({
                    email: user_data.email,
                    password: user_data.password
                });
                ModelsInit.customer.updateProfile({
                    internalid: guest_data.internalid,
                    firstname: user_data.firstname,
                    lastname: user_data.lastname,
                    companyname: user_data.company,
                    emailsubscribe: user_data.emailsubscribe && user_data.emailsubscribe !== 'F' ? 'T' : 'F'
                });
            } else {
                user_data.emailsubscribe = user_data.emailsubscribe && user_data.emailsubscribe !== 'F' ? 'T' : 'F';
                ModelsInit.session.registerCustomer({
                    firstname: user_data.firstname,
                    lastname: user_data.lastname,
                    companyname: user_data.company,
                    email: user_data.email,
                    password: user_data.password,
                    password2: user_data.password2,
                    emailsubscribe: user_data.emailsubscribe && user_data.emailsubscribe !== 'F' ? 'T' : 'F'
                });
            }
            var user = Profile.get();
            user.isLoggedIn = ModelsInit.session.isLoggedIn2() ? 'T' : 'F';
            user.isRecognized = ModelsInit.session.isRecognized() ? 'T' : 'F';
            return {
                touchpoints: ModelsInit.session.getSiteSettings(['touchpoints']).touchpoints,
                user: user,
                cart: LiveOrder.get(),
                address: Address.list(),
                creditcard: CreditCard.list()
            };
        }
    });
});
define('Account.ForgotPassword.ServiceController', [
    'ServiceController',
    'Account.Model'
], function (ServiceController, AccountModel) {
    'use strict';
    return ServiceController.extend({
        name: 'Account.ForgotPassword.ServiceController',
        post: function () {
            return AccountModel.forgotPassword(this.data.email);
        }
    });
});
define('Account.Login.ServiceController', [
    'ServiceController',
    'Account.Model'
], function (ServiceController, AccountModel) {
    'use strict';
    return ServiceController.extend({
        name: 'Account.Login.ServiceController',
        post: function () {
            return AccountModel.login(this.data.email, this.data.password, this.data.redirect);
        }
    });
});
define('Account.Register.ServiceController', [
    'ServiceController',
    'Account.Model'
], function (ServiceController, AccountModel) {
    'use strict';
    return ServiceController.extend({
        name: 'Account.Register.ServiceController',
        post: function () {
            return AccountModel.register(this.data);
        }
    });
});
define('Account.RegisterAsGuest.ServiceController', [
    'ServiceController',
    'Account.Model'
], function (ServiceController, AccountModel) {
    'use strict';
    return ServiceController.extend({
        name: 'Account.RegisterAsGuest.ServiceController',
        post: function () {
            return AccountModel.registerAsGuest(this.data);
        }
    });
});
define('Account.ResetPassword.ServiceController', [
    'ServiceController',
    'Account.Model'
], function (ServiceController, AccountModel) {
    'use strict';
    return ServiceController.extend({
        name: 'Account.ResetPassword.ServiceController',
        post: function () {
            return AccountModel.resetPassword(this.data.params, this.data.password);
        }
    });
});
define('Address.ServiceController', [
    'ServiceController',
    'Application',
    'Address.Model'
], function (ServiceController, Application, AddressModel) {
    'use strict';
    return ServiceController.extend({
        name: 'Address.ServiceController',
        options: { common: { requireLogin: true } },
        get: function () {
            var id = this.request.getParameter('internalid');
            return id ? AddressModel.get(id) : AddressModel.list() || [];
        },
        post: function () {
            var id = AddressModel.create(this.data);
            this.sendContent(AddressModel.get(id), { 'status': 201 });
        },
        put: function () {
            var id = this.request.getParameter('internalid');
            AddressModel.update(id, this.data);
            return AddressModel.get(id);
        },
        delete: function () {
            var id = this.request.getParameter('internalid');
            AddressModel.remove(id);
            return { 'status': 'ok' };
        }
    });
});
define('Case.Model', [
    'SC.Model',
    'Application',
    'Utils',
    'underscore'
], function (SCModel, Application, Utils, _) {
    'use strict';
    return SCModel.extend({
        name: 'Case',
        configuration: SC.Configuration.cases,
        dummy_date: new Date(),
        getNew: function () {
            var case_record = nlapiCreateRecord('supportcase');
            var category_field = case_record.getField('category');
            var category_options = category_field.getSelectOptions();
            var category_option_values = [];
            _(category_options).each(function (category_option) {
                var category_option_value = {
                    id: category_option.id,
                    text: category_option.text
                };
                category_option_values.push(category_option_value);
            });
            var origin_field = case_record.getField('origin');
            var origin_options = origin_field.getSelectOptions();
            var origin_option_values = [];
            _(origin_options).each(function (origin_option) {
                var origin_option_value = {
                    id: origin_option.id,
                    text: origin_option.text
                };
                origin_option_values.push(origin_option_value);
            });
            var status_field = case_record.getField('status');
            var status_options = status_field.getSelectOptions();
            var status_option_values = [];
            _(status_options).each(function (status_option) {
                var status_option_value = {
                    id: status_option.id,
                    text: status_option.text
                };
                status_option_values.push(status_option_value);
            });
            var priority_field = case_record.getField('priority');
            var priority_options = priority_field.getSelectOptions();
            var priority_option_values = [];
            _(priority_options).each(function (priority_option) {
                var priority_option_value = {
                    id: priority_option.id,
                    text: priority_option.text
                };
                priority_option_values.push(priority_option_value);
            });
            var newRecord = {
                categories: category_option_values,
                origins: origin_option_values,
                statuses: status_option_values,
                priorities: priority_option_values
            };
            return newRecord;
        },
        getColumnsArray: function () {
            return [
                new nlobjSearchColumn('internalid'),
                new nlobjSearchColumn('casenumber'),
                new nlobjSearchColumn('title'),
                new nlobjSearchColumn('status'),
                new nlobjSearchColumn('origin'),
                new nlobjSearchColumn('category'),
                new nlobjSearchColumn('company'),
                new nlobjSearchColumn('createddate'),
                new nlobjSearchColumn('lastmessagedate'),
                new nlobjSearchColumn('priority'),
                new nlobjSearchColumn('email')
            ];
        },
        get: function (id) {
            var filters = [
                    new nlobjSearchFilter('internalid', null, 'is', id),
                    new nlobjSearchFilter('isinactive', null, 'is', 'F')
                ], columns = this.getColumnsArray(), result = this.searchHelper(filters, columns, 1, true);
            if (result.records.length >= 1) {
                return result.records[0];
            } else {
                throw notFoundError;
            }
        },
        search: function (customer_id, list_header_data) {
            var filters = [new nlobjSearchFilter('isinactive', null, 'is', 'F')], columns = this.getColumnsArray(), selected_filter = parseInt(list_header_data.filter, 10);
            if (!_.isNaN(selected_filter)) {
                filters.push(new nlobjSearchFilter('status', null, 'anyof', selected_filter));
            }
            this.setSortOrder(list_header_data.sort, list_header_data.order, columns);
            return this.searchHelper(filters, columns, list_header_data.page, false);
        },
        searchHelper: function (filters, columns, page, join_messages) {
            var self = this, result = Application.getPaginatedSearchResults({
                    record_type: 'supportcase',
                    filters: filters,
                    columns: columns,
                    page: page
                });
            result.records = _.map(result.records, function (case_record) {
                var current_record_id = case_record.getId(), created_date = nlapiStringToDate(case_record.getValue('createddate')), last_message_date = nlapiStringToDate(case_record.getValue('lastmessagedate')), support_case = {
                        internalid: current_record_id,
                        caseNumber: case_record.getValue('casenumber'),
                        title: case_record.getValue('title'),
                        grouped_messages: [],
                        status: {
                            id: case_record.getValue('status'),
                            name: case_record.getText('status')
                        },
                        origin: {
                            id: case_record.getValue('origin'),
                            name: case_record.getText('origin')
                        },
                        category: {
                            id: case_record.getValue('category'),
                            name: case_record.getText('category')
                        },
                        company: {
                            id: case_record.getValue('company'),
                            name: case_record.getText('company')
                        },
                        priority: {
                            id: case_record.getValue('priority'),
                            name: case_record.getText('priority')
                        },
                        createdDate: nlapiDateToString(created_date ? created_date : self.dummy_date, 'date'),
                        lastMessageDate: nlapiDateToString(last_message_date ? last_message_date : self.dummy_date, 'date'),
                        email: case_record.getValue('email')
                    };
                if (join_messages) {
                    self.appendMessagesToCase(support_case);
                }
                return support_case;
            });
            return result;
        },
        stripHtmlFromMessage: function (message) {
            return message.replace(/<br\s*[\/]?>/gi, '\n').replace(/<(?:.|\n)*?>/gm, '');
        },
        appendMessagesToCase: function (support_case) {
            var message_columns = {
                    message_col: new nlobjSearchColumn('message', 'messages'),
                    message_date_col: new nlobjSearchColumn('messagedate', 'messages').setSort(true),
                    author_col: new nlobjSearchColumn('author', 'messages'),
                    message_id: new nlobjSearchColumn('internalid', 'messages')
                }, message_filters = [
                    new nlobjSearchFilter('internalid', null, 'is', support_case.internalid),
                    new nlobjSearchFilter('internalonly', 'messages', 'is', 'F')
                ], message_records = Application.getAllSearchResults('supportcase', message_filters, _.values(message_columns)), grouped_messages = [], messages_count = 0, self = this;
            _(message_records).each(function (message_record) {
                var customer_id = nlapiGetUser() + '', message_date_tmp = nlapiStringToDate(message_record.getValue('messagedate', 'messages')), message_date = message_date_tmp ? message_date_tmp : self.dummy_date, message_date_to_group_by = message_date.getFullYear() + '-' + (message_date.getMonth() + 1) + '-' + message_date.getDate(), message = {
                        author: message_record.getValue('author', 'messages') === customer_id ? 'You' : message_record.getText('author', 'messages'),
                        text: self.stripHtmlFromMessage(message_record.getValue('message', 'messages')),
                        messageDate: nlapiDateToString(message_date, 'timeofday'),
                        internalid: message_record.getValue('internalid', 'messages'),
                        initialMessage: false
                    };
                if (grouped_messages[message_date_to_group_by]) {
                    grouped_messages[message_date_to_group_by].messages.push(message);
                } else {
                    grouped_messages[message_date_to_group_by] = {
                        date: self.getMessageDate(message_date),
                        messages: [message]
                    };
                }
                messages_count++;
                if (messages_count === message_records.length) {
                    message.initialMessage = true;
                }
            });
            support_case.grouped_messages = _(grouped_messages).values();
            support_case.messages_count = messages_count;
        },
        getMessageDate: function (validJsDate) {
            var today = new Date(), today_dd = today.getDate(), today_mm = today.getMonth(), today_yyyy = today.getFullYear(), dd = validJsDate.getDate(), mm = validJsDate.getMonth(), yyyy = validJsDate.getFullYear();
            if (today_dd === dd && today_mm === mm && today_yyyy === yyyy) {
                return 'Today';
            }
            return nlapiDateToString(validJsDate, 'date');
        },
        create: function (customerId, data) {
            customerId = customerId || nlapiGetUser() + '';
            var newCaseRecord = nlapiCreateRecord('supportcase');
            data.title && newCaseRecord.setFieldValue('title', Utils.sanitizeString(data.title));
            data.message && newCaseRecord.setFieldValue('incomingmessage', Utils.sanitizeString(data.message));
            data.category && newCaseRecord.setFieldValue('category', data.category);
            data.email && newCaseRecord.setFieldValue('email', data.email);
            customerId && newCaseRecord.setFieldValue('company', customerId);
            var default_values = this.configuration.defaultValues;
            newCaseRecord.setFieldValue('status', default_values.statusStart.id);
            newCaseRecord.setFieldValue('origin', default_values.origin.id);
            return nlapiSubmitRecord(newCaseRecord);
        },
        setSortOrder: function (sort, order, columns) {
            switch (sort) {
            case 'createdDate':
                columns[7].setSort(order > 0);
                break;
            case 'lastMessageDate':
                columns[8].setSort(order > 0);
                break;
            default:
                columns[1].setSort(order > 0);
            }
        },
        update: function (id, data) {
            if (data && data.status) {
                if (data.reply && data.reply.length > 0) {
                    nlapiSubmitField('supportcase', id, [
                        'incomingmessage',
                        'messagenew',
                        'status'
                    ], [
                        Utils.sanitizeString(data.reply),
                        'T',
                        data.status.id
                    ]);
                } else {
                    nlapiSubmitField('supportcase', id, ['status'], data.status.id);
                }
            }
        }
    });
});
define('Case.Fields.ServiceController', [
    'ServiceController',
    'Case.Model'
], function (ServiceController, CaseModel) {
    'use strict';
    return ServiceController.extend({
        name: 'Case.Fields.ServiceController',
        options: {
            common: {
                requireLogin: true,
                requirePermissions: { list: ['lists.listCase.1'] }
            }
        },
        get: function () {
            return CaseModel.getNew();
        }
    });
});
define('Case.ServiceController', [
    'ServiceController',
    'Case.Model'
], function (ServiceController, CaseModel) {
    'use strict';
    return ServiceController.extend({
        name: 'Case.ServiceController',
        options: {
            common: {
                requireLogin: true,
                requirePermissions: { list: ['lists.listCase.1'] }
            }
        },
        get: function () {
            var id = this.request.getParameter('internalid') || this.data.internalid;
            if (id) {
                return CaseModel.get(id);
            } else {
                var list_header_data = {
                    filter: this.request.getParameter('filter'),
                    order: this.request.getParameter('order'),
                    sort: this.request.getParameter('sort'),
                    from: this.request.getParameter('from'),
                    to: this.request.getParameter('to'),
                    page: this.request.getParameter('page')
                };
                return CaseModel.search(nlapiGetUser() + '', list_header_data);
            }
        },
        post: function () {
            var new_case_id = CaseModel.create(nlapiGetUser() + '', this.data);
            return CaseModel.get(new_case_id);
        },
        put: function () {
            var id = this.request.getParameter('internalid') || this.data.internalid;
            CaseModel.update(id, this.data);
            return CaseModel.get(id);
        }
    });
});
define('Categories.Model', [
    'SC.Model',
    'Models.Init',
    'Application',
    'Configuration',
    'underscore'
], function (SCModel, ModelsInit, Application, Configuration, _) {
    'use strict';
    return SCModel.extend({
        name: 'Category',
        categoryColumns: {
            boolean: [
                'displayinsite',
                'isinactive',
                'isprimaryurl'
            ],
            sideMenu: {
                'sortBy': 'sequencenumber',
                'fields': [
                    'name',
                    'internalid',
                    'sequencenumber',
                    'urlfragment',
                    'displayinsite'
                ]
            },
            subCategories: {
                'sortBy': 'sequencenumber',
                'fields': [
                    'name',
                    'description',
                    'internalid',
                    'sequencenumber',
                    'urlfragment',
                    'thumbnailurl',
                    'displayinsite'
                ]
            },
            category: {
                'fields': [
                    'internalid',
                    'name',
                    'description',
                    'pagetitle',
                    'pageheading',
                    'pagebannerurl',
                    'addtohead',
                    'metakeywords',
                    'metadescription',
                    'displayinsite',
                    'urlfragment',
                    'idpath',
                    'fullurl',
                    'isprimaryurl'
                ]
            },
            breadcrumb: {
                'fields': [
                    'internalid',
                    'name',
                    'displayinsite'
                ]
            },
            menu: {
                'sortBy': 'sequencenumber',
                'fields': [
                    'internalid',
                    'name',
                    'sequencenumber',
                    'displayinsite'
                ]
            },
            mapping: {
                'internalid': 'subcatid',
                'name': 'subcatnameoverride',
                'description': 'subcatdescoverride',
                'pagetitle': 'subcatpagetitleoverride',
                'pageheading': 'subcatpageheadingoverride',
                'pagebannerurl': 'subcatpagebannerurloverride',
                'addtohead': 'subcataddtoheadoverride',
                'metakeywords': 'subcatmetakeywordsoverride',
                'metadescription': 'subcatmetadescoverride',
                'displayinsite': 'subcatdisplayinsiteoverride',
                'sequencenumber': 'subcatsequencenumber',
                'thumbnailurl': 'subcatthumbnailurloverride',
                'urlfragment': 'subcaturlfragmentoverride'
            }
        },
        getColumns: function (element) {
            var config = Configuration.categories;
            return _.union(this.categoryColumns[element].fields, config[element].fields);
        },
        getSortBy: function (element) {
            var config = Configuration.categories;
            return config[element].sortBy || this.categoryColumns[element].sortBy;
        },
        get: function (fullurl) {
            var cmsRequestT0 = new Date().getTime();
            var self = this;
            var category = {
                parenturl: fullurl.substring(0, fullurl.lastIndexOf('/')),
                urlfragment: fullurl.substring(fullurl.lastIndexOf('/') + 1)
            };
            if (category.parenturl) {
                category.siblings = this.getCategories(category.parenturl, null, this.getColumns('sideMenu'));
                _.each(category.siblings, function (sibling) {
                    if (sibling.urlfragment === category.urlfragment) {
                        category.internalid = sibling.internalid;
                    }
                    self.fixBooleans(sibling);
                });
                this.sortBy(category.siblings, this.getSortBy('sideMenu'));
            }
            if (category.internalid || !category.internalid && !category.parenturl) {
                var categories = this.getCategories(category.parenturl, {
                    'internalid': category.internalid,
                    'fullurl': fullurl
                }, this.getColumns('category'));
                if (categories.length) {
                    _.extend(category, categories[0]);
                } else {
                    throw notFoundError;
                }
            } else {
                throw notFoundError;
            }
            category.categories = this.getCategories(fullurl, null, this.getColumns('subCategories'));
            _.each(category.categories, function (subcategory) {
                self.fixBooleans(subcategory);
            });
            this.sortBy(category.categories, this.getSortBy('subCategories'));
            category.breadcrumb = this.getBreadcrumb(category.idpath);
            this.fixBooleans(category);
            var bread = { 'fullurl': category.fullurl };
            _.each(this.getColumns('breadcrumb'), function (column) {
                bread[column] = category[column];
            });
            category.breadcrumb.push(bread);
            category._debug_requestTime = new Date().getTime() - cmsRequestT0;
            return category;
        },
        getCategories: function (parenturl, categoryIds, columns) {
            var categories = [];
            var categoriesData;
            if (parenturl) {
                var categoriesOverride = this.getCategoriesOverride(parenturl, categoryIds ? categoryIds.internalid : null, columns);
                var i = categoriesOverride.length;
                if (i) {
                    var categoryids = categoryIds ? categoryIds : _.pluck(categoriesOverride, 'internalid');
                    categoriesData = this.getCategoriesData(parenturl, categoryids, columns);
                    var processColumn = function (column) {
                        category[column] = category[column] || categoryData[column];
                    };
                    while (i--) {
                        var categoryData = categoriesData[categoriesOverride[i].internalid];
                        if (categoryData) {
                            var category = categoriesOverride[i];
                            _.each(columns, processColumn);
                            category.fullurl = parenturl + '/' + category.urlfragment;
                            category.canonical = categoryData.canonical;
                            if (category.displayinsite === 'T') {
                                categories.push(category);
                            }
                        }
                    }
                }
            } else {
                categoriesData = _.values(this.getCategoriesData(parenturl, categoryIds, columns));
                _.each(categoriesData, function (category) {
                    if (category.displayinsite === 'T') {
                        category.fullurl = '/' + category.urlfragment;
                        categories.push(category);
                    }
                });
            }
            return categories;
        },
        getCategoriesOverride: function (parenturl, categoryid, columns) {
            var overrides = [], siteId = ModelsInit.session.getSiteSettings(['siteid']).siteid, searchFilters = [
                    new nlobjSearchFilter('fullurl', null, 'is', parenturl),
                    new nlobjSearchFilter('site', null, 'is', siteId)
                ], searchColumns = [], toSubCategory = this.categoryColumns.mapping;
            if (categoryid) {
                searchFilters.push(new nlobjSearchFilter('subcatid', null, 'is', categoryid));
            }
            _.each(columns, function (column) {
                toSubCategory[column] && searchColumns.push(new nlobjSearchColumn(toSubCategory[column]));
            });
            var result = Application.getAllSearchResults('commercecategory', searchFilters, searchColumns);
            _.each(result, function (line) {
                if (line.getValue(toSubCategory.internalid)) {
                    var override = {};
                    _.each(columns, function (column) {
                        override[column] = line.getValue(toSubCategory[column]);
                    });
                    overrides.push(override);
                }
            });
            return overrides;
        },
        getCategoriesData: function (parenturl, categoryIds, columns) {
            var categories = {}, siteId = ModelsInit.session.getSiteSettings(['siteid']).siteid, searchFilters = [
                    new nlobjSearchFilter('isinactive', null, 'is', 'F'),
                    new nlobjSearchFilter('site', null, 'is', siteId)
                ], searchColumns = [];
            if (_.isArray(categoryIds)) {
                searchFilters.push(new nlobjSearchFilter('internalid', null, 'anyof', categoryIds));
                searchFilters.push(new nlobjSearchFilter('isprimaryurl', null, 'is', 'T'));
            } else {
                var fullurlFilter = new nlobjSearchFilter('fullurl', null, 'is', categoryIds.fullurl);
                searchFilters.push(fullurlFilter);
                if (categoryIds.internalid) {
                    fullurlFilter.setLeftParens(1).setOr(true);
                    searchFilters.push(new nlobjSearchFilter('isprimaryurl', null, 'is', 'T').setLeftParens(1));
                    searchFilters.push(new nlobjSearchFilter('internalid', null, 'is', categoryIds.internalid).setRightParens(2));
                }
            }
            _.each(columns, function (column) {
                searchColumns.push(new nlobjSearchColumn(column));
            });
            var result = Application.getAllSearchResults('commercecategory', searchFilters, searchColumns);
            _.each(result, function (line) {
                var category = {};
                _.each(columns, function (column) {
                    category[column] = line.getValue(column);
                });
                var cat = categories[line.getValue('internalid')];
                if (cat) {
                    if (cat.isprimaryurl) {
                        cat.idpath = category.idpath;
                        cat.canonical = cat.fullurl;
                    } else {
                        cat.canonical = category.fullurl;
                    }
                } else {
                    categories[line.getValue('internalid')] = category;
                }
            });
            return categories;
        },
        fixBooleans: function (catObject) {
            _.each(this.categoryColumns.boolean, function (column) {
                if (catObject[column]) {
                    catObject[column] = catObject[column] ? catObject[column] === 'T' ? true : false : '';
                }
            });
        },
        getBreadcrumb: function (idpath) {
            var self = this, ids = idpath.split('|'), breadcrumb = [], siteId = ModelsInit.session.getSiteSettings(['siteid']).siteid, filters = [new nlobjSearchFilter('site', null, 'is', siteId)], searchColumns = [
                    new nlobjSearchColumn('isinactive'),
                    new nlobjSearchColumn('fullurl'),
                    new nlobjSearchColumn('idpath').setSort(false)
                ], columns = this.getColumns('breadcrumb'), toSubCategory = this.categoryColumns.mapping;
            _.each(columns, function (column) {
                searchColumns.push(new nlobjSearchColumn(column));
                toSubCategory[column] && searchColumns.push(new nlobjSearchColumn(toSubCategory[column]));
            });
            ids.splice(ids.length - 1, 1);
            for (var i = 1; i < ids.length - 1; i++) {
                var current = new nlobjSearchFilter('internalid', null, 'is', ids[i]);
                if (i === 1) {
                    current.setLeftParens(2);
                } else {
                    current.setLeftParens(1);
                }
                var currentChildren = new nlobjSearchFilter('subcatid', null, 'is', ids[i + 1]);
                if (i === ids.length - 2) {
                    currentChildren.setRightParens(2);
                } else {
                    currentChildren.setRightParens(1).setOr(true);
                }
                filters.push(current);
                filters.push(new nlobjSearchFilter('idpath', null, 'is', ids.slice(0, i + 1).join('|') + '|'));
                filters.push(currentChildren);
            }
            if (filters.length > 1) {
                var result = Application.getAllSearchResults('commercecategory', filters, searchColumns);
                var category = {};
                _.each(result, function (crumb, index) {
                    if (crumb.getValue('isinactive') === 'T') {
                        throw notFoundError;
                    }
                    _.each(columns, function (column) {
                        category[column] = category[column] || crumb.getValue(column);
                    });
                    if (category.displayinsite === 'F') {
                        throw notFoundError;
                    }
                    category.fullurl = crumb.getValue('fullurl');
                    breadcrumb.push(category);
                    if (index !== result.length - 1) {
                        category = {};
                        _.each(columns, function (column) {
                            category[column] = crumb.getValue(toSubCategory[column]);
                        });
                    }
                });
            }
            _.each(breadcrumb, function (category) {
                self.fixBooleans(category);
            });
            return breadcrumb;
        },
        getCategoryTree: function (level) {
            var cmsRequestT0 = new Date().getTime();
            var self = this, result = [], siteId = ModelsInit.session.getSiteSettings(['siteid']).siteid, filters = [
                    new nlobjSearchFilter('nestlevel', null, 'lessthanorequalto', level),
                    new nlobjSearchFilter('isinactive', null, 'is', 'F'),
                    new nlobjSearchFilter('site', null, 'is', siteId)
                ], searchColumns = [
                    new nlobjSearchColumn('fullurl'),
                    new nlobjSearchColumn('nestlevel'),
                    new nlobjSearchColumn('idpath').setSort(false)
                ], bag = {}, overrides = {}, columns = this.getColumns('menu'), toSubCategory = this.categoryColumns.mapping;
            _.each(columns, function (column) {
                searchColumns.push(new nlobjSearchColumn(column));
                toSubCategory[column] && searchColumns.push(new nlobjSearchColumn(toSubCategory[column]));
            });
            Application.getAllSearchResults('commercecategory', filters, searchColumns).forEach(function (line) {
                var idPath = line.getValue('idpath');
                if (!bag[idPath]) {
                    var current = { categories: [] }, override = overrides[idPath];
                    _.each(columns, function (column) {
                        current[column] = override && override[column] || line.getValue(column);
                    });
                    self.fixBooleans(current);
                    current.fullurl = line.getValue('fullurl');
                    current.level = line.getValue('nestlevel');
                    var parentIdPathArr = idPath.split('|');
                    if (parentIdPathArr.length > 3) {
                        parentIdPathArr.splice(parentIdPathArr.length - 2, 1);
                    } else {
                        parentIdPathArr = [];
                    }
                    current.parentIdPath = parentIdPathArr.join('|');
                    if (current.displayinsite) {
                        if (!current.parentIdPath) {
                            result.push(current);
                        } else {
                            bag[current.parentIdPath] && bag[current.parentIdPath].categories.push(current);
                        }
                        bag[idPath] = current;
                    }
                }
                var childId = line.getValue('subcatid');
                if (childId) {
                    var childIdPath = idPath + childId + '|';
                    var child = {};
                    _.each(columns, function (column) {
                        child[column] = line.getValue(toSubCategory[column]);
                    });
                    overrides[childIdPath] = child;
                }
            });
            this.sortBy(result, this.getSortBy('menu'));
            if (result.length) {
                result[0]._debug_requestTime = new Date().getTime() - cmsRequestT0;
            }
            return result;
        },
        sortBy: function (categories, property) {
            if (categories) {
                var self = this;
                property = property || 'sequencenumber';
                _.each(categories, function (category) {
                    self.sortBy(category.categories);
                });
                categories.sort(function (a, b) {
                    a = a[property] + '';
                    b = b[property] + '';
                    return a.localeCompare(b, {}, { numeric: true });
                });
            }
        }
    });
});
define('Categories.ServiceController', [
    'ServiceController',
    'Categories.Model'
], function (ServiceController, CategoriesModel) {
    'use strict';
    return ServiceController.extend({
        name: 'Categories.ServiceController',
        options: { common: { requireLoggedInPPS: true } },
        get: function () {
            var fullurl = this.request.getParameter('fullurl');
            if (fullurl) {
                return CategoriesModel.get(fullurl);
            } else {
                var menuLevel = this.request.getParameter('menuLevel');
                if (menuLevel) {
                    return CategoriesModel.getCategoryTree(menuLevel);
                }
            }
        }
    });
});
define('CreditCard.ServiceController', [
    'ServiceController',
    'CreditCard.Model'
], function (ServiceController, CreditCardModel) {
    'use strict';
    return ServiceController.extend({
        name: 'CreditCard.ServiceController',
        options: { common: { requireLogin: true } },
        get: function () {
            var id = this.request.getParameter('internalid');
            return id ? CreditCardModel.get(id) : CreditCardModel.list() || [];
        },
        post: function () {
            var id = CreditCardModel.create(this.data);
            this.sendContent(CreditCardModel.get(id), { 'status': 201 });
        },
        put: function () {
            var id = this.request.getParameter('internalid');
            CreditCardModel.update(id, this.data);
            return CreditCardModel.get(id);
        },
        delete: function () {
            var id = this.request.getParameter('internalid');
            CreditCardModel.remove(id);
            return { 'status': 'ok' };
        }
    });
});
define('CreditMemo.Model', [
    'SC.Model',
    'StoreItem.Model',
    'Application',
    'underscore',
    'Utils'
], function (SCModel, StoreItem, Application, _, Utils) {
    'use strict';
    return SCModel.extend({
        name: 'CreditMemo',
        get: function (id) {
            var creditmemo = nlapiLoadRecord('creditmemo', id), result = {};
            this.createRecord(creditmemo, result);
            this.setInvoices(creditmemo, result);
            this.getLines(creditmemo, result);
            return result;
        },
        createRecord: function (record, result) {
            result.internalid = record.getId();
            result.tranid = record.getFieldValue('tranid');
            result.subtotal = Utils.toCurrency(record.getFieldValue('subtotal'));
            result.subtotal_formatted = Utils.formatCurrency(record.getFieldValue('subtotal'));
            result.discount = Utils.toCurrency(record.getFieldValue('discounttotal'));
            result.discount_formatted = Utils.formatCurrency(record.getFieldValue('discounttotal'));
            result.taxtotal = Utils.toCurrency(record.getFieldValue('taxtotal'));
            result.taxtotal_formatted = Utils.formatCurrency(record.getFieldValue('taxtotal'));
            result.shippingcost = Utils.toCurrency(record.getFieldValue('shippingcost'));
            result.shippingcost_formatted = Utils.formatCurrency(record.getFieldValue('shippingcost'));
            result.total = Utils.toCurrency(record.getFieldValue('total'));
            result.total_formatted = Utils.formatCurrency(record.getFieldValue('total'));
            result.amountpaid = Utils.toCurrency(record.getFieldValue('amountpaid'));
            result.amountpaid_formatted = Utils.formatCurrency(record.getFieldValue('amountpaid'));
            result.amountremaining = Utils.toCurrency(record.getFieldValue('amountremaining'));
            result.amountremaining_formatted = Utils.formatCurrency(record.getFieldValue('amountremaining'));
            result.trandate = record.getFieldValue('trandate');
            result.status = record.getFieldValue('status');
            result.memo = record.getFieldValue('memo');
        },
        setInvoices: function (record, result) {
            result.invoices = [];
            for (var i = 1; i <= record.getLineItemCount('apply'); i++) {
                var invoice = {
                    line: i,
                    internalid: record.getLineItemValue('apply', 'internalid', i),
                    type: record.getLineItemValue('apply', 'type', i),
                    total: Utils.toCurrency(record.getLineItemValue('apply', 'total', i)),
                    total_formatted: Utils.formatCurrency(record.getLineItemValue('apply', 'total', i)),
                    apply: record.getLineItemValue('apply', 'apply', i) === 'T',
                    applydate: record.getLineItemValue('apply', 'applydate', i),
                    currency: record.getLineItemValue('apply', 'currency', i),
                    amount: Utils.toCurrency(record.getLineItemValue('apply', 'amount', i)),
                    amount_formatted: Utils.formatCurrency(record.getLineItemValue('apply', 'amount', i)),
                    due: Utils.toCurrency(record.getLineItemValue('apply', 'due', i)),
                    due_formatted: Utils.formatCurrency(record.getLineItemValue('apply', 'due', i)),
                    refnum: record.getLineItemValue('apply', 'refnum', i)
                };
                result.invoices.push(invoice);
            }
        },
        getLines: function (record, result) {
            var result_lines = [], items_to_query = [], items_to_preload = {};
            for (var i = 1; i <= record.getLineItemCount('item'); i++) {
                var amount = record.getLineItemValue('item', 'amount', i), rate = record.getLineItemValue('item', 'rate', i), item_id = record.getLineItemValue('item', 'item', i), item_type = record.getLineItemValue('item', 'itemtype', i);
                items_to_preload[item_id] = {
                    id: item_id,
                    type: item_type
                };
                result_lines.push({
                    quantity: Math.abs(record.getLineItemValue('item', 'quantity', i)),
                    options: Utils.getItemOptionsObject(record.getLineItemValue('item', 'options', i)),
                    item: item_id,
                    type: item_type,
                    amount: Utils.toCurrency(amount),
                    amount_formatted: Utils.formatCurrency(amount),
                    rate: Utils.toCurrency(rate),
                    rate_formatted: Utils.formatCurrency(rate)
                });
            }
            items_to_preload = _.values(items_to_preload);
            StoreItem.preloadItems(items_to_preload);
            _.each(result_lines, function (line) {
                if (line.item) {
                    var item = StoreItem.get(line.item, line.type);
                    if (!item || typeof item.itemid === 'undefined') {
                        items_to_query.push(line.item);
                    }
                }
            });
            if (items_to_query.length > 0) {
                var filters = [
                        new nlobjSearchFilter('entity', null, 'is', nlapiGetUser()),
                        new nlobjSearchFilter('internalid', 'item', 'anyof', items_to_query)
                    ], columns = [
                        new nlobjSearchColumn('internalid', 'item'),
                        new nlobjSearchColumn('type', 'item'),
                        new nlobjSearchColumn('parent', 'item'),
                        new nlobjSearchColumn('displayname', 'item'),
                        new nlobjSearchColumn('storedisplayname', 'item'),
                        new nlobjSearchColumn('itemid', 'item')
                    ], inactive_items_search = Application.getAllSearchResults('transaction', filters, columns);
                _.each(inactive_items_search, function (item) {
                    var inactive_item = {
                        internalid: item.getValue('internalid', 'item'),
                        type: item.getValue('type', 'item'),
                        displayname: item.getValue('displayname', 'item'),
                        storedisplayname: item.getValue('storedisplayname', 'item'),
                        itemid: item.getValue('itemid', 'item')
                    };
                    StoreItem.set(inactive_item);
                });
            }
            _.each(result_lines, function (line) {
                line.item = StoreItem.get(line.item, line.type);
            });
            result.lines = result_lines;
        }
    });
});
define('CreditMemo.ServiceController', [
    'ServiceController',
    'CreditMemo.Model'
], function (ServiceController, CreditMemoModel) {
    'use strict';
    return ServiceController.extend({
        name: 'CreditMemo.ServiceController',
        options: { common: { requireLogin: true } },
        get: function () {
            var id = this.request.getParameter('internalid');
            return CreditMemoModel.get(id);
        }
    });
});
define('Deposit.Model', [
    'SC.Model',
    'Utils'
], function (SCModel, Utils) {
    'use strict';
    return SCModel.extend({
        name: 'Deposit',
        get: function (id) {
            var deposit = nlapiLoadRecord('customerdeposit', id), result = {};
            this.createRecord(deposit, result);
            this.setInvoices(deposit, result);
            this.setPaymentMethod(deposit, result);
            return result;
        },
        createRecord: function (record, result) {
            result.internalid = record.getId();
            result.tranid = record.getFieldValue('tranid');
            result.payment = Utils.toCurrency(record.getFieldValue('payment'));
            result.payment_formatted = Utils.formatCurrency(record.getFieldValue('payment'));
            result.trandate = record.getFieldValue('trandate');
            result.status = record.getFieldValue('status');
            result.memo = record.getFieldValue('memo');
        },
        setInvoices: function (record, result) {
            result.invoices = [];
            var invoicesTotal = 0;
            for (var i = 1; i <= record.getLineItemCount('apply'); i++) {
                var invoice = {
                    line: i,
                    invoice_id: record.getLineItemValue('apply', 'id2', i),
                    deposit_id: record.getLineItemValue('apply', 'id', i),
                    type: record.getLineItemValue('apply', 'type', i),
                    total: Utils.toCurrency(record.getLineItemValue('apply', 'total', i)),
                    total_formatted: Utils.formatCurrency(record.getLineItemValue('apply', 'total', i)),
                    invoicedate: record.getLineItemValue('apply', 'applydate', i),
                    depositdate: record.getLineItemValue('apply', 'depositdate', i),
                    currency: record.getLineItemValue('apply', 'currency', i),
                    amount: Utils.toCurrency(record.getLineItemValue('apply', 'amount', i)),
                    amount_formatted: Utils.formatCurrency(record.getLineItemValue('apply', 'amount', i)),
                    due: Utils.toCurrency(record.getLineItemValue('apply', 'due', i)),
                    due_formatted: Utils.formatCurrency(record.getLineItemValue('apply', 'due', i)),
                    refnum: record.getLineItemValue('apply', 'refnum', i)
                };
                invoicesTotal += invoice.amount;
                result.invoices.push(invoice);
            }
            result.paid = Utils.toCurrency(invoicesTotal);
            result.paid_formatted = Utils.formatCurrency(invoicesTotal);
            result.remaining = Utils.toCurrency(result.payment - result.paid);
            result.remaining_formatted = Utils.formatCurrency(result.remaining);
        },
        setPaymentMethod: function (record, result) {
            var paymentmethod = {
                type: record.getFieldValue('paymethtype'),
                primary: true
            };
            if (paymentmethod.type === 'creditcard') {
                paymentmethod.creditcard = {
                    ccnumber: record.getFieldValue('ccnumber'),
                    ccexpiredate: record.getFieldValue('ccexpiredate'),
                    ccname: record.getFieldValue('ccname'),
                    paymentmethod: {
                        ispaypal: 'F',
                        name: record.getFieldText('paymentmethod'),
                        creditcard: 'T',
                        internalid: record.getFieldValue('paymentmethod')
                    }
                };
            }
            if (record.getFieldValue('ccstreet')) {
                paymentmethod.ccstreet = record.getFieldValue('ccstreet');
            }
            if (record.getFieldValue('cczipcode')) {
                paymentmethod.cczipcode = record.getFieldValue('cczipcode');
            }
            if (record.getFieldValue('terms')) {
                paymentmethod.type = 'invoice';
                paymentmethod.purchasenumber = record.getFieldValue('otherrefnum');
                paymentmethod.paymentterms = {
                    internalid: record.getFieldValue('terms'),
                    name: record.getFieldText('terms')
                };
            }
            result.paymentmethods = [paymentmethod];
        }
    });
});
define('Deposit.ServiceController', [
    'ServiceController',
    'Deposit.Model'
], function (ServiceController, DepositModel) {
    'use strict';
    return ServiceController.extend({
        name: 'Deposit.ServiceController',
        options: { common: { requireLogin: true } },
        get: function () {
            var id = this.request.getParameter('internalid');
            return DepositModel.get(id);
        }
    });
});
define('DepositApplication.Model', [
    'SC.Model',
    'Utils'
], function (SCModel, Utils) {
    'use strict';
    return SCModel.extend({
        name: 'DepositApplication',
        get: function (id) {
            var record = nlapiLoadRecord('depositapplication', id), result = {};
            this.createResult(record, result);
            this.setInvoices(record, result);
            return result;
        },
        createResult: function (record, result) {
            result.internalid = record.getId();
            result.tranid = record.getFieldValue('tranid');
            result.total = Utils.toCurrency(record.getFieldValue('total'));
            result.total_formatted = Utils.formatCurrency(record.getFieldValue('total'));
            result.deposit = {
                internalid: record.getFieldValue('deposit'),
                name: record.getFieldText('deposit')
            };
            result.depositdate = record.getFieldValue('depositdate');
            result.trandate = record.getFieldValue('trandate');
            result.memo = record.getFieldValue('memo');
        },
        setInvoices: function (record, result) {
            result.invoices = [];
            for (var i = 1; i <= record.getLineItemCount('apply'); i++) {
                var invoice = {
                    line: i,
                    internalid: record.getLineItemValue('apply', 'internalid', i),
                    type: record.getLineItemValue('apply', 'type', i),
                    total: Utils.toCurrency(record.getLineItemValue('apply', 'total', i)),
                    total_formatted: Utils.formatCurrency(record.getLineItemValue('apply', 'total', i)),
                    apply: record.getLineItemValue('apply', 'apply', i) === 'T',
                    applydate: record.getLineItemValue('apply', 'applydate', i),
                    currency: record.getLineItemValue('apply', 'currency', i),
                    amount: Utils.toCurrency(record.getLineItemValue('apply', 'amount', i)),
                    amount_formatted: Utils.formatCurrency(record.getLineItemValue('apply', 'amount', i)),
                    due: Utils.toCurrency(record.getLineItemValue('apply', 'due', i)),
                    due_formatted: Utils.formatCurrency(record.getLineItemValue('apply', 'due', i)),
                    refnum: record.getLineItemValue('apply', 'refnum', i)
                };
                result.invoices.push(invoice);
            }
        }
    });
});
define('DepositApplication.ServiceController', [
    'ServiceController',
    'DepositApplication.Model'
], function (ServiceController, DepositApplicationModel) {
    'use strict';
    return ServiceController.extend({
        name: 'DepositApplication.ServiceController',
        options: { common: { requireLogin: true } },
        get: function () {
            var id = this.request.getParameter('internalid');
            return DepositApplicationModel.get(id);
        }
    });
});
define('LiveOrder.GiftCertificate.ServiceController', [
    'ServiceController',
    'LiveOrder.Model'
], function (ServiceController, LiveOrderModel) {
    'use strict';
    return ServiceController.extend({
        name: 'LiveOrder.GiftCertificate.ServiceController',
        post: function () {
            LiveOrderModel.setGiftCertificates(this.data.giftcertificates);
            return LiveOrderModel.get() || {};
        }
    });
});
define('LiveOrder.Line.ServiceController', [
    'ServiceController',
    'Models.Init',
    'LiveOrder.Model',
    'underscore'
], function (ServiceController, ModelsInit, LiveOrderModel, _) {
    'use strict';
    return ServiceController.extend({
        name: 'LiveOrder.Line.ServiceController',
        options: { common: { checkLoggedInCheckout: true } },
        post: function () {
            LiveOrderModel.addLines(_.isArray(this.data) ? this.data : [this.data]);
            return LiveOrderModel.get() || {};
        },
        put: function () {
            var id = this.request.getParameter('internalid');
            if (this.data.options && this.data.options.void) {
                LiveOrderModel.voidLine(id);
            } else if (this.data.options && this.data.options['return']) {
                LiveOrderModel.returnLine(id);
            } else {
                LiveOrderModel.updateLine(id, this.data);
            }
            return LiveOrderModel.get() || {};
        },
        delete: function () {
            var id = this.request.getParameter('internalid');
            LiveOrderModel.removeLine(id);
            return LiveOrderModel.get() || {};
        }
    });
});
define('LiveOrder.ServiceController', [
    'ServiceController',
    'Models.Init',
    'LiveOrder.Model'
], function (ServiceController, ModelsInit, LiveOrderModel) {
    'use strict';
    return ServiceController.extend({
        name: 'LiveOrder.ServiceController',
        options: {
            put: { checkLoggedInCheckout: true },
            post: { checkLoggedInCheckout: true }
        },
        get: function () {
            return LiveOrderModel.get();
        },
        post: function () {
            LiveOrderModel.update(this.data);
            var confirmation = LiveOrderModel.submit(), order_info = LiveOrderModel.get();
            order_info.confirmation = confirmation;
            order_info.touchpoints = ModelsInit.session.getSiteSettings(['touchpoints']).touchpoints;
            return order_info;
        },
        put: function () {
            LiveOrderModel.update(this.data);
            return LiveOrderModel.get();
        }
    });
});
define('Payment.Model', [
    'SC.Model',
    'Utils',
    'Models.Init',
    'ExternalPayment.Model'
], function (SCModel, Utils, ModelsInit, ExternalPayment) {
    'use strict';
    return SCModel.extend({
        name: 'Payment',
        get: function (id) {
            var customer_payment = nlapiLoadRecord('customerpayment', id);
            return this.createResult(customer_payment);
        },
        setPaymentMethod: function (customer_payment, result) {
            result.paymentmethods = [];
            return Utils.setPaymentMethodToResult(customer_payment, result);
        },
        createResult: function (customer_payment) {
            var result = {};
            result.internalid = customer_payment.getId();
            result.type = customer_payment.getRecordType();
            result.tranid = customer_payment.getFieldValue('tranid');
            result.autoapply = customer_payment.getFieldValue('autoapply');
            result.invoices_total_formatted = Utils.formatCurrency(customer_payment.getFieldValue('applied'));
            result.invoices_total = Utils.toCurrency(customer_payment.getFieldValue('applied'));
            result.trandate = customer_payment.getFieldValue('trandate');
            result.status = customer_payment.getFieldValue('status');
            result.payment = Utils.toCurrency(customer_payment.getFieldValue('payment'));
            result.payment_formatted = Utils.formatCurrency(customer_payment.getFieldValue('payment'));
            result.lastmodifieddate = customer_payment.getFieldValue('lastmodifieddate');
            result.balance = Utils.toCurrency(customer_payment.getFieldValue('balance'));
            result.balance_formatted = Utils.formatCurrency(customer_payment.getFieldValue('balance'));
            this.setPaymentMethod(customer_payment, result);
            this.setInvoices(customer_payment, result);
            if (customer_payment.getFieldValue('paymethtype') === 'external_checkout') {
                result.redirecturl = ExternalPayment.generateUrl(result.internalid, result.type);
                result.paymenteventholdreason = customer_payment.getFieldValue('paymenteventholdreason');
                result.statuscode = result.paymenteventholdreason === 'FORWARD_REQUESTED' ? 'redirect' : '';
            }
            return result;
        },
        setInvoices: function (customer_payment, result) {
            result.invoices = [];
            for (var i = 1; i <= customer_payment.getLineItemCount('apply'); i++) {
                var apply = customer_payment.getLineItemValue('apply', 'apply', i) === 'T';
                if (apply) {
                    var invoice = {
                        internalid: customer_payment.getLineItemValue('apply', 'internalid', i),
                        type: customer_payment.getLineItemValue('apply', 'type', i),
                        total: Utils.toCurrency(customer_payment.getLineItemValue('apply', 'total', i)),
                        total_formatted: Utils.formatCurrency(customer_payment.getLineItemValue('apply', 'total', i)),
                        apply: apply,
                        applydate: customer_payment.getLineItemValue('apply', 'applydate', i),
                        currency: customer_payment.getLineItemValue('apply', 'currency', i),
                        disc: Utils.toCurrency(customer_payment.getLineItemValue('apply', 'disc', i)),
                        disc_formatted: Utils.formatCurrency(customer_payment.getLineItemValue('apply', 'disc', i)),
                        amount: Utils.toCurrency(customer_payment.getLineItemValue('apply', 'amount', i)),
                        amount_formatted: Utils.formatCurrency(customer_payment.getLineItemValue('apply', 'amount', i)),
                        due: Utils.toCurrency(customer_payment.getLineItemValue('apply', 'due', i)),
                        due_formatted: Utils.formatCurrency(customer_payment.getLineItemValue('apply', 'due', i)),
                        refnum: customer_payment.getLineItemValue('apply', 'refnum', i)
                    };
                    result.invoices.push(invoice);
                }
            }
            return result;
        }
    });
});
;
(function (global) {
    'use strict';
    var MAX = 1000000000, MAX_POWER = 1000000, DECIMAL_PLACES = 20, ROUNDING_MODE = 4, TO_EXP_NEG = -7, TO_EXP_POS = 21, MIN_EXP = -MAX, MAX_EXP = MAX, ERRORS = true, parse = parseInt, P = BigNumber.prototype, DIGITS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_', outOfRange, id = 0, isValid = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i, trim = String.prototype.trim || function () {
            return this.replace(/^\s+|\s+$/g, '');
        }, ONE = BigNumber(1);
    function BigNumber(n, b) {
        var e, i, isNum, digits, valid, orig, x = this;
        if (!(x instanceof BigNumber)) {
            return new BigNumber(n, b);
        }
        if (n instanceof BigNumber) {
            id = 0;
            if (b !== e) {
                n += '';
            } else {
                x['s'] = n['s'];
                x['e'] = n['e'];
                x['c'] = (n = n['c']) ? n.slice() : n;
                return;
            }
        }
        if (typeof n != 'string') {
            n = (isNum = typeof n == 'number' || Object.prototype.toString.call(n) == '[object Number]') && n === 0 && 1 / n < 0 ? '-0' : n + '';
        }
        orig = n;
        if (b === e && isValid.test(n)) {
            x['s'] = n.charAt(0) == '-' ? (n = n.slice(1), -1) : 1;
        } else {
            if (b == 10) {
                return setMode(n, DECIMAL_PLACES, ROUNDING_MODE);
            }
            n = trim.call(n).replace(/^\+(?!-)/, '');
            x['s'] = n.charAt(0) == '-' ? (n = n.replace(/^-(?!-)/, ''), -1) : 1;
            if (b != null) {
                if ((b == (b | 0) || !ERRORS) && !(outOfRange = !(b >= 2 && b < 65))) {
                    digits = '[' + DIGITS.slice(0, b = b | 0) + ']+';
                    n = n.replace(/\.$/, '').replace(/^\./, '0.');
                    if (valid = new RegExp('^' + digits + '(?:\\.' + digits + ')?$', b < 37 ? 'i' : '').test(n)) {
                        if (isNum) {
                            if (n.replace(/^0\.0*|\./, '').length > 15) {
                                ifExceptionsThrow(orig, 0);
                            }
                            isNum = !isNum;
                        }
                        n = convert(n, 10, b, x['s']);
                    } else if (n != 'Infinity' && n != 'NaN') {
                        ifExceptionsThrow(orig, 1, b);
                        n = 'NaN';
                    }
                } else {
                    ifExceptionsThrow(b, 2);
                    valid = isValid.test(n);
                }
            } else {
                valid = isValid.test(n);
            }
            if (!valid) {
                x['c'] = x['e'] = null;
                if (n != 'Infinity') {
                    if (n != 'NaN') {
                        ifExceptionsThrow(orig, 3);
                    }
                    x['s'] = null;
                }
                id = 0;
                return;
            }
        }
        if ((e = n.indexOf('.')) > -1) {
            n = n.replace('.', '');
        }
        if ((i = n.search(/e/i)) > 0) {
            if (e < 0) {
                e = i;
            }
            e += +n.slice(i + 1);
            n = n.substring(0, i);
        } else if (e < 0) {
            e = n.length;
        }
        for (i = 0; n.charAt(i) == '0'; i++) {
        }
        b = n.length;
        if (isNum && b > 15 && n.slice(i).length > 15) {
            ifExceptionsThrow(orig, 0);
        }
        id = 0;
        if ((e -= i + 1) > MAX_EXP) {
            x['c'] = x['e'] = null;
        } else if (i == b || e < MIN_EXP) {
            x['c'] = [x['e'] = 0];
        } else {
            for (; n.charAt(--b) == '0';) {
            }
            x['e'] = e;
            x['c'] = [];
            for (e = 0; i <= b; x['c'][e++] = +n.charAt(i++)) {
            }
        }
    }
    BigNumber['ROUND_UP'] = 0;
    BigNumber['ROUND_DOWN'] = 1;
    BigNumber['ROUND_CEIL'] = 2;
    BigNumber['ROUND_FLOOR'] = 3;
    BigNumber['ROUND_HALF_UP'] = 4;
    BigNumber['ROUND_HALF_DOWN'] = 5;
    BigNumber['ROUND_HALF_EVEN'] = 6;
    BigNumber['ROUND_HALF_CEIL'] = 7;
    BigNumber['ROUND_HALF_FLOOR'] = 8;
    BigNumber['config'] = function () {
        var v, p, i = 0, r = {}, a = arguments, o = a[0], c = 'config', inRange = function (n, lo, hi) {
                return !((outOfRange = n < lo || n > hi) || parse(n) != n && n !== 0);
            }, has = o && typeof o == 'object' ? function () {
                if (o.hasOwnProperty(p))
                    return (v = o[p]) != null;
            } : function () {
                if (a.length > i)
                    return (v = a[i++]) != null;
            };
        if (has(p = 'DECIMAL_PLACES')) {
            if (inRange(v, 0, MAX)) {
                DECIMAL_PLACES = v | 0;
            } else {
                ifExceptionsThrow(v, p, c);
            }
        }
        r[p] = DECIMAL_PLACES;
        if (has(p = 'ROUNDING_MODE')) {
            if (inRange(v, 0, 8)) {
                ROUNDING_MODE = v | 0;
            } else {
                ifExceptionsThrow(v, p, c);
            }
        }
        r[p] = ROUNDING_MODE;
        if (has(p = 'EXPONENTIAL_AT')) {
            if (inRange(v, -MAX, MAX)) {
                TO_EXP_NEG = -(TO_EXP_POS = ~~(v < 0 ? -v : +v));
            } else if (!outOfRange && v && inRange(v[0], -MAX, 0) && inRange(v[1], 0, MAX)) {
                TO_EXP_NEG = ~~v[0];
                TO_EXP_POS = ~~v[1];
            } else {
                ifExceptionsThrow(v, p, c, 1);
            }
        }
        r[p] = [
            TO_EXP_NEG,
            TO_EXP_POS
        ];
        if (has(p = 'RANGE')) {
            if (inRange(v, -MAX, MAX) && ~~v) {
                MIN_EXP = -(MAX_EXP = ~~(v < 0 ? -v : +v));
            } else if (!outOfRange && v && inRange(v[0], -MAX, -1) && inRange(v[1], 1, MAX)) {
                MIN_EXP = ~~v[0], MAX_EXP = ~~v[1];
            } else {
                ifExceptionsThrow(v, p, c, 1, 1);
            }
        }
        r[p] = [
            MIN_EXP,
            MAX_EXP
        ];
        if (has(p = 'ERRORS')) {
            if (v === !!v || v === 1 || v === 0) {
                parse = (outOfRange = id = 0, ERRORS = !!v) ? parseInt : parseFloat;
            } else {
                ifExceptionsThrow(v, p, c, 0, 0, 1);
            }
        }
        r[p] = ERRORS;
        return r;
    };
    function ifExceptionsThrow(arg, i, j, isArray, isRange, isErrors) {
        if (ERRORS) {
            var error, method = [
                    'new BigNumber',
                    'cmp',
                    'div',
                    'eq',
                    'gt',
                    'gte',
                    'lt',
                    'lte',
                    'minus',
                    'mod',
                    'plus',
                    'times',
                    'toFr'
                ][id ? id < 0 ? -id : id : 1 / id < 0 ? 1 : 0] + '()', message = outOfRange ? ' out of range' : ' not a' + (isRange ? ' non-zero' : 'n') + ' integer';
            message = ([
                method + ' number type has more than 15 significant digits',
                method + ' not a base ' + j + ' number',
                method + ' base' + message,
                method + ' not a number'
            ][i] || j + '() ' + i + (isErrors ? ' not a boolean or binary digit' : message + (isArray ? ' or not [' + (outOfRange ? ' negative, positive' : ' integer, integer') + ' ]' : ''))) + ': ' + arg;
            outOfRange = id = 0;
            error = new Error(message);
            error['name'] = 'BigNumber Error';
            throw error;
        }
    }
    function convert(nStr, baseOut, baseIn, sign) {
        var e, dvs, dvd, nArr, fracArr, fracBN;
        function strToArr(str, bIn) {
            var j, i = 0, strL = str.length, arrL, arr = [0];
            for (bIn = bIn || baseIn; i < strL; i++) {
                for (arrL = arr.length, j = 0; j < arrL; arr[j] *= bIn, j++) {
                }
                for (arr[0] += DIGITS.indexOf(str.charAt(i)), j = 0; j < arr.length; j++) {
                    if (arr[j] > baseOut - 1) {
                        if (arr[j + 1] == null) {
                            arr[j + 1] = 0;
                        }
                        arr[j + 1] += arr[j] / baseOut ^ 0;
                        arr[j] %= baseOut;
                    }
                }
            }
            return arr.reverse();
        }
        function arrToStr(arr) {
            var i = 0, arrL = arr.length, str = '';
            for (; i < arrL; str += DIGITS.charAt(arr[i++])) {
            }
            return str;
        }
        if (baseIn < 37) {
            nStr = nStr.toLowerCase();
        }
        if ((e = nStr.indexOf('.')) > -1) {
            e = nStr.length - e - 1;
            dvs = strToArr(new BigNumber(baseIn)['pow'](e)['toF'](), 10);
            nArr = nStr.split('.');
            dvd = strToArr(nArr[1]);
            nArr = strToArr(nArr[0]);
            fracBN = divide(dvd, dvs, dvd.length - dvs.length, sign, baseOut, nArr[nArr.length - 1] & 1);
            fracArr = fracBN['c'];
            if (e = fracBN['e']) {
                for (; ++e; fracArr.unshift(0)) {
                }
                nStr = arrToStr(nArr) + '.' + arrToStr(fracArr);
            } else if (fracArr[0]) {
                if (nArr[e = nArr.length - 1] < baseOut - 1) {
                    ++nArr[e];
                    nStr = arrToStr(nArr);
                } else {
                    nStr = new BigNumber(arrToStr(nArr), baseOut)['plus'](ONE)['toS'](baseOut);
                }
            } else {
                nStr = arrToStr(nArr);
            }
        } else {
            nStr = arrToStr(strToArr(nStr));
        }
        return nStr;
    }
    function divide(dvd, dvs, exp, s, base, isOdd) {
        var dvsL, dvsT, next, cmp, remI, dvsZ = dvs.slice(), dvdI = dvsL = dvs.length, dvdL = dvd.length, rem = dvd.slice(0, dvsL), remL = rem.length, quo = new BigNumber(ONE), qc = quo['c'] = [], qi = 0, dig = DECIMAL_PLACES + (quo['e'] = exp) + 1;
        quo['s'] = s;
        s = dig < 0 ? 0 : dig;
        for (; remL++ < dvsL; rem.push(0)) {
        }
        dvsZ.unshift(0);
        do {
            for (next = 0; next < base; next++) {
                if (dvsL != (remL = rem.length)) {
                    cmp = dvsL > remL ? 1 : -1;
                } else {
                    for (remI = -1, cmp = 0; ++remI < dvsL;) {
                        if (dvs[remI] != rem[remI]) {
                            cmp = dvs[remI] > rem[remI] ? 1 : -1;
                            break;
                        }
                    }
                }
                if (cmp < 0) {
                    for (dvsT = remL == dvsL ? dvs : dvsZ; remL;) {
                        if (rem[--remL] < dvsT[remL]) {
                            for (remI = remL; remI && !rem[--remI]; rem[remI] = base - 1) {
                            }
                            --rem[remI];
                            rem[remL] += base;
                        }
                        rem[remL] -= dvsT[remL];
                    }
                    for (; !rem[0]; rem.shift()) {
                    }
                } else {
                    break;
                }
            }
            qc[qi++] = cmp ? next : ++next;
            rem[0] && cmp ? rem[remL] = dvd[dvdI] || 0 : rem = [dvd[dvdI]];
        } while ((dvdI++ < dvdL || rem[0] != null) && s--);
        if (!qc[0] && qi != 1) {
            --quo['e'];
            qc.shift();
        }
        if (qi > dig) {
            rnd(quo, DECIMAL_PLACES, base, isOdd, rem[0] != null);
        }
        if (quo['e'] > MAX_EXP) {
            quo['c'] = quo['e'] = null;
        } else if (quo['e'] < MIN_EXP) {
            quo['c'] = [quo['e'] = 0];
        }
        return quo;
    }
    function format(n, d, exp) {
        var i = d - (n = new BigNumber(n))['e'], c = n['c'];
        if (!c) {
            return n['toS']();
        }
        if (c.length > ++d) {
            rnd(n, i, 10);
        }
        i = c[0] == 0 ? i + 1 : exp ? d : n['e'] + i + 1;
        for (; c.length < i; c.push(0)) {
        }
        i = n['e'];
        return exp == 1 || exp == 2 && (--d < i || i <= TO_EXP_NEG) ? (n['s'] < 0 && c[0] ? '-' : '') + (c.length > 1 ? (c.splice(1, 0, '.'), c.join('')) : c[0]) + (i < 0 ? 'e' : 'e+') + i : n['toS']();
    }
    function rnd(x, dp, base, isOdd, r) {
        var xc = x['c'], isNeg = x['s'] < 0, half = base / 2, i = x['e'] + dp + 1, next = xc[i], more = r || i < 0 || xc[i + 1] != null;
        r = ROUNDING_MODE < 4 ? (next != null || more) && (ROUNDING_MODE == 0 || ROUNDING_MODE == 2 && !isNeg || ROUNDING_MODE == 3 && isNeg) : next > half || next == half && (ROUNDING_MODE == 4 || more || ROUNDING_MODE == 6 && (xc[i - 1] & 1 || !dp && isOdd) || ROUNDING_MODE == 7 && !isNeg || ROUNDING_MODE == 8 && isNeg);
        if (i < 1 || !xc[0]) {
            xc.length = 0;
            xc.push(0);
            if (r) {
                xc[0] = 1;
                x['e'] = -dp;
            } else {
                x['e'] = 0;
            }
            return x;
        }
        xc.length = i--;
        if (r) {
            for (--base; ++xc[i] > base;) {
                xc[i] = 0;
                if (!i--) {
                    ++x['e'];
                    xc.unshift(1);
                }
            }
        }
        for (i = xc.length; !xc[--i]; xc.pop()) {
        }
        return x;
    }
    function setMode(x, dp, rm) {
        var r = ROUNDING_MODE;
        ROUNDING_MODE = rm;
        x = new BigNumber(x);
        x['c'] && rnd(x, dp, 10);
        ROUNDING_MODE = r;
        return x;
    }
    P['abs'] = P['absoluteValue'] = function () {
        var x = new BigNumber(this);
        if (x['s'] < 0) {
            x['s'] = 1;
        }
        return x;
    };
    P['ceil'] = function () {
        return setMode(this, 0, 2);
    };
    P['comparedTo'] = P['cmp'] = function (y, b) {
        var a, x = this, xc = x['c'], yc = (id = -id, y = new BigNumber(y, b))['c'], i = x['s'], j = y['s'], k = x['e'], l = y['e'];
        if (!i || !j) {
            return null;
        }
        a = xc && !xc[0], b = yc && !yc[0];
        if (a || b) {
            return a ? b ? 0 : -j : i;
        }
        if (i != j) {
            return i;
        }
        if (a = i < 0, b = k == l, !xc || !yc) {
            return b ? 0 : !xc ^ a ? 1 : -1;
        }
        if (!b) {
            return k > l ^ a ? 1 : -1;
        }
        for (i = -1, j = (k = xc.length) < (l = yc.length) ? k : l; ++i < j;) {
            if (xc[i] != yc[i]) {
                return xc[i] > yc[i] ^ a ? 1 : -1;
            }
        }
        return k == l ? 0 : k > l ^ a ? 1 : -1;
    };
    P['decimalPlaces'] = P['dp'] = function () {
        var dp;
        if (this['c']) {
            dp = this['c'].length - this['e'] - 1;
            return dp < 0 ? 0 : dp;
        }
        return null;
    };
    P['dividedBy'] = P['div'] = function (y, b) {
        var xc = this['c'], xe = this['e'], xs = this['s'], yc = (id = 2, y = new BigNumber(y, b))['c'], ye = y['e'], ys = y['s'], s = xs == ys ? 1 : -1;
        return !xe && (!xc || !xc[0]) || !ye && (!yc || !yc[0]) ? new BigNumber(!xs || !ys || (xc ? yc && xc[0] == yc[0] : !yc) ? NaN : xc && xc[0] == 0 || !yc ? s * 0 : s / 0) : divide(xc, yc, xe - ye, s, 10);
    };
    P['equals'] = P['eq'] = function (n, b) {
        id = 3;
        return this['cmp'](n, b) === 0;
    };
    P['floor'] = function () {
        return setMode(this, 0, 3);
    };
    P['greaterThan'] = P['gt'] = function (n, b) {
        id = 4;
        return this['cmp'](n, b) > 0;
    };
    P['greaterThanOrEqualTo'] = P['gte'] = function (n, b) {
        id = 5;
        return (b = this['cmp'](n, b)) == 1 || b === 0;
    };
    P['isFinite'] = P['isF'] = function () {
        return !!this['c'];
    };
    P['isNaN'] = function () {
        return !this['s'];
    };
    P['isNegative'] = P['isNeg'] = function () {
        return this['s'] < 0;
    };
    P['isZero'] = P['isZ'] = function () {
        return !!this['c'] && this['c'][0] == 0;
    };
    P['lessThan'] = P['lt'] = function (n, b) {
        id = 6;
        return this['cmp'](n, b) < 0;
    };
    P['lessThanOrEqualTo'] = P['lte'] = function (n, b) {
        id = 7;
        return (b = this['cmp'](n, b)) == -1 || b === 0;
    };
    P['minus'] = function (y, b) {
        var d, i, j, xLTy, x = this, a = x['s'];
        b = (id = 8, y = new BigNumber(y, b))['s'];
        if (!a || !b) {
            return new BigNumber(NaN);
        }
        if (a != b) {
            return y['s'] = -b, x['plus'](y);
        }
        var xc = x['c'], xe = x['e'], yc = y['c'], ye = y['e'];
        if (!xe || !ye) {
            if (!xc || !yc) {
                return xc ? (y['s'] = -b, y) : new BigNumber(yc ? x : NaN);
            }
            if (!xc[0] || !yc[0]) {
                return yc[0] ? (y['s'] = -b, y) : new BigNumber(xc[0] ? x : ROUNDING_MODE == 3 ? -0 : 0);
            }
        }
        if (xc = xc.slice(), a = xe - ye) {
            d = (xLTy = a < 0) ? (a = -a, xc) : (ye = xe, yc);
            for (d.reverse(), b = a; b--; d.push(0)) {
            }
            d.reverse();
        } else {
            j = ((xLTy = xc.length < yc.length) ? xc : yc).length;
            for (a = b = 0; b < j; b++) {
                if (xc[b] != yc[b]) {
                    xLTy = xc[b] < yc[b];
                    break;
                }
            }
        }
        if (xLTy) {
            d = xc, xc = yc, yc = d;
            y['s'] = -y['s'];
        }
        if ((b = -((j = xc.length) - yc.length)) > 0) {
            for (; b--; xc[j++] = 0) {
            }
        }
        for (b = yc.length; b > a;) {
            if (xc[--b] < yc[b]) {
                for (i = b; i && !xc[--i]; xc[i] = 9) {
                }
                --xc[i];
                xc[b] += 10;
            }
            xc[b] -= yc[b];
        }
        for (; xc[--j] == 0; xc.pop()) {
        }
        for (; xc[0] == 0; xc.shift(), --ye) {
        }
        if (ye < MIN_EXP || !xc[0]) {
            if (!xc[0]) {
                y['s'] = ROUNDING_MODE == 3 ? -1 : 1;
            }
            xc = [ye = 0];
        }
        return y['c'] = xc, y['e'] = ye, y;
    };
    P['modulo'] = P['mod'] = function (y, b) {
        var x = this, xc = x['c'], yc = (id = 9, y = new BigNumber(y, b))['c'], i = x['s'], j = y['s'];
        b = !i || !j || yc && !yc[0];
        if (b || xc && !xc[0]) {
            return new BigNumber(b ? NaN : x);
        }
        x['s'] = y['s'] = 1;
        b = y['cmp'](x) == 1;
        x['s'] = i, y['s'] = j;
        return b ? new BigNumber(x) : (i = DECIMAL_PLACES, j = ROUNDING_MODE, DECIMAL_PLACES = 0, ROUNDING_MODE = 1, x = x['div'](y), DECIMAL_PLACES = i, ROUNDING_MODE = j, this['minus'](x['times'](y)));
    };
    P['negated'] = P['neg'] = function () {
        var x = new BigNumber(this);
        return x['s'] = -x['s'] || null, x;
    };
    P['plus'] = function (y, b) {
        var d, x = this, a = x['s'];
        b = (id = 10, y = new BigNumber(y, b))['s'];
        if (!a || !b) {
            return new BigNumber(NaN);
        }
        if (a != b) {
            return y['s'] = -b, x['minus'](y);
        }
        var xe = x['e'], xc = x['c'], ye = y['e'], yc = y['c'];
        if (!xe || !ye) {
            if (!xc || !yc) {
                return new BigNumber(a / 0);
            }
            if (!xc[0] || !yc[0]) {
                return yc[0] ? y : new BigNumber(xc[0] ? x : a * 0);
            }
        }
        if (xc = xc.slice(), a = xe - ye) {
            d = a > 0 ? (ye = xe, yc) : (a = -a, xc);
            for (d.reverse(); a--; d.push(0)) {
            }
            d.reverse();
        }
        if (xc.length - yc.length < 0) {
            d = yc, yc = xc, xc = d;
        }
        for (a = yc.length, b = 0; a; b = (xc[--a] = xc[a] + yc[a] + b) / 10 ^ 0, xc[a] %= 10) {
        }
        if (b) {
            xc.unshift(b);
            if (++ye > MAX_EXP) {
                xc = ye = null;
            }
        }
        for (a = xc.length; xc[--a] == 0; xc.pop()) {
        }
        return y['c'] = xc, y['e'] = ye, y;
    };
    P['toPower'] = P['pow'] = function (e) {
        var i = e * 0 == 0 ? e | 0 : e, x = new BigNumber(this), y = new BigNumber(ONE);
        if (((outOfRange = e < -MAX_POWER || e > MAX_POWER) && (i = e * 1 / 0) || parse(e) != e && e !== 0 && !(i = NaN)) && !ifExceptionsThrow(e, 'exponent', 'pow') || !i) {
            return new BigNumber(Math.pow(x['toS'](), i));
        }
        for (i = i < 0 ? -i : i;;) {
            if (i & 1) {
                y = y['times'](x);
            }
            i >>= 1;
            if (!i) {
                break;
            }
            x = x['times'](x);
        }
        return e < 0 ? ONE['div'](y) : y;
    };
    P['round'] = function (dp, rm) {
        dp = dp == null || ((outOfRange = dp < 0 || dp > MAX) || parse(dp) != dp) && !ifExceptionsThrow(dp, 'decimal places', 'round') ? 0 : dp | 0;
        rm = rm == null || ((outOfRange = rm < 0 || rm > 8) || parse(rm) != rm && rm !== 0) && !ifExceptionsThrow(rm, 'mode', 'round') ? ROUNDING_MODE : rm | 0;
        return setMode(this, dp, rm);
    };
    P['squareRoot'] = P['sqrt'] = function () {
        var n, r, re, t, x = this, c = x['c'], s = x['s'], e = x['e'], dp = DECIMAL_PLACES, rm = ROUNDING_MODE, half = new BigNumber('0.5');
        if (s !== 1 || !c || !c[0]) {
            return new BigNumber(!s || s < 0 && (!c || c[0]) ? NaN : c ? x : 1 / 0);
        }
        s = Math.sqrt(x['toS']());
        ROUNDING_MODE = 1;
        if (s == 0 || s == 1 / 0) {
            n = c.join('');
            if (!(n.length + e & 1)) {
                n += '0';
            }
            r = new BigNumber(Math.sqrt(n) + '');
            if (!r['c']) {
                r['c'] = [1];
            }
            r['e'] = ((e + 1) / 2 | 0) - (e < 0 || e & 1);
        } else {
            r = new BigNumber(n = s.toString());
        }
        re = r['e'];
        s = re + (DECIMAL_PLACES += 4);
        if (s < 3) {
            s = 0;
        }
        e = s;
        for (;;) {
            t = r;
            r = half['times'](t['plus'](x['div'](t)));
            if (t['c'].slice(0, s).join('') === r['c'].slice(0, s).join('')) {
                c = r['c'];
                s = s - (n && r['e'] < re);
                if (c[s] == 9 && c[s - 1] == 9 && c[s - 2] == 9 && (c[s - 3] == 9 || n && c[s - 3] == 4)) {
                    if (n && c[s - 3] == 9) {
                        t = r['round'](dp, 0);
                        if (t['times'](t)['eq'](x)) {
                            ROUNDING_MODE = rm;
                            DECIMAL_PLACES = dp;
                            return t;
                        }
                    }
                    DECIMAL_PLACES += 4;
                    s += 4;
                    n = '';
                } else {
                    if (!c[e] && !c[e - 1] && !c[e - 2] && (!c[e - 3] || c[e - 3] == 5)) {
                        if (c.length > e - 2) {
                            c.length = e - 2;
                        }
                        if (!r['times'](r)['eq'](x)) {
                            while (c.length < e - 3) {
                                c.push(0);
                            }
                            c[e - 3]++;
                        }
                    }
                    ROUNDING_MODE = rm;
                    rnd(r, DECIMAL_PLACES = dp, 10);
                    return r;
                }
            }
        }
    };
    P['times'] = function (y, b) {
        var c, x = this, xc = x['c'], yc = (id = 11, y = new BigNumber(y, b))['c'], i = x['e'], j = y['e'], a = x['s'];
        y['s'] = a == (b = y['s']) ? 1 : -1;
        if (!i && (!xc || !xc[0]) || !j && (!yc || !yc[0])) {
            return new BigNumber(!a || !b || xc && !xc[0] && !yc || yc && !yc[0] && !xc ? NaN : !xc || !yc ? y['s'] / 0 : y['s'] * 0);
        }
        y['e'] = i + j;
        if ((a = xc.length) < (b = yc.length)) {
            c = xc, xc = yc, yc = c, j = a, a = b, b = j;
        }
        for (j = a + b, c = []; j--; c.push(0)) {
        }
        for (i = b - 1; i > -1; i--) {
            for (b = 0, j = a + i; j > i; b = c[j] + yc[i] * xc[j - i - 1] + b, c[j--] = b % 10 | 0, b = b / 10 | 0) {
            }
            if (b) {
                c[j] = (c[j] + b) % 10;
            }
        }
        b && ++y['e'];
        !c[0] && c.shift();
        for (j = c.length; !c[--j]; c.pop()) {
        }
        y['c'] = y['e'] > MAX_EXP ? y['e'] = null : y['e'] < MIN_EXP ? [y['e'] = 0] : c;
        return y;
    };
    P['toExponential'] = P['toE'] = function (dp) {
        return format(this, (dp == null || ((outOfRange = dp < 0 || dp > MAX) || parse(dp) != dp && dp !== 0) && !ifExceptionsThrow(dp, 'decimal places', 'toE')) && this['c'] ? this['c'].length - 1 : dp | 0, 1);
    };
    P['toFixed'] = P['toF'] = function (dp) {
        var n, str, d, x = this;
        if (!(dp == null || ((outOfRange = dp < 0 || dp > MAX) || parse(dp) != dp && dp !== 0) && !ifExceptionsThrow(dp, 'decimal places', 'toF'))) {
            d = x['e'] + (dp | 0);
        }
        n = TO_EXP_NEG, dp = TO_EXP_POS;
        TO_EXP_NEG = -(TO_EXP_POS = 1 / 0);
        if (d == str) {
            str = x['toS']();
        } else {
            str = format(x, d);
            if (x['s'] < 0 && x['c']) {
                if (!x['c'][0]) {
                    str = str.replace(/^-/, '');
                } else if (str.indexOf('-') < 0) {
                    str = '-' + str;
                }
            }
        }
        TO_EXP_NEG = n, TO_EXP_POS = dp;
        return str;
    };
    P['toFraction'] = P['toFr'] = function (maxD) {
        var q, frac, n0, d0, d2, n, e, n1 = d0 = new BigNumber(ONE), d1 = n0 = new BigNumber('0'), x = this, xc = x['c'], exp = MAX_EXP, dp = DECIMAL_PLACES, rm = ROUNDING_MODE, d = new BigNumber(ONE);
        if (!xc) {
            return x['toS']();
        }
        e = d['e'] = xc.length - x['e'] - 1;
        if (maxD == null || (!(id = 12, n = new BigNumber(maxD))['s'] || (outOfRange = n['cmp'](n1) < 0 || !n['c']) || ERRORS && n['e'] < n['c'].length - 1) && !ifExceptionsThrow(maxD, 'max denominator', 'toFr') || (maxD = n)['cmp'](d) > 0) {
            maxD = e > 0 ? d : n1;
        }
        MAX_EXP = 1 / 0;
        n = new BigNumber(xc.join(''));
        for (DECIMAL_PLACES = 0, ROUNDING_MODE = 1;;) {
            q = n['div'](d);
            d2 = d0['plus'](q['times'](d1));
            if (d2['cmp'](maxD) == 1) {
                break;
            }
            d0 = d1, d1 = d2;
            n1 = n0['plus'](q['times'](d2 = n1));
            n0 = d2;
            d = n['minus'](q['times'](d2 = d));
            n = d2;
        }
        d2 = maxD['minus'](d0)['div'](d1);
        n0 = n0['plus'](d2['times'](n1));
        d0 = d0['plus'](d2['times'](d1));
        n0['s'] = n1['s'] = x['s'];
        DECIMAL_PLACES = e * 2;
        ROUNDING_MODE = rm;
        frac = n1['div'](d1)['minus'](x)['abs']()['cmp'](n0['div'](d0)['minus'](x)['abs']()) < 1 ? [
            n1['toS'](),
            d1['toS']()
        ] : [
            n0['toS'](),
            d0['toS']()
        ];
        return MAX_EXP = exp, DECIMAL_PLACES = dp, frac;
    };
    P['toPrecision'] = P['toP'] = function (sd) {
        return sd == null || ((outOfRange = sd < 1 || sd > MAX) || parse(sd) != sd) && !ifExceptionsThrow(sd, 'precision', 'toP') ? this['toS']() : format(this, --sd | 0, 2);
    };
    P['toString'] = P['toS'] = function (b) {
        var u, str, strL, x = this, xe = x['e'];
        if (xe === null) {
            str = x['s'] ? 'Infinity' : 'NaN';
        } else if (b === u && (xe <= TO_EXP_NEG || xe >= TO_EXP_POS)) {
            return format(x, x['c'].length - 1, 1);
        } else {
            str = x['c'].join('');
            if (xe < 0) {
                for (; ++xe; str = '0' + str) {
                }
                str = '0.' + str;
            } else if (strL = str.length, xe > 0) {
                if (++xe > strL) {
                    for (xe -= strL; xe--; str += '0') {
                    }
                } else if (xe < strL) {
                    str = str.slice(0, xe) + '.' + str.slice(xe);
                }
            } else {
                if (u = str.charAt(0), strL > 1) {
                    str = u + '.' + str.slice(1);
                } else if (u == '0') {
                    return u;
                }
            }
            if (b != null) {
                if (!(outOfRange = !(b >= 2 && b < 65)) && (b == (b | 0) || !ERRORS)) {
                    str = convert(str, b | 0, 10, x['s']);
                    if (str == '0') {
                        return str;
                    }
                } else {
                    ifExceptionsThrow(b, 'base', 'toS');
                }
            }
        }
        return x['s'] < 0 ? '-' + str : str;
    };
    P['toNumber'] = P['toN'] = function () {
        var x = this;
        return +x || (x['s'] ? 0 * x['s'] : NaN);
    };
    P['valueOf'] = P['toJSON'] = function () {
        return this['toS']();
    };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = BigNumber;
    } else if (typeof define == 'function' && define.amd) {
        define('bignumber', [], function () {
            return BigNumber;
        });
    } else {
        global['BigNumber'] = BigNumber;
    }
}(this));
define('LivePayment.Model', [
    'SC.Model',
    'Payment.Model',
    'Models.Init',
    'Application',
    'bignumber',
    'Utils',
    'underscore'
], function (SCModel, Payment, ModelsInit, Application, BigNumber, Utils, _) {
    'use strict';
    return SCModel.extend({
        name: 'LivePayment',
        create: function () {
            var customer_payment = nlapiCreateRecord('customerpayment', { recordmode: 'dynamic' });
            customer_payment.setFieldValue('customer', nlapiGetUser());
            customer_payment.setFieldValue('autoapply', 'F');
            return customer_payment;
        },
        loadRecord: function (internalid) {
            return nlapiLoadRecord('customerpayment', internalid, { recordmode: 'dynamic' });
        },
        get: function (internalid) {
            try {
                var customer_payment;
                if (internalid && internalid !== 'null') {
                    customer_payment = this.loadRecord(internalid);
                } else {
                    customer_payment = this.create();
                }
                return this.createResult(customer_payment);
            } catch (e) {
                if (e instanceof nlobjError && e.getCode() === 'INSUFFICIENT_PERMISSION') {
                    return {};
                } else {
                    throw e;
                }
            }
        },
        setPaymentMethod: function (customer_payment, result) {
            result.paymentmethods = [];
            return Utils.setPaymentMethodToResult(customer_payment, result);
        },
        createResult: function (customer_payment) {
            var result = {};
            result.internalid = customer_payment.getId();
            result.type = customer_payment.getRecordType();
            result.tranid = customer_payment.getFieldValue('tranid');
            result.autoapply = customer_payment.getFieldValue('autoapply');
            result.trandate = customer_payment.getFieldValue('trandate');
            result.status = customer_payment.getFieldValue('status');
            result.payment = Utils.toCurrency(customer_payment.getFieldValue('payment'));
            result.payment_formatted = Utils.formatCurrency(customer_payment.getFieldValue('payment'));
            result.lastmodifieddate = customer_payment.getFieldValue('lastmodifieddate');
            result.balance = Utils.toCurrency(customer_payment.getFieldValue('balance'));
            result.balance_formatted = Utils.formatCurrency(customer_payment.getFieldValue('balance'));
            this.setPaymentMethod(customer_payment, result);
            this.setInvoices(customer_payment, result);
            this.setCredits(customer_payment, result);
            this.setDeposits(customer_payment, result);
            return result;
        },
        setInvoices: function (customer_payment, result) {
            result.invoices = [];
            var invoice_ids_to_search = [];
            for (var i = 1; i <= customer_payment.getLineItemCount('apply'); i++) {
                var invoice = {
                    internalid: customer_payment.getLineItemValue('apply', 'internalid', i),
                    total: Utils.toCurrency(customer_payment.getLineItemValue('apply', 'total', i)),
                    total_formatted: Utils.formatCurrency(customer_payment.getLineItemValue('apply', 'total', i)),
                    apply: customer_payment.getLineItemValue('apply', 'apply', i) === 'T',
                    applydate: customer_payment.getLineItemValue('apply', 'applydate', i),
                    currency: customer_payment.getLineItemValue('apply', 'currency', i),
                    discamt: Utils.toCurrency(customer_payment.getLineItemValue('apply', 'discamt', i)),
                    discamt_formatted: Utils.formatCurrency(customer_payment.getLineItemValue('apply', 'discamt', i)),
                    disc: Utils.toCurrency(customer_payment.getLineItemValue('apply', 'disc', i)),
                    disc_formatted: Utils.formatCurrency(customer_payment.getLineItemValue('apply', 'disc', i)),
                    discdate: customer_payment.getLineItemValue('apply', 'discdate', i),
                    amount: Utils.toCurrency(customer_payment.getLineItemValue('apply', 'amount', i)),
                    amount_formatted: Utils.formatCurrency(customer_payment.getLineItemValue('apply', 'amount', i)),
                    due: Utils.toCurrency(customer_payment.getLineItemValue('apply', 'due', i)),
                    due_formatted: Utils.formatCurrency(customer_payment.getLineItemValue('apply', 'due', i)),
                    tranid: customer_payment.getLineItemValue('apply', 'refnum', i)
                };
                if (customer_payment.getLineItemValue('apply', 'type', i) === 'Invoice') {
                    result.invoices.push(invoice);
                    invoice_ids_to_search.push(invoice.internalid);
                }
            }
            if (result.invoices.length) {
                var filters = [
                        new nlobjSearchFilter('mainline', null, 'is', 'T'),
                        new nlobjSearchFilter('internalid', null, 'anyof', invoice_ids_to_search)
                    ], columns = [
                        new nlobjSearchColumn('duedate'),
                        new nlobjSearchColumn('trandate'),
                        new nlobjSearchColumn('internalid')
                    ], now = new Date().getTime(), invoices_expanded = Application.getAllSearchResults('invoice', filters, columns);
                _.each(result.invoices, function (invoice) {
                    var selected_invoice = _.find(invoices_expanded, function (expaded_invoice_filter) {
                            return expaded_invoice_filter.getValue('internalid') === invoice.internalid;
                        }), due_date = selected_invoice.getValue('duedate'), due_in_milliseconds = new Date(due_date).getTime() - now;
                    invoice.discountapplies = invoice.due === invoice.total && (invoice.discdate && stringtodate(invoice.discdate) >= new Date());
                    invoice.duewithdiscount = BigNumber(invoice.due).minus(invoice.discountapplies ? invoice.discamt : 0).toNumber();
                    invoice.duewithdiscount_formatted = Utils.formatCurrency(invoice.duewithdiscount);
                    invoice.discount = invoice.discamt && invoice.total ? BigNumber(invoice.discamt).div(invoice.total).times(100).round(2).toNumber() : 0;
                    invoice.discount_formatted = invoice.discount + '%';
                    if (!invoice.apply) {
                        var amount = BigNumber(invoice.due).minus(invoice.discountapplies ? invoice.discamt : 0).toNumber();
                        invoice.amount = amount;
                        invoice.amount_formatted = Utils.formatCurrency(amount);
                    }
                    invoice.trandate = selected_invoice.getValue('trandate');
                    invoice.duedate = due_date;
                    invoice.dueinmilliseconds = due_in_milliseconds;
                    invoice.isOverdue = due_in_milliseconds <= 0 && -1 * due_in_milliseconds / 1000 / 60 / 60 / 24 >= 1;
                });
            }
            return result;
        },
        setCredits: function (customer_payment, result) {
            result.credits = [];
            result.creditmemosremaining = 0;
            for (var i = 1; i <= customer_payment.getLineItemCount('credit'); i++) {
                var creditmemo = {
                    internalid: customer_payment.getLineItemValue('credit', 'internalid', i),
                    type: customer_payment.getLineItemValue('credit', 'type', i),
                    total: Utils.toCurrency(customer_payment.getLineItemValue('credit', 'total', i)),
                    total_formatted: Utils.formatCurrency(customer_payment.getLineItemValue('credit', 'total', i)),
                    apply: customer_payment.getLineItemValue('credit', 'apply', i) === 'T',
                    currency: customer_payment.getLineItemValue('apply', 'currency', i),
                    remaining: Utils.toCurrency(customer_payment.getLineItemValue('credit', 'due', i)),
                    remaining_formatted: Utils.formatCurrency(customer_payment.getLineItemValue('credit', 'due', i)),
                    amount: Utils.toCurrency(customer_payment.getLineItemValue('credit', 'amount', i)),
                    amount_formatted: Utils.formatCurrency(customer_payment.getLineItemValue('credit', 'amount', i)),
                    refnum: customer_payment.getLineItemValue('credit', 'refnum', i)
                };
                result.creditmemosremaining = BigNumber(creditmemo.remaining).plus(result.creditmemosremaining).toNumber();
                result.credits.push(creditmemo);
            }
            result.creditmemosremaining_formatted = Utils.formatCurrency(result.creditmemosremaining);
            return result;
        },
        setDeposits: function (customer_payment, result) {
            result.deposits = [];
            result.depositsremaining = 0;
            for (var i = 1; i <= customer_payment.getLineItemCount('deposit'); i++) {
                var deposit = {
                    internalid: customer_payment.getLineItemValue('deposit', 'doc', i),
                    total: Utils.toCurrency(customer_payment.getLineItemValue('deposit', 'total', i)),
                    total_formatted: Utils.formatCurrency(customer_payment.getLineItemValue('deposit', 'total', i)),
                    apply: customer_payment.getLineItemValue('deposit', 'apply', i) === 'T',
                    currency: customer_payment.getLineItemValue('deposit', 'currency', i),
                    depositdate: customer_payment.getLineItemValue('deposit', 'depositdate', i),
                    remaining: Utils.toCurrency(customer_payment.getLineItemValue('deposit', 'remaining', i)),
                    remaining_formatted: Utils.formatCurrency(customer_payment.getLineItemValue('deposit', 'remaining', i)),
                    amount: Utils.toCurrency(customer_payment.getLineItemValue('deposit', 'amount', i)),
                    amount_formatted: Utils.formatCurrency(customer_payment.getLineItemValue('deposit', 'amount', i)),
                    refnum: customer_payment.getLineItemValue('deposit', 'refnum', i)
                };
                result.depositsremaining = BigNumber(deposit.remaining).plus(result.depositsremaining).toNumber();
                result.deposits.push(deposit);
            }
            result.depositsremaining_formatted = Utils.formatCurrency(result.depositsremaining);
            return result;
        },
        update: function (payment_record, data) {
            var self = this, invoices = data.invoices, credits = data.credits, deposits = data.deposits;
            for (var i = 1; i <= payment_record.getLineItemCount('apply'); i++) {
                var invoice = _.findWhere(invoices, { internalid: payment_record.getLineItemValue('apply', 'internalid', i) });
                if (invoice && invoice.apply) {
                    payment_record.setLineItemValue('apply', 'apply', i, 'T');
                    payment_record.setLineItemValue('apply', 'amount', i, invoice.amount);
                    invoice.due = payment_record.getLineItemValue('apply', 'due', i);
                    invoice.total = payment_record.getLineItemValue('apply', 'total', i);
                    invoice.discdate = payment_record.getLineItemValue('apply', 'discdate', i);
                    invoice.discamt = payment_record.getLineItemValue('apply', 'discamt', i);
                    invoice.discountapplies = invoice.due === invoice.total && (invoice.discdate && stringtodate(invoice.discdate) >= new Date());
                    invoice.duewithdiscount = BigNumber(invoice.due).minus(invoice.discountapplies ? invoice.discamt : 0).toNumber();
                    if (self._isPayFull(invoice) && invoice.discountapplies && invoice.discamt) {
                        payment_record.setLineItemValue('apply', 'disc', i, invoice.discamt);
                    }
                }
            }
            for (i = 1; i <= payment_record.getLineItemCount('deposit'); i++) {
                var deposit = _.findWhere(deposits, { internalid: payment_record.getLineItemValue('deposit', 'doc', i) });
                if (deposit && deposit.apply) {
                    payment_record.setLineItemValue('deposit', 'apply', i, 'T');
                    payment_record.setLineItemValue('deposit', 'amount', i, deposit.amount);
                }
            }
            for (i = 1; i <= payment_record.getLineItemCount('credit'); i++) {
                var credit = _.findWhere(credits, { internalid: payment_record.getLineItemValue('credit', 'internalid', i) });
                if (credit && credit.apply) {
                    payment_record.setLineItemValue('credit', 'apply', i, 'T');
                    payment_record.setLineItemValue('credit', 'amount', i, credit.amount);
                }
            }
            var payment_method = data.paymentmethods && data.paymentmethods[0];
            if (data.payment && payment_method && payment_method.type) {
                payment_record.setFieldValue('returnurl', null);
                payment_record.setFieldValue('creditcard', null);
                payment_record.setFieldValue('ccexpiredate', null);
                payment_record.setFieldValue('ccname', null);
                payment_record.setFieldValue('ccnumber', null);
                payment_record.setFieldValue('paymentmethod', null);
                payment_record.setFieldValue('creditcardprocessor', null);
                payment_record.setFieldValue('paymenteventholdreason', null);
                if (payment_method.type === 'creditcard') {
                    var credit_card = payment_method.creditcard;
                    payment_record.setFieldValue('creditcard', credit_card.internalid);
                    payment_record.setFieldValue('paymentmethod', credit_card.paymentmethod.internalid);
                    if (credit_card.paymentmethod.merchantid) {
                        payment_record.setFieldValue('creditcardprocessor', credit_card.paymentmethod.merchantid);
                    }
                    if (credit_card.ccsecuritycode) {
                        payment_record.setFieldValue('ccsecuritycode', credit_card.ccsecuritycode);
                    }
                    payment_record.setFieldValue('chargeit', 'T');
                } else if (~payment_method.type.indexOf('external_checkout')) {
                    payment_record.setFieldValue('paymentmethod', payment_method.internalid);
                    payment_record.setFieldValue('creditcardprocessor', payment_method.merchantid);
                    payment_record.setFieldValue('returnurl', payment_method.returnurl);
                    payment_record.setFieldValue('chargeit', 'T');
                }
            }
            payment_record.setFieldValue('payment', data.payment);
            return payment_record;
        },
        _isPayFull: function (invoice) {
            if (invoice.discountapplies) {
                return invoice.amount === invoice.duewithdiscount;
            } else {
                return invoice.amount === invoice.due;
            }
        },
        submit: function (data) {
            var payment_record = this.update(data.internalid ? this.loadRecord(data.internalid) : this.create(), data), payment_record_id = nlapiSubmitRecord(payment_record), new_payment_record = this.get();
            if (payment_record_id !== '0') {
                new_payment_record.confirmation = _.extend(data, Payment.get(payment_record_id));
            } else {
                data.internalid = '0';
                new_payment_record.confirmation = data;
            }
            return new_payment_record;
        }
    });
});
define('LivePayment.ServiceController', [
    'ServiceController',
    'LivePayment.Model'
], function (ServiceController, LivePaymentModel) {
    'use strict';
    return ServiceController.extend({
        name: 'LivePayment.ServiceController',
        options: {
            common: {
                requireLogin: true,
                requirePermissions: {
                    list: [
                        'transactions.tranCustPymt.2',
                        'transactions.tranCustInvc.1'
                    ]
                }
            }
        },
        get: function () {
            return LivePaymentModel.get();
        },
        post: function () {
            return LivePaymentModel.submit(this.data);
        },
        put: function () {
            return LivePaymentModel.submit(this.data);
        }
    });
});
define('Newsletter.Model', [
    'SC.Model',
    'Models.Init',
    'underscore',
    'Utils'
], function (SCModel, ModelsInit, _) {
    'use strict';
    return SCModel.extend({
        name: 'Newsletter',
        validation: {
            email: {
                required: true,
                pattern: 'email',
                msg: 'Valid email is required'
            }
        },
        subscribe: function subscribe(email) {
            this.validate({ 'email': email });
            var searchFilter = new nlobjSearchFilter('email', null, 'is', email), searchColumnSubscriptionStatus = new nlobjSearchColumn('globalsubscriptionstatus'), customers = nlapiSearchRecord('customer', null, [searchFilter], [searchColumnSubscriptionStatus]), records = _.groupBy(customers, function (customer) {
                    return customer.getRecordType();
                });
            if (!records.customer && !records.lead) {
                return this.createSubscription(email);
            } else {
                return records.customer ? this.updateSubscription(records.customer) : this.updateSubscription(records.lead);
            }
        },
        createSubscription: function createSubscription(email) {
            var record = nlapiCreateRecord('lead');
            record.setFieldValue('entityid', email);
            record.setFieldValue('firstname', SC.Configuration.newsletter.genericFirstName);
            record.setFieldValue('lastname', SC.Configuration.newsletter.genericLastName);
            record.setFieldValue('email', email);
            record.setFieldValue('subsidiary', ModelsInit.session.getShopperSubsidiary());
            record.setFieldValue('companyname', SC.Configuration.newsletter.companyName);
            record.setFieldValue('globalsubscriptionstatus', 1);
            nlapiSubmitRecord(record);
            return this.subscriptionDone;
        },
        updateSubscription: function updateSubscription(subscribers) {
            var subscribers_data = _.map(subscribers, function (subscriber) {
                    return {
                        'id': subscriber.getId(),
                        'status': subscriber.getValue('globalsubscriptionstatus')
                    };
                }), subscribers_count = _.countBy(subscribers_data, function (subscriber) {
                    return subscriber['status'];
                });
            subscribers_count['1'] = subscribers_count['1'] || 0;
            subscribers_count['2'] = subscribers_count['2'] || 0;
            subscribers_count['3'] = subscribers_count['3'] || 0;
            subscribers_count['4'] = subscribers_count['4'] || 0;
            if (subscribers_count['4'] === subscribers.length) {
                throw this.buildErrorAnswer('ERR_USER_STATUS_DISABLED');
            } else if (subscribers_count['1'] + subscribers_count['3'] + subscribers_count['4'] === subscribers.length) {
                throw this.buildErrorAnswer('ERR_USER_STATUS_ALREADY_SUBSCRIBED');
            } else if (subscribers_count['2']) {
                var customers_to_subscribe = _.filter(subscribers_data, function (subscriber) {
                    return subscriber.status == 2;
                });
                _.each(customers_to_subscribe, function (subscriber) {
                    nlapiSubmitField('customer', subscriber.id, 'globalsubscriptionstatus', 1, false);
                });
                return this.subscriptionDone;
            } else {
                throw this.buildErrorAnswer('ERROR');
            }
        },
        subscriptionDone: {
            code: 'OK',
            message: 'Subscription successful!'
        },
        buildErrorAnswer: function buildErrorAnswer(code) {
            return {
                status: 500,
                code: code,
                message: 'Error trying to set up subscription.'
            };
        }
    });
});
define('Newsletter.ServiceController', [
    'ServiceController',
    'Newsletter.Model'
], function (ServiceController, NewsletterModel) {
    'use strict';
    return ServiceController.extend({
        name: 'Newsletter.ServiceController',
        options: { common: { requirePermissions: { list: ['lists.listCustJob.3'] } } },
        post: function () {
            return NewsletterModel.subscribe(this.data.email);
        }
    });
});
define('Payment.ServiceController', [
    'ServiceController',
    'Payment.Model'
], function (ServiceController, PaymentModel) {
    'use strict';
    return ServiceController.extend({
        name: 'Payment.ServiceController',
        options: {
            common: {
                requireLogin: true,
                requirePermissions: { list: ['transactions.tranCustPymt.1'] }
            }
        },
        get: function () {
            var id = this.request.getParameter('internalid');
            return PaymentModel.get(id);
        }
    });
});
define('ReorderItems.Model', [
    'SC.Model',
    'Models.Init',
    'Application',
    'StoreItem.Model',
    'SiteSettings.Model',
    'Utils',
    'underscore'
], function (SCModel, ModelsInit, Application, StoreItem, SiteSettings, Utils, _) {
    'use strict';
    return SCModel.extend({
        name: 'OrderItem',
        isMultiSite: ModelsInit.context.getFeature('MULTISITE'),
        search: function (order_id, query_filters) {
            var filters = {
                    'entity': [
                        'entity',
                        'is',
                        nlapiGetUser()
                    ],
                    'entity_operator': 'and',
                    'quantity': [
                        'quantity',
                        'greaterthan',
                        0
                    ],
                    'quantity_operator': 'and',
                    'mainline': [
                        'mainline',
                        'is',
                        'F'
                    ],
                    'mainline_operator': 'and',
                    'cogs': [
                        'cogs',
                        'is',
                        'F'
                    ],
                    'cogs_operator': 'and',
                    'taxline': [
                        'taxline',
                        'is',
                        'F'
                    ],
                    'taxline_operator': 'and',
                    'shipping': [
                        'shipping',
                        'is',
                        'F'
                    ],
                    'shipping_operator': 'and',
                    'transactiondiscount': [
                        'transactiondiscount',
                        'is',
                        'F'
                    ],
                    'transactiondiscount_operator': 'and',
                    'item_is_active': [
                        'item.isinactive',
                        'is',
                        'F'
                    ],
                    'item_is_active_operator': 'and',
                    'item_type': [
                        'item.type',
                        'noneof',
                        'GiftCert'
                    ]
                }, columns = [
                    new nlobjSearchColumn('internalid', 'item', 'group'),
                    new nlobjSearchColumn('type', 'item', 'group'),
                    new nlobjSearchColumn('parent', 'item', 'group'),
                    new nlobjSearchColumn('options', null, 'group'),
                    new nlobjSearchColumn('onlinecustomerprice', 'item', 'max'),
                    new nlobjSearchColumn('trandate', null, 'max'),
                    new nlobjSearchColumn('internalid', null, 'count')
                ], item_name = new nlobjSearchColumn('formulatext', 'item', 'group');
            item_name.setFormula('case when LENGTH({item.storedisplayname}) > 0 then {item.storedisplayname} else (case when LENGTH({item.displayname}) > 0 then {item.displayname} else {item.itemid} end) end');
            columns.push(item_name);
            var site_settings = SiteSettings.get();
            if (site_settings.isSCISIntegrationEnabled) {
                filters.scisrecords_operator = 'and';
                filters.scisrecords = [
                    [
                        [
                            'type',
                            'anyof',
                            [
                                'CashSale',
                                'CustInvc'
                            ]
                        ],
                        'and',
                        [
                            'createdfrom',
                            'is',
                            '@NONE@'
                        ],
                        'and',
                        [
                            'location.locationtype',
                            'is',
                            SC.Configuration.locationTypeMapping.store.internalid
                        ],
                        'and',
                        [
                            'source',
                            'is',
                            '@NONE@'
                        ]
                    ],
                    'or',
                    [[
                            'type',
                            'anyof',
                            ['SalesOrd']
                        ]]
                ];
            } else {
                filters.type_operator = 'and';
                filters.type = [
                    'type',
                    'anyof',
                    ['SalesOrd']
                ];
            }
            if (this.isMultiSite) {
                var site_id = ModelsInit.session.getSiteSettings(['siteid']).siteid, filter_site = SC.Configuration.filter_site, search_filter_array = null;
                if (_.isString(filter_site) && filter_site === 'current') {
                    search_filter_array = [
                        site_id,
                        '@NONE@'
                    ];
                } else if (_.isString(filter_site) && filter_site === 'all') {
                    search_filter_array = [];
                } else if (_.isArray(filter_site)) {
                    search_filter_array = filter_site;
                    search_filter_array.push('@NONE@');
                }
                if (search_filter_array && search_filter_array.length) {
                    filters.site_operator = 'and';
                    filters.site = [
                        'website',
                        'anyof',
                        _.uniq(search_filter_array)
                    ];
                    filters.item_website_operator = 'and';
                    filters.item_website = [
                        'item.website',
                        'anyof',
                        _.uniq(search_filter_array)
                    ];
                }
            }
            if (order_id) {
                filters.order_operator = 'and';
                filters.order_id = [
                    'internalid',
                    'is',
                    order_id
                ];
                columns.push(new nlobjSearchColumn('tranid', null, 'group'));
            }
            if (query_filters.date.from && query_filters.date.to) {
                var offset = new Date().getTimezoneOffset() * 60 * 1000;
                filters.date_operator = 'and';
                filters.date = [
                    'trandate',
                    'within',
                    new Date(parseInt(query_filters.date.from, 10) + offset),
                    new Date(parseInt(query_filters.date.to, 10) + offset)
                ];
            }
            switch (query_filters.sort) {
            case 'name':
                item_name.setSort(query_filters.order > 0);
                break;
            case 'price':
                columns[4].setSort(query_filters.order > 0);
                break;
            case 'date':
                columns[5].setSort(query_filters.order > 0);
                break;
            case 'quantity':
                columns[6].setSort(query_filters.order > 0);
                break;
            default:
                columns[6].setSort(true);
                break;
            }
            var result = Application.getPaginatedSearchResults({
                    record_type: 'transaction',
                    filters: _.values(filters),
                    columns: columns,
                    page: query_filters.page,
                    column_count: new nlobjSearchColumn('formulatext', null, 'count').setFormula('CONCAT({item}, {options})')
                }), items_info = _.map(result.records, function (line) {
                    return {
                        id: line.getValue('internalid', 'item', 'group'),
                        type: line.getValue('type', 'item', 'group')
                    };
                });
            if (items_info.length) {
                StoreItem.preloadItems(items_info);
                result.records = _.map(result.records, function (line) {
                    return {
                        item: StoreItem.get(line.getValue('internalid', 'item', 'group'), line.getValue('type', 'item', 'group')),
                        tranid: line.getValue('tranid', null, 'group') || null,
                        options: Utils.getItemOptionsObject(line.getValue('options', null, 'group')),
                        trandate: line.getValue('trandate', null, 'max')
                    };
                });
            }
            return result;
        }
    });
});
define('ReorderItems.ServiceController', [
    'ServiceController',
    'ReorderItems.Model',
    'SiteSettings.Model'
], function (ServiceController, ReorderItemsModel, SiteSettingsModel) {
    'use strict';
    var enabled = SiteSettingsModel.get().isSCISIntegrationEnabled;
    return ServiceController.extend({
        name: 'ReorderItems.ServiceController',
        options: {
            common: {
                requireLogin: true,
                requirePermissions: {
                    list: [
                        enabled ? 'transactions.tranPurchases.1' : 'transactions.tranSalesOrd.1',
                        'transactions.tranFind.1'
                    ]
                }
            }
        },
        get: function () {
            return ReorderItemsModel.search(this.request.getParameter('order_id'), {
                date: {
                    from: this.request.getParameter('from'),
                    to: this.request.getParameter('to')
                },
                page: this.request.getParameter('page') || 1,
                sort: this.request.getParameter('sort'),
                order: this.request.getParameter('order')
            });
        }
    });
});
define('Transaction.Model', [
    'SC.Model',
    'Models.Init',
    'Application',
    'Utils',
    'underscore'
], function (SCModel, ModelsInit, Application, Utils, _) {
    'use strict';
    var StoreItem, AddressModel;
    try {
        StoreItem = require('StoreItem.Model');
    } catch (e) {
    }
    try {
        AddressModel = require('Address.Model');
    } catch (e) {
    }
    return SCModel.extend({
        name: 'Transaction',
        storeItem: StoreItem,
        isMultiCurrency: ModelsInit.context.getFeature('MULTICURRENCY'),
        isMultiSite: ModelsInit.context.getFeature('MULTISITE'),
        now: new Date().getTime(),
        list: function (data) {
            this.preList();
            var self = this;
            this.data = data;
            this.amountField = this.isMultiCurrency ? 'fxamount' : 'amount';
            this.filters = {
                'entity': [
                    'entity',
                    'is',
                    nlapiGetUser()
                ],
                'mainline_operator': 'and',
                'mainline': [
                    'mainline',
                    'is',
                    'T'
                ]
            };
            this.columns = {
                'trandate': new nlobjSearchColumn('trandate'),
                'internalid': new nlobjSearchColumn('internalid'),
                'tranid': new nlobjSearchColumn('tranid'),
                'status': new nlobjSearchColumn('status'),
                'amount': new nlobjSearchColumn(this.amountField)
            };
            if (this.isMultiCurrency) {
                this.columns.currency = new nlobjSearchColumn('currency');
            }
            if (this.data.from && this.data.to) {
                var offset = new Date().getTimezoneOffset() * 60 * 1000;
                this.filters.date_operator = 'and';
                this.filters.date = [
                    'trandate',
                    'within',
                    new Date(parseInt(this.data.from, 10) + offset),
                    new Date(parseInt(this.data.to, 10) + offset)
                ];
            }
            if (this.data.internalid) {
                this.data.internalid = _.isArray(this.data.internalid) ? this.data.internalid : this.data.internalid.split(',');
                this.filters.internalid_operator = 'and';
                this.filters.internalid = [
                    'internalid',
                    'anyof',
                    this.data.internalid
                ];
            }
            if (this.data.createdfrom) {
                this.filters.createdfrom_operator = 'and';
                this.filters.createdfrom = [
                    'createdfrom',
                    'is',
                    this.data.createdfrom
                ];
            }
            if (this.data.types) {
                this.filters.types_operator = 'and';
                this.filters.types = [
                    'type',
                    'anyof',
                    this.data.types.split(',')
                ];
            }
            if (this.isMultiSite) {
                var site_id = ModelsInit.session.getSiteSettings(['siteid']).siteid, filter_site = SC.Configuration.filter_site, search_filter_array = null;
                if (_.isString(filter_site) && filter_site === 'current') {
                    search_filter_array = [
                        site_id,
                        '@NONE@'
                    ];
                } else if (_.isString(filter_site) && filter_site === 'all') {
                    search_filter_array = [];
                } else if (_.isArray(filter_site)) {
                    search_filter_array = filter_site;
                    search_filter_array.push('@NONE@');
                }
                if (search_filter_array && search_filter_array.length) {
                    this.filters.site_operator = 'and';
                    this.filters.site = [
                        'website',
                        'anyof',
                        _.uniq(search_filter_array)
                    ];
                }
            }
            this.setExtraListFilters();
            this.setExtraListColumns();
            if (this.data.sort) {
                _.each(this.data.sort.split(','), function (column_name) {
                    if (self.columns[column_name]) {
                        self.columns[column_name].setSort(self.data.order >= 0);
                    }
                });
            }
            if (this.data.page === 'all') {
                this.search_results = Application.getAllSearchResults('transaction', _.values(this.filters), _.values(this.columns));
            } else {
                this.search_results = Application.getPaginatedSearchResults({
                    record_type: 'transaction',
                    filters: _.values(this.filters),
                    columns: _.values(this.columns),
                    page: this.data.page || 1,
                    results_per_page: this.data.results_per_page
                });
            }
            var records = _.map((this.data.page === 'all' ? this.search_results : this.search_results.records) || [], function (record) {
                var result = {
                    recordtype: record.getRecordType(),
                    internalid: record.getValue('internalid'),
                    tranid: record.getValue('tranid'),
                    trandate: record.getValue('trandate'),
                    status: {
                        internalid: record.getValue('status'),
                        name: record.getText('status')
                    },
                    amount: Utils.toCurrency(record.getValue(self.amountField)),
                    amount_formatted: Utils.formatCurrency(record.getValue(self.amountField)),
                    currency: self.isMultiCurrency ? {
                        internalid: record.getValue('currency'),
                        name: record.getText('currency')
                    } : null
                };
                return self.mapListResult(result, record);
            });
            if (this.data.page === 'all') {
                this.results = records;
            } else {
                this.results = this.search_results;
                this.results.records = records;
            }
            this.postList();
            return this.results;
        },
        setExtraListColumns: function () {
        },
        setExtraListFilters: function () {
        },
        mapListResult: function (result) {
            return result;
        },
        getTransactionRecord: function (record_type, id) {
            if (this.record) {
                return this.record;
            }
            return nlapiLoadRecord(record_type, id);
        },
        get: function (record_type, id) {
            this.preGet();
            this.recordId = id;
            this.recordType = record_type;
            this.result = {};
            if (record_type && id) {
                this.record = this.getTransactionRecord(record_type, id);
                this.getRecordFields();
                this.getRecordSummary();
                this.getRecordPromocodes();
                this.getRecordPaymentMethod();
                this.getPurchaseOrderNumber();
                this.getRecordAddresses();
                this.getRecordShippingMethods();
                this.getLines();
                this.getExtraRecordFields();
            }
            this.postGet();
            this.result.addresses = _.values(this.result.addresses || {});
            this.result.shipmethods = _.values(this.result.shipmethods || {});
            this.result.lines = _.values(this.result.lines || {});
            return this.result;
        },
        getSalesRep: function () {
            var salesrep_id = this.record.getFieldValue('salesrep'), salesrep_name = this.record.getFieldText('salesrep');
            if (salesrep_id) {
                this.result.salesrep = {
                    name: salesrep_name,
                    internalid: salesrep_id
                };
                var search_result = nlapiLookupField(this.result.recordtype, this.result.internalid, [
                    'salesrep.phone',
                    'salesrep.email',
                    'salesrep.entityid',
                    'salesrep.mobilephone',
                    'salesrep.fax'
                ]);
                if (search_result) {
                    this.result.salesrep.phone = search_result['salesrep.phone'];
                    this.result.salesrep.email = search_result['salesrep.email'];
                    this.result.salesrep.fullname = search_result['salesrep.entityid'];
                    this.result.salesrep.mobilephone = search_result['salesrep.mobilephone'];
                    this.result.salesrep.fax = search_result['salesrep.fax'];
                }
            }
        },
        getRecordFields: function () {
            this.result.internalid = this.recordId;
            this.result.recordtype = this.recordType;
            this.result.tranid = this.record.getFieldValue('tranid');
            this.result.memo = this.record.getFieldValue('memo');
            this.result.trandate = this.record.getFieldValue('trandate');
            if (this.isMultiCurrency) {
                this.result.currency = {
                    internalid: this.record.getFieldValue('currency'),
                    name: this.record.getFieldValue('currencyname')
                };
            }
            this.getCreatedFrom();
            this.getStatus();
        },
        getCreatedFrom: function () {
            var created_from_internalid = this.record.getFieldValue('createdfrom'), record_type = '';
            if (created_from_internalid) {
                record_type = Utils.getTransactionType(created_from_internalid);
            }
            this.result.createdfrom = {
                internalid: created_from_internalid,
                name: this.record.getFieldText('createdfrom'),
                recordtype: record_type || ''
            };
        },
        getStatus: function () {
            this.result.status = {
                internalid: this.record.getFieldValue('status'),
                name: this.record.getFieldText('status')
            };
        },
        getExtraRecordFields: function () {
        },
        getRecordPromocodes: function () {
            this.result.promocodes = [];
            var promocode = this.record.getFieldValue('promocode');
            if (promocode) {
                this.result.promocodes.push({
                    internalid: promocode,
                    code: this.record.getFieldText('couponcode'),
                    isvalid: true,
                    discountrate_formatted: ''
                });
            }
            for (var i = 1; i <= this.record.getLineItemCount('promotions'); i++) {
                this.result.promocodes.push({
                    internalid: this.record.getLineItemValue('promotions', 'couponcode', i),
                    code: this.record.getLineItemValue('promotions', 'couponcode_display', i),
                    isvalid: this.record.getLineItemValue('promotions', 'promotionisvalid', i) === 'T',
                    discountrate_formatted: ''
                });
            }
        },
        getTerms: function () {
            if (this.record.getFieldValue('terms')) {
                return {
                    internalid: this.record.getFieldValue('terms'),
                    name: this.record.getFieldText('terms')
                };
            }
            return null;
        },
        getPurchaseOrderNumber: function () {
            this.result.purchasenumber = this.record.getFieldValue('otherrefnum');
        },
        getRecordPaymentMethod: function () {
            var paymentmethod = {
                    type: this.record.getFieldValue('paymethtype'),
                    primary: true,
                    name: this.record.getFieldText('paymentmethod')
                }, terms = this.getTerms(), ccnumber = this.record.getFieldValue('ccnumber');
            if (ccnumber) {
                paymentmethod.type = 'creditcard';
                paymentmethod.creditcard = {
                    ccnumber: ccnumber,
                    ccexpiredate: this.record.getFieldValue('ccexpiredate'),
                    ccname: this.record.getFieldValue('ccname'),
                    internalid: this.record.getFieldValue('creditcard'),
                    paymentmethod: {
                        ispaypal: 'F',
                        name: this.record.getFieldText('paymentmethod'),
                        creditcard: 'T',
                        internalid: this.record.getFieldValue('paymentmethod')
                    }
                };
            }
            if (terms) {
                paymentmethod.type = 'invoice';
                paymentmethod.paymentterms = terms;
            }
            if (paymentmethod.type) {
                this.result.paymentmethods = [paymentmethod];
            } else {
                this.result.paymentmethods = [];
            }
        },
        getRecordSummary: function () {
            this.result.summary = {
                subtotal: Utils.toCurrency(this.record.getFieldValue('subtotal')),
                subtotal_formatted: Utils.formatCurrency(this.record.getFieldValue('subtotal')),
                taxtotal: Utils.toCurrency(this.record.getFieldValue('taxtotal')),
                taxtotal_formatted: Utils.formatCurrency(this.record.getFieldValue('taxtotal')),
                tax2total: Utils.toCurrency(0),
                tax2total_formatted: Utils.formatCurrency(0),
                shippingcost: Utils.toCurrency(this.record.getFieldValue('shippingcost')),
                shippingcost_formatted: Utils.formatCurrency(this.record.getFieldValue('shippingcost')),
                handlingcost: Utils.toCurrency(this.record.getFieldValue('althandlingcost')),
                handlingcost_formatted: Utils.formatCurrency(this.record.getFieldValue('althandlingcost')),
                estimatedshipping: 0,
                estimatedshipping_formatted: Utils.formatCurrency(0),
                taxonshipping: Utils.toCurrency(0),
                taxonshipping_formatted: Utils.formatCurrency(0),
                discounttotal: Utils.toCurrency(this.record.getFieldValue('discounttotal')),
                discounttotal_formatted: Utils.formatCurrency(this.record.getFieldValue('discounttotal')),
                taxondiscount: Utils.toCurrency(0),
                taxondiscount_formatted: Utils.formatCurrency(0),
                discountrate: Utils.toCurrency(this.record.getFieldValue('discountrate')),
                discountrate_formatted: Utils.formatCurrency(0),
                discountedsubtotal: Utils.toCurrency(0),
                discountedsubtotal_formatted: Utils.formatCurrency(0),
                giftcertapplied: Utils.toCurrency(this.record.getFieldValue('giftcertapplied')),
                giftcertapplied_formatted: Utils.formatCurrency(this.record.getFieldValue('giftcertapplied')),
                total: Utils.toCurrency(this.record.getFieldValue('total')),
                total_formatted: Utils.formatCurrency(this.record.getFieldValue('total'))
            };
        },
        getLines: function () {
            this.result.lines = {};
            var items_to_preload = [], amount, self = this, line_id;
            for (var i = 1; i <= this.record.getLineItemCount('item'); i++) {
                if (this.record.getLineItemValue('item', 'itemtype', i) === 'Discount' && this.record.getLineItemValue('item', 'discline', i)) {
                    var discline = this.record.getLineItemValue('item', 'discline', i);
                    line_id = self.result.internalid + '_' + discline;
                    amount = Math.abs(parseFloat(this.record.getLineItemValue('item', 'amount', i)));
                    this.result.lines[line_id].discount = this.result.lines[line_id].discount ? this.result.lines[line_id].discount + amount : amount;
                    this.result.lines[line_id].total = this.result.lines[line_id].amount + this.result.lines[line_id].tax_amount - this.result.lines[line_id].discount;
                    this.result.lines[line_id].discount_name = this.record.getLineItemValue('item', 'item_display', i);
                } else {
                    var rate = Utils.toCurrency(this.record.getLineItemValue('item', 'rate', i)), item_id = this.record.getLineItemValue('item', 'item', i), item_type = this.record.getLineItemValue('item', 'itemtype', i);
                    amount = Utils.toCurrency(this.record.getLineItemValue('item', 'amount', i));
                    var tax_amount = Utils.toCurrency(this.record.getLineItemValue('item', 'tax1amt', i)) || 0, total = amount + tax_amount;
                    line_id = this.record.getLineItemValue('item', 'id', i);
                    this.result.lines[line_id] = {
                        internalid: line_id,
                        quantity: parseInt(this.record.getLineItemValue('item', 'quantity', i), 10),
                        rate: rate,
                        amount: amount,
                        tax_amount: tax_amount,
                        tax_rate: this.record.getLineItemValue('item', 'taxrate1', i),
                        tax_code: this.record.getLineItemValue('item', 'taxcode_display', i),
                        isfulfillable: this.record.getLineItemValue('item', 'fulfillable', i) === 'T',
                        discount: 0,
                        total: total,
                        item: item_id,
                        type: item_type,
                        options: Utils.getItemOptionsObject(this.record.getLineItemValue('item', 'options', i)),
                        shipaddress: this.record.getLineItemValue('item', 'shipaddress', i) ? this.result.listAddresseByIdTmp[this.record.getLineItemValue('item', 'shipaddress', i)] : null,
                        shipmethod: this.record.getLineItemValue('item', 'shipmethod', i) || null
                    };
                    items_to_preload[item_id] = {
                        id: item_id,
                        type: item_type
                    };
                    self.getExtraLineFields(this.result.lines[line_id], this.record, i);
                }
            }
            var preloaded_items = this.preLoadItems(_.values(items_to_preload));
            _.each(this.result.lines, function (line) {
                line.rate_formatted = Utils.formatCurrency(line.rate);
                line.amount_formatted = Utils.formatCurrency(line.amount);
                line.tax_amount_formatted = Utils.formatCurrency(line.tax_amount);
                line.discount_formatted = Utils.formatCurrency(line.discount);
                line.total_formatted = Utils.formatCurrency(line.total);
                line.item = preloaded_items[line.item] ? preloaded_items[line.item] : { itemid: line.item };
            });
            delete this.result.listAddresseByIdTmp;
        },
        preLoadItems: function (items_to_preload) {
            return this.storeItem ? this.loadItemsWithStoreItem(items_to_preload) : this.loadItemsWithSuiteScript(items_to_preload);
        },
        loadItemsWithStoreItem: function (items_to_preload) {
            var result = {}, self = this, items_to_query = [], inactive_item = {};
            this.storeItem.preloadItems(items_to_preload);
            _.each(this.result.lines, function (line) {
                if (line.item) {
                    var item = self.storeItem.get(line.item, line.type);
                    if (!item || _.isUndefined(item.itemid)) {
                        items_to_query.push({ id: line.item });
                    } else {
                        result[line.item] = item;
                    }
                }
            });
            inactive_item = this.loadItemsWithSuiteScript(items_to_query);
            _.each(inactive_item, function (value, key) {
                result[key] = value;
            });
            return result;
        },
        loadItemsWithSuiteScript: function (items_to_query) {
            var result = {};
            if (items_to_query.length > 0) {
                items_to_query = _.pluck(items_to_query, 'id');
                var filters = [
                        new nlobjSearchFilter('entity', null, 'is', nlapiGetUser()),
                        new nlobjSearchFilter('internalid', null, 'is', this.result.internalid),
                        new nlobjSearchFilter('internalid', 'item', 'anyof', items_to_query)
                    ], columns = [
                        new nlobjSearchColumn('internalid', 'item'),
                        new nlobjSearchColumn('type', 'item'),
                        new nlobjSearchColumn('parent', 'item'),
                        new nlobjSearchColumn('displayname', 'item'),
                        new nlobjSearchColumn('storedisplayname', 'item'),
                        new nlobjSearchColumn('itemid', 'item')
                    ], inactive_items_search = Application.getAllSearchResults('transaction', filters, columns), loaded_item;
                _.each(inactive_items_search, function (item) {
                    loaded_item = {
                        internalid: item.getValue('internalid', 'item'),
                        itemtype: item.getValue('type', 'item'),
                        displayname: item.getValue('displayname', 'item'),
                        storedisplayname: item.getValue('storedisplayname', 'item'),
                        itemid: item.getValue('itemid', 'item')
                    };
                    result[item.getValue('internalid', 'item')] = loaded_item;
                });
            }
            return result;
        },
        getExtraLineFields: function () {
        },
        getRecordShippingMethods: function () {
            var self = this;
            if (this.record.getLineItemCount('shipgroup') <= 0) {
                self.addShippingMethod({
                    internalid: this.record.getFieldValue('shipmethod'),
                    name: this.record.getFieldText('shipmethod'),
                    rate: Utils.toCurrency(this.record.getFieldValue('shipping_rate')),
                    rate_formatted: Utils.formatCurrency(this.record.getFieldValue('shipping_rate')),
                    shipcarrier: this.record.getFieldValue('carrier')
                });
            }
            for (var i = 1; i <= this.record.getLineItemCount('shipgroup'); i++) {
                self.addShippingMethod({
                    internalid: this.record.getLineItemValue('shipgroup', 'shippingmethodref', i),
                    name: this.record.getLineItemValue('shipgroup', 'shippingmethod', i),
                    rate: Utils.toCurrency(this.record.getLineItemValue('shipgroup', 'shippingrate', i)),
                    rate_formatted: Utils.formatCurrency(this.record.getLineItemValue('shipgroup', 'shippingrate', i)),
                    shipcarrier: this.record.getLineItemValue('shipgroup', 'shippingcarrier', i)
                });
            }
            this.result.shipmethod = this.record.getFieldValue('shipmethod');
        },
        getAdjustments: function (options) {
            options = options || {};
            var applied_to_transaction = options.appliedToTransaction || [this.result.internalid], types = options.types || [
                    'CustCred',
                    'DepAppl',
                    'CustPymt'
                ], ids = [], adjustments = {}, amount_field = this.isMultiCurrency ? 'appliedtoforeignamount' : 'appliedtolinkamount', filters = [
                    new nlobjSearchFilter('appliedtotransaction', null, 'anyof', applied_to_transaction),
                    new nlobjSearchFilter(amount_field, null, 'isnotempty'),
                    new nlobjSearchFilter('type', null, 'anyof', types)
                ], columns = [
                    new nlobjSearchColumn('total'),
                    new nlobjSearchColumn('tranid'),
                    new nlobjSearchColumn('trandate').setSort(true),
                    new nlobjSearchColumn('type'),
                    new nlobjSearchColumn(amount_field)
                ], search_results = Application.getAllSearchResults('transaction', filters, columns);
            _.each(search_results || [], function (payout) {
                var internal_id = payout.getId(), duplicated_adjustment = adjustments[internal_id];
                if (options.paymentMethodInformation) {
                    ids.push(internal_id);
                }
                if (!duplicated_adjustment) {
                    adjustments[internal_id] = {
                        internalid: internal_id,
                        tranid: payout.getValue('tranid'),
                        recordtype: payout.getRecordType(),
                        amount: Utils.toCurrency(payout.getValue(amount_field)),
                        amount_formatted: Utils.formatCurrency(payout.getValue(amount_field)),
                        trandate: payout.getValue('trandate')
                    };
                } else {
                    duplicated_adjustment.amount += Utils.toCurrency(payout.getValue(amount_field));
                    duplicated_adjustment.amount_formatted = Utils.formatCurrency(duplicated_adjustment.amount);
                }
            });
            if (options.paymentMethodInformation && ids.length) {
                filters = [
                    new nlobjSearchFilter('mainline', null, 'is', 'T'),
                    new nlobjSearchFilter('internalid', null, 'anyof', ids),
                    new nlobjSearchFilter('type', null, 'anyof', types)
                ];
                columns = [
                    new nlobjSearchColumn('internalid'),
                    new nlobjSearchColumn('type'),
                    new nlobjSearchColumn('ccexpdate'),
                    new nlobjSearchColumn('ccholdername'),
                    new nlobjSearchColumn('ccnumber'),
                    new nlobjSearchColumn('paymentmethod'),
                    new nlobjSearchColumn('tranid')
                ];
                search_results = Application.getAllSearchResults('transaction', filters, columns);
                _.each(search_results || [], function (payout) {
                    var internal_id = payout.getId(), adjustment = adjustments[internal_id], paymentmethod = {
                            name: payout.getText('paymentmethod'),
                            internalid: payout.getValue('tranid')
                        }, ccnumber = payout.getValue('ccnumber');
                    if (ccnumber) {
                        paymentmethod.type = 'creditcard';
                        paymentmethod.creditcard = {
                            ccnumber: ccnumber,
                            ccexpiredate: payout.getValue('ccexpdate'),
                            ccname: payout.getValue('ccholdername'),
                            paymentmethod: {
                                ispaypal: 'F',
                                name: paymentmethod.name,
                                creditcard: 'T',
                                internalid: payout.getValue('tranid')
                            }
                        };
                    }
                    if (adjustment) {
                        adjustment.paymentmethod = paymentmethod;
                    }
                });
            }
            this.result.adjustments = _.values(adjustments);
        },
        getTransactionType: function (ids) {
            ids = _.isArray(ids) ? ids : [ids];
            var results = {}, filters = [new nlobjSearchFilter('internalid', null, 'anyof', ids)], columns = [new nlobjSearchColumn('recordtype')];
            if (ids && ids.length) {
                _.each(Application.getAllSearchResults('transaction', filters, columns) || [], function (record) {
                    results[record.getId()] = record.getValue('recordtype');
                });
            }
            return results;
        },
        getRecordAddresses: function () {
            this.result.addresses = {};
            this.result.listAddresseByIdTmp = {};
            for (var i = 1; i <= this.record.getLineItemCount('iladdrbook'); i++) {
                this.result.listAddresseByIdTmp[this.record.getLineItemValue('iladdrbook', 'iladdrinternalid', i)] = this.addAddress({
                    internalid: this.record.getLineItemValue('iladdrbook', 'iladdrshipaddr', i),
                    country: this.record.getLineItemValue('iladdrbook', 'iladdrshipcountry', i),
                    state: this.record.getLineItemValue('iladdrbook', 'iladdrshipstate', i),
                    city: this.record.getLineItemValue('iladdrbook', 'iladdrshipcity', i),
                    zip: this.record.getLineItemValue('iladdrbook', 'iladdrshipzip', i),
                    addr1: this.record.getLineItemValue('iladdrbook', 'iladdrshipaddr1', i),
                    addr2: this.record.getLineItemValue('iladdrbook', 'iladdrshipaddr2', i),
                    attention: this.record.getLineItemValue('iladdrbook', 'iladdrshipattention', i),
                    addressee: this.record.getLineItemValue('iladdrbook', 'iladdrshipaddressee', i),
                    phone: this.record.getLineItemValue('iladdrbook', 'iladdrshipphone', i)
                });
            }
            this.result.shipaddress = this.record.getFieldValue('shipaddress') ? this.addAddress({
                internalid: this.record.getFieldValue('shipaddress'),
                country: this.record.getFieldValue('shipcountry'),
                state: this.record.getFieldValue('shipstate'),
                city: this.record.getFieldValue('shipcity'),
                zip: this.record.getFieldValue('shipzip'),
                addr1: this.record.getFieldValue('shipaddr1'),
                addr2: this.record.getFieldValue('shipaddr2'),
                attention: this.record.getFieldValue('shipattention'),
                addressee: this.record.getFieldValue('shipaddressee'),
                phone: this.record.getFieldValue('shipphone')
            }) : null;
            this.result.billaddress = this.record.getFieldValue('billaddress') ? this.addAddress({
                internalid: this.record.getFieldValue('billaddress'),
                country: this.record.getFieldValue('billcountry'),
                state: this.record.getFieldValue('billstate'),
                city: this.record.getFieldValue('billcity'),
                zip: this.record.getFieldValue('billzip'),
                addr1: this.record.getFieldValue('billaddr1'),
                addr2: this.record.getFieldValue('billaddr2'),
                attention: this.record.getFieldValue('billattention'),
                addressee: this.record.getFieldValue('billaddressee'),
                phone: this.record.getFieldValue('billphone')
            }) : null;
        },
        addShippingMethod: function (shipping_method) {
            this.result.shipmethods = this.result.shipmethods || {};
            if (!this.result.shipmethods[shipping_method.internalid]) {
                this.result.shipmethods[shipping_method.internalid] = shipping_method;
            }
            return shipping_method.internalid;
        },
        addAddress: function (address) {
            this.result.addresses = this.result.addresses || {};
            address.fullname = address.attention ? address.attention : address.addressee;
            address.company = address.attention ? address.addressee : null;
            delete address.attention;
            delete address.addressee;
            address.internalid = this.getAddressInternalId(address);
            if (AddressModel && AddressModel.isValid) {
                address.isvalid = AddressModel.isValid(address) ? 'T' : 'F';
            }
            if (!this.result.addresses[address.internalid]) {
                this.result.addresses[address.internalid] = address;
            }
            return address.internalid;
        },
        getAddressInternalId: function (address) {
            var address_internalid = (address.country || '') + '-' + (address.state || '') + '-' + (address.city || '') + '-' + (address.zip || '') + '-' + (address.addr1 || '') + '-' + (address.addr2 || '') + '-' + (address.fullname || '') + '-' + (address.company || '');
            return address_internalid.replace(/\s/g, '-');
        },
        update: function (record_type, id, data_model) {
            if (record_type && id) {
                this.recordId = id;
                this.data = data_model;
                this.record = this.getTransactionRecord(record_type, id);
                this.currentRecord = this.get(record_type, id);
                this.setPaymentMethod();
                this.setLines();
                this.setAddress('ship', this.data.shipaddress, 'billaddress');
                this.setAddress('bill', this.data.billaddress, 'shipaddress');
                this.setMemo();
            }
        },
        setMemo: function () {
            this.record.setFieldValue('memo', null);
            if (this.data.memo) {
                this.record.setFieldValue('memo', this.data.memo);
            }
        },
        setPaymentMethod: function () {
            var self = this, method_name = '';
            this.removePaymentMethod();
            if (this.data.paymentmethods) {
                _.each(this.data.paymentmethods, function (payment_method) {
                    method_name = 'setPaymentMethod' + payment_method.type.toUpperCase();
                    if (_.isFunction(self[method_name])) {
                        self[method_name](payment_method);
                    }
                });
            }
        },
        setAddress: function (prefix, address_id, other_address_name) {
            this.removeAddress(prefix);
            if (address_id) {
                if (!this.hasCurrentCustomerAddress(address_id)) {
                    var old_address_model = _.find(this.data.addresses, { internalid: address_id }), old_address_id = address_id;
                    address_id = this.createAddress(old_address_model);
                    this.data.addresses = _.reject(this.data.addresses, function (address) {
                        return address.internalid === old_address_id;
                    });
                    old_address_model.internalid = address_id;
                    this.data.addresses.push(old_address_model);
                    if (other_address_name && this.data[other_address_name] === old_address_id) {
                        this.data[other_address_name] = address_id;
                    }
                }
                this.record.setFieldValue(prefix + 'addresslist', address_id);
            }
        },
        hasCurrentCustomerAddress: function (address_id) {
            try {
                return AddressModel ? !!AddressModel.get(address_id) : true;
            } catch (e) {
                return false;
            }
        },
        createAddress: function (address_model) {
            return AddressModel && AddressModel.create(_.clone(address_model));
        },
        removeAddress: function (prefix) {
            var empty_value = '';
            this.record.setFieldValue(prefix + 'country', empty_value);
            this.record.setFieldValue(prefix + 'address', empty_value);
            this.record.setFieldValue(prefix + 'state', empty_value);
            this.record.setFieldValue(prefix + 'city', empty_value);
            this.record.setFieldValue(prefix + 'zip', empty_value);
            this.record.setFieldValue(prefix + 'addr1', empty_value);
            this.record.setFieldValue(prefix + 'addr2', empty_value);
            this.record.setFieldValue(prefix + 'attention', empty_value);
            this.record.setFieldValue(prefix + 'addressee', empty_value);
            this.record.setFieldValue(prefix + 'phone', empty_value);
        },
        setLines: function () {
            this.removeAllItemLines();
            if (this.data.lines) {
                var self = this;
                _.each(this.data.lines, function (line) {
                    self.record.selectNewLineItem('item');
                    self.record.setCurrentLineItemValue('item', 'item', line.item.internalid);
                    self.record.setCurrentLineItemValue('item', 'quantity', line.quantity);
                    self.record.setCurrentLineItemValue('item', 'itemtype', line.item.type);
                    self.record.setCurrentLineItemValue('item', 'id', line.internalid);
                    _.each(line.options, function (option_value, option_id) {
                        self.record.setCurrentLineItemValue('item', option_id, option_value);
                    });
                    self.setLinesAddUpdateLine(line, self.record);
                    self.record.commitLineItem('item');
                });
            }
        },
        setLinesRemoveLines: function () {
        },
        setLinesAddUpdateLine: function () {
        },
        removeAllItemLines: function () {
            var items_count = this.record.getLineItemCount('item');
            this.setLinesRemoveLines(this.record);
            for (var i = 1; i <= items_count; i++) {
                this.record.removeLineItem('item', i);
            }
        },
        setPaymentMethodINVOICE: function (payment_method) {
            this.record.setFieldValue('terms', payment_method.terms.internalid);
            this.record.setFieldValue('otherrefnum', payment_method.purchasenumber);
        },
        setPaymentMethodCREDITCARD: function (payment_method) {
            if (!payment_method.creditcard.ccname) {
                throw {
                    status: 500,
                    code: 'ERR_WS_INVALID_PAYMENT',
                    message: 'Please enter your name as it appears on your card.'
                };
            }
            var credit_card = payment_method.creditcard;
            this.record.setFieldValue('creditcard', credit_card.internalid);
            this.record.setFieldValue('paymentmethod', credit_card.paymentmethod.internalid);
            this.record.setFieldValue('creditcardprocessor', credit_card.paymentmethod.merchantid);
            if (credit_card.ccsecuritycode) {
                this.record.setFieldValue('ccsecuritycode', credit_card.ccsecuritycode);
            }
        },
        setPaymentMethodEXTERNAL: function (payment_method) {
            this.record.setFieldValue('paymentmethod', payment_method.internalid);
            this.record.setFieldValue('creditcardprocessor', payment_method.merchantid);
            this.record.setFieldValue('returnurl', payment_method.returnurl);
            this.record.setFieldValue('getauth', 'T');
        },
        removePaymentMethod: function () {
            this.record.setFieldValue('paymentterms', null);
            this.record.setFieldValue('paymentmethod', null);
            this.record.setFieldValue('thankyouurl', null);
            this.record.setFieldValue('errorurl', null);
            this.record.setFieldValue('returnurl', null);
            this.record.setFieldValue('terms', null);
            this.record.setFieldValue('otherrefnum', null);
            this.record.setFieldValue('creditcard', null);
        },
        preSubmitRecord: function () {
        },
        postSubmitRecord: function (confirmation_result) {
            return confirmation_result;
        },
        submit: function () {
            if (!this.record) {
                throw new Error('Please load a record before calling Transaction.Model.Submit method.');
            }
            this.preSubmitRecord();
            var new_record_id = nlapiSubmitRecord(this.record), result = { internalid: new_record_id };
            return this.postSubmitRecord(result);
        },
        preList: function () {
        },
        postList: function () {
        },
        preGet: function () {
        },
        postGet: function () {
        }
    });
});
define('ReturnAuthorization.Model', [
    'Transaction.Model',
    'Utils',
    'Application',
    'StoreItem.Model',
    'SiteSettings.Model',
    'underscore'
], function (Transaction, Utils, Application, StoreItem, SiteSettings, _) {
    'use strict';
    return Transaction.extend({
        name: 'ReturnAuthorization',
        validation: {},
        getExtraRecordFields: function () {
            this.result.isCancelable = this.isCancelable();
            if (this.isSCISIntegrationEnabled && this.result.recordtype === 'creditmemo') {
                this.result.amountpaid = Utils.toCurrency(this.record.getFieldValue('amountpaid'));
                this.result.amountpaid_formatted = Utils.formatCurrency(this.record.getFieldValue('amountpaid'));
                this.result.amountremaining = Utils.toCurrency(this.record.getFieldValue('amountremaining'));
                this.result.amountremaining_formatted = Utils.formatCurrency(this.record.getFieldValue('amountremaining'));
                this.getApply();
            }
        },
        isCancelable: function () {
            return this.result.recordtype === 'returnauthorization' && this.result.status.internalid === 'pendingApproval';
        },
        getExtraLineFields: function (result, record, i) {
            result.reason = this.result.recordtype === 'creditmemo' ? '' : record.getLineItemValue('item', 'description', i);
        },
        getApply: function () {
            var self = this, ids = [];
            this.result.applies = {};
            for (var i = 1; i <= this.record.getLineItemCount('apply'); i++) {
                if (self.record.getLineItemValue('apply', 'apply', i) === 'T') {
                    var internalid = self.record.getLineItemValue('apply', 'internalid', i);
                    ids.push(internalid);
                    self.result.applies[internalid] = {
                        line: i,
                        internalid: internalid,
                        tranid: self.record.getLineItemValue('apply', 'refnum', i),
                        applydate: self.record.getLineItemValue('apply', 'applydate', i),
                        recordtype: self.record.getLineItemValue('apply', 'type', i),
                        currency: self.record.getLineItemValue('apply', 'currency', i),
                        amount: Utils.toCurrency(self.record.getLineItemValue('apply', 'amount', i)),
                        amount_formatted: Utils.formatCurrency(self.record.getLineItemValue('apply', 'amount', i))
                    };
                }
            }
            if (ids && ids.length) {
                _.each(this.getTransactionType(ids) || {}, function (recordtype, internalid) {
                    self.result.applies[internalid].recordtype = recordtype;
                });
            }
            this.result.applies = _.values(this.result.applies);
        },
        update: function (id, data, headers) {
            if (data.status === 'cancelled') {
                var url = 'https://' + Application.getHost() + '/app/accounting/transactions/returnauthmanager.nl?type=cancel&id=' + id;
                nlapiRequestURL(url, null, headers);
            }
        },
        create: function (data) {
            var return_authorization = nlapiTransformRecord(data.type, data.id, 'returnauthorization'), transaction_lines = this.getTransactionLines(data.id);
            this.setLines(return_authorization, data.lines, transaction_lines);
            return_authorization.setFieldValue('memo', data.comments);
            return nlapiSubmitRecord(return_authorization);
        },
        getTransactionLines: function (transaction_internalid) {
            var filters = {
                    mainline: [
                        'mainline',
                        'is',
                        'F'
                    ],
                    mainline_operator: 'and',
                    internalid: [
                        'internalid',
                        'is',
                        transaction_internalid
                    ]
                }, columns = [
                    new nlobjSearchColumn('line'),
                    new nlobjSearchColumn('rate')
                ];
            var search_results = Application.getAllSearchResults('transaction', _.values(filters), columns), item_lines = [];
            _.each(search_results, function (search_result) {
                var item_line = {
                    line: transaction_internalid + '_' + search_result.getValue('line'),
                    rate: search_result.getValue('rate')
                };
                item_lines.push(item_line);
            });
            return item_lines;
        },
        getCreatedFrom: function () {
            var created_from_internalid, created_from_name, recordtype, tranid;
            if (this.isSCISIntegrationEnabled && this.result.recordtype === 'creditmemo') {
                created_from_internalid = this.record.getFieldValue('custbody_ns_pos_created_from');
                created_from_name = this.record.getFieldText('custbody_ns_pos_created_from');
            } else {
                created_from_internalid = nlapiLookupField(this.result.recordtype, this.result.internalid, 'createdfrom');
                created_from_name = created_from_internalid && nlapiLookupField(this.result.recordtype, this.result.internalid, 'createdfrom', true);
            }
            recordtype = created_from_internalid ? Utils.getTransactionType(created_from_internalid) : '';
            tranid = recordtype ? nlapiLookupField(recordtype, created_from_internalid, 'tranid') : '';
            this.result.createdfrom = {
                internalid: created_from_internalid,
                name: created_from_name,
                recordtype: recordtype,
                tranid: tranid
            };
        },
        getStatus: function () {
            this.result.status = {
                internalid: nlapiLookupField(this.result.recordtype, this.result.internalid, 'status'),
                name: nlapiLookupField(this.result.recordtype, this.result.internalid, 'status', true)
            };
        },
        findLine: function (line_id, lines) {
            return _.findWhere(lines, { id: line_id });
        },
        setLines: function (return_authorization, lines, transaction_lines) {
            var line_count = return_authorization.getLineItemCount('item'), add_line = true, i = 1;
            while (add_line && i <= line_count) {
                var line_item_value = return_authorization.getLineItemValue('item', 'id', i);
                add_line = this.findLine(line_item_value, lines);
                if (add_line) {
                    var transaction_line = _.findWhere(transaction_lines, { line: line_item_value });
                    if (transaction_line) {
                        return_authorization.setLineItemValue('item', 'rate', i, transaction_line.rate);
                    }
                    return_authorization.setLineItemValue('item', 'quantity', i, add_line.quantity);
                    return_authorization.setLineItemValue('item', 'description', i, add_line.reason);
                } else {
                    return_authorization.removeLineItem('item', i);
                }
                i++;
            }
            return !add_line ? this.setLines(return_authorization, lines, transaction_lines) : this;
        },
        setExtraListFilters: function () {
            if (this.data.getLines && this.data.page === 'all') {
                delete this.filters.mainline;
                delete this.filters.mainline_operator;
                this.filters.shipping_operator = 'and';
                this.filters.shipping = [
                    'shipping',
                    'is',
                    'F'
                ];
                this.filters.taxline_operator = 'and';
                this.filters.taxline = [
                    'taxline',
                    'is',
                    'F'
                ];
                this.filters.quantity_operator = 'and';
                this.filters.quantity = [
                    'quantity',
                    'notequalto',
                    0
                ];
            }
            if (this.isSCISIntegrationEnabled) {
                this.filters.scisrecords_operator = 'and';
                this.filters.scisrecords = [
                    [
                        [
                            'type',
                            'anyof',
                            ['CustCred']
                        ],
                        'and',
                        [
                            'location.locationtype',
                            'is',
                            SC.Configuration.locationTypeMapping.store.internalid
                        ],
                        'and',
                        [
                            'source',
                            'is',
                            '@NONE@'
                        ]
                    ],
                    'or',
                    [[
                            'type',
                            'anyof',
                            ['RtnAuth']
                        ]]
                ];
            } else {
                this.filters.type_operator = 'and';
                this.filters.type = [
                    'type',
                    'anyof',
                    ['RtnAuth']
                ];
            }
            if (this.data.createdfrom) {
                delete this.filters.createdfrom;
                delete this.filters.createdfrom_operator;
                this.data.createdfrom = _.isArray(this.data.createdfrom) ? this.data.createdfrom : this.data.createdfrom.split(',');
                var internal_ids = [], filters = [[
                            [
                                'createdfrom',
                                'anyof',
                                this.data.createdfrom
                            ],
                            'and',
                            [
                                'type',
                                'anyof',
                                ['RtnAuth']
                            ]
                        ]], columns = nlobjSearchColumn('internalid');
                if (this.isSCISIntegrationEnabled) {
                    filters.push('or');
                    filters.push([
                        [
                            'custbody_ns_pos_created_from',
                            'anyof',
                            this.data.createdfrom
                        ],
                        'and',
                        [
                            [
                                'type',
                                'anyof',
                                ['CustCred']
                            ],
                            'and',
                            [
                                'location.locationtype',
                                'is',
                                SC.Configuration.locationTypeMapping.store.internalid
                            ],
                            'and',
                            [
                                'source',
                                'is',
                                '@NONE@'
                            ]
                        ]
                    ]);
                }
                internal_ids = _(Application.getAllSearchResults('transaction', _.values(filters), columns) || []).pluck('id');
                if (this.data.internalid && this.data.internalid.length) {
                    internal_ids = _.intersection(internal_ids, this.data.internalid);
                }
                internal_ids = internal_ids.length ? internal_ids : [0];
                this.filters.internalid_operator = 'and';
                this.filters.internalid = [
                    'internalid',
                    'anyof',
                    internal_ids
                ];
            }
        },
        setExtraListColumns: function () {
            if (this.data.getLines && this.data.page === 'all') {
                this.columns.mainline = new nlobjSearchColumn('mainline');
                this.columns.internalid_item = new nlobjSearchColumn('internalid', 'item');
                this.columns.type_item = new nlobjSearchColumn('type', 'item');
                this.columns.parent_item = new nlobjSearchColumn('parent', 'item');
                this.columns.displayname_item = new nlobjSearchColumn('displayname', 'item');
                this.columns.storedisplayname_item = new nlobjSearchColumn('storedisplayname', 'item');
                this.columns.rate = new nlobjSearchColumn('rate');
                this.columns.total = new nlobjSearchColumn('total');
                this.columns.options = new nlobjSearchColumn('options');
                this.columns.line = new nlobjSearchColumn('line').setSort();
                this.columns.quantity = new nlobjSearchColumn('quantity');
            }
        },
        mapListResult: function (result, record) {
            result.amount = Math.abs(result.amount || 0);
            result.amount_formatted = Utils.formatCurrency(result.amount);
            result.lines = record.getValue(this.columns.lines);
            if (this.data.getLines) {
                result.mainline = record.getValue('mainline');
            }
            return result;
        },
        postList: function () {
            if (this.data.getLines && this.data.page === 'all') {
                this.results = _.where(this.results, { mainline: '*' });
                var items_to_preload = {}, self = this;
                _.each(this.search_results || [], function (record) {
                    if (record.getValue('mainline') !== '*') {
                        var record_id = record.getId(), result = _.findWhere(self.results, { internalid: record_id });
                        if (result) {
                            result.lines = result.lines || [];
                            var item_id = record.getValue('internalid', 'item'), item_type = record.getValue('type', 'item');
                            result.lines.push({
                                internalid: record_id + '_' + record.getValue('line'),
                                quantity: Math.abs(record.getValue('quantity')),
                                rate: Utils.toCurrency(record.getValue('rate')),
                                rate_formatted: Utils.formatCurrency(record.getValue('rate')),
                                tax_amount: Utils.toCurrency(Math.abs(record.getValue('taxtotal'))),
                                tax_amount_formatted: Utils.formatCurrency(Math.abs(record.getValue('taxtotal'))),
                                amount: Utils.toCurrency(Math.abs(record.getValue(self.amountField))),
                                amount_formatted: Utils.formatCurrency(Math.abs(record.getValue(self.amountField))),
                                options: Utils.getItemOptionsObject(record.getValue('options')),
                                item: {
                                    internalid: item_id,
                                    type: item_type,
                                    parent: record.getValue('parent', 'item'),
                                    displayname: record.getValue('displayname', 'item'),
                                    storedisplayname: record.getValue('storedisplayname', 'item'),
                                    itemid: record.getValue('itemid', 'item')
                                }
                            });
                            items_to_preload[item_id] = {
                                id: item_id,
                                type: item_type
                            };
                        }
                    }
                });
                this.store_item = StoreItem;
                this.store_item.preloadItems(_.values(items_to_preload));
                _.each(this.results, function (result) {
                    _.each(result.lines, function (line) {
                        var item_details = self.store_item.get(line.item.internalid, line.item.type);
                        if (item_details && !_.isUndefined(item_details.itemid)) {
                            line.item = item_details;
                        }
                    });
                });
            } else if (this.results.records && this.results.records.length) {
                var filters = {}, columns = [
                        new nlobjSearchColumn('internalid', null, 'group'),
                        new nlobjSearchColumn('quantity', null, 'sum')
                    ], quantities = {};
                filters.internalid = [
                    'internalid',
                    'anyof',
                    _(this.results.records || []).pluck('internalid')
                ];
                filters.mainline_operator = 'and';
                filters.mainline = [
                    'mainline',
                    'is',
                    'F'
                ];
                filters.cogs_operator = 'and';
                filters.cogs = [
                    'cogs',
                    'is',
                    'F'
                ];
                filters.taxline_operator = 'and';
                filters.taxline = [
                    'taxline',
                    'is',
                    'F'
                ];
                filters.shipping_operator = 'and';
                filters.shipping = [
                    'shipping',
                    'is',
                    'F'
                ];
                Application.getAllSearchResults('transaction', _.values(filters), columns).forEach(function (record) {
                    quantities[record.getValue('internalid', null, 'group')] = record.getValue('quantity', null, 'sum');
                });
                _.each(this.results.records, function (record) {
                    record.quantity = Math.abs(quantities[record.internalid] || 0);
                });
            }
        },
        loadSCISIntegrationStatus: function () {
            var site_settings = SiteSettings.get();
            this.isSCISIntegrationEnabled = site_settings.isSCISIntegrationEnabled;
        },
        getIsSCISIntegrationEnabled: function () {
            return _.isUndefined(this.isSCISIntegrationEnabled) ? false : !!this.isSCISIntegrationEnabled;
        },
        preList: function () {
            this.loadSCISIntegrationStatus();
        },
        preGet: function () {
            this.loadSCISIntegrationStatus();
        },
        postGet: function () {
            var filters = {}, columns = [
                    new nlobjSearchColumn('createdfrom'),
                    new nlobjSearchColumn('tranid', 'createdfrom')
                ], self = this, isCreditMemo = this.result.recordtype === 'creditmemo', record_type = '', created_from_internalid = '', created_from_name = '', cretaed_from_tranid = '';
            filters.internalid = [
                'internalid',
                'is',
                this.result.internalid
            ];
            if (isCreditMemo) {
                columns.push(new nlobjSearchColumn('line'));
                columns.push(new nlobjSearchColumn('custcol_ns_pos_returnreason'));
                filters.mainline_operator = 'and';
                filters.mainline = [
                    'mainline',
                    'is',
                    'F'
                ];
                filters.cogs_operator = 'and';
                filters.cogs = [
                    'cogs',
                    'is',
                    'F'
                ];
                filters.taxline_operator = 'and';
                filters.taxline = [
                    'taxline',
                    'is',
                    'F'
                ];
                filters.shipping_operator = 'and';
                filters.shipping = [
                    'shipping',
                    'is',
                    'F'
                ];
            } else {
                filters.createdfrom_operator = 'and';
                filters.createdfrom = [
                    'createdfrom',
                    'noneof',
                    '@NONE@'
                ];
            }
            Application.getAllSearchResults('transaction', _.values(filters), columns).forEach(function (record) {
                created_from_internalid = record.getValue('createdfrom');
                created_from_name = record.getText('createdfrom');
                cretaed_from_tranid = record.getValue('tranid', 'createdfrom');
                if (isCreditMemo) {
                    var line = self.result.lines[self.result.internalid + '_' + record.getValue('line')];
                    if (line) {
                        line.reason = record.getText('custcol_ns_pos_returnreason');
                    }
                }
            });
            if (created_from_internalid) {
                record_type = Utils.getTransactionType(created_from_internalid);
            }
            this.result.createdfrom = {
                internalid: created_from_internalid,
                name: created_from_name,
                recordtype: record_type || '',
                tranid: cretaed_from_tranid
            };
            this.result.lines = _.reject(this.result.lines, function (line) {
                return line.quantity === 0;
            });
        }
    });
});
define('OrderHistory.Model', [
    'Application',
    'Utils',
    'StoreItem.Model',
    'Transaction.Model',
    'SiteSettings.Model',
    'SC.Model',
    'ReturnAuthorization.Model',
    'ExternalPayment.Model',
    'underscore'
], function (Application, Utils, StoreItem, Transaction, SiteSettings, SCModel, ReturnAuthorization, ExternalPayment, _) {
    'use strict';
    return Transaction.extend({
        name: 'OrderHistory',
        setExtraListColumns: function () {
            this.columns.trackingnumbers = new nlobjSearchColumn('trackingnumbers');
            if (!this.isSCISIntegrationEnabled) {
                return;
            }
            this.columns.origin = new nlobjSearchColumn('formulatext');
            this.columns.origin.setFormula('case when LENGTH({source})>0 then 2 else (case when {location.locationtype.id} = \'' + SC.Configuration.locationTypeMapping.store.internalid + '\' then 1 else 0 end) end');
        },
        setExtraListFilters: function () {
            if (this.data.filter === 'status:open') {
                this.filters.type_operator = 'and';
                this.filters.type = [
                    'type',
                    'anyof',
                    ['SalesOrd']
                ];
                this.filters.status_operator = 'and';
                this.filters.status = [
                    'status',
                    'anyof',
                    [
                        'SalesOrd:A',
                        'SalesOrd:B',
                        'SalesOrd:D',
                        'SalesOrd:E',
                        'SalesOrd:F'
                    ]
                ];
            } else if (this.isSCISIntegrationEnabled) {
                if (this.data.filter === 'origin:instore') {
                    this.filters.scisrecords_operator = 'and';
                    this.filters.scisrecords = [
                        [
                            'type',
                            'anyof',
                            [
                                'CashSale',
                                'CustInvc',
                                'SalesOrd'
                            ]
                        ],
                        'and',
                        [
                            'createdfrom.type',
                            'noneof',
                            ['SalesOrd']
                        ],
                        'and',
                        [
                            'location.locationtype',
                            'is',
                            SC.Configuration.locationTypeMapping.store.internalid
                        ],
                        'and',
                        [
                            'source',
                            'is',
                            '@NONE@'
                        ]
                    ];
                } else {
                    this.filters.scisrecords_operator = 'and';
                    this.filters.scisrecords = [
                        [
                            [
                                'type',
                                'anyof',
                                [
                                    'CashSale',
                                    'CustInvc'
                                ]
                            ],
                            'and',
                            [
                                'createdfrom.type',
                                'noneof',
                                ['SalesOrd']
                            ],
                            'and',
                            [
                                'location.locationtype',
                                'is',
                                SC.Configuration.locationTypeMapping.store.internalid
                            ],
                            'and',
                            [
                                'source',
                                'is',
                                '@NONE@'
                            ]
                        ],
                        'or',
                        [[
                                'type',
                                'anyof',
                                ['SalesOrd']
                            ]]
                    ];
                }
            } else {
                this.filters.type_operator = 'and';
                this.filters.type = [
                    'type',
                    'anyof',
                    ['SalesOrd']
                ];
            }
        },
        mapListResult: function (result, record) {
            result = result || {};
            result.trackingnumbers = record.getValue('trackingnumbers') ? record.getValue('trackingnumbers').split('<BR>') : null;
            if (this.isSCISIntegrationEnabled) {
                result.origin = parseInt(record.getValue(this.columns.origin), 10);
            }
            return result;
        },
        getExtraRecordFields: function () {
            this.getReceipts();
            this.getReturnAuthorizations();
            var origin = 0, applied_to_transaction;
            if (this.isSCISIntegrationEnabled && !this.record.getFieldValue('source') && this.record.getFieldValue('location') && nlapiLookupField(this.result.recordtype, this.result.internalid, 'location.locationtype') === SC.Configuration.locationTypeMapping.store.internalid) {
                origin = 1;
            } else if (this.record.getFieldValue('source')) {
                origin = 2;
            }
            this.result.origin = origin;
            if (this.result.recordtype === 'salesorder') {
                this.getFulfillments();
                applied_to_transaction = _(_.where(this.result.receipts || [], { recordtype: 'invoice' })).pluck('internalid');
            } else if (this.result.recordtype === 'invoice') {
                applied_to_transaction = [this.result.internalid];
            }
            if (applied_to_transaction && applied_to_transaction.length) {
                this.getAdjustments({
                    paymentMethodInformation: true,
                    appliedToTransaction: applied_to_transaction
                });
            }
            this.result.ismultishipto = this.record.getFieldValue('ismultishipto') === 'T';
            this.getLinesGroups();
            this.result.receipts = _.values(this.result.receipts);
            this.result.isReturnable = this.isReturnable();
            this.getPaymentEvent();
            this.result.isCancelable = this.isCancelable();
        },
        getTerms: function () {
            var terms = nlapiLookupField(this.result.recordtype, this.result.internalid, 'terms');
            if (terms) {
                return {
                    internalid: terms,
                    name: nlapiLookupField(this.result.recordtype, this.result.internalid, 'terms', true)
                };
            }
            return null;
        },
        getStatus: function () {
            this.result.status = {
                internalid: nlapiLookupField(this.result.recordtype, this.result.internalid, 'status'),
                name: nlapiLookupField(this.result.recordtype, this.result.internalid, 'status', true)
            };
        },
        getLinesGroups: function () {
            var self = this;
            _.each(this.result.lines, function (line) {
                var line_group_id = '';
                if (self.result.recordtype === 'salesorder') {
                    if (!self.result.ismultishipto && (!line.isfulfillable || !self.result.shipaddress) || self.result.ismultishipto && (!line.shipaddress || !line.shipmethod)) {
                        if (self.isSCISIntegrationEnabled && self.result.origin === 1) {
                            line_group_id = 'instore';
                        } else {
                            line_group_id = 'nonshippable';
                        }
                    } else {
                        line_group_id = 'shippable';
                    }
                } else {
                    line_group_id = 'instore';
                }
                line.linegroup = line_group_id;
            });
        },
        getFulfillments: function () {
            this.result.fulfillments = {};
            var self = this, filters = [
                    new nlobjSearchFilter('internalid', null, 'is', this.result.internalid),
                    new nlobjSearchFilter('mainline', null, 'is', 'F'),
                    new nlobjSearchFilter('shipping', null, 'is', 'F'),
                    new nlobjSearchFilter('taxline', null, 'is', 'F')
                ], columns = [
                    new nlobjSearchColumn('line'),
                    new nlobjSearchColumn('fulfillingtransaction'),
                    new nlobjSearchColumn('quantitypicked'),
                    new nlobjSearchColumn('quantitypacked'),
                    new nlobjSearchColumn('quantityshiprecv'),
                    new nlobjSearchColumn('actualshipdate'),
                    new nlobjSearchColumn('quantity', 'fulfillingtransaction'),
                    new nlobjSearchColumn('item', 'fulfillingtransaction'),
                    new nlobjSearchColumn('shipmethod', 'fulfillingtransaction'),
                    new nlobjSearchColumn('shipto', 'fulfillingtransaction'),
                    new nlobjSearchColumn('trackingnumbers', 'fulfillingtransaction'),
                    new nlobjSearchColumn('trandate', 'fulfillingtransaction'),
                    new nlobjSearchColumn('status', 'fulfillingtransaction'),
                    new nlobjSearchColumn('shipaddress', 'fulfillingtransaction'),
                    new nlobjSearchColumn('shipaddress1', 'fulfillingtransaction'),
                    new nlobjSearchColumn('shipaddress2', 'fulfillingtransaction'),
                    new nlobjSearchColumn('shipaddressee', 'fulfillingtransaction'),
                    new nlobjSearchColumn('shipattention', 'fulfillingtransaction'),
                    new nlobjSearchColumn('shipcity', 'fulfillingtransaction'),
                    new nlobjSearchColumn('shipcountry', 'fulfillingtransaction'),
                    new nlobjSearchColumn('shipstate', 'fulfillingtransaction'),
                    new nlobjSearchColumn('shipzip', 'fulfillingtransaction')
                ];
            Application.getAllSearchResults('salesorder', filters, columns).forEach(function (ffline) {
                var fulfillment_id = ffline.getValue('fulfillingtransaction'), line_internalid = self.result.internalid + '_' + ffline.getValue('line'), line = _.findWhere(self.result.lines, { internalid: line_internalid });
                if (fulfillment_id) {
                    var shipaddress = self.addAddress({
                        internalid: ffline.getValue('shipaddress', 'fulfillingtransaction'),
                        country: ffline.getValue('shipcountry', 'fulfillingtransaction'),
                        state: ffline.getValue('shipstate', 'fulfillingtransaction'),
                        city: ffline.getValue('shipcity', 'fulfillingtransaction'),
                        zip: ffline.getValue('shipzip', 'fulfillingtransaction'),
                        addr1: ffline.getValue('shipaddress1', 'fulfillingtransaction'),
                        addr2: ffline.getValue('shipaddress2', 'fulfillingtransaction'),
                        attention: ffline.getValue('shipattention', 'fulfillingtransaction'),
                        addressee: ffline.getValue('shipaddressee', 'fulfillingtransaction')
                    }, self.result);
                    self.result.fulfillments[fulfillment_id] = self.result.fulfillments[fulfillment_id] || {
                        internalid: fulfillment_id,
                        shipaddress: shipaddress,
                        shipmethod: self.addShippingMethod({
                            internalid: ffline.getValue('shipmethod', 'fulfillingtransaction'),
                            name: ffline.getText('shipmethod', 'fulfillingtransaction')
                        }),
                        date: ffline.getValue('actualshipdate'),
                        trackingnumbers: ffline.getValue('trackingnumbers', 'fulfillingtransaction') ? ffline.getValue('trackingnumbers', 'fulfillingtransaction').split('<BR>') : null,
                        lines: [],
                        status: {
                            internalid: ffline.getValue('status', 'fulfillingtransaction'),
                            name: ffline.getText('status', 'fulfillingtransaction')
                        }
                    };
                    self.result.fulfillments[fulfillment_id].lines.push({
                        internalid: line_internalid,
                        quantity: parseInt(ffline.getValue('quantity', 'fulfillingtransaction'), 10)
                    });
                }
                if (line) {
                    line.quantityfulfilled = parseInt(ffline.getValue('quantityshiprecv') || 0, 10);
                    line.quantitypacked = parseInt(ffline.getValue('quantitypacked') || 0, 10) - line.quantityfulfilled;
                    line.quantitypicked = parseInt(ffline.getValue('quantitypicked') || 0, 10) - line.quantitypacked - line.quantityfulfilled;
                    line.quantitybackordered = line.quantity - line.quantityfulfilled - line.quantitypacked - line.quantitypicked;
                }
            });
            this.result.fulfillments = _.values(this.result.fulfillments);
        },
        isReturnable: function () {
            if (this.result.recordtype === 'salesorder') {
                var status_id = this.record.getFieldValue('statusRef');
                return status_id !== 'pendingFulfillment' && status_id !== 'pendingApproval' && status_id !== 'closed' && status_id !== 'canceled';
            } else {
                return true;
            }
        },
        getReceipts: function () {
            this.result.receipts = Transaction.list({
                createdfrom: this.result.internalid,
                types: 'CustInvc,CashSale',
                page: 'all'
            });
        },
        getReturnAuthorizations: function () {
            var created_from = _(this.result.receipts || []).pluck('internalid');
            created_from.push(this.result.internalid);
            this.result.returnauthorizations = ReturnAuthorization.list({
                createdfrom: created_from,
                page: 'all',
                getLines: true
            });
        },
        loadSCISIntegrationStatus: function () {
            var site_settings = SiteSettings.get();
            this.isSCISIntegrationEnabled = site_settings.isSCISIntegrationEnabled;
        },
        getIsSCISIntegrationEnabled: function () {
            return _.isUndefined(this.isSCISIntegrationEnabled) ? false : !!this.isSCISIntegrationEnabled;
        },
        postGet: function () {
            this.result.lines = _.reject(this.result.lines, function (line) {
                return line.quantity === 0;
            });
        },
        preList: function () {
            this.loadSCISIntegrationStatus();
        },
        preGet: function () {
            this.loadSCISIntegrationStatus();
        },
        getPaymentEvent: function () {
            if (this.record.getFieldValue('paymethtype') === 'external_checkout') {
                this.result.paymentevent = {
                    holdreason: this.record.getFieldValue('paymenteventholdreason'),
                    redirecturl: ExternalPayment.generateUrl(this.result.internalid, this.result.recordtype)
                };
            } else {
                this.result.paymentevent = {};
            }
        },
        update: function (id, data, headers) {
            var result = 'OK';
            if (data.status === 'cancelled') {
                var url = 'https://' + Application.getHost() + '/app/accounting/transactions/salesordermanager.nl?type=cancel&xml=T&id=' + id, cancel_response = nlapiRequestURL(url, null, headers);
                if (cancel_response.getCode() === 206) {
                    if (nlapiLookupField('salesorder', id, 'statusRef') !== 'cancelled') {
                        result = 'ERR_ALREADY_APPROVED_STATUS';
                    } else {
                        result = 'ERR_ALREADY_CANCELLED_STATUS';
                    }
                }
            }
            return result;
        },
        isCancelable: function () {
            return this.result.recordtype === 'salesorder' && this.result.status.internalid === 'pendingApproval';
        },
        getCreatedFrom: function () {
            var fields = [
                    'createdfrom.tranid',
                    'createdfrom.internalid',
                    'createdfrom.type'
                ], result = nlapiLookupField(this.recordType, this.recordId, fields);
            if (result) {
                this.result.createdfrom = {
                    internalid: result['createdfrom.internalid'],
                    name: result['createdfrom.tranid'],
                    recordtype: result['createdfrom.type']
                };
            }
        }
    });
});
define('OrderHistory.ServiceController', [
    'ServiceController',
    'OrderHistory.Model'
], function (ServiceController, OrderHistoryModel) {
    'use strict';
    OrderHistoryModel.loadSCISIntegrationStatus();
    var enabled = OrderHistoryModel.getIsSCISIntegrationEnabled();
    return ServiceController.extend({
        name: 'OrderHistory.ServiceController',
        options: {
            common: {
                requireLogin: true,
                requirePermissions: {
                    list: [
                        'transactions.tranFind.1',
                        enabled ? 'transactions.tranPurchases.1' : 'transactions.tranSalesOrd.1'
                    ]
                }
            }
        },
        get: function () {
            var recordtype = this.request.getParameter('recordtype'), id = this.request.getParameter('internalid');
            if (recordtype && id) {
                return OrderHistoryModel.get(recordtype, id);
            } else {
                return OrderHistoryModel.list({
                    filter: this.request.getParameter('filter'),
                    order: this.request.getParameter('order'),
                    sort: this.request.getParameter('sort'),
                    from: this.request.getParameter('from'),
                    to: this.request.getParameter('to'),
                    origin: this.request.getParameter('origin'),
                    page: this.request.getParameter('page') || 1,
                    results_per_page: this.request.getParameter('results_per_page')
                });
            }
        },
        put: function () {
            var id = this.request.getParameter('internalid'), cancel_result = OrderHistoryModel.update(id, this.data, this.request.getAllHeaders()), record = OrderHistoryModel.get(this.data.recordtype, id);
            record.cancel_response = cancel_result;
            return record;
        }
    });
});
define('PrintStatement.Model', ['SC.Model'], function (SCModel) {
    'use strict';
    return SCModel.extend({
        name: 'PrintStatement',
        getUrl: function (data) {
            var customerId = customer.getFieldValues(['internalid']).internalid, offset = new Date().getTimezoneOffset() * 60 * 1000, statementDate = null, startDate = null, openOnly = data.openOnly ? 'T' : 'F', inCustomerLocale = data.inCustomerLocale ? 'T' : 'F', consolidatedStatement = data.consolidatedStatement ? 'T' : 'F', statementTimestamp = parseInt(data.statementDate, 10), startDateParam = data.startDate, startTimestamp = parseInt(startDateParam, 10), email = data.email, baseUrl = email ? '/app/accounting/transactions/email.nl' : '/app/accounting/print/NLSPrintForm.nl', url = baseUrl + '?submitted=T&printtype=statement&currencyprecision=2&formdisplayview=NONE&type=statement';
            if (isNaN(statementTimestamp) || startDateParam && isNaN(startTimestamp)) {
                throw {
                    status: 500,
                    code: 'ERR_INVALID_DATE_FORMAT',
                    message: 'Invalid date format'
                };
            }
            statementDate = nlapiDateToString(new Date(statementTimestamp + offset));
            startDate = startDateParam ? nlapiDateToString(new Date(startTimestamp + offset)) : null;
            url += '&customer=' + customerId;
            url += startDate ? '&start_date=' + startDate : '';
            url += '&statement_date=' + statementDate;
            url += '&consolstatement=' + consolidatedStatement;
            url += '&openonly=' + openOnly;
            url += '&incustlocale=' + inCustomerLocale;
            return url;
        }
    });
});
define('PrintStatement.ServiceController', [
    'ServiceController',
    'PrintStatement.Model'
], function (ServiceController, PrintStatementModel) {
    'use strict';
    return ServiceController.extend({
        name: 'PrintStatement.ServiceController',
        options: {
            common: { requireLogin: true },
            post: { requirePermissions: { extraList: ['transactions.tranStatement.2'] } }
        },
        post: function () {
            return { 'url': PrintStatementModel.getUrl(this.data) };
        }
    });
});
define('ProductList.Item.Search', [
    'Application',
    'Models.Init',
    'Utils',
    'Configuration',
    'underscore'
], function (Application, ModelsInit, Utils, Configuration, _) {
    'use strict';
    var StoreItem;
    try {
        StoreItem = require('StoreItem.Model');
    } catch (e) {
    }
    return {
        configuration: Configuration.productList,
        verifySession: function () {
            if (this.configuration.loginRequired && !ModelsInit.session.isLoggedIn2()) {
                throw unauthorizedError;
            }
        },
        getProductName: function (item) {
            if (!item) {
                return '';
            }
            if (item && item.matrix_parent && item.matrix_parent.internalid) {
                return item.matrix_parent.storedisplayname2 || item.matrix_parent.displayname;
            }
            return item.storedisplayname2 || item.displayname;
        },
        search: function (user, product_list_id, include_store_item, sort_and_paging_data) {
            this.verifySession();
            if (!product_list_id) {
                return [];
            }
            var filters = [
                    new nlobjSearchFilter('custrecord_ns_pl_pli_productlist', null, 'is', product_list_id),
                    new nlobjSearchFilter('isinactive', null, 'is', 'F'),
                    new nlobjSearchFilter('custrecord_ns_pl_pl_owner', 'custrecord_ns_pl_pli_productlist', 'is', user)
                ], sort_column = sort_and_paging_data.sort, sort_direction = sort_and_paging_data.order;
            if (!sort_column) {
                sort_column = 'created';
            }
            if (sort_column === 'priority') {
                sort_column = 'priority_value';
            }
            if (!sort_direction) {
                sort_direction = '-1';
            }
            var search_lines = this.searchHelper(filters, sort_column, sort_direction === '-1' ? 'DESC' : 'ASC', include_store_item);
            if (include_store_item && sort_column === 'price') {
                search_lines = this.sortLinesByPrice(search_lines, sort_direction === '-1' ? -1 : 1);
            }
            return search_lines;
        },
        sortLinesByPrice: function (lines, sort_direction) {
            return _.sortBy(lines, function (line) {
                var price_detail = line.item.onlinecustomerprice_detail || {}, price = price_detail.onlinecustomerprice || line.item.pricelevel1 || 0, quantity = line.quantity;
                if (quantity && price_detail.priceschedule && price_detail.priceschedule.length) {
                    var price_schedule = _.find(price_detail.priceschedule, function (price_schedule) {
                        return price_schedule.minimumquantity <= quantity && quantity < price_schedule.maximumquantity || price_schedule.minimumquantity <= quantity && !price_schedule.maximumquantity;
                    });
                    price = price_schedule.price;
                }
                return price * sort_direction;
            });
        },
        searchHelper: function (filters, sort_column, sort_direction, include_store_item) {
            var productListItemColumns = {
                internalid: new nlobjSearchColumn('internalid'),
                name: new nlobjSearchColumn('formulatext', 'custrecord_ns_pl_pli_item').setFormula('case when LENGTH({custrecord_ns_pl_pli_item.displayname}) > 0 then {custrecord_ns_pl_pli_item.displayname} else {custrecord_ns_pl_pli_item.itemid} end'),
                sku: new nlobjSearchColumn('formulatext', 'custrecord_ns_pl_pli_item').setFormula('{custrecord_ns_pl_pli_item.itemid}'),
                description: new nlobjSearchColumn('custrecord_ns_pl_pli_description'),
                options: new nlobjSearchColumn('custrecord_ns_pl_pli_options'),
                quantity: new nlobjSearchColumn('custrecord_ns_pl_pli_quantity'),
                price: new nlobjSearchColumn('price', 'custrecord_ns_pl_pli_item'),
                created: new nlobjSearchColumn('created'),
                item_id: new nlobjSearchColumn('custrecord_ns_pl_pli_item'),
                item_type: new nlobjSearchColumn('type', 'custrecord_ns_pl_pli_item'),
                item_matrix_parent: new nlobjSearchColumn('parent', 'custrecord_ns_pl_pli_item'),
                priority: new nlobjSearchColumn('custrecord_ns_pl_pli_priority'),
                priority_value: new nlobjSearchColumn('custrecord_ns_pl_plip_value', 'custrecord_ns_pl_pli_priority'),
                lastmodified: new nlobjSearchColumn('lastmodified')
            };
            productListItemColumns[sort_column] && productListItemColumns[sort_column].setSort(sort_direction === 'DESC');
            var records = Application.getAllSearchResults('customrecord_ns_pl_productlistitem', filters, _.values(productListItemColumns)), productlist_items = [], self = this;
            _(records).each(function (productListItemSearchRecord) {
                var itemInternalId = productListItemSearchRecord.getValue('custrecord_ns_pl_pli_item'), itemId = productListItemSearchRecord.getText('custrecord_ns_pl_pli_item'), itemMatrixParent = productListItemSearchRecord.getValue('parent', 'custrecord_ns_pl_pli_item'), created_date = nlapiStringToDate(productListItemSearchRecord.getValue('created'), window.dateformat), created_date_str = nlapiDateToString(created_date, window.dateformat), itemType = productListItemSearchRecord.getValue('type', 'custrecord_ns_pl_pli_item'), productListItem = {
                        internalid: productListItemSearchRecord.getId(),
                        description: productListItemSearchRecord.getValue('custrecord_ns_pl_pli_description'),
                        options: JSON.parse(productListItemSearchRecord.getValue('custrecord_ns_pl_pli_options') || '{}'),
                        quantity: parseInt(productListItemSearchRecord.getValue('custrecord_ns_pl_pli_quantity'), 10),
                        created: productListItemSearchRecord.getValue('created'),
                        createddate: created_date_str,
                        lastmodified: productListItemSearchRecord.getValue('lastmodified'),
                        store_item_reference: {
                            id: itemInternalId,
                            internalid: itemInternalId,
                            type: itemType,
                            matrix_parent: itemMatrixParent,
                            itemid: itemId
                        },
                        priority: {
                            id: productListItemSearchRecord.getValue('custrecord_ns_pl_pli_priority'),
                            name: productListItemSearchRecord.getText('custrecord_ns_pl_pli_priority')
                        }
                    };
                productlist_items.push(productListItem);
            });
            var store_item_references = _(productlist_items).pluck('store_item_reference'), results = [];
            StoreItem && StoreItem.preloadItems(store_item_references);
            _(productlist_items).each(function (productlist_item) {
                var store_item_reference = productlist_item.store_item_reference, store_item = StoreItem ? StoreItem.get(store_item_reference.id, store_item_reference.type) : store_item_reference;
                delete productlist_item.store_item_reference;
                if (!store_item) {
                    return;
                }
                if (include_store_item || !StoreItem) {
                    productlist_item.item = store_item;
                } else {
                    productlist_item.item = {
                        internalid: store_item_reference.id,
                        displayname: self.getProductName(store_item),
                        ispurchasable: store_item.ispurchasable,
                        itemoptions_detail: store_item.itemoptions_detail,
                        minimumquantity: store_item.minimumquantity
                    };
                }
                if (!include_store_item && store_item && store_item.matrix_parent) {
                    productlist_item.item.matrix_parent = store_item.matrix_parent;
                }
                results.push(productlist_item);
            });
            return results;
        }
    };
});
define('ProductList.Model', [
    'SC.Model',
    'Application',
    'Models.Init',
    'ProductList.Item.Search',
    'Utils',
    'underscore'
], function (SCModel, Application, ModelsInit, ProductListItemSearch, Utils, _) {
    'use strict';
    return SCModel.extend({
        name: 'ProductList',
        configuration: SC.Configuration.productList,
        later_type_id: '2',
        quote_type_id: '4',
        verifySession: function () {
            if (!!_.result(this.configuration, 'loginRequired') && !ModelsInit.session.isLoggedIn2()) {
                throw unauthorizedError;
            }
        },
        getColumns: function () {
            return {
                internalid: new nlobjSearchColumn('internalid'),
                templateid: new nlobjSearchColumn('custrecord_ns_pl_pl_templateid'),
                name: new nlobjSearchColumn('name'),
                description: new nlobjSearchColumn('custrecord_ns_pl_pl_description'),
                owner: new nlobjSearchColumn('custrecord_ns_pl_pl_owner'),
                scope: new nlobjSearchColumn('custrecord_ns_pl_pl_scope'),
                type: new nlobjSearchColumn('custrecord_ns_pl_pl_type'),
                created: new nlobjSearchColumn('created'),
                lastmodified: new nlobjSearchColumn('lastmodified')
            };
        },
        get: function (user, id) {
            if (request.getURL().indexOf('https') === 0) {
                this.verifySession();
            }
            var filters = [
                    new nlobjSearchFilter('internalid', null, 'is', id),
                    new nlobjSearchFilter('isinactive', null, 'is', 'F'),
                    new nlobjSearchFilter('custrecord_ns_pl_pl_owner', null, 'is', user)
                ], product_lists = this.searchHelper(filters, this.getColumns(), true);
            if (product_lists.length >= 1) {
                return product_lists[0];
            } else {
                throw notFoundError;
            }
        },
        getSavedForLaterProductList: function (user) {
            return this.getSpecialTypeProductList(user, this.later_type_id);
        },
        getRequestAQuoteProductList: function (user) {
            return this.getSpecialTypeProductList(user, this.quote_type_id);
        },
        getSpecialTypeProductList: function (user, type_id) {
            this.verifySession();
            var filters = [
                    new nlobjSearchFilter('custrecord_ns_pl_pl_type', null, 'is', type_id),
                    new nlobjSearchFilter('custrecord_ns_pl_pl_owner', null, 'is', user),
                    new nlobjSearchFilter('isinactive', null, 'is', 'F')
                ], product_lists = this.searchHelper(filters, this.getColumns(), true);
            if (product_lists.length >= 1) {
                return product_lists[0];
            } else {
                var sfl_template = _(_(this.configuration.listTemplates).filter(function (pl) {
                    return pl.typeId && pl.typeId === type_id;
                })).first();
                if (sfl_template) {
                    if (!sfl_template.scope) {
                        sfl_template.scope = {
                            id: type_id,
                            name: 'private'
                        };
                    }
                    if (!sfl_template.description) {
                        sfl_template.description = '';
                    }
                    return sfl_template;
                }
                throw notFoundError;
            }
        },
        sanitize: function (text) {
            return text ? text.replace(/<br>/g, '\n').replace(/</g, '&lt;').replace(/\>/g, '&gt;') : '';
        },
        searchHelper: function (filters, columns, include_store_items, order, template_ids) {
            var order_tokens = order && order.split(':') || [], sort_column = order_tokens[0] || 'name', sort_direction = order_tokens[1] || 'ASC', productLists = [];
            columns[sort_column] && columns[sort_column].setSort(sort_direction === 'DESC');
            var records = Application.getAllSearchResults('customrecord_ns_pl_productlist', filters, _.values(columns));
            _.each(records, function (productListSearchRecord) {
                var product_list_type_text = productListSearchRecord.getText('custrecord_ns_pl_pl_type'), last_modified_date = nlapiStringToDate(productListSearchRecord.getValue('lastmodified'), window.dateformat), last_modified_date_str = nlapiDateToString(last_modified_date, window.dateformat), productList = {
                        internalid: productListSearchRecord.getId(),
                        templateId: productListSearchRecord.getValue('custrecord_ns_pl_pl_templateid'),
                        name: productListSearchRecord.getValue('name'),
                        description: productListSearchRecord.getValue('custrecord_ns_pl_pl_description') ? productListSearchRecord.getValue('custrecord_ns_pl_pl_description').replace(/\n/g, '<br>') : '',
                        owner: {
                            id: productListSearchRecord.getValue('custrecord_ns_pl_pl_owner'),
                            name: productListSearchRecord.getText('custrecord_ns_pl_pl_owner')
                        },
                        scopeId: productListSearchRecord.getValue('custrecord_ns_pl_pl_scope'),
                        scopeName: productListSearchRecord.getText('custrecord_ns_pl_pl_scope'),
                        typeId: productListSearchRecord.getValue('custrecord_ns_pl_pl_type'),
                        typeName: product_list_type_text,
                        created: productListSearchRecord.getValue('created'),
                        lastmodified: productListSearchRecord.getValue('lastmodified'),
                        lastmodifieddate: last_modified_date_str,
                        items: ProductListItemSearch.search(productListSearchRecord.getValue('custrecord_ns_pl_pl_owner'), productListSearchRecord.getId(), include_store_items, {
                            sort: 'sku',
                            order: '1',
                            page: -1
                        })
                    };
                if (template_ids && productList.templateId) {
                    template_ids.push(productList.templateId);
                }
                productLists.push(productList);
            });
            return productLists;
        },
        search: function (user, order) {
            var filters = [
                    new nlobjSearchFilter('isinactive', null, 'is', 'F'),
                    new nlobjSearchFilter('custrecord_ns_pl_pl_owner', null, 'is', user)
                ], template_ids = [], product_lists = this.searchHelper(filters, this.getColumns(), false, order, template_ids), self = this;
            _(this.configuration.listTemplates).each(function (template) {
                if (!_(template_ids).contains(template.templateId)) {
                    if (!template.templateId || !template.name) {
                        console.log('Error: Wrong predefined Product List. Please check backend configuration.');
                    } else {
                        if (!template.scopeId) {
                            template.scopeId = '2';
                            template.scopeName = 'private';
                        }
                        if (!template.description) {
                            template.description = '';
                        }
                        if (!template.typeId) {
                            template.typeId = '3';
                            template.typeName = 'predefined';
                        }
                        product_lists.push(template);
                    }
                }
            });
            if (this.isSingleList()) {
                return _.filter(product_lists, function (pl) {
                    return pl.typeName === 'predefined';
                });
            }
            return product_lists.filter(function (pl) {
                return pl.typeId !== self.later_type_id && pl.typeId !== self.quote_type_id;
            });
        },
        isSingleList: function () {
            var self = this;
            return !this.configuration.additionEnabled && this.configuration.listTemplates && _.filter(this.configuration.listTemplates, function (pl) {
                return !pl.typeId || pl.typeId !== self.later_type_id && pl.typeId !== self.quote_type_id;
            }).length === 1;
        },
        create: function (user, data) {
            this.verifySession();
            var productList = nlapiCreateRecord('customrecord_ns_pl_productlist');
            data.templateId && productList.setFieldValue('custrecord_ns_pl_pl_templateid', data.templateId);
            data.scopeId && productList.setFieldValue('custrecord_ns_pl_pl_scope', data.scopeId);
            data.typeId && productList.setFieldValue('custrecord_ns_pl_pl_type', data.typeId);
            data.name && productList.setFieldValue('name', this.sanitize(data.name));
            data.description && productList.setFieldValue('custrecord_ns_pl_pl_description', this.sanitize(data.description));
            productList.setFieldValue('custrecord_ns_pl_pl_owner', user);
            return nlapiSubmitRecord(productList);
        },
        update: function (user, id, data) {
            this.verifySession();
            var product_list = nlapiLoadRecord('customrecord_ns_pl_productlist', id);
            if (parseInt(product_list.getFieldValue('custrecord_ns_pl_pl_owner'), 10) !== user) {
                throw unauthorizedError;
            }
            data.templateId && product_list.setFieldValue('custrecord_ns_pl_pl_templateid', data.templateId);
            data.scopeId && product_list.setFieldValue('custrecord_ns_pl_pl_scope', data.scopeId);
            data.typeId && product_list.setFieldValue('custrecord_ns_pl_pl_type', data.typeId);
            data.name && product_list.setFieldValue('name', this.sanitize(data.name));
            product_list.setFieldValue('custrecord_ns_pl_pl_description', data.description ? this.sanitize(data.description) : '');
            nlapiSubmitRecord(product_list);
        },
        delete: function (user, id) {
            this.verifySession();
            var product_list = nlapiLoadRecord('customrecord_ns_pl_productlist', id);
            if (parseInt(product_list.getFieldValue('custrecord_ns_pl_pl_owner'), 10) !== user) {
                throw unauthorizedError;
            }
            product_list.setFieldValue('isinactive', 'T');
            var internalid = nlapiSubmitRecord(product_list);
            return internalid;
        }
    });
});
define('ProductList.ServiceController', [
    'ServiceController',
    'Models.Init',
    'Application',
    'ProductList.Model'
], function (ServiceController, ModelsInit, Application, ProductListModel) {
    'use strict';
    return ServiceController.extend({
        name: 'ProductList.ServiceController',
        options: { common: { requireLoggedInPPS: true } },
        getUser: function () {
            var user = ModelsInit.session.isLoggedIn2() ? nlapiGetUser() : 0, role = ModelsInit.context.getRoleId();
            if (role !== 'shopper' && role !== 'customer_center') {
                user = parseInt(this.request.getParameter('user') || this.data.owner && this.data.owner.id || user, 10);
            }
            return user;
        },
        getId: function () {
            return this.request.getParameter('internalid') || this.data.internalid;
        },
        get: function () {
            var id = this.getId(), user = this.getUser();
            if (id) {
                if (id === 'later') {
                    return ProductListModel.getSavedForLaterProductList(user);
                } else if (id === 'quote') {
                    return ProductListModel.getRequestAQuoteProductList(user);
                } else {
                    return ProductListModel.get(user, id);
                }
            } else {
                return ProductListModel.search(user, 'name');
            }
        },
        post: function () {
            var user = this.getUser(), internalid = ProductListModel.create(user, this.data);
            this.sendContent(ProductListModel.get(user, internalid), { 'status': 201 });
        },
        put: function () {
            var id = this.getId(), user = this.getUser();
            ProductListModel.update(user, id, this.data);
            return ProductListModel.get(user, id);
        },
        delete: function () {
            var id = this.getId(), user = this.getUser();
            ProductListModel.delete(user, id);
            return { 'status': 'ok' };
        }
    });
});
define('ProductList.Item.Model', [
    'SC.Model',
    'Models.Init',
    'Application',
    'Utils',
    'ProductList.Model',
    'ProductList.Item.Search',
    'Configuration',
    'underscore'
], function (SCModel, ModelsInit, Application, Utils, ProductList, Search, Configuration, _) {
    'use strict';
    return SCModel.extend({
        name: 'ProductList.Item',
        configuration: Configuration.productList,
        verifySession: function () {
            if (this.configuration.loginRequired && !ModelsInit.session.isLoggedIn2()) {
                throw unauthorizedError;
            }
        },
        get: function (user, id) {
            this.verifySession();
            var filters = [
                    new nlobjSearchFilter('internalid', null, 'is', id),
                    new nlobjSearchFilter('isinactive', null, 'is', 'F'),
                    new nlobjSearchFilter('custrecord_ns_pl_pl_owner', 'custrecord_ns_pl_pli_productlist', 'is', user)
                ], sort_column = 'custrecord_ns_pl_pli_item', sort_direction = 'ASC', productlist_items = Search.searchHelper(filters, sort_column, sort_direction, true);
            if (productlist_items.length >= 1) {
                return productlist_items[0];
            } else {
                throw notFoundError;
            }
        },
        delete: function (user, id) {
            this.verifySession();
            var product_list_item = nlapiLoadRecord('customrecord_ns_pl_productlistitem', id), parent_product_list = ProductList.get(user, product_list_item.getFieldValue('custrecord_ns_pl_pli_productlist'));
            if (parseInt(parent_product_list.owner.id, 10) !== user) {
                throw unauthorizedError;
            }
            product_list_item.setFieldValue('isinactive', 'T');
            return nlapiSubmitRecord(product_list_item);
        },
        sanitize: function (text) {
            return text ? text.replace(/<br>/g, '\n').replace(/</g, '&lt;').replace(/\>/g, '&gt;') : '';
        },
        create: function (user, data) {
            this.verifySession();
            if (!(data.productList && data.productList.id)) {
                throw notFoundError;
            }
            var parent_product_list = ProductList.get(user, data.productList.id);
            if (parseInt(parent_product_list.owner.id, 10) !== user) {
                throw unauthorizedError;
            }
            var productListItem = nlapiCreateRecord('customrecord_ns_pl_productlistitem');
            data.description && productListItem.setFieldValue('custrecord_ns_pl_pli_description', this.sanitize(data.description));
            if (data.options) {
                data.options && productListItem.setFieldValue('custrecord_ns_pl_pli_options', JSON.stringify(data.options || {}));
            }
            data.quantity && productListItem.setFieldValue('custrecord_ns_pl_pli_quantity', data.quantity);
            data.item && data.item.internalid && productListItem.setFieldValue('custrecord_ns_pl_pli_item', data.item.internalid);
            data.priority && data.priority.id && productListItem.setFieldValue('custrecord_ns_pl_pli_priority', data.priority.id);
            productListItem.setFieldValue('custrecord_ns_pl_pli_productlist', data.productList.id);
            data.internalid = nlapiSubmitRecord(productListItem);
            return data;
        },
        update: function (user, id, data) {
            this.verifySession();
            var product_list_item = nlapiLoadRecord('customrecord_ns_pl_productlistitem', id), parent_product_list = ProductList.get(user, product_list_item.getFieldValue('custrecord_ns_pl_pli_productlist'));
            if (parseInt(parent_product_list.owner.id, 10) !== user) {
                throw unauthorizedError;
            }
            product_list_item.setFieldValue('custrecord_ns_pl_pli_description', this.sanitize(data.description));
            data.options && product_list_item.setFieldValue('custrecord_ns_pl_pli_options', JSON.stringify(data.options || {}));
            data.quantity && product_list_item.setFieldValue('custrecord_ns_pl_pli_quantity', data.quantity);
            data.item && data.item.id && product_list_item.setFieldValue('custrecord_ns_pl_pli_item', data.item.id);
            if (data.priority) {
                if (_.isObject(data.priority)) {
                    data.priority.id && product_list_item.setFieldValue('custrecord_ns_pl_pli_priority', data.priority.id);
                } else {
                    product_list_item.setFieldValue('custrecord_ns_pl_pli_priority', data.priority);
                }
            }
            data.productList && data.productList.id && product_list_item.setFieldValue('custrecord_ns_pl_pli_productlist', data.productList.id);
            nlapiSubmitRecord(product_list_item);
        },
        search: function (user, product_list_id, include_store_item, sort_and_paging_data) {
            this.verifySession();
            return Search.search(user, product_list_id, include_store_item, sort_and_paging_data);
        }
    });
});
define('ProductList.Item.ServiceController', [
    'ServiceController',
    'Models.Init',
    'Application',
    'ProductList.Item.Model'
], function (ServiceController, ModelsInit, Application, ProductListItemModel) {
    'use strict';
    return ServiceController.extend({
        name: 'ProductList.Item.ServiceController',
        options: { common: { requireLoggedInPPS: true } },
        getUser: function () {
            var role = ModelsInit.context.getRoleId(), user = nlapiGetUser();
            if (role !== 'shopper' && role !== 'customer_center') {
                user = parseInt(this.request.getParameter('user') || this.data.productList && this.data.productList.owner || user, 10);
            }
            return user;
        },
        getId: function () {
            return this.request.getParameter('internalid') ? this.request.getParameter('internalid') : this.data.internalid;
        },
        get: function () {
            var product_list_id = this.request.getParameter('productlistid') ? this.request.getParameter('productlistid') : this.data.productlistid, id = this.getId(), user = this.getUser();
            return id ? ProductListItemModel.get(user, id) : ProductListItemModel.search(user, product_list_id, true, {
                sort: this.request.getParameter('sort') ? this.request.getParameter('sort') : this.data.sort,
                order: this.request.getParameter('order') ? this.request.getParameter('order') : this.data.order,
                page: this.request.getParameter('page') || -1
            });
        },
        post: function () {
            var user = this.getUser();
            this.sendContent(ProductListItemModel.create(user, this.data), { 'status': 201 });
        },
        put: function () {
            var id = this.getId(), user = this.getUser();
            ProductListItemModel.update(user, id, this.data);
            return ProductListItemModel.get(user, id);
        },
        delete: function () {
            var id = this.getId(), user = this.getUser();
            ProductListItemModel.delete(user, id);
            return { 'status': 'ok' };
        }
    });
});
define('ProductReviews.Model', [
    'SC.Model',
    'Models.Init',
    'Application',
    'Utils',
    'underscore'
], function (SCModel, ModelsInit, Application, Utils, _) {
    'use strict';
    return SCModel.extend({
        name: 'ProductReview',
        maxFlagsCount: SC.Configuration.productReviews.maxFlagsCount,
        loginRequired: SC.Configuration.productReviews.loginRequired,
        flaggedStatus: SC.Configuration.productReviews.flaggedStatus,
        approvedStatus: SC.Configuration.productReviews.approvedStatus,
        pendingApprovalStatus: SC.Configuration.productReviews.pendingApprovalStatus,
        resultsPerPage: SC.Configuration.productReviews.resultsPerPage,
        get: function (id) {
            var review = nlapiLoadRecord('customrecord_ns_pr_review', id);
            if (review) {
                var result = {
                        internalid: review.getId(),
                        status: review.getFieldValue('custrecord_ns_prr_status'),
                        isinactive: review.getFieldValue('isinactive') === 'T',
                        title: review.getFieldValue('name') || '',
                        text: review.getFieldValue('custrecord_ns_prr_text') ? review.getFieldValue('custrecord_ns_prr_text').replace(/\n/g, '<br>') : '',
                        itemid: review.getFieldValue('custrecord_ns_prr_item_id'),
                        rating: review.getFieldValue('custrecord_ns_prr_rating'),
                        useful_count: review.getFieldValue('custrecord_ns_prr_useful_count'),
                        not_useful_count: review.getFieldValue('custrecord_ns_prr_not_useful_count'),
                        falgs_count: review.getFieldValue('custrecord_ns_prr_falgs_count'),
                        isVerified: review.getFieldValue('custrecord_ns_prr_verified') === 'T',
                        created_on: review.getFieldValue('custrecord_ns_prr_creation_date') || review.getFieldValue('created'),
                        writer: {
                            id: review.getFieldValue('custrecord_ns_prr_writer'),
                            name: review.getFieldValue('custrecord_ns_prr_writer_name') || review.getFieldText('custrecord_ns_prr_writer')
                        },
                        rating_per_attribute: {}
                    }, filters = [new nlobjSearchFilter('custrecord_ns_prar_review', null, 'is', id)], columns = [
                        new nlobjSearchColumn('custrecord_ns_prar_attribute'),
                        new nlobjSearchColumn('custrecord_ns_prar_rating')
                    ], ratings_per_attribute = Application.getAllSearchResults('customrecord_ns_pr_attribute_rating', filters, columns);
                _.each(ratings_per_attribute, function (rating_per_attribute) {
                    result.rating_per_attribute[rating_per_attribute.getText('custrecord_ns_prar_attribute')] = rating_per_attribute.getValue('custrecord_ns_prar_rating');
                });
                return result;
            } else {
                throw notFoundError;
            }
        },
        search: function (filters, order, page, records_per_page) {
            var review_filters = [
                    new nlobjSearchFilter('custrecord_ns_prr_status', null, 'is', this.approvedStatus),
                    new nlobjSearchFilter('isinactive', null, 'is', 'F')
                ], review_columns = {}, result = {};
            if (filters.itemid) {
                review_filters.push(new nlobjSearchFilter('custrecord_ns_prr_item_id', null, 'equalto', filters.itemid));
            }
            if (filters.writer) {
                review_filters.push(new nlobjSearchFilter('custrecord_ns_prr_writer', null, 'equalto', filters.writer));
            }
            if (filters.rating) {
                review_filters.push(new nlobjSearchFilter('custrecord_ns_prr_rating', null, 'equalto', filters.rating));
            }
            if (filters.q) {
                review_filters.push(new nlobjSearchFilter('custrecord_ns_prr_text', null, 'contains', filters.q));
            }
            review_columns = {
                internalid: new nlobjSearchColumn('internalid'),
                title: new nlobjSearchColumn('name'),
                text: new nlobjSearchColumn('custrecord_ns_prr_text'),
                itemid: new nlobjSearchColumn('custrecord_ns_prr_item_id'),
                rating: new nlobjSearchColumn('custrecord_ns_prr_rating'),
                isVerified: new nlobjSearchColumn('custrecord_ns_prr_verified'),
                useful_count: new nlobjSearchColumn('custrecord_ns_prr_useful_count'),
                not_useful_count: new nlobjSearchColumn('custrecord_ns_prr_not_useful_count'),
                writer: new nlobjSearchColumn('custrecord_ns_prr_writer'),
                writer_name: new nlobjSearchColumn('custrecord_ns_prr_writer_name'),
                created_on: new nlobjSearchColumn('created')
            };
            var custom_created_field_exists = Utils.recordTypeHasField('customrecord_ns_pr_review', 'custrecord_ns_prr_creation_date');
            if (custom_created_field_exists === true) {
                review_columns.custom_created_on = new nlobjSearchColumn('custrecord_ns_prr_creation_date');
            }
            var order_tokens = order && order.split(':') || [], sort_column = order_tokens[0] || 'created', sort_direction = order_tokens[1] || 'ASC';
            review_columns[sort_column] && review_columns[sort_column].setSort(sort_direction === 'DESC');
            result = Application.getPaginatedSearchResults({
                record_type: 'customrecord_ns_pr_review',
                filters: review_filters,
                columns: _.values(review_columns),
                page: parseInt(page, 10) || 1,
                results_per_page: parseInt(records_per_page, 10) || this.resultsPerPage
            });
            var reviews_by_id = {}, review_ids = [];
            _.each(result.records, function (review) {
                review_ids.push(review.getId());
                reviews_by_id[review.getId()] = {
                    internalid: review.getId(),
                    title: review.getValue('name'),
                    text: review.getValue('custrecord_ns_prr_text') ? review.getValue('custrecord_ns_prr_text').replace(/\n/g, '<br>') : '',
                    itemid: review.getValue('custrecord_ns_prr_item_id'),
                    rating: review.getValue('custrecord_ns_prr_rating'),
                    useful_count: review.getValue('custrecord_ns_prr_useful_count'),
                    not_useful_count: review.getValue('custrecord_ns_prr_not_useful_count'),
                    isVerified: review.getValue('custrecord_ns_prr_verified') === 'T',
                    created_on: review.getValue('custrecord_ns_prr_creation_date') || review.getValue('created'),
                    writer: {
                        id: review.getValue('custrecord_ns_prr_writer'),
                        name: review.getValue('custrecord_ns_prr_writer_name') || review.getText('custrecord_ns_prr_writer')
                    },
                    rating_per_attribute: {}
                };
            });
            if (review_ids.length) {
                var attribute_filters = [new nlobjSearchFilter('custrecord_ns_prar_review', null, 'anyof', review_ids)], attribute_columns = [
                        new nlobjSearchColumn('custrecord_ns_prar_attribute'),
                        new nlobjSearchColumn('custrecord_ns_prar_rating'),
                        new nlobjSearchColumn('custrecord_ns_prar_review')
                    ], ratings_per_attribute = Application.getAllSearchResults('customrecord_ns_pr_attribute_rating', attribute_filters, attribute_columns);
                _.each(ratings_per_attribute, function (rating_per_attribute) {
                    var review_id = rating_per_attribute.getValue('custrecord_ns_prar_review'), attribute_name = rating_per_attribute.getText('custrecord_ns_prar_attribute'), rating = rating_per_attribute.getValue('custrecord_ns_prar_rating');
                    if (reviews_by_id[review_id]) {
                        reviews_by_id[review_id].rating_per_attribute[attribute_name] = rating;
                    }
                });
            }
            result.records = _.values(reviews_by_id);
            return result;
        },
        create: function (data) {
            if (this.loginRequired && !ModelsInit.session.isLoggedIn2()) {
                throw unauthorizedError;
            }
            var review = nlapiCreateRecord('customrecord_ns_pr_review');
            if (ModelsInit.session.isLoggedIn2()) {
                review.setFieldValue('custrecord_ns_prr_writer', nlapiGetUser() + '');
            }
            if (data.writer) {
                data.writer.name && review.setFieldValue('custrecord_ns_prr_writer_name', Utils.sanitizeString(data.writer.name));
                data.writer.id && review.setFieldValue('custrecord_ns_prr_writer', data.writer.id);
            }
            data.rating && review.setFieldValue('custrecord_ns_prr_rating', data.rating);
            data.title && review.setFieldValue('name', Utils.sanitizeString(data.title));
            if (data.text) {
                var sanitized_text = Utils.sanitizeString(data.text);
                review.setFieldValue('custrecord_ns_prr_text', sanitized_text);
                data.text = sanitized_text.replace(/\n/g, '<br>');
            }
            data.itemid && review.setFieldValue('custrecord_ns_prr_item_id', data.itemid);
            var review_id = nlapiSubmitRecord(review);
            _.each(data.rating_per_attribute, function (rating, name) {
                var review_attribute = nlapiCreateRecord('customrecord_ns_pr_attribute_rating');
                review_attribute.setFieldValue('custrecord_ns_prar_item', data.itemid);
                review_attribute.setFieldValue('custrecord_ns_prar_review', review_id);
                review_attribute.setFieldValue('custrecord_ns_prar_rating', rating);
                review_attribute.setFieldText('custrecord_ns_prar_attribute', name);
                nlapiSubmitRecord(review_attribute);
            });
            return data;
        },
        update: function (id, data) {
            var action = data.action, field_name_by_action = {
                    'flag': 'custrecord_ns_prr_falgs_count',
                    'mark-as-useful': 'custrecord_ns_prr_useful_count',
                    'mark-as-not-useful': 'custrecord_ns_prr_not_useful_count'
                }, field_name = field_name_by_action[action];
            if (field_name) {
                var review = nlapiLoadRecord('customrecord_ns_pr_review', id), current_count = review.getFieldValue(field_name);
                review.setFieldValue(field_name, parseInt(current_count, 10) + 1 || 1);
                if (action === 'flag' && current_count >= this.maxFlagsCount) {
                    review.setFieldValue('custrecord_ns_prr_status', this.flaggedStatus);
                }
                nlapiSubmitRecord(review);
            }
        }
    });
});
define('ProductReviews.ServiceController', [
    'ServiceController',
    'Application',
    'ProductReviews.Model',
    'underscore'
], function (ServiceController, Application, ProductReviewsModel, _) {
    'use strict';
    return ServiceController.extend({
        name: 'ProductReviews.ServiceController',
        options: { common: { requireLoggedInPPS: true } },
        get: function () {
            var result, id = this.request.getParameter('internalid') ? this.request.getParameter('internalid') : this.data.internalid;
            if (id) {
                result = ProductReviewsModel.get(id);
                if (result.status !== ProductReviewsModel.approvedStatus || result.isinactive) {
                    throw notFoundError;
                }
            } else {
                var params = this.request.getAllParameters(), filters = {};
                _.each(params, function (value, key) {
                    filters[key] = value;
                });
                result = ProductReviewsModel.search(filters, filters.order, filters.page, filters.limit);
            }
            this.sendContent(result, { 'cache': response.CACHE_DURATION_LONG });
        },
        post: function () {
            this.sendContent(ProductReviewsModel.create(this.data), { 'status': 201 });
        },
        put: function () {
            var id = this.request.getParameter('internalid') ? this.request.getParameter('internalid') : this.data.internalid;
            ProductReviewsModel.update(id, this.data);
            return ProductReviewsModel.get(id);
        }
    });
});
define('Profile.ServiceController', [
    'ServiceController',
    'Models.Init',
    'Profile.Model'
], function (ServiceController, ModelsInit, ProfileModel) {
    'use strict';
    return ServiceController.extend({
        name: 'Profile.ServiceController',
        options: {
            common: { requireLoggedInPPS: true },
            put: { requireLogin: true }
        },
        get: function () {
            return ProfileModel.get();
        },
        put: function () {
            ProfileModel.update(this.data);
            return ProfileModel.get();
        }
    });
});
define('SiteSettings.ServiceController', [
    'ServiceController',
    'SiteSettings.Model'
], function (ServiceController, SiteSettingsModel) {
    'use strict';
    return ServiceController.extend({
        name: 'SiteSettings.ServiceController',
        options: { common: { requireLoggedInPPS: true } },
        get: function () {
            return SiteSettingsModel.get();
        }
    });
});
define('Quote.Model', [
    'Transaction.Model',
    'Utils',
    'Application',
    'underscore'
], function (TransactionModel, Utils, Application, _) {
    'use strict';
    var QuoteToSalesOrderValidatorModel;
    try {
        QuoteToSalesOrderValidatorModel = require('QuoteToSalesOrderValidator.Model');
    } catch (e) {
    }
    return TransactionModel.extend({
        name: 'Quote',
        _isCreatingARecord: function () {
            return this.recordId === 'null';
        },
        getTransactionRecord: function () {
            if (this.record) {
                return this.record;
            }
            if (!this._isCreatingARecord()) {
                return TransactionModel.getTransactionRecord.apply(this, arguments);
            }
            return nlapiCreateRecord('estimate', { recordmode: 'dynamic' });
        },
        getExtraRecordFields: function () {
            if (!this._isCreatingARecord()) {
                this.getEntityStatus();
            }
            this.result.statusRef = this.record.getFieldValue('statusRef');
            this.result.message = Utils.sanitizeString(this.record.getFieldValue('message'));
            this.result.allowToPurchase = Application.getPermissions().transactions.tranSalesOrd >= 2;
            this.result.isOpen = this.record.getFieldValue('statusRef') === 'open';
            if (!this._isCreatingARecord()) {
                this.getSalesRep();
                this.result.purchasablestatus = QuoteToSalesOrderValidatorModel ? QuoteToSalesOrderValidatorModel.getQuoteToSalesOrderValidation(this.result) : {};
            } else {
                this.result.salesrep = {
                    name: this.record.getFieldText('salesrep'),
                    internalid: this.record.getFieldValue('salesrep')
                };
            }
            this.getDiscountInformation();
            this.getDueDate();
        },
        getRecordAddresses: function () {
            this.result.addresses = {};
            this.result.listAddresseByIdTmp = {};
            for (var i = 1; i <= this.record.getLineItemCount('iladdrbook'); i++) {
                this.result.listAddresseByIdTmp[this.record.getLineItemValue('iladdrbook', 'iladdrinternalid', i)] = this.addAddress({
                    internalid: this.record.getLineItemValue('iladdrbook', 'iladdrinternalid', i),
                    country: this.record.getLineItemValue('iladdrbook', 'iladdrshipcountry', i),
                    state: this.record.getLineItemValue('iladdrbook', 'iladdrshipstate', i),
                    city: this.record.getLineItemValue('iladdrbook', 'iladdrshipcity', i),
                    zip: this.record.getLineItemValue('iladdrbook', 'iladdrshipzip', i),
                    addr1: this.record.getLineItemValue('iladdrbook', 'iladdrshipaddr1', i),
                    addr2: this.record.getLineItemValue('iladdrbook', 'iladdrshipaddr2', i),
                    attention: this.record.getLineItemValue('iladdrbook', 'iladdrshipattention', i),
                    addressee: this.record.getLineItemValue('iladdrbook', 'iladdrshipaddressee', i),
                    phone: this.record.getLineItemValue('iladdrbook', 'iladdrshipphone', i)
                });
            }
            this.result.shipaddress = this.addAddress({
                internalid: this.record.getFieldValue('shipaddresslist'),
                country: this.record.getFieldValue('shipcountry'),
                state: this.record.getFieldValue('shipstate'),
                city: this.record.getFieldValue('shipcity'),
                zip: this.record.getFieldValue('shipzip'),
                addr1: this.record.getFieldValue('shipaddr1'),
                addr2: this.record.getFieldValue('shipaddr2'),
                attention: this.record.getFieldValue('shipattention'),
                addressee: this.record.getFieldValue('shipaddressee'),
                phone: this.record.getFieldValue('shipphone')
            });
            this.result.billaddress = this.addAddress({
                internalid: this.record.getFieldValue('billaddresslist'),
                country: this.record.getFieldValue('billcountry'),
                state: this.record.getFieldValue('billstate'),
                city: this.record.getFieldValue('billcity'),
                zip: this.record.getFieldValue('billzip'),
                addr1: this.record.getFieldValue('billaddr1'),
                addr2: this.record.getFieldValue('billaddr2'),
                attention: this.record.getFieldValue('billattention'),
                addressee: this.record.getFieldValue('billaddressee'),
                phone: this.record.getFieldValue('billphone')
            });
        },
        getAddressInternalId: function (address) {
            if (_.isNaN(parseInt(address.internalid, 10))) {
                return TransactionModel.getAddressInternalId.apply(this, arguments);
            }
            return address.internalid;
        },
        _getQuoteStatus: function (estimate_id) {
            var estimates = nlapiSearchRecord('estimate', null, [
                [
                    'internalid',
                    'is',
                    estimate_id
                ],
                'and',
                [
                    'mainline',
                    'is',
                    'T'
                ]
            ], [new nlobjSearchColumn('entitystatus')]);
            return estimates[0];
        },
        getEntityStatus: function () {
            var estimate_aux = this._getQuoteStatus(this.record.getId());
            this.result.entitystatus = {
                id: estimate_aux.getValue('entitystatus'),
                name: estimate_aux.getText('entitystatus')
            };
        },
        getDiscountInformation: function () {
            this.result.discount = this.record.getFieldValue('discountitem') ? {
                internalid: this.record.getFieldValue('discountitem'),
                name: this.record.getFieldText('discountitem'),
                rate: this.record.getFieldValue('discountrate')
            } : null;
        },
        getDueDate: function () {
            var duedate = this.record.getFieldValue('duedate'), now = new Date().getTime();
            this.result.duedate = duedate;
            this.result.isOverdue = this.isDateInterval(new Date(nlapiStringToDate(duedate)).getTime() - now);
            this.result.isCloseOverdue = this.isDateInterval(new Date(nlapiStringToDate(duedate)).getTime() - (now + this.getDaysBeforeExpiration()));
            this.result.expectedclosedate = this.record.getFieldValue('expectedclosedate');
        },
        setExtraListColumns: function () {
            this.columns.duedate = new nlobjSearchColumn('duedate');
            this.columns.expectedclosedate = new nlobjSearchColumn('expectedclosedate');
            this.columns.entitystatus = new nlobjSearchColumn('entitystatus');
            this.columns.total = new nlobjSearchColumn('total');
        },
        setExtraListFilters: function () {
            if (this.data.filter && this.data.filter !== 'ALL') {
                this.filters.entitystatus_operator = 'and';
                this.filters.entitystatus = [
                    'entitystatus',
                    'is',
                    this.data.filter
                ];
            }
        },
        mapListResult: function (result, record) {
            var duedate = record.getValue('duedate'), now = new Date().getTime();
            result.duedate = duedate;
            result.isOverdue = this.isDateInterval(new Date(nlapiStringToDate(duedate)).getTime() - now);
            result.isCloseOverdue = this.isDateInterval(new Date(nlapiStringToDate(duedate)).getTime() - (now + this.getDaysBeforeExpiration()));
            result.expectedclosedate = record.getValue('expectedclosedate');
            result.entitystatus = {
                id: record.getValue('entitystatus'),
                name: record.getText('entitystatus')
            };
            result.total = Utils.toCurrency(record.getValue('total'));
            result.total_formatted = Utils.formatCurrency(record.getValue('total'));
            return result;
        },
        isDateInterval: function (date) {
            return date <= 0 && -1 * date / 1000 / 60 / 60 / 24 >= 1;
        },
        getDaysBeforeExpiration: function () {
            return SC.Configuration.quote.daysToExpire * 24 * 60 * 60 * 1000;
        },
        getSalesRepFromId: function (quote_id) {
            var salesrep = {};
            var search_result = nlapiLookupField('estimate', quote_id, [
                'salesrep.phone',
                'salesrep.email',
                'salesrep.entityid',
                'salesrep.mobilephone',
                'salesrep.fax',
                'salesrep'
            ]);
            if (search_result) {
                salesrep.phone = search_result['salesrep.phone'];
                salesrep.email = search_result['salesrep.email'];
                salesrep.fullname = search_result['salesrep.entityid'];
                salesrep.name = search_result['salesrep.entityid'];
                salesrep.mobilephone = search_result['salesrep.mobilephone'];
                salesrep.fax = search_result['salesrep.fax'];
                salesrep.internalid = search_result.salesrep;
            }
            return salesrep;
        },
        postSubmitRecord: function (confirmation_result) {
            var created_salesorder = nlapiLookupField('estimate', confirmation_result.internalid, ['tranid']) || {};
            confirmation_result.tranid = created_salesorder.tranid;
            confirmation_result.salesrep = this.getSalesRepFromId(confirmation_result.internalid);
            confirmation_result.confirmationnumber = created_salesorder.tranid;
            return confirmation_result;
        }
    });
});
define('Quote.ServiceController', [
    'ServiceController',
    'Quote.Model'
], function (ServiceController, QuoteModel) {
    'use strict';
    return ServiceController.extend({
        name: 'Quote.ServiceController',
        options: {
            common: {
                requireLogin: true,
                requirePermissions: {
                    list: [
                        'transactions.tranEstimate.1',
                        'transactions.tranFind.1'
                    ]
                }
            }
        },
        get: function () {
            var id = this.request.getParameter('internalid');
            if (id) {
                return QuoteModel.get('estimate', id);
            } else {
                return QuoteModel.list({
                    filter: this.request.getParameter('filter'),
                    order: this.request.getParameter('order'),
                    sort: this.request.getParameter('sort'),
                    from: this.request.getParameter('from'),
                    to: this.request.getParameter('to'),
                    page: this.request.getParameter('page') || 1,
                    types: this.request.getParameter('types')
                });
            }
        },
        post: function () {
            QuoteModel.update('estimate', this.data.internalid || 'null', this.data);
            var order_info = QuoteModel.get('estimate', this.data.internalid || 'null');
            order_info.confirmation = QuoteModel.submit();
            return order_info;
        },
        put: function () {
            QuoteModel.update('estimate', this.data.internalid, this.data);
            return QuoteModel.get('estimate', this.data.internalid);
        }
    });
});
define('Receipt.Model', [
    'Application',
    'Utils',
    'Transaction.Model'
], function (Application, Utils, TransactionModel) {
    'use strict';
    return TransactionModel.extend({
        name: 'Receipt',
        getStatus: function () {
            this.result.status = {
                internalid: nlapiLookupField(this.result.recordtype, this.result.internalid, 'status'),
                name: nlapiLookupField(this.result.recordtype, this.result.internalid, 'status', true)
            };
        },
        getCreatedFrom: function () {
            var created_from_internalid = nlapiLookupField(this.result.recordtype, this.result.internalid, 'createdfrom'), recordtype = created_from_internalid ? Utils.getTransactionType(created_from_internalid) : '', tranid = recordtype ? nlapiLookupField(recordtype, created_from_internalid, 'tranid') : '';
            this.result.createdfrom = {
                internalid: created_from_internalid,
                name: nlapiLookupField(this.result.recordtype, this.result.internalid, 'createdfrom', true) || '',
                recordtype: recordtype,
                tranid: tranid
            };
        }
    });
});
define('Receipt.ServiceController', [
    'ServiceController',
    'Receipt.Model'
], function (ServiceController, ReceiptModel) {
    'use strict';
    return ServiceController.extend({
        name: 'Receipt.ServiceController',
        options: {
            common: {
                requireLogin: true,
                requirePermissions: {
                    list: [
                        'transactions.tranFind.1',
                        'transactions.tranCashSale.1'
                    ]
                }
            }
        },
        get: function () {
            var id = this.request.getParameter('internalid'), status = this.request.getParameter('status'), page = this.request.getParameter('page');
            return id ? ReceiptModel.get('cashsale', id) : ReceiptModel.list({
                types: 'CashSale',
                status: status,
                page: page
            });
        }
    });
});
define('ReturnAuthorization.ServiceController', [
    'ServiceController',
    'Application',
    'ReturnAuthorization.Model'
], function (ServiceController, Application, ReturnAuthorizationModel) {
    'use strict';
    ReturnAuthorizationModel.loadSCISIntegrationStatus();
    var enabled = ReturnAuthorizationModel.getIsSCISIntegrationEnabled();
    return ServiceController.extend({
        name: 'ReturnAuthorization.ServiceController',
        options: {
            common: {
                requireLogin: true,
                requirePermissions: {
                    list: [
                        enabled ? 'transactions.tranPurchasesReturns.1' : 'transactions.tranRtnAuth.1',
                        'transactions.tranFind.1'
                    ]
                }
            },
            post: { requirePermissions: { extraList: ['transactions.tranRtnAuth.2'] } }
        },
        get: function () {
            var recordtype = this.request.getParameter('recordtype'), id = this.request.getParameter('internalid');
            return id && recordtype ? ReturnAuthorizationModel.get(recordtype, id) : ReturnAuthorizationModel.list({
                order: this.request.getParameter('order'),
                sort: this.request.getParameter('sort'),
                from: this.request.getParameter('from'),
                to: this.request.getParameter('to'),
                page: this.request.getParameter('page')
            });
        },
        post: function () {
            var id = ReturnAuthorizationModel.create(this.data);
            this.sendContent(ReturnAuthorizationModel.get('returnauthorization', id), { 'status': 201 });
        }
    });
});
define('TransactionHistory.Model', [
    'SC.Model',
    'Application',
    'Utils',
    'Transaction.Model'
], function (SCModel, Application, Utils, Transaction) {
    'use strict';
    return Transaction.extend({
        setExtraListFilters: function () {
            this.filters.types_operator = 'and';
            this.filters.types = [
                'type',
                'anyof',
                this.data.filter.split(',')
            ];
        }
    });
});
define('TransactionHistory.ServiceController', [
    'ServiceController',
    'TransactionHistory.Model',
    'Application'
], function (ServiceController, TransactionHistoryModel, Application) {
    'use strict';
    return ServiceController.extend({
        name: 'TransactionHistory.ServiceController',
        options: { common: { requireLogin: true } },
        _validatePermission: function () {
            var permissions = Application.getPermissions().transactions;
            if (!(permissions.tranFind > 0 && (permissions.tranCustInvc > 0 || permissions.tranCustCred > 0 || permissions.tranCustPymt > 0 || permissions.tranCustDep > 0 || permissions.tranDepAppl > 0))) {
                throw forbiddenError;
            }
        },
        get: function () {
            this._validatePermission();
            return TransactionHistoryModel.list({
                filter: this.request.getParameter('filter'),
                order: this.request.getParameter('order'),
                sort: this.request.getParameter('sort'),
                from: this.request.getParameter('from'),
                to: this.request.getParameter('to'),
                page: this.request.getParameter('page') || 1
            });
        }
    });
});
define('ReleaseMetadata', ['underscore'], function (_) {
    'use strict';
    return {
        available: function () {
            return release_metadata !== undefined;
        },
        get: function () {
            return release_metadata;
        },
        getVersion: function () {
            return release_metadata && release_metadata.version;
        },
        asHTMLComment: function () {
            if (!release_metadata) {
                return '';
            }
            var bracketVals = _.chain(release_metadata).omit('name').map(function (value, key) {
                return '[ ' + key + ' ' + JSON.stringify(value) + ' ]';
            }).value().join(' ');
            return '<!-- ' + release_metadata.name + ' ' + bracketVals + ' -->';
        }
    };
});
define('QuoteToSalesOrderValidator.Model', [
    'SC.Model',
    'Application',
    'StoreItem.Model',
    'Address.Model',
    'underscore'
], function (SCModel, Application, StoreItemModel, AddressModel, _) {
    'use strict';
    var invalidQuoteError = {
        status: 500,
        code: 'ERR_INVALID_QUOTE_STATUS',
        message: 'Sorry, the specified quote id is not valid to be purchased.'
    };
    return SCModel.extend({
        name: 'QuoteToSalesOrderValidator',
        invalidQuoteError: invalidQuoteError,
        purchasableQuoteConditions: [
            {
                errorCode: 'INVALIDPERMISSION',
                stopValidation: true,
                validatesCondtion: function () {
                    return Application.getPermissions().transactions.tranSalesOrd >= 2;
                }
            },
            {
                errorCode: 'INVALIDENTITYSTATUS',
                validatesCondtion: function (quote) {
                    return quote.entitystatus.id === SC.Configuration.quote.purchaseReadyStatusId;
                }
            },
            {
                errorCode: 'INVALIDSTATUS',
                validatesCondtion: function (quote) {
                    return quote.statusRef === 'open';
                }
            },
            {
                errorCode: 'MISSINGSHIPMETHOD',
                validatesCondtion: function (quote) {
                    var all_items_fulfillable = _.all(_.pluck(quote.lines, 'isfulfillable'), function (fulfillable) {
                        return !fulfillable;
                    });
                    if (all_items_fulfillable) {
                        return true;
                    }
                    return !!quote.shipmethod;
                }
            },
            {
                errorCode: 'MISSINGSHIPADDRESS',
                validatesCondtion: function (quote) {
                    var all_items_fulfillable = _.all(_.pluck(quote.lines, 'isfulfillable'), function (fulfillable) {
                        return !fulfillable;
                    });
                    if (all_items_fulfillable) {
                        return true;
                    }
                    var shipping_address = quote.addresses[quote.shipaddress];
                    return !!(shipping_address && shipping_address.isvalid === 'T');
                }
            },
            {
                errorCode: 'MISSINGSALESREP',
                validatesCondtion: function (quote) {
                    return quote.salesrep && quote.salesrep.internalid;
                }
            },
            {
                errorCode: 'GIFTCERTIFICATENOTALLOWED',
                validatesCondtion: function (quote) {
                    return _.all(quote.lines, function (line) {
                        return line.item.itemtype !== 'GiftCert';
                    });
                }
            }
        ],
        getQuoteToSalesOrderValidation: function (record, validators) {
            var purchase_validation_errors = [], is_valid_for_purchase = false;
            validators = validators || this.purchasableQuoteConditions;
            _.find(validators, function (validator) {
                if (!validator.validatesCondtion(record)) {
                    purchase_validation_errors.push(validator.errorCode);
                    return !!validator.stopValidation;
                }
                return false;
            });
            is_valid_for_purchase = !purchase_validation_errors.length;
            return {
                isPurchasable: is_valid_for_purchase,
                validationErrors: purchase_validation_errors
            };
        }
    });
});
define('QuoteToSalesOrder.Model', [
    'Transaction.Model',
    'QuoteToSalesOrderValidator.Model',
    'Models.Init',
    'Utils',
    'ExternalPayment.Model',
    'underscore'
], function (TransactionModel, QuoteToSalesOrderValidatorModel, ModelsInit, Utils, ExternalPayment, _) {
    'use strict';
    var requireQuoteIdError = {
        status: 500,
        code: 'ERR_MISSING_QUOTEID_PARAMETER',
        message: 'Sorry, the quoteid parameter is require to use this operation.'
    };
    return TransactionModel.extend({
        name: 'QuoteToSalesOrder',
        getTransactionRecord: function () {
            if (this.record) {
                return this.record;
            }
            if (this.salesorderId && this.salesorderId !== 'null' && this.salesorderId !== 'undefined') {
                return nlapiLoadRecord('salesorder', this.salesorderId);
            }
            var payment_method_list = [], invoice_payment_method = {};
            if (this.data && this.data.paymentmethods) {
                payment_method_list = this.data.paymentmethods;
            }
            invoice_payment_method = _.findWhere(payment_method_list, {
                primary: true,
                type: 'invoice'
            });
            if (!!invoice_payment_method) {
                return nlapiTransformRecord('estimate', this.quoteId, 'salesorder', {
                    recordmode: 'dynamic',
                    customform: this.getInvoiceCustomFormId()
                });
            }
            return nlapiTransformRecord('estimate', this.quoteId, 'salesorder', { recordmode: 'dynamic' });
        },
        getInvoiceCustomFormId: function () {
            return SC.Configuration.quoteToSalesorderWizard.invoiceFormId;
        },
        getExtraRecordFields: function () {
            this.result.quoteDetails = this.getQuoteDetailsForValidation(this.quoteId);
            if (!this.skipQuoteValidation) {
                var quote_validation = QuoteToSalesOrderValidatorModel.getQuoteToSalesOrderValidation(_.extend({}, this.result, this.result.quoteDetails));
                if (!quote_validation.isPurchasable) {
                    throw QuoteToSalesOrderValidatorModel.invalidQuoteError;
                }
            }
            if (this.record.getFieldValue('paymentmethod') && this.record.getFieldValue('paymenteventholdreason') !== 'FORWARD_REQUESTED') {
                this.result.confirmation = { internalid: this.salesorderId };
                this.postSubmitRecord(this.result.confirmation, this.record);
            }
        },
        getQuoteDetailsForValidation: function (quote_id) {
            var basic_quote_values = nlapiLookupField('estimate', quote_id, [
                'entitystatus',
                'status',
                'statusRef',
                'tranid'
            ]) || {};
            return {
                entitystatus: { id: basic_quote_values.entitystatus },
                statusRef: basic_quote_values.statusRef,
                internalid: quote_id,
                salesrep: this.getSalesRep(quote_id),
                tranid: basic_quote_values.tranid
            };
        },
        getSalesRep: function (quote_id) {
            var salesrep = {};
            var search_result = nlapiLookupField('estimate', quote_id, [
                'salesrep.phone',
                'salesrep.email',
                'salesrep.entityid',
                'salesrep.mobilephone',
                'salesrep.fax',
                'salesrep'
            ]);
            if (search_result) {
                salesrep.phone = search_result['salesrep.phone'];
                salesrep.email = search_result['salesrep.email'];
                salesrep.fullname = search_result['salesrep.entityid'];
                salesrep.name = search_result['salesrep.entityid'];
                salesrep.mobilephone = search_result['salesrep.mobilephone'];
                salesrep.fax = search_result['salesrep.fax'];
                salesrep.internalid = search_result.salesrep;
            }
            return salesrep;
        },
        get: function (salesorder_id, quote_id, skip_quote_validation) {
            if (!quote_id) {
                throw requireQuoteIdError;
            }
            this.salesorderId = salesorder_id;
            this.skipQuoteValidation = skip_quote_validation ? skip_quote_validation : true;
            this.quoteId = quote_id;
            return TransactionModel.get.call(this, 'salesorder', 'tempid');
        },
        getCreatedFrom: function () {
            var created_from_internalid = nlapiLookupField(this.result.recordtype, this.salesorderId, 'createdfrom');
            var recordtype = created_from_internalid ? Utils.getTransactionType(created_from_internalid) : '';
            var tranid = recordtype ? nlapiLookupField(recordtype, created_from_internalid, 'tranid') : '';
            this.result.createdfrom = {
                internalid: created_from_internalid,
                name: nlapiLookupField(this.result.recordtype, this.salesorderId, 'createdfrom', true) || '',
                recordtype: recordtype,
                tranid: tranid
            };
        },
        update: function (salesorder_id, quote_id, data) {
            this.quoteId = quote_id;
            this.salesorderId = salesorder_id;
            return TransactionModel.update.call(this, 'salesorder', quote_id, data);
        },
        setLines: function () {
        },
        getRecordAddresses: function () {
            this.result.addresses = {};
            this.result.listAddresseByIdTmp = {};
            for (var i = 1; i <= this.record.getLineItemCount('iladdrbook'); i++) {
                this.result.listAddresseByIdTmp[this.record.getLineItemValue('iladdrbook', 'iladdrinternalid', i)] = this.addAddress({
                    internalid: this.record.getLineItemValue('iladdrbook', 'iladdrinternalid', i),
                    country: this.record.getLineItemValue('iladdrbook', 'iladdrshipcountry', i),
                    state: this.record.getLineItemValue('iladdrbook', 'iladdrshipstate', i),
                    city: this.record.getLineItemValue('iladdrbook', 'iladdrshipcity', i),
                    zip: this.record.getLineItemValue('iladdrbook', 'iladdrshipzip', i),
                    addr1: this.record.getLineItemValue('iladdrbook', 'iladdrshipaddr1', i),
                    addr2: this.record.getLineItemValue('iladdrbook', 'iladdrshipaddr2', i),
                    attention: this.record.getLineItemValue('iladdrbook', 'iladdrshipattention', i),
                    addressee: this.record.getLineItemValue('iladdrbook', 'iladdrshipaddressee', i),
                    phone: this.record.getLineItemValue('iladdrbook', 'iladdrshipphone', i)
                });
            }
            this.result.shipaddress = this.addAddress({
                internalid: this.record.getFieldValue('shipaddresslist'),
                country: this.record.getFieldValue('shipcountry'),
                state: this.record.getFieldValue('shipstate'),
                city: this.record.getFieldValue('shipcity'),
                zip: this.record.getFieldValue('shipzip'),
                addr1: this.record.getFieldValue('shipaddr1'),
                addr2: this.record.getFieldValue('shipaddr2'),
                attention: this.record.getFieldValue('shipattention'),
                addressee: this.record.getFieldValue('shipaddressee'),
                phone: this.record.getFieldValue('shipphone')
            });
            this.result.billaddress = this.addAddress({
                internalid: this.record.getFieldValue('billaddresslist'),
                country: this.record.getFieldValue('billcountry'),
                state: this.record.getFieldValue('billstate'),
                city: this.record.getFieldValue('billcity'),
                zip: this.record.getFieldValue('billzip'),
                addr1: this.record.getFieldValue('billaddr1'),
                addr2: this.record.getFieldValue('billaddr2'),
                attention: this.record.getFieldValue('billattention'),
                addressee: this.record.getFieldValue('billaddressee'),
                phone: this.record.getFieldValue('billphone')
            });
        },
        getAddressInternalId: function (address) {
            if (_.isNaN(parseInt(address.internalid, 10))) {
                return TransactionModel.getAddressInternalId.apply(this, arguments);
            }
            return address.internalid;
        },
        postSubmitRecord: function (confirmation_result, record) {
            var created_salesorder = !_.isUndefined(record) ? record : nlapiLoadRecord('salesorder', confirmation_result.internalid);
            confirmation_result.tranid = created_salesorder.getFieldValue('tranid');
            confirmation_result.confirmationnumber = created_salesorder.getFieldValue('tranid');
            if (confirmation_result.isexternal) {
                confirmation_result.redirecturl = ExternalPayment.generateUrl(confirmation_result.internalid, 'salesorder');
                confirmation_result.statuscode = created_salesorder.getFieldValue('paymenteventholdreason') === 'FORWARD_REQUESTED' ? 'redirect' : '';
                confirmation_result.paymenteventholdreason = created_salesorder.getFieldValue('paymenteventholdreason');
            }
            return confirmation_result;
        },
        submit: function () {
            if (!this.record) {
                throw new Error('Please load a record before calling QuoteToSalesOrder.Model.Submit method.');
            }
            this.preSubmitRecord();
            var new_record_id, is_payment_method_external = _.findWhere(this.data.paymentmethods, { isexternal: 'T' });
            if (is_payment_method_external) {
                new_record_id = nlapiSubmitRecord(this.record, false, true);
            } else {
                new_record_id = nlapiSubmitRecord(this.record);
            }
            var result = {
                internalid: new_record_id,
                isexternal: is_payment_method_external
            };
            return this.postSubmitRecord(result);
        }
    });
});
define('QuoteToSalesOrder.ServiceController', [
    'ServiceController',
    'Models.Init',
    'QuoteToSalesOrder.Model'
], function (ServiceController, ModelsInit, QuoteToSalesOrderModel) {
    'use strict';
    return ServiceController.extend({
        name: 'QuoteToSalesOrder.ServiceController',
        options: { common: { checkLoggedInCheckout: true } },
        get: function () {
            var quote_id = this.request.getParameter('quoteid'), salesorder_id = this.request.getParameter('salesorderid'), skip_validation = this.request.getParameter('skipvalidation');
            return QuoteToSalesOrderModel.get(salesorder_id, quote_id, skip_validation);
        },
        post: function () {
            var quote_id = this.request.getParameter('quoteid'), salesorder_id = this.request.getParameter('salesorderid');
            QuoteToSalesOrderModel.update(salesorder_id, quote_id, this.data);
            var order_info = QuoteToSalesOrderModel.get(salesorder_id, quote_id, true);
            order_info.confirmation = QuoteToSalesOrderModel.submit();
            order_info.internalid = order_info.confirmation.internalid;
            return order_info;
        },
        put: function () {
            var quote_id = this.request.getParameter('quoteid'), salesorder_id = this.request.getParameter('salesorderid');
            QuoteToSalesOrderModel.update(salesorder_id, quote_id, this.data);
            return QuoteToSalesOrderModel.get(salesorder_id, quote_id, true);
        }
    });
});
define('CMSadapter.Model', [
    'SC.Model',
    'SiteSettings.Model'
], function (SCModel, SiteSettingsModel) {
    'use strict';
    return SCModel.extend({
        name: 'CMSadapter',
        getPages: function (baseUrl) {
            try {
                var siteSettings = SiteSettingsModel.get();
                var cmsRequestT0 = new Date().getTime();
                var cmsPagesHeader = { 'Accept': 'application/json' };
                var cmsPagesUrl = baseUrl + '/api/cms/pages?site_id=' + siteSettings.siteid + '&c=' + nlapiGetContext().getCompany() + '&{}';
                var cmsPagesResponse = nlapiRequestURL(cmsPagesUrl, null, cmsPagesHeader);
                var cmsPagesResponseBody = cmsPagesResponse.getBody();
                var data = {};
                if (cmsPagesResponse.getContentType().indexOf('json') !== -1 && cmsPagesResponse.getCode() === 200) {
                    data.pages = JSON.parse(cmsPagesResponseBody);
                } else {
                    data.error = cmsPagesResponseBody;
                }
                data._debug_requestTime = new Date().getTime() - cmsRequestT0;
                return data;
            } catch (e) {
                return { error: e };
            }
        }
    });
});
define('Invoice.Model', [
    'Application',
    'Utils',
    'Transaction.Model',
    'underscore'
], function (Application, Utils, TransactionModel, _) {
    'use strict';
    return TransactionModel.extend({
        name: 'Invoice',
        setExtraListColumns: function () {
            if (this.isMultiCurrency) {
                this.columns.amount_remaining = new nlobjSearchColumn('formulanumeric').setFormula('{amountremaining} / {exchangerate}');
            } else {
                this.columns.amount_remaining = new nlobjSearchColumn('amountremaining');
            }
            this.columns.closedate = new nlobjSearchColumn('closedate');
            this.columns.duedate = new nlobjSearchColumn('duedate');
        },
        setExtraListFilters: function () {
            var status = this.data.status;
            if (status) {
                var value = null;
                switch (status) {
                case 'open':
                    value = 'CustInvc:A';
                    break;
                case 'paid':
                    value = 'CustInvc:B';
                    break;
                }
                if (value) {
                    this.filters.status_operator = 'and';
                    this.filters.status = [
                        'status',
                        'anyof',
                        value
                    ];
                }
            }
        },
        mapListResult: function (result, record) {
            var due_date = record.getValue('duedate'), close_date = record.getValue('closedate'), transaction_date = record.getValue('trandate'), due_date_millisenconds = !!due_date ? nlapiStringToDate(due_date).getTime() : new Date().getTime(), due_in_milliseconds = due_date_millisenconds - this.now;
            result.amountremaining = Utils.toCurrency(record.getValue(this.columns.amount_remaining));
            result.amountremaining_formatted = Utils.formatCurrency(record.getValue(this.columns.amount_remaining));
            result.closedate = close_date;
            result.closedateInMilliseconds = close_date ? nlapiStringToDate(close_date).getTime() : 0;
            result.tranDateInMilliseconds = transaction_date ? nlapiStringToDate(transaction_date).getTime() : 0;
            result.duedate = due_date;
            result.dueinmilliseconds = due_in_milliseconds;
            result.isOverdue = due_in_milliseconds <= 0 && -1 * due_in_milliseconds / 1000 / 60 / 60 / 24 >= 1;
            return result;
        },
        getExtraRecordFields: function () {
            this.getAdjustments();
            this.getSalesRep();
            this.result.purchasenumber = this.record.getFieldValue('otherrefnum');
            this.result.dueDate = this.record.getFieldValue('duedate');
            this.result.amountDue = Utils.toCurrency(this.record.getFieldValue('amountremainingtotalbox'));
            this.result.amountDue_formatted = Utils.formatCurrency(this.record.getFieldValue('amountremainingtotalbox'));
        },
        postGet: function () {
            this.result.lines = _.reject(this.result.lines, function (line) {
                return line.quantity === 0;
            });
        },
        getStatus: function () {
            this.result.status = {
                internalid: nlapiLookupField(this.result.recordtype, this.result.internalid, 'status'),
                name: nlapiLookupField(this.result.recordtype, this.result.internalid, 'status', true)
            };
        },
        getCreatedFrom: function () {
            var created_from_internalid = nlapiLookupField(this.result.recordtype, this.result.internalid, 'createdfrom'), recordtype = created_from_internalid ? Utils.getTransactionType(created_from_internalid) : '', tranid = recordtype ? nlapiLookupField(recordtype, created_from_internalid, 'tranid') : '';
            this.result.createdfrom = {
                internalid: created_from_internalid,
                name: nlapiLookupField(this.result.recordtype, this.result.internalid, 'createdfrom', true) || '',
                recordtype: recordtype,
                tranid: tranid
            };
        }
    });
});
define('Invoice.ServiceController', [
    'ServiceController',
    'Invoice.Model'
], function (ServiceController, InvoiceModel) {
    'use strict';
    return ServiceController.extend({
        name: 'Invoice.ServiceController',
        options: {
            common: {
                requireLogin: true,
                requirePermissions: {
                    operator: 'or',
                    list: [
                        'transactions.tranFind.1',
                        'transactions.tranCustInvc.1'
                    ]
                }
            }
        },
        get: function () {
            var id = this.request.getParameter('internalid'), status = this.request.getParameter('status'), page = this.request.getParameter('page');
            return id ? InvoiceModel.get('invoice', id) : InvoiceModel.list({
                types: 'CustInvc',
                status: status,
                page: page
            });
        }
    });
});
define('Transaction.ServiceController', [
    'ServiceController',
    'Transaction.Model'
], function (ServiceController, TransactionModel) {
    'use strict';
    return ServiceController.extend({
        name: 'Transaction.ServiceController',
        options: { common: { requireLogin: true } },
        get: function () {
            var id = this.request.getParameter('internalid'), record_type = this.request.getParameter('recordtype');
            if (id && record_type) {
                return TransactionModel.get(record_type, id);
            } else {
                return TransactionModel.list({
                    filter: this.request.getParameter('filter'),
                    order: this.request.getParameter('order'),
                    sort: this.request.getParameter('sort'),
                    from: this.request.getParameter('from'),
                    to: this.request.getParameter('to'),
                    page: this.request.getParameter('page') || 1,
                    types: this.request.getParameter('types'),
                    createdfrom: this.request.getParameter('createdfrom')
                });
            }
        }
    });
});
define('Location.Model', [
    'SC.Model',
    'Application',
    'Utils',
    'underscore'
], function (SCModel, Application, Utils, _) {
    'use strict';
    return SCModel.extend({
        name: 'Location',
        columns: {
            'address1': new nlobjSearchColumn('address1'),
            'address2': new nlobjSearchColumn('address2'),
            'address3': new nlobjSearchColumn('address3'),
            'city': new nlobjSearchColumn('city'),
            'country': new nlobjSearchColumn('country'),
            'state': new nlobjSearchColumn('state'),
            'internalid': new nlobjSearchColumn('internalid'),
            'isinactive': new nlobjSearchColumn('isinactive'),
            'isoffice': new nlobjSearchColumn('isoffice'),
            'makeinventoryavailable': new nlobjSearchColumn('makeinventoryavailable'),
            'makeinventoryavailablestore': new nlobjSearchColumn('makeinventoryavailablestore'),
            'namenohierarchy': new nlobjSearchColumn('namenohierarchy'),
            'phone': new nlobjSearchColumn('phone'),
            'tranprefix': new nlobjSearchColumn('tranprefix'),
            'zip': new nlobjSearchColumn('zip'),
            'latitude': new nlobjSearchColumn('latitude'),
            'longitude': new nlobjSearchColumn('longitude'),
            'locationtype:': new nlobjSearchColumn('locationtype')
        },
        list: function (data) {
            return this.search(data);
        },
        get: function (data) {
            this.result = {};
            if (data.internalid) {
                var search_results = this.search(data);
                this.result = search_results[0];
            }
            return this.result;
        },
        search: function (data) {
            var result = {}, records = [], self = this;
            this.filters = [];
            this.data = data;
            this.filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
            if (this.data.locationtype) {
                var locationtype = _.isArray(this.data.locationtype) ? this.data.locationtype : this.data.locationtype.split(',');
                this.filters.push(new nlobjSearchFilter('locationtype', null, 'anyof', locationtype));
            }
            if (this.data.latitude && this.data.longitude) {
                this.filters.push(new nlobjSearchFilter('latitude', null, 'isnotempty'));
                this.filters.push(new nlobjSearchFilter('longitude', null, 'isnotempty'));
                var formula = this.getDistanceFormulates();
                if (this.data.radius) {
                    this.filters.push(new nlobjSearchFilter('formulanumeric', null, 'lessthan', this.data.radius).setFormula(formula));
                }
                this.filters.push(new nlobjSearchFilter('formulanumeric', null, 'noneof', '@NONE@'));
                this.columns.distance = new nlobjSearchColumn('formulanumeric').setFormula(formula).setFunction('roundToTenths');
            }
            if (this.data.internalid) {
                var internalid = _.isArray(this.data.internalid) ? this.data.internalid : this.data.internalid.split(',');
                this.filters.push(new nlobjSearchFilter('internalid', null, 'anyof', internalid));
            }
            if (this.data.sort) {
                _.each(this.data.sort.split(','), function (column_name) {
                    if (self.columns[column_name]) {
                        self.columns[column_name].setSort(self.data.order >= 0);
                    }
                });
            }
            if (this.data.page === 'all') {
                this.search_results = Application.getAllSearchResults('location', _.values(this.filters), _.values(this.columns));
            } else {
                this.search_results = Application.getPaginatedSearchResults({
                    record_type: 'location',
                    filters: _.values(this.filters),
                    columns: _.values(this.columns),
                    page: this.data.page || 1,
                    results_per_page: this.data.results_per_page || 1
                });
            }
            _.each((this.data.page === 'all' ? this.search_results : this.search_results.records) || [] || [], function (record) {
                records.push(self.getRecordValues(record));
            });
            if (this.data.page === 'all' || this.data.internalid) {
                result = records;
            } else {
                result = this.search_results;
                result.records = records;
            }
            return result;
        },
        getServiceHours: function (id) {
            if (SC.Configuration.storeLocator.customServiceHours) {
                try {
                    return nlapiLookupField('location', id, SC.Configuration.storeLocator.customServiceHours);
                } catch (error) {
                    return '';
                }
            }
            return '';
        },
        getFriendlyName: function (id) {
            if (SC.Configuration.storeLocator.customFriendlyName) {
                try {
                    return nlapiLookupField('location', id, SC.Configuration.storeLocator.customFriendlyName);
                } catch (error) {
                    return '';
                }
            }
            return '';
        },
        getDistanceFormulates: function () {
            var PI = Math.PI, R = SC.Configuration.storeLocator.distanceUnit === 'mi' ? 3959 : 6371, lat = this.data.latitude * PI / 180, lon = this.data.longitude * PI / 180, formula = R + ' * (2 * ATAN2(SQRT((SIN((' + lat + '- ({latitude} * ' + PI + ' / 180)) / 2) *' + 'SIN((' + lat + '- ({latitude} * ' + PI + ' / 180)) / 2) + ' + 'COS(({latitude} * ' + PI + ' / 180)) * COS(' + lat + ') *' + 'SIN((' + lon + '- ({longitude} * ' + PI + ' / 180)) /2) *' + 'SIN((' + lon + '- ({longitude} * ' + PI + ' / 180)) /2))),' + 'SQRT(1 - (SIN((' + lat + '- ({latitude} * ' + PI + ' / 180)) / 2) *' + 'SIN((' + lat + '- ({latitude} * ' + PI + ' / 180)) / 2) +' + 'COS(({latitude} * ' + PI + ' / 180)) * COS(' + lat + ') * ' + 'SIN((' + lon + '- ({longitude} * ' + PI + ' / 180)) /2) * ' + 'SIN((' + lon + '- ({longitude} * ' + PI + ' / 180)) /2)))))';
            return formula;
        },
        getRecordValues: function (record) {
            var map_result = {}, id = record.getValue('internalid'), friendlyName = this.getFriendlyName(id);
            map_result.recordtype = record.getRecordType();
            map_result.internalid = id;
            map_result.address1 = record.getValue('address1');
            map_result.address2 = record.getValue('address2');
            map_result.address3 = record.getValue('address3');
            map_result.city = record.getValue('city');
            map_result.country = record.getValue('country');
            map_result.state = record.getValue('state');
            map_result.isoffice = record.getValue('isoffice');
            map_result.makeinventoryavailable = record.getValue('makeinventoryavailable');
            map_result.makeinventoryavailablestore = record.getValue('makeinventoryavailablestore');
            map_result.name = friendlyName !== '' ? friendlyName : record.getValue('namenohierarchy');
            map_result.servicehours = this.getServiceHours(id);
            map_result.phone = record.getValue('phone');
            map_result.zip = record.getValue('zip');
            map_result.location = {
                latitude: record.getValue('latitude'),
                longitude: record.getValue('longitude')
            };
            map_result.locationtype = record.getValue('locationtype');
            if (this.data.latitude && this.data.longitude) {
                var distance = Math.round(record.getValue('formulanumeric') * 10) / 10;
                if (!_.isUndefined(distance)) {
                    map_result.distance = Math.round(record.getValue('formulanumeric') * 10) / 10;
                    map_result.distanceunit = SC.Configuration.storeLocator.distanceUnit;
                }
            }
            return map_result;
        }
    });
});
define('Location.ServiceController', [
    'ServiceController',
    'Location.Model'
], function (ServiceController, LocationModel) {
    'use strict';
    return ServiceController.extend({
        name: 'Location.ServiceController',
        get: function () {
            var id = this.request.getParameter('internalid');
            if (id) {
                return LocationModel.get({ internalid: id });
            } else {
                return LocationModel.list({
                    'latitude': this.request.getParameter('latitude'),
                    'longitude': this.request.getParameter('longitude'),
                    'radius': this.request.getParameter('radius'),
                    'sort': this.request.getParameter('sort'),
                    'page': this.request.getParameter('page'),
                    'locationtype': this.request.getParameter('locationtype'),
                    'results_per_page': this.request.getParameter('results_per_page')
                });
            }
        }
    });
});
define('StoreLocator.Model', [
    'SC.Model',
    'Application',
    'Utils',
    'Location.Model'
], function (SCModel, Application, Utils, LocationModel) {
    'use strict';
    return LocationModel.extend({
        name: 'StoreLocator',
        list: function (data) {
            data.locationtype = data.locationtype || SC.Configuration.storeLocator.defaultTypeLocations;
            var result = this.search(data);
            if (!result.length && !result.recordsPerPage) {
                data.radius = undefined;
                data.results_per_page = data.results_per_page || SC.Configuration.storeLocator.defaultQuantityLocations;
                data.page = 1;
                result = this.search(data);
            }
            return result;
        }
    });
});
define('StoreLocator.ServiceController', [
    'ServiceController',
    'StoreLocator.Model'
], function (ServiceController, StoreLocatorModel) {
    'use strict';
    return ServiceController.extend({
        name: 'Location.ServiceController',
        get: function () {
            var id = this.request.getParameter('internalid');
            if (id) {
                return StoreLocatorModel.get({ internalid: id });
            } else {
                return StoreLocatorModel.list({
                    'latitude': this.request.getParameter('latitude'),
                    'longitude': this.request.getParameter('longitude'),
                    'radius': this.request.getParameter('radius'),
                    'sort': this.request.getParameter('sort'),
                    'page': this.request.getParameter('page'),
                    'locationtype': this.request.getParameter('locationtype'),
                    'results_per_page': this.request.getParameter('results_per_page')
                });
            }
        }
    });
});
define('SCA', [
    'Application',
    'Account.ForgotPassword.ServiceController',
    'Account.Login.ServiceController',
    'Account.Register.ServiceController',
    'Account.RegisterAsGuest.ServiceController',
    'Account.ResetPassword.ServiceController',
    'Address.ServiceController',
    'Case.Fields.ServiceController',
    'Case.ServiceController',
    'Categories.ServiceController',
    'CreditCard.ServiceController',
    'CreditMemo.ServiceController',
    'Deposit.ServiceController',
    'DepositApplication.ServiceController',
    'LiveOrder.GiftCertificate.ServiceController',
    'LiveOrder.Line.ServiceController',
    'LiveOrder.ServiceController',
    'LivePayment.ServiceController',
    'Newsletter.ServiceController',
    'Payment.ServiceController',
    'ReorderItems.ServiceController',
    'OrderHistory.ServiceController',
    'PrintStatement.ServiceController',
    'ProductList.ServiceController',
    'ProductList.Item.ServiceController',
    'ProductReviews.ServiceController',
    'Profile.ServiceController',
    'SiteSettings.ServiceController',
    'Quote.ServiceController',
    'Receipt.ServiceController',
    'ReturnAuthorization.ServiceController',
    'TransactionHistory.ServiceController',
    'ReleaseMetadata',
    'QuoteToSalesOrderValidator.Model',
    'QuoteToSalesOrder.ServiceController',
    'CMSadapter.Model',
    'Invoice.ServiceController',
    'Transaction.ServiceController',
    'Location.ServiceController',
    'StoreLocator.ServiceController',
    'ExternalPayment.Model'
], function () {
});
ConfigurationManifestDefaults = {
	"bronto": {
		"accountId": "",
		"adapterUrl": "https://cdn.bronto.com/netsuite/configure.js"
	},
	"addToCartBehavior": "showCartConfirmationModal",
	"addToCartFromFacetsView": false,
	"promocodes": {
		"allowMultiples": false
	},
	"cases": {
		"defaultValues": {
			"statusStart": {
				"id": "1"
			},
			"statusClose": {
				"id": "5"
			},
			"origin": {
				"id": "-5"
			}
		}
	},
	"categories": {
		"menuLevel": 3,
		"addToNavigationTabs": true,
		"sideMenu": {
			"sortBy": "sequencenumber",
			"additionalFields": [],
			"uncollapsible": false,
			"showMax": 5,
			"collapsed": false
		},
		"subCategories": {
			"sortBy": "sequencenumber",
			"fields": []
		},
		"category": {
			"fields": []
		},
		"breadcrumb": {
			"fields": []
		},
		"menu": {
			"sortBy": "sequencenumber",
			"fields": []
		}
	},
	"checkoutApp": {
		"skipLogin": false,
		"checkoutSteps": "Standard",
		"paypalLogo": "https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg",
		"invoiceTermsAndConditions": "<h4>Invoice Terms and Conditions</h4><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>"
	},
	"isMultiShippingEnabled": false,
	"autoPopulateNameAndEmail": true,
	"forms": {
		"loginAsGuest": {
			"showName": false,
			"showEmail": true
		},
		"address": {
			"showAddressLineTwo": true
		}
	},
	"cms": {
		"useCMS": true
	},
	"defaultSearchUrl": "search",
	"imageNotAvailable": "img/no_image_available.jpeg",
	"imageSizeMapping": [
		{
			"id": "thumbnail",
			"value": "thumbnail"
		},
		{
			"id": "main",
			"value": "main"
		},
		{
			"id": "tinythumb",
			"value": "tinythumb"
		},
		{
			"id": "zoom",
			"value": "zoom"
		},
		{
			"id": "fullscreen",
			"value": "fullscreen"
		},
		{
			"id": "homeslider",
			"value": "homeslider"
		},
		{
			"id": "homecell",
			"value": "homecell"
		}
	],
	"searchApiMasterOptions": [
		{
			"id": "Facets",
			"fieldset": "search",
			"include": "facets"
		},
		{
			"id": "itemDetails",
			"fieldset": "details",
			"include": "facets"
		},
		{
			"id": "relatedItems",
			"fieldset": "relateditems_details"
		},
		{
			"id": "correlatedItems",
			"fieldset": "correlateditems_details"
		},
		{
			"id": "merchandisingZone"
		},
		{
			"id": "typeAhead",
			"fieldset": "typeahead"
		},
		{
			"id": "itemsSearcher",
			"fieldset": "itemssearcher"
		}
	],
	"defaultPaginationSettings": {
		"showPageList": true,
		"pagesToShow": 9,
		"showPageIndicator": false
	},
	"defaultPaginationSettingsPhone": {
		"showPageList": false,
		"pagesToShow": 9,
		"showPageIndicator": true
	},
	"defaultPaginationSettingsTablet": {
		"showPageList": true,
		"pagesToShow": 4,
		"showPageIndicator": true
	},
	"paymentmethods": [
		{
			"key": "5,5,1555641112",
			"regex": "^4[0-9]{12}(?:[0-9]{3})?$",
			"description": "VISA"
		},
		{
			"key": "4,5,1555641112",
			"regex": "^5[1-5][0-9]{14}$",
			"description": "Master Card"
		},
		{
			"key": "6,5,1555641112",
			"regex": "^3[47][0-9]{13}$",
			"description": "American Express"
		},
		{
			"key": "3,5,1555641112",
			"regex": "^6(?:011|5[0-9]{2})[0-9]{12}$",
			"description": "Discover"
		},
		{
			"key": "16,5,1555641112",
			"regex": "^(?:5[0678]\\\\d\\\\d|6304|6390|67\\\\d\\\\d)\\\\d{8,15}$",
			"description": "Maestro"
		},
		{
			"key": "17,3,1555641112",
			"regex": "",
			"description": "This company allows both private individuals and businesses to accept payments over the Internet"
		}
	],
	"cookieWarningBanner": {
		"closable": true,
		"saveInCookie": true,
		"anchorText": "Learn More",
		"message": "To provide a better shopping experience, our website uses cookies. Continuing use of the site implies consent."
	},
	"creditCard": {
		"showCreditCardHelp": true,
		"creditCardHelpTitle": "Enter the title of the credit card help link. This title is displayed only if the Show Credit Card Help property is enabled.",
		"imageCvvAllCards": "img/cvv_all_cards.jpg",
		"imageCvvAmericanCard": "img/cvv_american_card.jpg",
		"creditCardShowSecureInfo": "<p class=\"order-wizard-paymentmethod-creditcard-secure-info\">We take all reasonable steps to protect our customers personal information against loss, misuse and alteration. We use encryption technology whenever receiving and transferring your personal information on our site. <strong>When you are viewing a page that is requesting personal information, the URL in the address bar at top of your browser will start with \"https\". </strong> This indicates your transaction session is secured through Secure Sockets Layer (SSL). If the web page you are viewing does not start with \"https\", please contact us.</p>"
	},
	"facetsSeoLimits": {
		"options": [
			"page",
			"keywords"
		]
	},
	"facets": [
		{
			"id": "pricelevel5",
			"name": "Price",
			"priority": 10,
			"behavior": "range",
			"template": "facets_faceted_navigation_item_range.tpl",
			"uncollapsible": true,
			"titleToken": "Price $(1) - $(0)",
			"titleSeparator": ", ",
			"parser": "currency"
		}
	],
	"facetsColorPalette": [
		{
			"paletteId": "default",
			"colorName": "black",
			"colorValue": "#212121"
		},
		{
			"paletteId": "default",
			"colorName": "gray",
			"colorValue": "#9c9c9c"
		},
		{
			"paletteId": "default",
			"colorName": "grey",
			"colorValue": "#9c9c9c"
		},
		{
			"paletteId": "default",
			"colorName": "white",
			"colorValue": "#fff"
		},
		{
			"paletteId": "default",
			"colorName": "brown",
			"colorValue": "#804d3b"
		},
		{
			"paletteId": "default",
			"colorName": "beige",
			"colorValue": "#eedcbe"
		},
		{
			"paletteId": "default",
			"colorName": "blue",
			"colorValue": "#0f5da3"
		},
		{
			"paletteId": "default",
			"colorName": "light-blue",
			"colorValue": "#8fdeec"
		},
		{
			"paletteId": "default",
			"colorName": "purple",
			"colorValue": "#9b4a97"
		},
		{
			"paletteId": "default",
			"colorName": "lilac",
			"colorValue": "#ceadd0"
		},
		{
			"paletteId": "default",
			"colorName": "red",
			"colorValue": "#f63440"
		},
		{
			"paletteId": "default",
			"colorName": "pink",
			"colorValue": "#ffa5c1"
		},
		{
			"paletteId": "default",
			"colorName": "orange",
			"colorValue": "#ff5200"
		},
		{
			"paletteId": "default",
			"colorName": "peach",
			"colorValue": "#ffcc8c"
		},
		{
			"paletteId": "default",
			"colorName": "yellow",
			"colorValue": "#ffde00"
		},
		{
			"paletteId": "default",
			"colorName": "light-yellow",
			"colorValue": "#ffee7a"
		},
		{
			"paletteId": "default",
			"colorName": "green",
			"colorValue": "#00af43"
		},
		{
			"paletteId": "default",
			"colorName": "lime",
			"colorValue": "#c3d600"
		},
		{
			"paletteId": "default",
			"colorName": "teal",
			"colorValue": "#00ab95"
		},
		{
			"paletteId": "default",
			"colorName": "aqua",
			"colorValue": "#28e1c5"
		},
		{
			"paletteId": "default",
			"colorName": "burgandy",
			"colorValue": "#9c0633"
		},
		{
			"paletteId": "default",
			"colorName": "navy",
			"colorValue": "#002d5d"
		}
	],
	"lightColors": [
		"white"
	],
	"facetDelimiters": {
		"betweenFacetNameAndValue": "/",
		"betweenDifferentFacets": "/",
		"betweenDifferentFacetsValues": ",",
		"betweenRangeFacetsValues": "to",
		"betweenFacetsAndOptions": "?",
		"betweenOptionNameAndValue": "=",
		"betweenDifferentOptions": "&"
	},
	"footer": {
		"navigationLinks": [
			{
				"text": "Link a",
				"href": "#"
			},
			{
				"text": "Link b",
				"href": "#"
			},
			{
				"text": "Link c",
				"href": "#"
			}
		]
	},
	"tracking": {
		"googleAdWordsConversion": {
			"id": "",
			"value": 0,
			"label": ""
		},
		"googleTagManager": {
			"id": "",
			"dataLayerName": "dataLayer"
		},
		"googleUniversalAnalytics": {
			"propertyID": "",
			"domainName": "",
			"domainNameSecure": ""
		}
	},
	"header": {
		"notShowCurrencySelector": false,
		"logoUrl": "img/SCA_Logo.png"
	},
	"home": {
		"carouselImages": [
			"img/carousel-home-1.jpg",
			"img/carousel-home-2.jpg",
			"img/carousel-home-3.jpg"
		],
		"bottomBannerImages": [
			"img/banner-bottom-home-1.jpg",
			"img/banner-bottom-home-2.jpg",
			"img/banner-bottom-home-3.jpg"
		]
	},
	"multiImageOption": "",
	"listHeader": {
		"filterRangeQuantityDays": 0
	},
	"newsletter": {
		"genericFirstName": "unknown",
		"genericLastName": "unknown",
		"companyName": "unknown"
	},
	"transactionRecordOriginMapping": [
		{
			"id": "backend",
			"origin": 0,
			"name": "",
			"detailedName": "Purchase"
		},
		{
			"id": "inStore",
			"origin": 1,
			"name": "In Store",
			"detailedName": "In Store Purchase"
		},
		{
			"id": "online",
			"origin": 2,
			"name": "Online",
			"detailedName": "Online Purchase"
		}
	],
	"overview": {
		"customerSupportURL": "",
		"homeBanners": [],
		"homeRecentOrdersQuantity": 3
	},
	"productList": {
		"additionEnabled": true,
		"loginRequired": true,
		"listTemplates": [
			{
				"templateId": "1",
				"name": "My list",
				"description": "An example predefined list",
				"scopeId": 2,
				"scopeName": "private"
			},
			{
				"templateId": "2",
				"name": "Saved for Later",
				"description": "This is for the cart saved for later items",
				"scopeId": 2,
				"scopeName": "private",
				"typeId": "2",
				"typeName": "later"
			},
			{
				"templateid": "3",
				"name": "Request a Quote",
				"description": "This is for the request a quote items",
				"scopeId": 2,
				"scopeName": "private",
				"typeId": "4",
				"typeName": "quote"
			}
		],
		"templates": [
			{
				"id": "list",
				"name": "List",
				"columns": 1,
				"icon": "list-header-view-icon-list",
				"isDefault": true
			},
			{
				"id": "condensed",
				"name": "Condensed",
				"columns": 1,
				"icon": "list-header-view-icon-condensed"
			}
		]
	},
	"productReviews": {
		"maxFlagsCount": 2,
		"loginRequired": false,
		"flaggedStatus": 4,
		"approvedStatus": "2",
		"pendingApprovalStatus": 1,
		"resultsPerPage": 25,
		"maxRate": 5,
		"computeOverall": true,
		"filterOptions": [
			{
				"id": "all",
				"name": "All Reviews",
				"params": "{}",
				"isDefault": true
			},
			{
				"id": "5star",
				"name": "5 Star Reviews",
				"params": "{\"rating\": 5}",
				"isDefault": false
			},
			{
				"id": "4star",
				"name": "4 Star Reviews",
				"params": "{\"rating\": 4}",
				"isDefault": false
			},
			{
				"id": "3star",
				"name": "3 Star Reviews",
				"params": "{\"rating\": 3}",
				"isDefault": false
			},
			{
				"id": "2star",
				"name": "2 Star Reviews",
				"params": "{\"rating\": 2}",
				"isDefault": false
			},
			{
				"id": "1star",
				"name": "1 Star Reviews",
				"params": "{\"rating\": 1}",
				"isDefault": false
			}
		],
		"sortOptions": [
			{
				"id": "date",
				"name": "By Date",
				"params": "{\"order\": \"created_on:ASC\"}",
				"isDefault": true
			},
			{
				"id": "rating",
				"name": "By Rating",
				"params": "{\"order\": \"rating:ASC\"}",
				"isDefault": false
			}
		]
	},
	"quote": {
		"daysToExpire": 7,
		"disclaimerSummary": "To place the order please contact <strong>Contact Center</strong> at <strong>(000)-XXX-XXXX</strong> or send an email to <a href=\"mailto:xxxx@xxxx.com\">xxxx@xxxx.com</a>",
		"disclaimer": "For immediate assistance contact <strong>Contact Center</strong> at <strong>(000)-XXX-XXXX</strong> or send an email to <a href=\"mailto:xxxx@xxxx.com\">xxxx@xxxx.com</a>",
		"defaultPhone": "(000)-XXX-XXXX",
		"defaultEmail": "xxxx@xxxx.com",
		"purchaseReadyStatusId": "12"
	},
	"quoteToSalesorderWizard": {
		"invoiceFormId": "89"
	},
	"itemDetails": [
		{
			"name": "Details",
			"contentFromKey": "storedetaileddescription",
			"opened": true,
			"itemprop": "description"
		}
	],
	"itemOptions": [
		{
			"cartOptionId": "custcol13",
			"label": "Color",
			"url": "color",
			"colors": "default",
			"templateSelector": "item_views_option_color.tpl",
			"templateSelected": "item_views_selected_option_color.tpl"
		}
	],
	"recentlyViewedItems": {
		"useCookie": true,
		"numberOfItemsDisplayed": "6"
	},
	"itemsDisplayOptions": [
		{
			"id": "list",
			"name": "List",
			"template": "facets_item_cell_list.tpl",
			"columns": 1,
			"icon": "icon-display-list"
		},
		{
			"id": "table",
			"name": "Table",
			"template": "facets_item_cell_table.tpl",
			"columns": 2,
			"icon": "icon-display-table"
		},
		{
			"id": "grid",
			"name": "Grid",
			"template": "facets_item_cell_grid.tpl",
			"columns": 4,
			"icon": "icon-display-grid",
			"isDefault": true
		}
	],
	"itemsDisplayOptionsPhone": [
		{
			"id": "list",
			"name": "List",
			"template": "facets_item_cell_list_tpl",
			"columns": 1,
			"icon": "icon-display-list"
		},
		{
			"id": "table",
			"name": "Table",
			"template": "facets_item_cell_table_tpl",
			"columns": 2,
			"icon": "icon-display-table",
			"isDefault": true
		}
	],
	"itemsDisplayOptionsTablet": [
		{
			"id": "list",
			"name": "List",
			"template": "facets_item_cell_list.tpl",
			"columns": 1,
			"icon": "icon-display-list"
		},
		{
			"id": "table",
			"name": "Table",
			"template": "facets_item_cell_table.tpl",
			"columns": 2,
			"icon": "icon-display-table"
		},
		{
			"id": "grid",
			"name": "Grid",
			"template": "facets_item_cell_grid.tpl",
			"columns": 4,
			"icon": "icon-display-grid",
			"isDefault": true
		}
	],
	"defaultSearchTitle": "Products",
	"searchPrefs": {
		"maxLength": 40
	},
	"resultsPerPage": [
		{
			"items": 12,
			"name": "Show $(0) products per page"
		},
		{
			"items": 24,
			"name": "Show $(0) products per page",
			"isDefault": true
		},
		{
			"items": 48,
			"name": "Show $(0) products per page"
		}
	],
	"sortOptions": [
		{
			"id": "relevance:asc",
			"name": "Sort by relevance",
			"isDefault": true
		},
		{
			"id": "onlinecustomerprice:asc",
			"name": "Sort by price, low to high",
			"isDefault": false
		},
		{
			"id": "onlinecustomerprice:desc",
			"name": "Sort by price, high to low",
			"isDefault": false
		}
	],
	"sortOptionsPhone": [
		{
			"id": "relevance:asc",
			"name": "Sort by relevance",
			"isDefault": true
		},
		{
			"id": "onlinecustomerprice:asc",
			"name": "Sort by price, low to high",
			"isDefault": false
		},
		{
			"id": "onlinecustomerprice:desc",
			"name": "Sort by price, high to low",
			"isDefault": false
		}
	],
	"sortOptionsTablet": [
		{
			"id": "relevance:asc",
			"name": "Sort by relevance",
			"isDefault": true
		},
		{
			"id": "onlinecustomerprice:asc",
			"name": "Sort by price, low to high",
			"isDefault": false
		},
		{
			"id": "onlinecustomerprice:desc",
			"name": "Sort by price, high to low",
			"isDefault": false
		}
	],
	"returnAuthorization": {
		"cancelUrlRoot": "https://system.netsuite.com",
		"reasons": [
			{
				"text": "Wrong Item Shipped",
				"id": 1,
				"order": 1
			},
			{
				"text": "Did not fit",
				"id": 2,
				"order": 2
			},
			{
				"text": "Quality did not meet my standards",
				"id": 3,
				"order": 3
			},
			{
				"text": "Not as pictured on the Website",
				"id": 4,
				"order": 4
			},
			{
				"text": "Damaged during shipping",
				"id": 5,
				"order": 5
			},
			{
				"text": "Changed my mind",
				"id": 6,
				"order": 6
			},
			{
				"text": "Item was defective",
				"id": 7,
				"order": 7
			},
			{
				"text": "Arrived too late",
				"id": 8,
				"order": 8
			},
			{
				"text": "Other",
				"id": 9,
				"order": 9,
				"isOther": true
			}
		]
	},
	"isSCISIntegrationEnabled": true,
	"locationTypeMapping": {
		"store": {
			"internalid": "1",
			"name": "Store"
		}
	},
	"navigationData": [
		{
			"text": "Home",
			"href": "/",
			"dataTouchpoint": "home",
			"dataHashtag": "#/",
			"level": "1",
			"classnames": "header-menu-home-anchor"
		},
		{
			"text": "Shop",
			"href": "/search",
			"dataTouchpoint": "home",
			"dataHashtag": "#/search",
			"level": "1",
			"classnames": "header-menu-shop-anchor"
		},
		{
			"text": "Categories placeholder",
			"level": "1",
			"placeholder": "Categories"
		}
	],
	"typeahead": {
		"minLength": 3,
		"maxResults": 4,
		"sort": "relevance:asc"
	},
	"cache": {
		"contentPageCdn": "MEDIUM",
		"contentPageTtl": 7200
	},
	"addThis": {
		"enable": false,
		"pubId": "ra-50abc2544eed5fa5",
		"toolboxClass": "addthis_default_style addthis_toolbox addthis_button_compact",
		"servicesToShow": [
			{
				"key": "facebook",
				"value": "Facebook"
			},
			{
				"key": "google_plusone",
				"value": ""
			},
			{
				"key": "email",
				"value": "Email"
			},
			{
				"key": "expanded",
				"value": "More"
			}
		],
		"options": [
			{
				"key": "username",
				"value": ""
			},
			{
				"key": "data_track_addressbar",
				"value": true
			}
		]
	},
	"facebook": {
		"enable": false,
		"appId": "",
		"popupOptions": {
			"status": "no",
			"resizable": "yes",
			"scrollbars": "yes",
			"personalbar": "no",
			"directories": "no",
			"location": "no",
			"toolbar": "no",
			"menubar": "no",
			"width": 500,
			"height": 250,
			"left": 0,
			"top": 0
		}
	},
	"googlePlus": {
		"enable": true,
		"popupOptions": {
			"status": "no",
			"resizable": "yes",
			"scrollbars": "yes",
			"personalbar": "no",
			"directories": "no",
			"location": "no",
			"toolbar": "no",
			"menubar": "no",
			"width": 600,
			"height": 600,
			"left": 0,
			"top": 0
		}
	},
	"pinterest": {
		"enableHover": true,
		"enableButton": true,
		"imageSize": "main",
		"popupOptions": {
			"status": "no",
			"resizable": "yes",
			"scrollbars": "yes",
			"personalbar": "no",
			"directories": "no",
			"location": "no",
			"toolbar": "no",
			"menubar": "no",
			"width": 680,
			"height": 300,
			"left": 0,
			"top": 0
		}
	},
	"twitter": {
		"enable": true,
		"popupOptions": {
			"status": "no",
			"resizable": "yes",
			"scrollbars": "yes",
			"personalbar": "no",
			"directories": "no",
			"location": "no",
			"toolbar": "no",
			"menubar": "no",
			"width": 632,
			"height": 250,
			"left": 0,
			"top": 0
		},
		"via": ""
	},
	"filterSite": {
		"option": "current"
	},
	"orderShoppingFieldKeys": {
		"keys": [
			"shipaddress",
			"summary",
			"promocodes"
		],
		"items": [
			"amount",
			"promotionamount",
			"promotiondiscount",
			"orderitemid",
			"quantity",
			"minimimquantity",
			"onlinecustomerprice_detail",
			"internalid",
			"options",
			"itemtype",
			"rate",
			"rate_formatted"
		]
	},
	"orderCheckoutFieldKeys": {
		"keys": [
			"giftcertificates",
			"shipaddress",
			"billaddress",
			"payment",
			"summary",
			"promocodes",
			"shipmethod",
			"shipmethods",
			"agreetermcondition",
			"purchasenumber"
		],
		"items": [
			"amount",
			"promotionamount",
			"promotiondiscount",
			"orderitemid",
			"quantity",
			"minimumquantity",
			"onlinecustomerprice_detail",
			"internalid",
			"rate",
			"rate_formatted",
			"options",
			"itemtype",
			"itemid"
		]
	},
	"suitescriptResultsPerPage": 20,
	"fieldKeys": {
		"itemsFieldsAdvancedName": "order",
		"itemsFieldsStandardKeys": [
			"canonicalurl",
			"displayname",
			"internalid",
			"itemid",
			"itemoptions_detail",
			"itemtype",
			"minimumquantity",
			"onlinecustomerprice_detail",
			"pricelevel1",
			"pricelevel1_formatted",
			"isinstock",
			"ispurchasable",
			"isbackordable",
			"outofstockmessage",
			"stockdescription",
			"showoutofstockmessage",
			"storedisplayimage",
			"storedisplayname2",
			"storedisplaythumbnail",
			"isfullfillable"
		]
	},
	"extraTranslations": [
		{
			"key": "hello world!!!",
			"en_US": "hello world!!!",
			"fr_FR": "bonjour le monde!!!",
			"es_ES": "hola mundo!!!",
			"it_IT": "ciao mondo!!!"
		}
	],
	"storeLocator": {
		"icons": {
			"stores": "img/default-marker.png",
			"position": "img/position-marker.png",
			"autocomplete": "img/position-marker.png"
		},
		"zoomInDetails": 17,
		"openPopupOnMouseOver": true,
		"title": "Store Locator",
		"isEnabled": true,
		"radius": 50,
		"showLocalizationMap": true,
		"showAllStoresRecordsPerPage": 28,
		"defaultTypeLocations": "1",
		"defaultQuantityLocations": 3,
		"distanceUnit": "mi",
		"apiKey": "",
		"mapOptions": {
			"centerPosition": {
				"latitude": -34.86993,
				"longitude": -56.145212
			},
			"zoom": 11,
			"mapTypeControl": false,
			"streetViewControl": false,
			"mapTypeId": "ROADMAP"
		}
	}
};

require.config({"paths":{"Backbone.Validation":"backbone-validation.server.custom"},"shim":{"Backbone.Validation":{"exports":"Backbone.Validation"}},"baseUrl":"","configFile":null,"exclude":[],"excludeShallow":[],"findNestedDependencies":false,"loader":null,"preserveComments":false,"wrapShim":true});
require('SCA');
