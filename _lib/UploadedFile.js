'use strict';

const fs = require("fs");
const path = require("path");

module.exports = function(file) {
    var self = this,
        _currPath = file.path,
        _currName = file.filename;

    this.getOriginalExtension = function() {
        return file.originalname.substring(file.lastIndexOf(".")+1);
    };

    this.getOriginalName = function() {
        return file.originalname;
    };

    this.getCurrentName = function() {
        return _currName;
    };

    this.getCurrentPath = function() {
        return _currPath;
    };

    this.getSize = function() {
        return file.size;
    };

    this.getMimeType = function() {
        return file.mimetype;
    };

    this.getTmpFileName = function() {
        return file.filename;
    };

    this.getLocation = function() {
       return file.destination;
    };

    this.getTmpFilePath = function() {
        return file.path;
    };

    this.move = function(dir, file) {
        if(file) {
            dir = path.join(dir, file);
        }
        fs.renameSync(self.getCurrentPath(), dir);
        _currPath = dir;
        _currName = dir.substring(dir.lastIndexOf("/")+1);
    };

    this.moveAsync = function(dir, file, cb) {
        if(file) {
            dir = path.join(dir, file);
        }
        fs.rename(self.getCurrentPath(), dir, function(err) {
            if(!err) {
                _currPath = dir;
                _currName = dir.substring(dir.lastIndexOf("/") + 1);
            }
            cb(err);
        });
    };

    this.moveAutoName = function(dir, prefix) {
        var name = self.randomName(prefix);
        self.move(path.join(dir, name));
        return name;
    };

    this.moveAutoNameAsync = function(dir, prefix, cb) {
        var name = self.randomName(prefix);
        self.moveAsync(path.join(dir,name), cb.bind(null, name));
    };

    this.delete = function() {
        fs.unlinkSync(self.getCurrentPath());
        _currPath = null;
        _currName = null;
    };

    this.deleteAsync = function(cb) {
        fs.unlink(self.getCurrentPath(), function(err) {
            if(!err) {
                _currName = null;
                _currPath = null;
            }
            cb(err);
        });
    };

    this.read = function() {
        return fs.readFileSync(self.getCurrentPath());
    };

    this.readAsync = function(cb) {
        fs.readFile(self.getCurrentPath(), cb);
    };

    this.isImage = function() {
        return /^image\/([^;\\s]+)/.test(self.getMimeType());
    };

    this.isVideo = function() {
        return /^video\/([^;\\s]+)/.test(self.getMimeType());
    };

    this.isAudio = function() {
        return /^audio\/([^;\\s]+)/.test(self.getMimeType());
    };

    this.randomName = function(prefix) {
        return Date.now()+ (prefix ? "_"+self.getOriginalName() : "."+self.getOriginalExtension());
    }

};