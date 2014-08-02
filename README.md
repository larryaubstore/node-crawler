node-crawler
============

A 200 hundred lines node.js crawler that follows robots.txt convention. Possibility to store files for tests.


# Usage

## Instantiation

```javascript
  var crawler = new Crawler({ 
    loadstatic:     false,
    loadstaticDirectory: "/tmp",
    checkrobotsTXT: true
    "callback":function(error,result,ignore) {
      if(result && result.body && result.body.length > 0) { 

      }
    }
  });

  crawler.queue("https://github.com/larryaubstore/node-crawler");

```


## Options

  * loadstatic: If url had been crawled before, the crawler load it from hard disk.
  * loadstaticDirectory: The directory where to store crawled urls.
  * checkrobotsTXT: if true, the crawler will follow the 'robots.txt' convention. 
