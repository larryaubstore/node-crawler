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
        name: 'Cribellatae',
        frequency: 100 
    },options);


    if( typeof(self.options.datestamp) === "undefined") {
      throw "datestamp is mandatory";
    }

    if(self.options.loadstatic == true) {
      if(fs.existsSync(self.options.loadstaticDirectory) && !fs.lstatSync(self.options.loadstaticDirectory).isDirectory()) {
        throw "loadstaticDirectory: " + self.options.loadstaticDirectory + " is not a directory";
      }

      var lastcharacter = self.options.loadstaticDirectory.substr(self.options.loadstaticDirectory.length - 1);
      if(lastcharacter != '/') {
        self.options.loadstaticDirectory += '/';
      }
    }

    self.finalrequest = function(item, callback) {
      self.getfilename(item, function () { 
        self.options.uri = item;
        self.loadstatic(self.options, function (err, response) {
          if(response) {
            callback(err, response);
          } else {

            // frequency
            setTimeout(function () {
              request(item, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                  self.writeStaticCache(item, response, function(err) {
                    if(err) {
                      throw err;
                    }
                    callback(null, response);
                  });
                } else {
                  callback("err", null);
                }
              });
            }, self.options.frequency);
          }
        });
      });
    };

    self.robotparser = new robots.RobotsParser(null, self.options.name, self.finalrequest);


    self.queue = function (item, callback) {

      if(typeof(callback) === "undefined") {
        throw "No callback defined.";
      }


      if(self.options.checkrobotsTXT == true && item.indexOf("robots.txt") == -1) {
        var parser = urlparser.parse(item);
        var roboturl = "http://" + parser.hostname + "/robots.txt";

        self.robotparser.setUrl(roboturl, function(parser, success) {
          if(success) {
            parser.canFetch('*', item, function (access) {
              if (access) {
                console.log("**** AUTHORIZED ****" + item);
                self.finalrequest(item, callback);
              } else {
                console.log("**** NOT               AUTHORIZED ****");
                callback("err", null); 
              }
            });
          } else {
            console.log("**** NOT               AUTHORIZED ****");
            callback("err", null); 
          }
        });
      } else {
        self.finalrequest(item, callback);
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
        staticFilename = self.options.finalstaticdirectory + '/' +  self.sha256(opts.uri) + ".data";
      }
      return staticFilename;
    }

    self.getStaticFilenameInfo = function (opts) {
      var staticFilename = "";
      if(opts && opts.uri) {
        staticFilename = self.options.finalstaticdirectory + '/' + self.sha256(opts.uri) + ".url";
      }
      return staticFilename;
    }

    self.checkIfFileExists = function (opts, callback, staticFilename) {
      fs.exists(staticFilename, function(exists) {
        if(exists) {
          fs.readFile(staticFilename, "utf8",  function (err, data) {
            if(!err) {
              var response = {};
              response.body = data;
              console.log("***************************** FILE FROM CACHE ***********************************");
              callback(null, response);
            } else {
              throw err;
            }
          });
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
              if(err) {
                callback(err);
              } else {
                callback();
              }
            });

            fs.writeFile(staticFilenameInfo, uri, "utf8",  function(err) {
              if(err) {
                throw err;
              } else {
                callback();
              }
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

    self.createIfNotExists = function (name, datestamp, callback) {

      var directory = self.options.loadstaticDirectory + name;
      self.options.finalstaticdirectory = directory + '/' + datestamp;
      fs.exists(directory, function(exists) {
        if(exists == true) { 
          console.log("dir already exists ==> " + directory);
          fs.exists(directory + '/' + datestamp, function(exists) {
            if(exists == false) {
              fs.mkdir(directory + '/' + datestamp, function (err) {
                if(err) {
                  throw err;
                } else {
                  callback();
                }
              });
            } else {
              callback();
            }
          });
        } else {
          console.log("create dir ==> " + directory);
          fs.mkdir(directory, function (err) {
            console.log("dir created ==> " + directory);
            if(err) {
              throw err;
            } else {
              fs.mkdir(directory + '/' + datestamp, function (err) {
                if(err) {
                  throw err;
                } else {
                  callback();
                }
              });
            }
          });
        }
      });
    };

    self.getfilename = function (href, callback) {

      var urlparsed = urlparser.parse(href);
      var datestamp = self.options.datestamp;

      self.createIfNotExists(urlparsed.host, datestamp, function () {
        callback();
      });
    };



    robots.request = self.request;
};


/* EXPORT */
exports.VERSION = "0.0.1";
exports.Crawler = crawler;
