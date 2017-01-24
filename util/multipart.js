'use strict';
module.exports = {
        files: function() {
            var args = Array.prototype.slice.apply(arguments);
            return function ($upload, $next) {
                $upload(args).then($next);
            }
        },
        data: function() {
            return function ($upload, $next) {
                $upload([]).then($next);
            }
        }
};