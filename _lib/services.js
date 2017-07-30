'use strict';
const fs = require("fs");
const UploadedFilesHandler = require("./UploadedFilesHandler");
module.exports = function(_vars, _app) {

    function objectInjector(fn, req, res, injector) {
        return new (injector(fn, req, res))();
    }

    function modelInjector(fn, req, res, injector) {
        return new (injector(fn, req, res));
    }

    this.$model = function(req, res, injector) {
        return function(name) {
            if (_vars.models.hasOwnProperty(name)) {
                // return modelInjector(_vars.models[name].model, req, res, injector);
                return objectInjector(_vars.models[name].model, req, res, injector);
            }
            return null;
        }
    };

    this.$response = function(req, res) {
        return res;
    };

    this.$request = function(req) {
        return req;
    };

    this.$express = function() {
        return _app;
    };

    this.$locals = function() {
        return {
            has: function(name) {
                return _app.locales[name] !== undefined;
            },
            get: function(name) {
                return _app.locals[name] || "";
            },
            set: function(name, val) {
                _app.locals[name] = val;
            },
            unset: function(name, val) {
                delete _app.locals[name];
            },
            all: function() {
                return _app.locals || {};
            }
        }
    };

    this.$session = function(req) {
        return {
            has: function(name) {
                return typeof req.session[name] !== "undefined";
            },
            get: function(name) {
                return req.session[name] || "";
            },
            set: function(name, value) {
                req.session[name] = value;
            },
            all: function() {
                return req.session || {}
            },
            destroy: function(cb) {
                req.session.destroy(cb);
            },
            unset: function(name) {
                delete req.session[name];
            }
        };
    };

    this.$post = function(req) {
        return {
            has: function(name) {
                return typeof req.body[name] !== "undefined";
            },
            get: function(name) {
                return req.body[name] || "";
            },
            set: function(name, value) {
                req.body[name] = value;
            },
            all: function() {
                return req.body || {}
            }
        }
    };

    this.$get = function(req) {
        return {
            has: function(name) {
                return typeof req.query[name] !== "undefined";
            },
            get: function(name) {
                return req.query[name] || "";
            },
            set: function(name, value) {
                req.query[name] = value;
            },
            all: function() {
                return req.query || {}
            }
        }
    };

    this.$param = function(req) {
        return {
            has: function(name) {
                return typeof req.params[name] !== "undefined";
            },
            get: function(name) {
                return req.params[name] || "";
            },
            set: function(name, value) {
                req.params[name] = value;
            },
            all: function() {
                return req.params || {}
            }
        }
    };

    this.$next = function(req,res,injector,next) {
        return next;
    };

    this.$upload = function(req, res, injector, next) {
        return  function(fields) {
            let _cb;

            _vars.uploader.accept(fields)(req, res, function() {
                if(_cb) _cb();
            });

            return {
                then: function(cb) {
                    _cb = cb;
                }
            }

        }
    };

    this.$files = function(req) {
        return {
            handler: function() {
                return req.__filesHandler || (req.__filesHandler = new UploadedFilesHandler(req));
            }
        }
    };

    this.$global = function() {
        return global.get;
    };

    const global = {
        get: function(name) {
            return _vars.globals[name];
        }
    };

};