'use strict';
module.exports = function(config) {
    var _controllers = [];
    return {
        add: function(ctrl) {
            _controllers.push(ctrl);
        },
        _get: function() {
            return {
                controllers: _controllers,
                group: {
                    middleware: config.middleware,
                    route: config.route
                }
            };
        },
        route: config.route
    }
};