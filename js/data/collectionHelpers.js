MusicTab.namespace('MusicTab.Data.CollectionHelpers');

MusicTab.Data.CollectionHelpers.removeTab = function (tab, callback) {
    MusicTab.Data.db.open({ server: "TabsDb", version: 1 }).done(function(server) {
        server.tabs.remove(tab.id);

        MusicTab.Data.removeFromList(function (i) {
            return i.id == tab.id;
        }, true);
        
        // delete tab from recent
        if (tab.originalId) {
            MusicTab.Data.removeFromList(function(i) {
                return i.id == tab.originalId;
            }, true);
            server.tabs.remove(tab.originalId);
        }

        else {
            // remove recent tab if present
            var recent = MusicTab.Data.removeFromList(function(i) {
                return i.originalId && i.originalId == tab.id;
            }, true);
            if (recent) {
                server.tabs.remove(recent.id);
            }
        }
        
        MusicTab.Helpers.rootFolder.getFileAsync(tab.path).done(function (file) {
            file.deleteAsync();
        });

        callback();
    });
};

MusicTab.Data.CollectionHelpers.addToRecent = function(tab) {
    MusicTab.Data.db.open().done(function(server) {
        server.query("groups").filter("key", "!").execute().done(function(results) {
            if (results.length > 0) {
                var group = results[0];

                //check whether tab exists in recent group
                var exists = false;
                var items = MusicTab.Data.getItemsFromGroup(group);
                items.forEach(function(i) {
                    if (i.originalId == tab.id) {
                        exists = true;
                    }
                });

                var addToRecentClosure = function() {
                    var copy = MusicTab.Data.CollectionHelpers.cloneTab(tab);
                    copy.groupId = group.id;
                    copy.group = group;
                    copy.originalId = tab.id;
                    copy.groupTitle = tab.group.title;
                    copy.groupImage = tab.group.backgroundImage;
                    server.tabs.add(copy).done(function(i) {
                        MusicTab.Data.getItemsFromGroup(group).push(i[0]);
                    });
                };

                if (tab.groupId != group.id && !exists) {
                    if (items.length >= Windows.Storage.ApplicationData.current.roamingSettings.values["recent"]) {
                        var previous = MusicTab.Data.removeFromList(function(i) {
                            return i.groupId == group.id;
                        }, true);
                        if (previous) {
                            server.tabs.remove(previous.id).done(function() {
                                addToRecentClosure();
                            });
                        }
                    } else {
                        addToRecentClosure();
                    }
                }
            }
        });
    });
};

// clones all properties except id, group, groupId
MusicTab.Data.CollectionHelpers.cloneTab = function(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr) && attr != "id" && attr != "group" && attr != "groupId") copy[attr] = obj[attr];
    }
    return copy;
}