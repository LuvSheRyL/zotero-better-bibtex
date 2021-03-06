// Generated by CoffeeScript 1.10.0
Zotero.BetterBibTeX.DebugBridge = {
  namespace: 'better-bibtex',
  methods: {}
};

Zotero.BetterBibTeX.DebugBridge.methods.init = function() {
  if (Zotero.BetterBibTeX.DebugBridge.initialized) {
    return;
  }
  Zotero.BetterBibTeX.DebugBridge.initialized = true;
  Zotero.getActiveZoteroPane().show();
  Zotero.noUserInput = true;
  Zotero.Items.getAll = function(onlyTopLevel, libraryID, includeDeleted) {
    var ids, sql;
    sql = 'SELECT A.itemID FROM items A';
    if (onlyTopLevel) {
      sql += ' LEFT JOIN itemNotes B USING (itemID) LEFT JOIN itemAttachments C ON (C.itemID=A.itemID) WHERE B.sourceItemID IS NULL AND C.sourceItemID IS NULL';
    } else {
      sql += ' WHERE 1';
    }
    if (!includeDeleted) {
      sql += ' AND A.itemID NOT IN (SELECT itemID FROM deletedItems)';
    }
    if (libraryID) {
      sql += ' AND libraryID=? ORDER BY A.itemID';
      ids = Zotero.DB.columnQuery(sql, libraryID);
    } else {
      sql += ' AND libraryID IS NULL ORDER BY A.itemID';
      ids = Zotero.DB.columnQuery(sql);
    }
    return this.get(ids) || [];
  };
  return true;
};

Zotero.BetterBibTeX.DebugBridge.methods.reset = function() {
  var coll, err, item, j, k, key, len, len1, ref, ref1;
  Zotero.BetterBibTeX.DebugBridge.methods.init();
  ref = Zotero.BetterBibTeX.pref.prefs.getChildList('');
  for (j = 0, len = ref.length; j < len; j++) {
    key = ref[j];
    Zotero.BetterBibTeX.pref.prefs.clearUserPref(key);
  }
  Zotero.Items.erase((function() {
    var k, len1, ref1, results;
    ref1 = Zotero.BetterBibTeX.safeGetAll();
    results = [];
    for (k = 0, len1 = ref1.length; k < len1; k++) {
      item = ref1[k];
      results.push(item.id);
    }
    return results;
  })());
  ref1 = Zotero.BetterBibTeX.safeGetAll();
  for (k = 0, len1 = ref1.length; k < len1; k++) {
    item = ref1[k];
    item.erase();
  }
  Zotero.Collections.erase((function() {
    var l, len2, ref2, results;
    ref2 = Zotero.getCollections();
    results = [];
    for (l = 0, len2 = ref2.length; l < len2; l++) {
      coll = ref2[l];
      results.push(coll.id);
    }
    return results;
  })());
  Zotero.Items.emptyTrash();
  Zotero.BetterBibTeX.cache.reset('debugbridge.reset');
  Zotero.BetterBibTeX.serialized.reset('debugbridge.reset');
  Zotero.BetterBibTeX.auto.clear();
  Zotero.BetterBibTeX.keymanager.reset();
  if (Zotero.DB.valueQuery('select count(*) from items') === 0) {
    return true;
  }
  err = JSON.stringify((function() {
    var l, len2, ref2, results;
    ref2 = Zotero.BetterBibTeX.safeGetAll();
    results = [];
    for (l = 0, len2 = ref2.length; l < len2; l++) {
      item = ref2[l];
      results.push(item.toArray());
    }
    return results;
  })());
  throw "reset failed -- Library not empty -- " + err;
};

Zotero.BetterBibTeX.DebugBridge.methods["import"] = function(filename) {
  var file;
  file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
  file.initWithPath(filename);
  Zotero_File_Interface.importFile(file);
  return true;
};

Zotero.BetterBibTeX.DebugBridge.methods.librarySize = function() {
  var count, items, j, len, ref;
  items = {
    references: 0,
    notes: 0,
    attachments: 0
  };
  ref = Zotero.DB.query("select count(*) as nr, case itemtypeID when 1 then 'notes' when 14 then 'attachments' else 'references' end as itemType from items i where not i.itemID in (select d.itemID from deletedItems d) group by 2");
  for (j = 0, len = ref.length; j < len; j++) {
    count = ref[j];
    items[count.itemType] = parseInt(count.nr);
  }
  Zotero.BetterBibTeX.debug('librarySize:', items);
  return items;
};

Zotero.BetterBibTeX.DebugBridge.methods.exportToString = function(translator, displayOptions) {
  var deferred;
  deferred = Q.defer();
  if (translator.substring(0, 3) === 'id:') {
    translator = translator.slice(3);
  } else {
    translator = Zotero.BetterBibTeX.getTranslator(translator);
  }
  Zotero.BetterBibTeX.translate(translator, {
    library: null
  }, displayOptions || {}, function(err, result) {
    if (err) {
      return deferred.reject(err);
    } else {
      return deferred.fulfill(result);
    }
  });
  return deferred.promise;
};

