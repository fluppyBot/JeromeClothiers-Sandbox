// Based on: 
// Backbone.Validation v0.5.2
//
// Copyright (C)2011-2012 Thomas Pedersen
// Distributed under MIT License
//
// Documentation and full license available at:
// http://thedersen.github.com/backbone.validation


(function ()
{
    var getValidatedAttrs = function(validations){
        return _.reduce(_.keys(validations), function(memo, key){
            memo[key] = undefined;
            return memo;
        }, {});
    };
    
    
    var getValidators = function(model, validation, attr) {
        var attrValidation = validation[attr] || {};

        if (_.isFunction(attrValidation)) {
            return attrValidation;
        } else if(_.isString(attrValidation)) {
            return model[attrValidation];
        } else if(!_.isArray(attrValidation)) {
            attrValidation = [attrValidation];
        }

        return _.reduce(attrValidation, function(memo, attrValidation){
            _.each(_.without(_.keys(attrValidation), 'msg'), function(validator){
                memo.push({
                    fn: Validation.validators[validator],
                    val: attrValidation[validator],
                    msg: attrValidation.msg
                });
            });
            return memo;
        }, []);
    };

    var hasChildValidaton = function(validation, attr) {
        return _.isObject(validation) && _.isObject(validation[attr]) && _.isObject(validation[attr].validation);
    };

    var validateAttr = function(model, validation, attr, value, computed) {
        var validators = getValidators(model, validation, attr);

        if (_.isFunction(validators)) {
            return validators.call(model, value, attr, computed);
        }

        return _.reduce(validators, function(memo, validator){
            var result = validator.fn.call(Validation.validators, value, attr, validator.val, model, computed);
            if(result === false || memo === false) {
                return false;
            }
            if (result && !memo) {
                return validator.msg || result;
            }
            return memo;
        }, '');
    };

    var validateAll = function(model, validation, attrs, computed) {
        if (!attrs) {
          return false;
        }
        var isValid = true, error;
        for (var validatedAttr in validation) {
            error = validateAttr(model, validation, validatedAttr, model[validatedAttr], computed);
            if (_.isUndefined(attrs[validatedAttr]) && error) {
                isValid = false;
                break;
            }
            if (error !== false && hasChildValidaton(validation, validatedAttr)) {
                isValid = validateAll(model, validation[validatedAttr].validation, attrs[validatedAttr], computed);
            }
        }
        return isValid;
    };

    var validateObject = function(model, validation, attrs, attrPath) {
        attrPath = attrPath || '';
        var result, error, changedAttr,
            errorMessages = [],
            invalidAttrs = [],
            isValid = true,
            computed = _.extend(model, attrs);

        for (changedAttr in attrs) {
            error = validateAttr(model, validation, changedAttr, attrs[changedAttr], computed);
            if (error) {
                errorMessages.push(error);
                invalidAttrs.push(attrPath + changedAttr);
                isValid = false;
            }

            if (error !== false && hasChildValidaton(validation, changedAttr)) {

                result = validateObject(model, validation[changedAttr].validation, attrs[changedAttr], attrPath + changedAttr + '.');

                Array.prototype.push.apply(errorMessages, result.errorMessages);
                Array.prototype.push.apply(invalidAttrs, result.invalidAttrs);
                isValid = isValid && result.isValid;
            }
        }

        if (isValid) {
            isValid = validateAll(model, validation, attrs, computed);
        }

        return {
            errorMessages: errorMessages,
            invalidAttrs: invalidAttrs,
            isValid: isValid
        };
    };
	
	
	function Validation(validations, data) {
		if (!(this instanceof Validation)) 
			return new Validation(validations, data);
		
		this.validations = validations;
		this.data = data;
		this.result = false;
	}
	
	this.Validation = Validation;
	
	Validation.prototype.validate = function()
	{
		if (!this.result)
			this.result = validateObject(this.data, this.validations, _.extend(getValidatedAttrs(this.validations), this.data));
	}


	Validation.prototype.isValid = function()
	{
		this.validate();
		return this.result.isValid;
	}

	Validation.prototype.getError = function()
	{
		if (this.result.isValid)
			return null;
		
		return {
			status: 400,
			code: "ERR_BAD_REQUEST",
			message: this.result.errorMessages
		};
	}




	
})();


