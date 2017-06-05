// Backbone.Events
// -----------------
var slice = Array.prototype.slice;
// Regular expression used to split event strings
var eventSplitter = /\s+/;

// Pass these methods through to the console if they exist, otherwise just
// fail gracefully. These methods are provided for convenience.

if (typeof console == "undefined") {
    console = { };
}
var console_methods = 'assert clear count debug dir dirxml exception group groupCollapsed groupEnd info log profile profileEnd table time timeEnd trace warn'.split(' '),
idx = console_methods.length;
  
while ( --idx >= 0 ) {
	var method = console_methods[idx];
	if (typeof console[method] == "undefined") {
		console[method] = function() {}; 
	}
}
if (typeof console.memory == "undefined") {
	console.memory = {};
}

console.log = function () {
//	nlapiLogExecution("DEBUG", arguments.length > 1 ? arguments[0] : "", arguments.length > 1 ? arguments[1] : arguments[0] || "null" );
};
console.info = function () {
	nlapiLogExecution("AUDIT", arguments.length > 1 ? arguments[0] : "", arguments.length > 1 ? arguments[1] : arguments[0] || "null" );
};
console.error = function () {
	nlapiLogExecution("EMERGENCY", arguments.length > 1 ? arguments[0] : "", arguments.length > 1 ? arguments[1] : arguments[0] || "null" );
};
console.warn = function () {
	nlapiLogExecution("ERROR", arguments.length > 1 ? arguments[0] : "", arguments.length > 1 ? arguments[1] : arguments[0] || "null" );
};
console.timeEntries = [];
console.time = function (text) {
	if (typeof text == "string") {
		console.timeEntries[text] = Date.now();
	}
}
console.timeEnd = function (text) {
	if (typeof text == "string") {
		if ( ! arguments.length ) {
			nlapiLogExecution("ERROR", "TypeError:", "Not enough arguments");
		}else {
			if (typeof console.timeEntries[text] != "undefined") {
				nlapiLogExecution("DEBUG", text + ":", Date.now() -  console.timeEntries[text] + "ms" );
				delete console.timeEntries[text];
			}
		}
	}
}


