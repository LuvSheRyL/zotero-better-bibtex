// Generated by CoffeeScript 1.10.0
Zotero.BetterBibTeX.endpoints = {};

Zotero.BetterBibTeX.endpoints.collection = {
  supportedMethods: ['GET']
};

Zotero.BetterBibTeX.endpoints.collection.init = function(url, data, sendResponseCallback) {
  var child, children, col, collection, deferred, err, error, error1, i, j, key, len, len1, libid, name, path, translator;
  try {
    collection = url.query[''];
  } catch (error) {
    err = error;
    collection = null;
  }
  if (!collection) {
    sendResponseCallback(501, 'text/plain', 'Could not export bibliography: no path');
    return;
  }
  try {
    path = collection.split('.');
    if (path.length === 1) {
      sendResponseCallback(404, 'text/plain', "Could not export bibliography '" + collection + "': no format specified");
      return;
    }
    translator = path.pop();
    path = path.join('.');
    if (path.charAt(0) !== '/') {
      path = "/0/" + path;
    }
    path = path.split('/');
    path.shift();
    libid = parseInt(path.shift());
    if (isNaN(libid)) {
      throw "Not a valid library ID: " + collectionkey;
    }
    key = '' + path[0];
    col = null;
    for (i = 0, len = path.length; i < len; i++) {
      name = path[i];
      children = Zotero.getCollections(col != null ? col.id : void 0, false, libid);
      col = null;
      for (j = 0, len1 = children.length; j < len1; j++) {
        child = children[j];
        if (child.name.toLowerCase() === name.toLowerCase()) {
          col = child;
          break;
        }
      }
      if (!col) {
        break;
      }
    }
    col || (col = Zotero.Collections.getByLibraryAndKey(libid, key));
    if (!col) {
      throw collectionkey + " not found";
    }
    deferred = Q.defer();
    Zotero.BetterBibTeX.translate(Zotero.BetterBibTeX.getTranslator(translator), {
      collection: col
    }, Zotero.BetterBibTeX.displayOptions(url), function(err, result) {
      if (err) {
        return deferred.reject(err);
      } else {
        return deferred.fulfill(result);
      }
    });
    return sendResponseCallback(200, 'text/plain', deferred.promise);
  } catch (error1) {
    err = error1;
    Zotero.BetterBibTeX.log("Could not export bibliography '" + collection, err);
    return sendResponseCallback(404, 'text/plain', "Could not export bibliography '" + collection + "': " + err);
  }
};

Zotero.BetterBibTeX.endpoints.library = {
  supportedMethods: ['GET']
};

Zotero.BetterBibTeX.endpoints.library.init = function(url, data, sendResponseCallback) {
  var deferred, err, error, error1, format, libid, library, params, translator;
  try {
    library = url.query[''];
  } catch (error) {
    err = error;
    library = null;
  }
  if (!library) {
    sendResponseCallback(501, 'text/plain', 'Could not export bibliography: no path');
    return;
  }
  try {
    params = /^\/?([0-9]+)?\/?library.(.*)$/.exec(library);
    libid = params[1];
    format = params[2];
    if (libid && !Zotero.Libraries.exists(libid)) {
      sendResponseCallback(404, 'text/plain', "Could not export bibliography: library '" + library + "' does not exist");
      return;
    }
    if (!format) {
      sendResponseCallback(404, 'text/plain', "Could not export bibliography '" + library + "': no format specified");
      return;
    }
    translator = Zotero.BetterBibTeX.getTranslator(format);
    if (!translator) {
      sendResponseCallback(404, 'text/plain', "Could not export bibliography '" + library + "': unsupported format " + format);
      return;
    }
    deferred = Q.defer();
    Zotero.BetterBibTeX.translate(translator, {
      library: libid
    }, Zotero.BetterBibTeX.displayOptions(url), function(err, result) {
      if (err) {
        return deferred.reject(err);
      } else {
        return deferred.fulfill(result);
      }
    });
    return sendResponseCallback(200, 'text/plain', deferred.promise);
  } catch (error1) {
    err = error1;
    Zotero.BetterBibTeX.log("Could not export bibliography '" + library + "'", err);
    return sendResponseCallback(404, 'text/plain', "Could not export bibliography '" + library + "': " + err);
  }
};

Zotero.BetterBibTeX.endpoints.selected = {
  supportedMethods: ['GET']
};

