'use strict';
const UploadedFile = require('./UploadedFile');
module.exports = function(req) {

    var _files = new Map();

    function construct() {
        for (let field in req.files) {
            _files.set(field, []);
            req.files[field].forEach(function (file) {
                _files.get(field).push(new UploadedFile(file))
            });
        }
    }
    construct();

    this.has = function(field) {
        return _files.has(field);
    };

    this.getLength = function(field) {
        return _files.has(field) ? _files.get(field).length : 0;
    };

    this.get = function(field) {
        return _files.get(field) || null;
    };

    this.getOne = function(field) {
        return _files.has(field) ? _files.get(field)[0] || null : null;
    };

    this.getMap = function() {
        return _files;
    };

    this.forEach = function(cb) {
        _files.forEach(function(items) {
            items.forEach(cb);
        });
    };

};