Validation.patterns = {
    digits: /^\d+$/,
    number: /^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/,
    email: /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i,
    url: /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i
};

Validation.messages = {
    required: '{0} is required',
    acceptance: '{0} must be accepted',
    min: '{0} must be grater than or equal to {1}',
    max: '{0} must be less than or equal to {1}',
    range: '{0} must be between {1} and {2}',
    length: '{0} must be {1} characters',
    minLength: '{0} must be at least {1} characters',
    maxLength: '{0} must be at most {1} characters',
    rangeLength: '{0} must be between {1} and {2} characters',
    oneOf: '{0} must be one of: {1}',
    equalTo: '{0} must be the same as {1}',
    pattern: '{0} must be a valid {1}',
    object: '{0} must be an object'
};

Validation.validators = (function(patterns, messages, _) {
    var trim = String.prototype.trim ?
                function(text) {
                    return text === null ? '' : String.prototype.trim.call(text);
                } :
                function(text) {
                    var trimLeft = /^\s+/,
                        trimRight = /\s+$/;

                    return text === null ? '' : text.toString().replace(trimLeft, '').replace(trimRight, '');
                };
    var format = function() {
        var args = Array.prototype.slice.call(arguments);
        var text = args.shift();
        return text.replace(/\{(\d+)\}/g, function(match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
    var isNumber = function(value){
        return _.isNumber(value) || (_.isString(value) && value.match(patterns.number));
    };
    var hasValue = function(value) {
        return !(_.isNull(value) || _.isUndefined(value) || (_.isString(value) && trim(value) === ''));
    };

    return {
        fn: function(value, attr, fn, model, computed) {
            if(_.isString(fn)){
                fn = model[fn];
            }
            return fn.call(model, value, attr, computed);
        },
        required: function(value, attr, required, model) {
            var isRequired = _.isFunction(required) ? required.call(model) : required;
            if(!isRequired && !hasValue(value)) {
                return false; // overrides all other validators
            }
            if (isRequired && !hasValue(value)) {
                return format(messages.required, attr);
            }
        },
        acceptance: function(value, attr) {
            if(value !== 'true' && (!_.isBoolean(value) || value === false)) {
                return format(messages.acceptance, attr);
            }
        },
        min: function(value, attr, minValue) {
            if (!isNumber(value) || value < minValue) {
                return format(messages.min, attr, minValue);
            }
        },
        max: function(value, attr, maxValue) {
            if (!isNumber(value) || value > maxValue) {
                return format(messages.max, attr, maxValue);
            }
        },
        range: function(value, attr, range) {
            if(!isNumber(value) || value < range[0] || value > range[1]) {
                return format(messages.range, attr, range[0], range[1]);
            }
        },
        length: function(value, attr, length) {
            if (!hasValue(value) || trim(value).length !== length) {
                return format(messages.length, attr, length);
            }
        },
        minLength: function(value, attr, minLength) {
            if (!hasValue(value) || trim(value).length < minLength) {
                return format(messages.minLength, attr, minLength);
            }
        },
        maxLength: function(value, attr, maxLength) {
            if (!hasValue(value) || trim(value).length > maxLength) {
                return format(messages.maxLength, attr, maxLength);
            }
        },
        rangeLength: function(value, attr, range) {
            if(!hasValue(value) || trim(value).length < range[0] || trim(value).length > range[1]) {
                return format(messages.rangeLength, attr, range[0], range[1]);
            }
        },
        oneOf: function(value, attr, values) {
            if(!_.include(values, value)){
                return format(messages.oneOf, attr, values.join(', '));
            }
        },
        equalTo: function(value, attr, equalTo, model, computed) {
            if(value !== computed[equalTo]) {
                return format(messages.equalTo, attr, equalTo);
            }
        },
        pattern: function(value, attr, pattern) {
            if (!hasValue(value) || !value.toString().match(patterns[pattern] || pattern)) {
                return format(messages.pattern, attr, pattern);
            }
        },
        validation: function(value, attr, objectValue) {
            if (!_.isObject(value)) {
                return format(messages.object, attr);
            }
        }
    };
} (Validation.patterns, Validation.messages, _));
