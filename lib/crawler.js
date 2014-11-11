 /**
 * node-crawler
 * https://github.com/larryaubstore/node-cache/ 
 *
 * Copyright 2014 Laurence Morin-Daoust
 * Released under the MIT license
 */

    var request = require('./request'), 
    fs = require("fs"),
    _ = require('underscore'),
    crypto = require('crypto'), 
    robots = require('robots'), 
    urlparser = require('url'),
    util = require('util');


var crawler = function(options) {

    var self = this;

    //Default options
    self.options = _.extend({
        loadstatic:     false,
        loadstaticDirectory: "/tmp",
        checkrobotsTXT: true,
        name: 'Cribellatae'
    },options);


    if(self.options.loadstatic == true) {
      if(!fs.lstatSync(self.options.loadstaticDirectory).isDirectory()) {
        throw "loadstaticDirectory: " + self.options.loadstaticDirectory + " is not a directory";
      }

      var lastcharacter = self.options.loadstaticDirectory.substr(self.options.loadstaticDirectory.length - 1);
      if(lastcharacter != '/') {
        self.options.loadstaticDirectory += '/';
      }
    }

    self.robotparser = new robots.RobotsParser(null, self.options.name);
    self.externalrequest = request;

    self.oldrequest = function(item, callback) {
      self.options.uri = item;
      self.loadstatic(self.options, function (err, response) {
        if(response) {
          if(typeof(callback) !== "undefined") {
            callback(err, response);
          } else {
            self.options.callback(err, response);
          }
        } else {
          self.externalrequest(item, function (error, response, body) {
            if (!error && response.statusCode == 200) {
              self.writeStaticCache(item, response, function(err) {
                if(err) {
                  throw err;
                }
                callback(null, response);
              });
            } else {
              debugger;
              callback("err", null);
            }
          });
        }
      });
    };


    self.request = self.queue = function (item, callback) {
      if(self.options.checkrobotsTXT == true && item.indexOf("robots.txt") == -1) {
        var parser = urlparser.parse(item);
        var roboturl = "http://" + parser.hostname + "/robots.txt";

        console.log(util.inspect(process.memoryUsage()));

        self.robotparser.setUrl(roboturl, function(parser, success) {
          if(success) {
            parser.canFetch('*', item, function (access) {
              if (access) {
                console.log("**** AUTHORIZED ****" + item);
                self.oldrequest(item, function (err, response) {
                  if(err) {
                    self.options.callback("err", null); 
                  } else {
                    self.options.callback(null, response); 
                  }
                });
              } else {
                console.log("**** NOT               AUTHORIZED ****");
                self.options.callback("err", null); 
              }
            });
          } else {
            console.log("**** NOT               AUTHORIZED ****");
            self.options.callback("err", null); 
          }
        });
      } else {
        self.oldrequest(item, callback);
      } 
    };

    self.sha256 = function (pwd) {
      var hash;
      var shasum = crypto.createHash('sha256');
      shasum.update(pwd, "utf8");
      hash = shasum.digest("hex");
      return hash;
    };

    self.getStaticFilename = function (opts) {
      var staticFilename = "";
      if(opts && opts.uri) {
        staticFilename = self.options.loadstaticDirectory +  self.sha256(opts.uri) + ".data";
      }
      return staticFilename;
    }

    self.getStaticFilenameInfo = function (opts) {
      var staticFilename = "";
      if(opts && opts.uri) {
        staticFilename = self.options.loadstaticDirectory +  self.sha256(opts.uri) + ".url";
      }
      return staticFilename;
    }

    self.checkIfFileExists = function (opts, callback, staticFilename) {
    
      fs.readFile(staticFilename, "utf8",  function (err, data) {
        if(!err) {
          var response = {};
          response.body = data;
          console.log("***************************** FILE FROM CACHE ***********************************");
          callback(null, response);
        } else {
          callback();
        }
      });
    };


    self.readstaticfile = function (opts, callback) {
      var staticFilename = self.getStaticFilename(opts); 
      self.checkIfFileExists(opts, callback, staticFilename);
    };

    self.loadstatic = function (opts, callback) {
      if(self.options.loadstatic == true) {
        self.readstaticfile(opts, callback);
      } else {
        callback();
      }
    };
  
    self.writeStaticCacheAsync = function (staticFilename, staticFilenameInfo, uri, response, callback) {
        fs.exists(staticFilename, function(exists) {
          if (!exists) {
            fs.writeFile(staticFilename, response.body, "utf8",  function(err) {
              callback(err);
            });

            fs.writeFile(staticFilenameInfo, uri, "utf8",  function(err) {
              callback(err);
            });
          }
        });
    }

    self.writeStaticCache = function (uri, response, callback) {
      if(self.options.loadstatic == true) {
        var fs = require('fs');
        var opts = {};
        opts.uri = uri;

        var staticFilename = self.getStaticFilename(opts); 
        var staticFilenameInfo = self.getStaticFilenameInfo(opts); 
        self.writeStaticCacheAsync(staticFilename, staticFilenameInfo, uri, response, callback);
      }
    };


    robots.request = self.request;
};


/* EXPORT */
exports.VERSION = "0.0.1";
exports.Crawler = crawler;
