var http = require('http');
var url  = require('url');

var wrapper  = function () {
  var self = this;

  self.protocol_wrapper = http.request;
  self.request = function (urlparam, callback) {

    self.callback = callback;
    self.resp = '';
    self.data = '';

    self.urlparsed = url.parse(urlparam);

    self.options = {
      host: self.urlparsed.hostname,
      port: self.urlparsed.port ? self.urlparsed.port : 80,
      path: self.urlparsed.path
    };

    self.myrequest = self.protocol_wrapper(self.options, function(res) {

      self.res = res;

      if(self.res.statusCode == 200 
        && self.res.headers['content-type'] 
        && ( self.res.headers['content-type'].indexOf("text/html") > -1 ||
             self.res.headers['content-type'].indexOf("text/plain") > -1)) {

        self.res.on('data', function(d) {
          self.data = self.data + d;
        });

        self.res.on('end', function() {
          var finalresponse = {};
          finalresponse.body = self.data;
          finalresponse.statusCode = 200;
          self.callback(null, finalresponse, self.data); 
        });
      } else {
        self.callback("err");
      }
    });

    self.myrequest.on('error', function (e) {
      self.callback(e);
    });

    // Start the request
    self.myrequest.end();
  };
};

var instance = new wrapper();
module.exports = instance.request; 
