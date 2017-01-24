'use strict';
const multer = require("multer");

module.exports = function(options) {

    var up = multer(options);

    this.accept = function(fields) {
        if(Array.isArray(fields)) {
            fields = fields.map(function(field) {
                if(typeof field == "string") {
                    return {name: field};
                }
                return field;
            });
            return up.fields(fields);
        }
        return up.fields([]);
    };

    this.none = function() {
        return up.fields([]);
    }

};