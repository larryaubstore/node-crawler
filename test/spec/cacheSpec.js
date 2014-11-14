var Crawler = require("../../lib/crawler.js").Crawler;
var request = require("../../lib/request");

describe("Cache tests", function () {

  var mockrequest = function (url, callback) {
    callback(null, {body: "#\nUser-agent: *\nAllow: *\n", statusCode: 200}, "#\nUser-agent: *\nAllow: *\n");
  };

  it("function is defined", function () {

    console.log("TEST ==> function is defined");
    var crawler = new Crawler({
      "loadstatic": true,
      "callback":function(error,result,$) {
      }
    });

    expect(crawler.options.loadstatic).toEqual(true);
    expect(crawler.loadstatic).not.toBeUndefined();
  });


  it("get static filename", function () {
    console.log("TEST ==> get static filename");

    var crawler = new Crawler({
      "loadstatic": true,
      "loadstaticDirectory": "/tmp/"
    });

    expect(crawler.getStaticFilename).not.toBeUndefined();

    var opts = {};
    opts.uri = "http://www.google.com";

    var sha256 = crawler.sha256(opts.uri);
    var staticFilename = crawler.getStaticFilename(opts);
    expect(staticFilename).toEqual("/tmp/" + sha256 + ".data");

  });

  it("test basic workflow", function () {
    console.log("TEST ==> test basic workflow");
    var callbackCalled = false;
    var crawler = new Crawler({
      "loadstatic": true,
      request: mockrequest
    });

    spyOn(crawler, "loadstatic").andCallFake(function(param1, param2) {
      if(crawler.loadstatic.calls.length == 1) {
        expect(param1.uri).toEqual("http://www.google.com/robots.txt");
        expect(typeof(param2)).toEqual("function");
        param2(null,  {body: "EMPTY BODY", statusCode: 200});
      } else if(crawler.loadstatic.calls.length == 2) {
        expect(param1.uri).toEqual("http://www.google.com");
        expect(typeof(param2)).toEqual("function");
        param2(null,  {body: "EMPTY BODY", statusCode: 200});
      }
    });


    crawler.queue("http://www.google.com",function(err, resp) {
    
    });    


    waitsFor(function () {
      return crawler.loadstatic.calls.length == 2
    }, "Load static never called two times", 2000);


  });


  it("test write cache", function () {
    console.log("TEST ==> test write cache");
    var crawler = new Crawler({
      "loadstatic": true,
      "loadstaticDirectory": "test/spec/dummydata/"
    });

    spyOn(crawler, "writeStaticCacheAsync").andCallFake(function () {});
    crawler.writeStaticCache("http://www.google.com/index.html", "<HTML><BODY></BODY></HTML>");

    expect(crawler.writeStaticCacheAsync).toHaveBeenCalled();
    expect(crawler.writeStaticCacheAsync.calls[0].args[0]).toEqual("test/spec/dummydata/" + crawler.sha256("http://www.google.com/index.html") + ".data");
    expect(crawler.writeStaticCacheAsync.calls[0].args[1]).toEqual("test/spec/dummydata/" + crawler.sha256("http://www.google.com/index.html") + ".url");

  });

  it("test robots.txt with files already cached", function () {
    
    console.log("TEST ==> test robots.txt with files already cached");
    var crawler = new Crawler({
      "loadstatic": true,
      "loadstaticDirectory": "test/spec/dummydata/",
      checkrobotsTXT: true,
      request: mockrequest
    });

    spyOn(crawler, "loadstatic").andCallFake(function(opts, callback) {

      if(opts.uri == "http://www.hamelia.com") {
        callback(null, {body: "<HTML><BODY></BODY></HTML>"});
      } else if(opts.uri == "http://www.hamelia.com/robots.txt") {
        callback(null, {body: "#\nUser-agent: *\nAllow: *\n"}); 
      }    
    }); 

    spyOn(crawler.robotparser, "setUrl").andCallThrough();
    spyOn(crawler.robotparser, "canFetch").andCallThrough();


    crawler.queue("http://www.hamelia.com", function(err, response) {

    });


    waitsFor(function () {
      return crawler.loadstatic.calls.length == 2;
    }, "Load static never called two times", 2000);

    runs(function () {
      expect(crawler.robotparser.setUrl.call.length).toEqual(1);
      expect(crawler.robotparser.canFetch.call.length).toEqual(1);
    });
  });

  it("test robots.txt with files not already cached", function () {
    console.log("TEST ==> test robots.txt with files not already cached");
    var crawler = new Crawler({
      "loadstatic": true,
      "loadstaticDirectory": "test/spec/dummydata/",
      checkrobotsTXT: true,
      request: mockrequest
    });

    spyOn(crawler, "loadstatic").andCallFake(function(opts, callback) {

      if(opts.uri == "http://www.hamelia.com") {
        callback();
      } else if(opts.uri == "http://www.hamelia.com/robots.txt") {
        callback(); 
      }    
    }); 

    spyOn(crawler.robotparser, "setUrl").andCallThrough();
    spyOn(crawler.robotparser, "canFetch").andCallThrough();
    spyOn(crawler, "writeStaticCache").andCallFake(function(uri, response, callback) {
      callback(null);
    });


    crawler.queue("http://www.hamelia.com", function (err, response) {

    });


    waitsFor(function () {
      return crawler.loadstatic.calls.length == 2;
    }, "Load static never called two times", 2000);


    var timeout = false;
    runs(function() {
      setTimeout(function() {
        timeout = true;
      }, 1000);
    });
   
    waitsFor(function () {
      return timeout == true;
    }, "Timeout never true"); 

    runs(function () {
      expect(crawler.robotparser.setUrl.call.length).toEqual(1);
      expect(crawler.robotparser.canFetch.call.length).toEqual(1);
    });
  });


  it("true crawler test", function () {
    console.log("TEST ==> true crawler test");
    expect(request).toBeDefined();

    var isCalled = false;

    request("http://localhost:3000", function(err, response, body) {
      if(err == null && body) {
        isCalled = true;
      }
    });

    waitsFor(function () {
      return isCalled == true;
    }, "Request never called", 2000);
  });
});
