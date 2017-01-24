'use strict';
module.exports = function(name, fn) {
    return {
        name: name,
        model: fn
    };
};