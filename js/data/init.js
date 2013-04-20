(function () {
    "use strict";
    var serverName = "TabsDb";
    var recentGroupKey = "!";
    var list = new WinJS.Binding.List();
    var groupedItems = list.createGrouped(
        function groupKeySelector(item) { return item.group.key; },
        function groupDataSelector(item) { return item.group; }
    );

    function initialize() {
        var signal = new MusicTab.Data.Signal();

        //window.indexedDB.deleteDatabase(serverName, 1);
        MusicTab.Data.db.open({
            server: serverName,
            schema: createSchema,
            version: 1
        }).done(function (s) {
            // s.query("groups")
            //.filter("title", "A Christmas Carol")
            //  .filter(function (item) {
            //      return item.title == "A Christmas Carol"
            //  })
            //    .execute()
            //   .done(function (results) {
            //        debugger;
            //    });
            
            // NOTE Emulate join
            // TODO refactor this
            s.query("groups").execute()
              .done(function (groups) {
                  s.query("tabs").execute()
                  .done(function (tabs) {                  
                      tabs.forEach(function (tab) {
                          // replace group string with group object
                          var groupId = tab.groupId;
                          groups.forEach(function (item) {
                              if (item.id == groupId) {
                                  tab.group = item;
                                  item.tabsCount++;
                              }
                          });
                          /* var newFileName = MusicTab.Helpers.getGuid();
                          var path = tab.path;
                          tab.path = newFileName;*/
                          list.push(tab);
                          //copy tab file to local
                          MusicTab.Helpers.copyFileToAppDataFolder(tab.path, MusicTab.Helpers.rootFolder, tab.path);
                      });
                      
                      // NOTE cleanup groups which haven't any tab and create recent group
                      var recentGroupExist = false;
                      groups.forEach(function (item) {
                          if (item.tabsCount == 0 && item.key != recentGroupKey) {
                              s.groups.remove(item.id);
                          }
                          if (item.key == recentGroupKey) {
                              recentGroupExist = true;
                          }
                      });
                      if (!recentGroupExist) {
                          createRecentGroup(s);
                      }

                      signal.complete();
                  });
              });

        });
        return signal.promise;
    }


    function createRecentGroup(server) {
        server.groups.add({
            key: recentGroupKey,
            title: "Recent tabs",
            backgroundImage: "images/groups/group_detail.png",
            groupImage: "images/groups/group_view.png"
        });
    }

    function createSchema(evt, complete) {
        var db = evt.target.result;
        // Get the version update transaction handle, since we want to create the schema as part of the same transaction.
        var txn = evt.target.transaction;

        db.createObjectStore("groups", { keyPath: "id", autoIncrement: true });
        db.createObjectStore("tabs", { keyPath: "id", autoIncrement: true });

        // Once the creation of the object stores is finished (they are created asynchronously), log success.
        txn.oncomplete = function (){
            WinJS.log && WinJS.log("Database schema created.", "data", "status");
            loadInitData(db, evt, complete);
        };
    }
    
    function loadInitData(db, evt, complete) {

        WinJS.xhr({ url: "data/data.json" }).then(function (xhr) {
            var data = JSON.parse(xhr.responseText);

            var txn = db.transaction(["groups", "tabs"], "readwrite");
            txn.oncomplete = function () {
                WinJS.log && WinJS.log("Database populated.", "data", "status");
                complete();
            };
            txn.onerror = function () {
                WinJS.log && WinJS.log("Unable to populate database or database already populated.", "data", "error");
                complete();
            };
            txn.onabort = function () {
                WinJS.log && WinJS.log("Unable to populate database or database already populated.", "data", "error");
                complete();
            };

            var groupsStore = { 
                name: "groups",
                value: txn.objectStore("groups")
            };
            var tabsStore = {
                name: "tabs",
                value: txn.objectStore("tabs")
            };

            // insert value to stored collection
            var insert = function(store, item) {
                var result = store.value.add(item);
                result.title = item.title;
                result.onerror = function() {
                    WinJS && WinJS.log("Failed to add to " + store.name + ": " + this.title + ".", "data", "error");
                };
            };

            data.groups.forEach(function (item) {
                insert(groupsStore, item);
            });

            data.tabs.forEach(function (item) {
                insert(tabsStore, item);
            });
        });
    }
    
    WinJS.Namespace.define("MusicTab.Data", {
        list: list,
        items: groupedItems,
        groups: groupedItems.groups,
        getItemReference: getItemReference,
        getItemsFromGroup: getItemsFromGroup,
        getGroupReference: getGroupReference,
        resolveGroupReference: resolveGroupReference,
        resolveItemReference: resolveItemReference,
        initialize: initialize(),
        removeFromList: removeFromList
    });

    function removeFromList(predicate, once, action) {
        var items = [];
        var length = MusicTab.Data.list.length;
        for (var i = 0; i < length; i++) {
            var item = MusicTab.Data.list.getAt(i);
            if (item && predicate(item)) {
                MusicTab.Data.list.splice(i, 1);
                if (action) {
                    action(item);
                }
                if (once) {
                    return item;
                    break;
                }
                else {
                    items.push(item);
                }
            }
        }
    }
    
    // Get a reference for an item, using the group key and item title as a
    // unique reference to the item that can be easily serialized.
    function getGroupReference(group) {
        return group.key;
    }

    // Get a reference for an item, using the group key and item title as a
    // unique reference to the item that can be easily serialized.
    function getItemReference(item) {
        return [item.group.key, item.title, item.type];
    }

    // This function returns a WinJS.Binding.List containing only the items
    // that belong to the provided group.
    function getItemsFromGroup(group) {
        return list.createFiltered(function (item) { return item.group.key === group.key; });
    }

    // Get the unique group corresponding to the provided group key.
    function resolveGroupReference(key) {
        for (var i = 0; i < groupedItems.groups.length; i++) {
            if (groupedItems.groups.getAt(i).key === key) {
                return groupedItems.groups.getAt(i);
            }
        }
    }

    // Get a unique item from the provided string array, which should contain a
    // group key and an item title.
    function resolveItemReference(reference) {
        for (var i = 0; i < groupedItems.length; i++) {
            var item = groupedItems.getAt(i);
            if (item.group.key === reference[0] && item.title === reference[1] && item.type == reference[2]) {
                return item;
            }
        }
    }

})();