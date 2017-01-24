'use strict';
module.exports = function(fn, config) {
    return {
        controller: fn,
        route: config.route,
        method: config.method || "GET",
        middleware: config.middleware
    }
};