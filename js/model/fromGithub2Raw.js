;var Github2Raw = (function(){

  var _this_ = {
  };
  
  _this_.parse = function(urlAsString) {
    var ret = {
      url    : null,
      rawUrl : null,
      htmlUrl: null
    }    
    
    if (urlAsString) {
      ret.url = new URL(urlAsString);

      if (ret.url.host.includes("github") && ret.url.host.includes(".sap.corp") ) {
        // e.g. 
        // html : https://github.wdf.sap.corp/production-neo-ondemand-com/geppaequo/blob/develop/ABOUT.md
        // raw  : https://github.wdf.sap.corp/raw/production-neo-ondemand-com/geppaequo/develop/ABOUT.md 

        if (ret.url.pathname.startsWith("/raw")) {
          ret.rawUrl = ret.url;
          
          var splitted = ret.url.pathname.split('/');
          splitted.shift(); // remove "" path segment (just before /raw)
          splitted.shift(); // remove "raw" path segment 
          splitted.unshift(""); // put again "" at start of array
          if (splitted.length > 2) {
              splitted.splice( 3, 0, "blob"); // insert '/blob' path segment after ""/<org-name>/<repo-name> (that is, <0>/<1>/<2> -> 3 )
          }
          var htmlPath = splitted.join("/");
          
          ret.htmlUrl = new URL(htmlPath, ret.url.origin);
        } else if (!ret.url.pathname.startsWith("/pages")) {
          ret.htmlUrl = ret.url;
          
          var splitted = ret.url.pathname.split('/');
          splitted.splice( 1, 0, "raw"); // insert '/raw' path segment after first element ("")
          if (splitted.length > 3) {
              splitted.splice( 4, 1); // remove /blob' path segment after ""/raw/<org-name>/<repo-name>/*blob*  (that is, <0>/<1>/<2>/<3> -> 4 )
          }
          var rawPath = splitted.join("/");

          ret.rawUrl = new URL(rawPath, ret.url.origin);
        } else {
          ret.rawUrl  = ret.url;
          ret.htmlUrl = ret.url;
        } 
      } else if (ret.url.host.includes("github") && ret.url.host.includes(".com") ) {
        // e.g. 
        // html : https://github.com/aequologica/hat/blob/develop/README.md
        // raw  : https://raw.githubusercontent.com/aequologica/hat/develop/README.md

        if (ret.url.host === "raw.githubusercontent.com") {
          ret.rawUrl = ret.url;
          
          var splitted = ret.url.pathname.split('/');
          if (splitted.length > 2) {
              splitted.splice( 3, 0, "blob"); // insert '/blob' path segment after ""/<org-name>/<repo-name> (that is, <0>/<1>/<2> -> 3 )
          }
          var htmlPath = splitted.join("/");
          
          ret.htmlUrl = new URL(htmlPath, "https://github.com");
        } else if (ret.url.host === "github.com") {
          ret.htmlUrl = ret.url;
          
          var splitted = ret.url.pathname.split('/');
          if (splitted.length > 2) {
              splitted.splice( 3, 1); // remove /blob' path segment after ""/<org-name>/<repo-name>/*blob* (that is, <0>/<1>/<2> -> 3 )
          }
          var rawPath = splitted.join("/");

          ret.rawUrl = new URL(rawPath, "https://raw.githubusercontent.com");
        } else {
          ret.rawUrl  = ret.url;
          ret.htmlUrl = ret.url;
        } 
      } 
      
    }
  
    return ret;
  }
  
  return _this_;

})();