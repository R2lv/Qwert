'use strict';
const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const session = require("express-session");

const util = require("./_lib/Utils");
const Uploader = require("./_lib/uploader");
const Services = require("./_lib/services");

module.exports = new (function() {
    const self = this;
    let config;
    const
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
        },
        _variables = {
            controllers: {},
            models: {},
            middleware: {},
            singletons: {}
        };

    _variables.services = new Services(_variables);

    const _app = express(),
        _http = http.Server(_app);
    let _session;

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
        const files = fs.readdirSync(dir);
        files.forEach(function(file,i) {
            if(!file.endsWith(".js")) {
                files.splice(i,1);
            }
        });
        return getRealPaths(files, dir);
    }

    function findControllers() {

        const files = findJsInDir(realDir(config.controllers_dir));

        files.forEach(function(file) {
            const ctrl = require(file);
            if(!util.exists(ctrl.route) || !util.exists(ctrl.route)) {
                throw new Error("Controller "+file+" not found, maybe you missed module.exports at the end of the file");
            }
            _variables.controllers[ctrl.route] = ctrl;
        });

    }

    function findModels() {
        const files = findJsInDir(realDir(config.models_dir));

        files.forEach(function(file) {
            const mdl = require(file);
            _variables.models[mdl.name] = mdl;
        });
    }

    function findMiddleware() {
        let files = findJsInDir(realDir(config.middleware_dir));

        files.forEach(function(file) {
            let mware = require(file);
            if(typeof mware.name === "string")
                _variables.middleware[mware.name] = mware;
        });
    }

    function configureApp() {
        _variables.uploader = new Uploader(config.upload);

        _app.set('trust proxy', 1);

        _app.use(_session);

        _app.use(bodyParser.urlencoded({ extended: true }));
        _app.use(bodyParser.json());

        _app.use(express.static(realDir(config.public_dir)));

        // _app.use(uploader.none());

        if(util.exists(config.views.engines)) {
            for(let ext in config.views.engines) {
                _app.engine(ext, config.views.engines[ext]);
            }
        }

        if(util.exists(config.views.view_engine)) {
            _app.set("view engine", config.views.view_engine);
        }

        _app.set("views", realDir(config.views.dir));

    }

    function getRouteArguments(ctrl) {
        const controller = controllerInjector(ctrl.controller);
        const fns = [ctrl.route];
        if(Array.isArray(ctrl.middleware)) {
            ctrl.middleware.forEach(function(middleware) {
                fns.push(getMiddleware(middleware));
            });
        } else if(typeof ctrl.middleware === "string" || typeof ctrl.middleware === "function") {
            fns.push(getMiddleware(ctrl.middleware));
        }

        fns.push(controller);
        return fns;
    }

    function getMiddleware(func) {
        if(typeof func === 'function') {
            return middlewareInjector(func);
        } else if(util.exists(_variables.middleware[func]))
            return middlewareInjector(_variables.middleware[func].fn);
        else
            throw new Error("Middleware "+func+" not found");
    }

    function setRoutes() {
        for(const route in _variables.controllers) {
            const ctrl = _variables.controllers[route];
            if(util.exists(ctrl.controller)) {
                const args = getRouteArguments(ctrl);
                _app[ctrl.method.toLowerCase()].apply(_app, args);
            } else {
                setRouteGroup(ctrl._get());
            }
        }
    }


    function setRouteGroup(ctrl) {
        const router = express.Router();

        if(typeof ctrl.group.middleware === "string") {
            router.use(getMiddleware(ctrl.group.middleware));
        } else if(Array.isArray(ctrl.group.middleware)) {
            ctrl.group.middleware.forEach(function(middleware) {
                router.use(getMiddleware(middleware));
            });
        }

        ctrl.controllers.forEach(function(c) {
            const args = getRouteArguments(c);
            router[c.method.toLowerCase()].apply(router, args);
        });

        _app.use(ctrl.group.route, router);
    }

    function init() {
        findControllers();
        findModels();
        findMiddleware();

        configureApp();
        setRoutes();

    }

    function inject(fn, req, res, next) {
        let services = util.getFnArgumentNames(fn);
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

    this.setServiceProvider = function(service, fn) {
        _variables.services[service] = fn;
    };

    this.setSingletonProvider = function(singleton, fn) {
        _variables.singletons[singleton] = fn();
    };

    this.getHttpServer = function() {
        return _http;
    };

    this.getExpressInstance = function() {
        return _app;
    };

    this.getSessionMiddleware = function() {
        return _session;
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

        _session = session({
            name: config.sessionCookieName || defaults.sessionCookieName,
            secret: config.cookieSecret || defaults.cookieSecret,
            resave: true,
            saveUninitialized: true,
            store: config.sessionStore || defaults.sessionStore
        });


        return self;
    };

    this.boot = function(cb) {
        if(!util.exists(config)) {
            throw new Error("Config is not set");
        }
        init();
        _http.listen(config.port, cb.bind(self));
        return self;
    };

})();