var Crawler = require("../../lib/crawler.js").Crawler;

describe("Cache tests", function () {

  it("function is defined", function () {

    var crawler = new Crawler({
      "maxConnections":1,
      "loadstatic": true,
      "callback":function(error,result,$) {
      }
    });

    expect(crawler.options.loadstatic).toEqual(true);
    expect(crawler.loadstatic).not.toBeUndefined();
  });


  it("get static filename", function () {

    var crawler = new Crawler({
      "maxConnections":1,
      "loadstatic": true,
      "loadstaticDirectory": "/temp/"
    });

    expect(crawler.getStaticFilename).not.toBeUndefined();

    var opts = {};
    opts.uri = "http://www.google.com";

    var sha256 = crawler.sha256(opts.uri);
    var staticFilename = crawler.getStaticFilename(opts);
    expect(staticFilename).toEqual("/temp/" + sha256 + ".data");

  });

  it("test basic workflow", function () {
    var callbackCalled = false;
    var crawler = new Crawler({
      "maxConnections":1,
      "loadstatic": true,
      "callback":function(error,result,$) {
        callbackCalled = true;
      }
    });

    spyOn(crawler, "loadstatic").andCallFake(function(param1, param2) {
      expect(param1.uri).toEqual("http://www.google.com");
      expect(typeof(param2)).toEqual("function");
    });

    crawler.queue("http://www.google.com");    

    runs(function () {
      expect(crawler.loadstatic).toHaveBeenCalled();
    });

  });


  it("test write cache", function () {

    var crawler = new Crawler({
      "maxConnections":1,
      "loadstatic": true,
      "loadstaticDirectory": "test/spec/dummydata/"
    });

    spyOn(crawler, "writeStaticCacheAsync").andCallFake(function () {});
    crawler.writeStaticCache("http://www.google.com/index.html", "<HTML><BODY></BODY></HTML>");

    expect(crawler.writeStaticCacheAsync).toHaveBeenCalled();
    expect(crawler.writeStaticCacheAsync.calls[0].args[0]).toEqual("test/spec/dummydata/" + crawler.sha256("http://www.google.com/index.html") + ".data");
    expect(crawler.writeStaticCacheAsync.calls[0].args[1]).toEqual("test/spec/dummydata/" + crawler.sha256("http://www.google.com/index.html") + ".url");

  });

});
