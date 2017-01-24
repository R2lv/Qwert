'use strict';
exports.exists = function(v) {
    return typeof v != "undefined";
};

exports.mergeObjects = function(obj1, obj2) {
    for(var key in obj2) {
        obj1[key] = obj2[key];
    }
    return obj1;
};

exports.getFnArgumentNames = function(fn) {
    if(typeof fn == "function") {
        var argsStr = fn.toString().match(/\((.*)\)/);
        if(argsStr[1] && argsStr[1].trim() != "") {
            return argsStr[1].split(",").map(function(e){return e.trim()});
        }
    }
    return [];
};