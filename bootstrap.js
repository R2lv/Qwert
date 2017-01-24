'use strict';
const express = require("express");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const session = require("express-session");

const util = require("./_lib/Utils");
const Uploader = require("./_lib/uploader");
const services = require("./_lib/services");

module.exports = new (function() {
    var self = this;
    var config,
        defaults = {
            "controllers_dir": "controllers",
            "models_dir": "models",
            "middleware_dir": "middleware",
            "public_dir": "public",
            "views_dir": "views",
            "uploads_dir": "tmp",
            "sessionStore": new session.MemoryStore(),
            "sessionCookieName": "SESSID",
            "cookieSecret": "Hack Me!"
        };

    var _variables = {
        controllers: {},
        models: {},
        middleware: {}
    };

    _variables.services = new services(_variables);

    var _app = express();

    function realDir(dir) {
        return path.join(config.root_dir, dir);
    }

    function getRealPaths(files, dir) {
        return files.map(function(file) {
            return path.join(dir, file);
        });
    }

    function findJsInDir(dir) {
        if(!fs.existsSync(dir)) {
            return [];
        }
        var files = fs.readdirSync(dir);
        return getRealPaths(files, dir);
    }

    function findControllers() {

        var files = findJsInDir(realDir(config.controllers_dir));

        files.forEach(function(file) {
            var ctrl = require(file);
            if(!util.exists(ctrl.route) || !util.exists(ctrl.route)) {
                throw new Error("Controller "+file+" not found, maybe you missed module.exports at the end of the file");
            }
            _variables.controllers[ctrl.route] = ctrl;
        });

    }

    function findModels() {
        var files = findJsInDir(realDir(config.models_dir));

        files.forEach(function(file) {
            var mdl = require(file);
            _variables.models[mdl.name] = mdl;
        });
    }

    function findMiddleware() {
        var files = findJsInDir(realDir(config.middleware_dir));

        files.forEach(function(file) {
            var mware = require(file);
            if(typeof mware.name == "string")
                _variables.middleware[mware.name] = mware;
        });
    }

    function configureApp() {

        var uploader = new Uploader(config.upload);
        _variables.uploader = uploader;

        _app.set('trust proxy', 1);

        _app.use(session({
            name: config.sessionCookieName || defaults.sessionCookieName,
            secret: config.cookieSecret || defaults.cookieSecret,
            resave: true,
            saveUninitialized: true,
            store: config.sessionStore || defaults.sessionStore
        }));

        _app.use(bodyParser.urlencoded({ extended: true }));
        _app.use(bodyParser.json());

        _app.use(express.static(realDir(config.public_dir)));

        // _app.use(uploader.none());

        if(util.exists(config.views.engines)) {
            for(var ext in config.views.engines) {
                _app.engine(ext, config.views.engines[ext]);
            }
        }

        if(util.exists(config.views.view_engine)) {
            _app.set("view engine", config.views.view_engine);
        }

        _app.set("views", realDir(config.views.dir));

    }

    function getRouteArguments(ctrl) {
        var controller = controllerInjector(ctrl.controller);
        var fns = [ctrl.route];
        if(Array.isArray(ctrl.middleware)) {
            ctrl.middleware.forEach(function(middleware) {
                fns.push(getMiddleware(middleware));
            });
        } else if(typeof ctrl.middleware == "string" || typeof ctrl.middleware == "function") {
            fns.push(getMiddleware(ctrl.middleware));
        }

        fns.push(controller);
        return fns;
    }

    function getMiddleware(func) {
        if(typeof func == 'function') {
            return middlewareInjector(func);
        } else if(util.exists(_variables.middleware[func]))
            return middlewareInjector(_variables.middleware[func].fn);
        else
            throw new Error("Middleware "+func+" not found");
    }

    function setRoutes() {
        for(var route in _variables.controllers) {
            var ctrl = _variables.controllers[route];
            if(util.exists(ctrl.controller)) {
                var args = getRouteArguments(ctrl);
                _app[ctrl.method.toLowerCase()].apply(_app, args);
            } else {
                setRouteGroup(ctrl._get());
            }
        }
    }


    function setRouteGroup(ctrl) {
        var router = express.Router();

        if(typeof ctrl.group.middleware == "string") {
            router.use(getMiddleware(ctrl.group.middleware));
        } else if(Array.isArray(ctrl.group.middleware)) {
            ctrl.group.middleware.forEach(function(middleware) {
                router.use(getMiddleware(middleware));
            });
        }

        ctrl.controllers.forEach(function(c) {
            var args = getRouteArguments(c);
            router[c.method.toLowerCase()].apply(router, args);
        });

        _app.use(ctrl.group.route, router);
    }

    function boot() {
        findControllers();
        findModels();
        findMiddleware();

        configureApp();
        setRoutes();

        _app.listen(config.port);
    }

    function inject(fn, req, res, next) {
        var services = util.getFnArgumentNames(fn);
        services = services.map(function(s) {
            return _variables.services.hasOwnProperty(s) ? _variables.services[s](req, res, inject, next) : null;
        });
        return fn.bind.apply(fn, [null].concat(services));
    }

    function controllerInjector(fn) {
        return function(req, res, next) {
            return inject(fn, req, res, next)();
        }
    }

    function middlewareInjector(fn) {
        return function(req, res, next) {
            return inject(fn, req, res, next)();
        }
    }

    this.registerServiceProvider = function(service, fn) {
        _variables.services[service] = fn;
    };

    this.config = function(conf) {
        if(!util.exists(conf.controllers_dir)) {
            conf.controllers_dir = defaults.controllers_dir;
        }
        if(!util.exists(conf.models_dir)) {
            conf.models_dir = defaults.models_dir;
        }
        if(!util.exists(conf.middleware_dir)) {
            conf.middleware_dir = defaults.middleware_dir;
        }
        if(!util.exists(conf.public_dir)) {
            conf.public_dir = defaults.public_dir;
        }
        if(!util.exists(conf.views)) {
            conf.views = {
                dir: defaults.views_dir
            };
        }
        if(!util.exists(conf.views.dir)) {
            conf.views.dir = defaults.views_dir;
        }

        if(!util.exists(conf.upload)) {
            conf.upload = {
                dest: defaults.uploads_dir
            }
        } else if(!util.exists(conf.upload.dest)) {
            conf.upload.dest = defaults.uploads_dir;
        }
        config = conf;

        config.upload.dest = realDir(config.upload.dest);

        return self;
    };

    this.boot = function() {
        if(!util.exists(config)) {
            throw new Error("Config is not set");
        }
        boot();
        return self;
    };
})();