// A module that can be mixed in to *any object* in order to provide it with
// custom events. You may bind with `on` or remove with `off` callback functions
// to an event; trigger`-ing an event fires all callbacks in succession.
//
//     var object = {};
//     _.extend(object, Events);
//     object.on('expand', function(){ alert('expanded'); });
//     object.trigger('expand');
//
var Events = {

	// Bind one or more space separated events, `events`, to a `callback`
	// function. Passing `"all"` will bind the callback to all events fired.
	on: function(events, callback, context) {

		var calls, event, node, tail, list;

		if (!callback) return this;

		events = events.split(eventSplitter);
		calls = this._callbacks || (this._callbacks = {});

		// Create an immutable callback list, allowing traversal during
		// modification.  The tail is an empty object that will always be used
		// as the next node.
		while (event = events.shift()) {
			list = calls[event];
			node = list ? list.tail : {};
			node.next = tail = {};
			node.context = context;
			node.callback = callback;
			calls[event] = {tail: tail, next: list ? list.next : node};
		}

		return this;
	},

	// Remove one or many callbacks. If `context` is null, removes all callbacks
	// with that function. If `callback` is null, removes all callbacks for the
	// event. If `events` is null, removes all bound callbacks for all events.
	off: function(events, callback, context) {
		var event, calls, node, tail, cb, ctx;

		// No events, or removing *all* events.
		if (!(calls = this._callbacks)) return;

		if (!(events || callback || context)) {
			delete this._callbacks;
			return this;
		}

		// Loop through the listed events and contexts, splicing them out of the
		// linked list of callbacks if appropriate.
		events = events ? events.split(eventSplitter) : _.keys(calls);
		while (event = events.shift()) {
			node = calls[event];
			delete calls[event];

			if (!node || !(callback || context)) continue;
			
			// Create a new list, omitting the indicated callbacks.
			tail = node.tail;
			while ((node = node.next) !== tail) {
				cb = node.callback;
				ctx = node.context;
				if ((callback && cb !== callback) || (context && ctx !== context)) {
					this.on(event, cb, ctx);
				}
			}
		}

		return this;
	},

	// Trigger one or many events, firing all bound callbacks. Callbacks are
	// passed the same arguments as `trigger` is, apart from the event name
	// (unless you're listening on `"all"`, which will cause your callback to
	// receive the true name of the event as the first argument).
	trigger: function(events) {
		console.log('Suitelet Details','Trigger: ' +events )
		var event, node, calls, tail, args, all, rest;
		if (!(calls = this._callbacks)) return this;
		all = calls.all;
		events = events.split(eventSplitter);
		rest = slice.call(arguments, 1);

		// For each event, walk through the linked list of callbacks twice,
		// first to trigger the event, then to trigger any `"all"` callbacks.
		while (event = events.shift()) {
			if (node = calls[event]) {
				tail = node.tail;
				while ((node = node.next) !== tail) {
					node.callback.apply(node.context || this, rest);
				}
			}
			if (node = all) {
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

// Aliases for backwards compatibility.
Events.bind   = Events.on;
Events.unbind = Events.off;

var SC = {}; // This sands for SuiteCommerce

var Application = _.extend({
	
	originalModels: {},
	extendedModels: {},
	
	init: function () {
		
	},
	
	wrapFunctionWithEvents: function (methodName, thisObj, fn) {
		return  _.wrap(fn, function(func) {
			var args = slice.call(arguments, 1); // Gets the arguments passed to the function from the execution code (removes func from arguments)
			
			// Fires the 'before:ObjectName.MethodName' event most common 'before:Model.method'
			Application.trigger.apply( Application, ['before:' + methodName, thisObj].concat(args) );
			
			// Executes the real code of the method
			var result = func.apply(thisObj, args);
			
			// Fires the 'before:ObjectName.MethodName' event adding result as 1st parameter
			Application.trigger.apply( Application, ['after:' + methodName, thisObj, result].concat(args) );
			
			// Returns the result from the execution of the real code, modifications may happend in the after event
			return result;
		});
	},
	
	defineModel: function(name, definition) {
		Application.originalModels[name] = definition;
	},
	
	extendModel: function (name, extensions) {
		if (Application.originalModels[name]) {
			_.each(extensions, function (value, key)
			{
				Application.originalModels[name][key] = value;
			});
		} else {
			throw nlapiCreateError("APP_ERR_UNKNOWN_MODEL", "The model "+name+" is not defined");
		}
		
	},
	
	getModel: function(name) {

		if (Application.originalModels[name]) {
			if (!Application.extendedModels[name]) {
				var model = {};
				
				_.each(Application.originalModels[name], function (value, key) {
					if (typeof value == 'function') {
						model[key] = Application.wrapFunctionWithEvents(name + '.' + key, model, value);
					} else {
						model[key] = value;
					}
				})
				
				if (!model.validate) {
					model.validate = Application.wrapFunctionWithEvents(name + '.validate', model, function(data) {
						if ( this.validation ) {
							var validation = new Validation( this.validation, data );
							if ( !validation.isValid() )
								throw validation.getError();
						}
					});
				}	
				Application.extendedModels[name] = model;
			}
			return Application.extendedModels[name];

		} else {
			throw nlapiCreateError("APP_ERR_UNKNOWN_MODEL", "The model "+name+" is not defined");
		}
			
	},
	
	sendContent: function (content, options) { 
        'use strict'; 

        // Default options 
        options = _.extend({status: 200, cache: false}, options || {}); 

        // Triggers an event for you to know that there is content being sent 
        Application.trigger('before:Application.sendContent', content, options); 

        // We set a custom status 
        response.setHeader('Custom-Header-Status', parseInt(options.status, 10).toString()); 

        // The content type will be here 
        var content_type = false; 

        // If its a complex object we transform it into an string 
        if (_.isArray(content) || _.isObject(content)) 
        { 
                content_type = 'JSON'; 
                content = JSON.stringify( content ); 
        } 

        // If you set a jsonp callback this will honor it 
        if (request.getParameter('jsonp_callback')) 
        { 
                content_type = 'JAVASCRIPT'; 
                content = request.getParameter('jsonp_callback') + '(' + content + ');'; 
        } 

        //Set the response chache option 
        if (options.cache) 
        {	
                response.setCDNCacheable(options.cache); 
        } 
         
        // Content type was set so we send it 
        content_type && response.setContentType(content_type); 

        if(options.customHeaderCacheStatus){
			response.setHeader("Custom-Header-Cache-Status", JSON.stringify(options.customHeaderCacheStatus));	
		}
        
        response.write(content); 

        Application.trigger('after:Application.sendContent', content, options); 
	},
	
	getPaginatedSearchResults: function (record_type, filters, columns, page, results_per_page)
	{
		var range_start		= ( page * results_per_page ) - results_per_page,
			range_end		= page * results_per_page,
			doRealCount		= _.any(columns, function (column) { return column.getSummary(); }),
			result			= {
				page: page,
				recordsPerPage: results_per_page
			};
		
		/// Performs a count search by the internal id
		if (!doRealCount)
		{
			var cuontSearch = nlapiCreateSearch(record_type, filters, [new nlobjSearchColumn("internalid", null, "count")]),
				cuontSearchRan = cuontSearch.runSearch();

			result.totalRecordsFound = parseInt(cuontSearchRan.getResults(0, 1)[0].getValue("internalid", null, "count"));
		}	
		
		result.records = [];
		
		if (doRealCount || (result.totalRecordsFound > 0 && result.totalRecordsFound > range_start))
		{
			var search = nlapiCreateSearch(record_type, filters, columns),
				searchRan = search.runSearch();
			
			if (doRealCount)
				result.totalRecordsFound = searchRan.getResults(0, 1000).length;
			
			result.records = searchRan.getResults(range_start, range_end);
		}
		
		return result;
	},
	
	getAllSearchResults: function (record_type, filters, columns) {
		console.time("All Search Results");
		var search = nlapiCreateSearch(record_type, filters, columns);
		search.setIsPublic(true);
		var searchRan = search.runSearch(), bolStop = false, intMaxReg = 1000, intMinReg = 0, result = [];
		console.time("Loop Results");
		while(!bolStop &&  nlapiGetContext().getRemainingUsage() > 10 ) {
			// First loop get 1000 rows (from 0 to 1000), the second loop starts at 1001 to 2000 gets another 1000 rows and the same for the next loops
			var extras = searchRan.getResults(intMinReg, intMaxReg);
			result = Application.searchUnion(result, extras);			
			intMinReg = intMaxReg;
			intMaxReg += 1000;
			// If the execution reach the the last result set stop the execution 
			if(extras.length < 1000) {
			   bolStop = true;
			}			
		}
		console.timeEnd("Loop Results");
		console.timeEnd("All Search Results");
		console.log("All Search Results","Remaining Usage: " + nlapiGetContext().getRemainingUsage());
		return result;
	},
	
	searchUnion: function (target,array) {
		return target.concat(array);
	},
	
	getSublistArray: function(record,group,fieldName) {
		var result = [];
		var pageContenLength = record.getLineItemCount(group);
		for ( var i = 1; i < pageContenLength ; i++) {
			result.push(record.getLineItemValue(group, fieldName, i));
		}
		return result;
	},
	
	
	sendError: function(e) {
		Application.trigger('before:Application.sendError', e);
		
		var status	= 500,
			code	= "ERR_UNEXPECTED",
			message	= "error";
		
		if (e instanceof nlobjError) {
			code = e.getCode();
			message = e.getDetails();
		}
		else if (_.isObject(e) && !_.isUndefined(e.status)) {
			status	= e.status;
			code	= e.code;
			message	= e.message;
		} else {		
			var error = nlapiCreateError(e);
			code = error.getCode();
			message = (error.getDetails() != '') ? error.getDetails() : error.getCode();
		}
		
		response.setContentType("JSON");
		response.setHeader("Custom-Header-Status", parseInt(status).toString());
		response.write( JSON.stringify( { "errorStatusCode": parseInt(status).toString(), "errorCode": code, "errorMessage": message, } ) );
		
		Application.trigger('after:Application.sendError', e);
	}
	
}, Events);











function getItemOptionsObject(options_string) {
	
	var options_object = [];
	
	if (options_string && options_string != '- None -')
	{
		var split_char_3 = String.fromCharCode(3);
		var split_char_4 = String.fromCharCode(4);
		
		_.each(options_string.split(split_char_4), function (option_line)
		{
			option_line = option_line.split(split_char_3);
			options_object.push({
				option_id: option_line[0],
				option_name: option_line[2],
				value_id: option_line[3],
				value_name: option_line[4],
				mandatory: option_line[1]
			});
		});
	}
	return options_object;
}




/// Default error objetcs
var unauthorizedError = {
	status: 403,
	code: "ERR_USER_NOT_LOGGED_IN",
	message: "Not logged In"
};

var methodNotAllowedError = {
	status: 405,
	code: "ERR_METHOD_NOT_ALLOWED",
	message: "Sorry, You are not allowed to preform this action."
};


function RecordsAPI(debug)
{
	this.debug = debug;
	this.params = [];
	this.is_multipe = false;
	return this;
}

RecordsAPI.prototype.multiple = function()
{
	this.is_multipe = true;
	return this;
};

RecordsAPI.prototype.getResults = function()
{
	var verifier = Math.random().toString();
	var api_record = nlapiCreateRecord("customrecord_records_api_sessions")
	
 	api_record.setFieldValue( 'custrecord_ras_session_verifier'	, verifier)
	api_record.setFieldValue( 'custrecord_ras_parameters'		, JSON.stringify(this.params))
	
	var id = nlapiSubmitRecord(api_record)
	
	if (this.debug)
		return nlapiResolveURL('SUITELET', 'customscript_records_api', 'customdeploy_records_api', true) + "&id="+id+"&verifier="+verifier;
	else
		return JSON.parse(
				nlapiRequestURL(
					nlapiResolveURL('SUITELET', 'customscript_records_api', 'customdeploy_records_api', true) + "&id="+id+"&verifier="+verifier)
						.getBody()); 
}


RecordsAPI.prototype._createApiRequest = function(params)
{
	this.params.push(params)
	
	if (!this.is_multipe)
	{
		var result = this.getResults();
		if (result.length)
			return result[0];
		else
			return result;
	}
		
	return this;
}

RecordsAPI.prototype.search = function(record_type, filters, columns, sort_by, page, items_per_page)
{
	return this._createApiRequest({
		method			: 'search',
		record_type		: record_type,
		filters			: filters,
		columns			: columns,
		sort_by			: sort_by,
		page			: page,
		items_per_page	: items_per_page,
	})
}

RecordsAPI.prototype.load = function(record_type, id)
{
	return this._createApiRequest({
		method			: 'load',
		record_type		: record_type,
		id: id,
	});
}

RecordsAPI.prototype.update = function(record_type, id, props, sublists)
{
	return this._createApiRequest({
		method			: 'update',
		record_type		: record_type,
		id				: id,
		props			: props,
		sublists		: sublists
	});
}