Zotero.BetterBibTeX.endpoints.selected.init = function(url, data, sendResponseCallback) {
  var deferred, err, error, item, items, translator, zoteroPane;
  try {
    translator = url.query[''];
  } catch (error) {
    err = error;
    translator = null;
  }
  if (!translator) {
    sendResponseCallback(501, 'text/plain', 'Could not export bibliography: no path');
    return;
  }
  zoteroPane = Zotero.getActiveZoteroPane();
  items = Zotero.Items.get((function() {
    var results;
    results = [];
    for (item in zoteroPane.getSelectedItems()) {
      results.push(item.id);
    }
    return results;
  })());
  deferred = Q.defer();
  Zotero.BetterBibTeX.translate(Zotero.BetterBibTeX.getTranslator(translator), {
    items: items
  }, Zotero.BetterBibTeX.displayOptions(url), function(err, result) {
    if (err) {
      return deferred.reject(err);
    } else {
      return deferred.fulfill(result);
    }
  });
  return sendResponseCallback(200, 'text/plain', deferred.promise);
};

Zotero.BetterBibTeX.endpoints.schomd = {
  supportedMethods: ['POST']
};

Zotero.BetterBibTeX.endpoints.schomd.init = function(url, data, sendResponseCallback) {
  var err, error, req, response, result;
  req = JSON.parse(data);
  response = [];
  if (Array.isArray(req)) {
    throw new Error('batch requests are not supported');
  }
  try {
    switch (req.method) {
      case 'citations':
      case 'citation':
      case 'bibliography':
      case 'bibtex':
      case 'search':
        Zotero.BetterBibTeX.keymanager.prime();
        result = Zotero.BetterBibTeX.schomd[req.method].apply(Zotero.BetterBibTeX.schomd, req.params);
        if (typeof (result != null ? result.then : void 0) === 'function') {
          result = result.then(function(result) {
            return JSON.stringify({
              jsonrpc: (req.jsonrpc ? req.jsonrpc : void 0),
              id: (req.id || (typeof req.id) === 'number' ? req.id : null),
              result: result
            });
          })["catch"](function(e) {
            return JSON.stringify({
              jsonrpc: (req.jsonrpc ? req.jsonrpc : void 0),
              id: (req.id || (typeof req.id) === 'number' ? req.id : null),
              result: e.message
            });
          });
        } else {
          result = JSON.stringify({
            jsonrpc: (req.jsonrpc ? req.jsonrpc : void 0),
            id: (req.id || (typeof req.id) === 'number' ? req.id : null),
            result: result
          });
        }
        break;
      default:
        throw "Unsupported method '" + req.method + "'";
    }
  } catch (error) {
    err = error;
    result = JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: 5000,
        message: '' + err + "\n" + err.stack
      },
      id: null
    });
  }
  return sendResponseCallback(200, 'application/json', result);
};

Zotero.BetterBibTeX.endpoints.cayw = {
  supportedMethods: ['GET']
};

Zotero.BetterBibTeX.endpoints.cayw.init = function(url, data, sendResponseCallback) {
  var deferred, doc, io, mode;
  if (url.query.probe) {
    sendResponseCallback(200, 'text/plain', 'ready');
    return;
  }
  doc = new Zotero.BetterBibTeX.CAYW.Document(url.query || {});
  deferred = Q.defer();
  io = new Zotero.BetterBibTeX.CAYW.CitationEditInterface(deferred, url.query || {}, doc);
  if (Zotero.Prefs.get('integration.useClassicAddCitationDialog')) {
    Zotero.Integration.displayDialog(doc, 'chrome://zotero/content/integration/addCitationDialog.xul', 'alwaysRaised,resizable', io);
  } else {
    mode = !Zotero.isMac && Zotero.Prefs.get('integration.keepAddCitationDialogRaised') ? 'popup' : 'alwaysRaised';
    Zotero.Integration.displayDialog(doc, 'chrome://zotero/content/integration/quickFormat.xul', mode, io);
  }
  return sendResponseCallback(200, 'text/plain', deferred.promise);
};

Zotero.BetterBibTeX.endpoints.cacheActivity = {
  supportedMethods: ['GET'],
  init: function(url, data, sendResponseCallback) {
    var dataURL, dp, err, error, timestamp;
    try {
      dataURL = url.query[''];
    } catch (error) {
      err = error;
      dataURL = null;
    }
    if (dataURL) {
      return sendResponseCallback(200, 'text/html', Zotero.File.getContentsFromURL('resource://zotero-better-bibtex/reports/cacheActivity.txt'));
    }
    Zotero.BetterBibTeX.addCacheHistory();
    timestamp = function(date) {
      var dp;
      date = [date.getHours(), date.getMinutes(), date.getSeconds()];
      date = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = date.length; i < len; i++) {
          dp = date[i];
          results.push(('0' + dp).slice(-2));
        }
        return results;
      })();
      return date.join(':');
    };
    data = (function() {
      var i, len, ref, results;
      ref = Zotero.BetterBibTeX.cacheHistory;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        dp = ref[i];
        results.push([timestamp(dp.timestamp), dp.serialized.hit, dp.serialized.miss, dp.serialized.clear, dp.cache.hit, dp.cache.miss, dp.cache.clear]);
      }
      return results;
    })();
    return sendResponseCallback(200, 'application/json', JSON.stringify(data));
  }
};
