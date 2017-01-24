'use strict';
module.exports = function(name, fn) {
    if(typeof name == "function") {
        return name;
    }
    return {
        name: name,
        fn: fn
    }
};