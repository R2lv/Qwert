'use strict';
var express = require("express");

var ExpressRouter = function(app) {
    var self = this;

    self.addController = function(method, route, controller, middleware) {
        method = method.toLowerCase();
        if(ExpressRouter.methods.indexOf(method.toUpperCase()) == -1) {
            throw new Error("Method not allowed: "+method);
        }
        var args;
        if(middleware) {
            args = [route, middleware, controller];
        } else
            args = [route, controller];
        if(Array.isArray(method)) {
            method.forEach(function(method) {
                app[method].apply(app, args);
            });
        } else {
            app[method].apply(app, args);
        }
    };

    self.addControllerGroup = function(path, controllers, middleware) {
        var router = express.Router();

        if(middleware) {
            router.use(middleware);
        }
        app.use(path, router);

        var routes = Object.keys(controllers);
        routes.forEach(function(route) {
            var method = "all";
            var controller = controllers[route];
            var _route;
            if(route.indexOf('$')) {
                var r = route.split("$");
                method = r[0];
                _route = r[1];
            }
            if(ExpressRouter.methods.indexOf(method.toUpperCase()) == -1) {
                throw new Error("Method not allowed: "+method);
            }

            router[method].apply(router, ["/"+_route, controller]);
            if(_route == 'index') {
                router[method].apply(router, ["/", controller]);
            }
        });

    };

};
Object.defineProperty(ExpressRouter, 'method', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: {
        GET: 'get',
        POST: 'post',
        PUT: 'put',
        PATCH: 'patch',
        DELETE: 'delete',
        ALL: 'all'
    }
});
Object.defineProperty(ExpressRouter, 'methods', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: ['GET','POST','PUT','PATCH','DELETE','ALL']
});

module.exports = ExpressRouter;