Zotero.BetterBibTeX.DebugBridge.methods.exportToFile = function(translator, displayOptions, filename) {
  var deferred, file, translation;
  translation = new Zotero.Translate.Export();
  file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
  file.initWithPath(filename);
  translation.setLocation(file);
  if (translator.substring(0, 3) === 'id:') {
    translator = translator.slice(3);
  } else {
    translator = Zotero.BetterBibTeX.getTranslator(translator);
  }
  translation.setTranslator(translator);
  displayOptions || (displayOptions = {});
  displayOptions.exportFileData = false;
  translation.setDisplayOptions(displayOptions);
  translation.setLibraryID(null);
  deferred = Q.defer();
  translation.setHandler('done', function(obj, worked) {
    if (worked) {
      return deferred.fulfill(true);
    } else {
      return deferred.reject(!worked);
    }
  });
  translation.translate();
  return deferred.promise;
};

Zotero.BetterBibTeX.DebugBridge.methods.library = function() {
  var deferred, translator;
  translator = Zotero.BetterBibTeX.getTranslator('BetterBibTeX JSON');
  deferred = Q.defer();
  Zotero.BetterBibTeX.translate(translator, {
    library: null
  }, {
    exportNotes: true,
    exportFileData: false
  }, function(err, result) {
    if (err) {
      return deferred.reject(err);
    } else {
      return deferred.fulfill(JSON.parse(result));
    }
  });
  return deferred.promise;
};

Zotero.BetterBibTeX.DebugBridge.methods.setPreference = function(name, value) {
  return Zotero.Prefs.set(name, value);
};

Zotero.BetterBibTeX.DebugBridge.methods.keyManagerState = function() {
  return Zotero.BetterBibTeX.DB.keys.find();
};

Zotero.BetterBibTeX.DebugBridge.methods.cacheState = function() {
  return Zotero.BetterBibTeX.DB.cache.find();
};

Zotero.BetterBibTeX.DebugBridge.methods.serializedState = function() {
  return Zotero.BetterBibTeX.serialized.items;
};

Zotero.BetterBibTeX.DebugBridge.methods.cacheStats = function() {
  return {
    serialized: Zotero.BetterBibTeX.serialized.stats,
    cache: Zotero.BetterBibTeX.cache.stats
  };
};

Zotero.BetterBibTeX.DebugBridge.methods.find = function(attribute, value, select) {
  var attempt, i, id, j, selected, sql, zoteroPane;
  attribute = attribute.replace(/[^a-zA-Z]/, '');
  sql = "select i.itemID as itemID from items i join itemData id on i.itemID = id.itemID join itemDataValues idv on idv.valueID = id.valueID join fields f on id.fieldID = f.fieldID where f.fieldName = '" + attribute + "' and not i.itemID in (select itemID from deletedItems) and idv.value = ?";
  id = Zotero.DB.valueQuery(sql, [value]);
  if (!id) {
    throw new Error("No item found with " + attribute + " = '" + value + "'");
  }
  id = parseInt(id);
  if (!select) {
    return id;
  }
  for (attempt = j = 1; j <= 10; attempt = ++j) {
    Zotero.BetterBibTeX.debug("select: " + id + ", attempt " + attempt);
    zoteroPane = Zotero.getActiveZoteroPane();
    zoteroPane.show();
    if (!zoteroPane.selectItem(id, true)) {
      continue;
    }
    selected = (function() {
      var k, len, ref, results;
      ref = zoteroPane.getSelectedItems(true);
      results = [];
      for (k = 0, len = ref.length; k < len; k++) {
        i = ref[k];
        results.push(parseInt(i));
      }
      return results;
    })();
    if (selected.length === 1 && id === selected[0]) {
      return id;
    }
    Zotero.BetterBibTeX.debug("select: expected " + (JSON.stringify([id])) + ", got " + (JSON.stringify(selected)));
  }
  throw new Error("failed to select " + id);
};

Zotero.BetterBibTeX.DebugBridge.methods.remove = function(id) {
  return Zotero.Items.trash([id]);
};

Zotero.BetterBibTeX.DebugBridge.methods.selected = function(action) {
  var zoteroPane;
  Zotero.BetterBibTeX.keymanager.selected(action);
  zoteroPane = Zotero.getActiveZoteroPane();
  return zoteroPane.getSelectedItems();
};

Zotero.BetterBibTeX.DebugBridge.methods.autoExports = function() {
  var exports;
  exports = [];
  return exports;
};

Zotero.BetterBibTeX.DebugBridge.methods.cayw = function(picks, format) {
  var deferred, doc, picker;
  doc = new Zotero.BetterBibTeX.CAYW.Document({
    format: format
  });
  deferred = Q.defer();
  picker = new Zotero.BetterBibTeX.CAYW.CitationEditInterface(deferred, {
    format: format
  }, doc);
  picker.citation = {
    citationItems: picks,
    properties: {}
  };
  picker.accept();
  return deferred.promise;
};
