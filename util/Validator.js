'use strict';
module.exports = function() {
    var self = this;

    var _rules = {
        required: function(item, val) {
            if(!val) return true;
            return (typeof item != "undefined");
        },
        type: function(item, type) {
            type = realType(type);
            return typeof item == type;
        },
        min: function(item, min) {
            return item >= min;
        },
        max: function(item, max) {
            return item <= max;
        },
        inArray: function(item, arr) {
            return arr.indexOf(item) != -1;
        },
        minLength: function(item, min) {
            return item.length && item.length >= min;
        },
        maxLength: function(item, max) {
            return item.length && item.length <= max;
        },
        notEquals: function(item, item2) {
            return item != item2;
        },
        notEqualsWithType: function(item, item2) {
            return item !== item2;
        },
        equals: function(item, item2) {
            return item==item2;
        },
        equalsWithType: function(item, item2) {
            return item===item2;
        },
        startsWith: function(item, value) {
            return typeof item == "string" && item.startsWith(value);
        },
        endsWith: function(item, value) {
            return typeof item == "string" && item.endsWith(value);
        }
    };

    var _errorMessages = {
            "en": {}
        },
        _aliases = {
            "en": {}
        },
        _lang = "en";

    function realType(type) {
        return type;
    }

    function getError(field, rule, val) {
        field = getFieldAlias(field);
        if(Array.isArray(val)) {
            val = val.join(",");
        }
        if(typeof _errorMessages[_lang][rule] != "undefined") {
            return _errorMessages[_lang][rule].replace(/\{field\}/ig, field).replace(/\{value\}/ig, val);
        } else {
            return null;
        }
    }

    function getFieldAlias(field) {
        return _aliases[_lang][field] || field;
    }

    self.lang = function(lang) {
        _lang = lang;
        return self;
    };

    self.validate = function(o, rules) {
        var errors = {};
        var valid = true;

        var keys = Object.keys(rules);

        keys.forEach(function(key) {
            var res = self.validateItem(key, o[key], rules[key]);
            if(!res.valid) {
                valid = false;
                errors[key]=res.errors;
            }
        });

        return {
            valid: valid,
            errors: errors
        }
    };

    self.validateItem = function(field, item, rules) {
        var errors = [];
        var valid = true;

        var keys = Object.keys(rules);

        keys.forEach(function(key) {
            if(_rules.hasOwnProperty(key)) {
                if(!_rules[key](item, rules[key])) {
                    errors.push(getError(field, key, rules[key]));
                    if (valid) valid = false;
                }
            } else {
                throw new Error("Invalid rule: "+key);
            }
        });

        return {
            valid: valid,
            errors: errors
        }
    };

    self.extend = function(name, fn) {
        if(!_rules.hasOwnProperty(name)) {
            _rules[name] = fn;
        }
    };

    self.setErrorMessage = function(lang, name, message) {
        if(_errorMessages[lang]) {
            _errorMessages[name] = message;
        } else {
            _errorMessages[lang] = {};
            _errorMessages[lang][name]=message;
        }
    };

    self.setErrorMessages = function(lang, messages) {
        if(typeof messages != "object") {
            throw new Error("messages must be object containing pairs of validation rule and message");
        }

        if(typeof _errorMessages[lang] == "undefined") {
            _errorMessages[lang] = messages;
        } else {
            for (var rule in messages) {
                _errorMessages[lang][rule] = messages[rule];
            }
        }
    };

    self.setAlias = function(lang, name, value) {
        if(typeof _aliases[lang] != "undefined") {
            _aliases[lang][key] = value;
        } else {
            _aliases[lang] = {};
            _aliases[lang][name] = value;
        }
    };

    self.setAliases = function(lang, aliases) {
        if(typeof _aliases[lang] == "undefined") {
            _aliases[lang] = aliases;
        } else {
            for (var name in aliases) {
                _aliases[lang][name] = aliases[name];
            }
        }
    };

};
