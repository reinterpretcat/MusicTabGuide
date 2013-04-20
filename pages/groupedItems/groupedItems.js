

(function () {
    "use strict";

    // Track if the adding group was successful
    var groupAdded;
    var appView = Windows.UI.ViewManagement.ApplicationView;
    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    var nav = WinJS.Navigation;
    var ui = WinJS.UI;
    
    // consts
    var defaultDescription = "Try to press 'Search info' button to get information about group from lastfm";
    var defaultBackgroundImage = "images/groups/group_detail.png";
    var defaultGroupImage = "images/groups/group_view.png";

    var groupInfo = WinJS.Utilities.markSupportedForProcessing(function groupInfo() {
        return {
            enableCellSpanning: true,
            cellWidth: 280,
            cellHeight: 70
        };
    });

    var OutListViewHeaderTemplate = WinJS.Utilities.markSupportedForProcessing(function OutListViewHeaderTemplate(itemPromise) {
        return itemPromise.then(function (currentItem) {

            var template = document.querySelector(".headertemplate");
            if (currentItem.data.key == "!") {
                template = document.querySelector(".recentHeaderTemplate");
            }
            return template.winControl.render(currentItem.data);
        }).then(function (result) {
                return result;
            });
    });

    var OutListViewTemplate = WinJS.Utilities.markSupportedForProcessing(function OutListViewTemplate(itemPromise) {
        return itemPromise.then(function (currentItem) {
            var template = { };
            if (currentItem.data.temp) {
                template = document.querySelector(".tempItemTemplate");
            }
            else{
                template = document.querySelector(".itemtemplate");
                if (currentItem.data.group && currentItem.data.group.key == "!") {
                    template = document.querySelector(".recentItemTemplate");
                }
            }
            return template.winControl.render(currentItem.data);
        }).then(function (result) {
                return result;
            });
    });

    ui.Pages.define("/pages/groupedItems/groupedItems.html", {
        // Navigates to the groupHeaderPage. Called from the groupHeaders,
        // keyboard shortcut and iteminvoked.
        navigateToGroup: function(key) {
            nav.navigate("/pages/groupDetail/groupDetail.html", { groupKey: key });
        },

        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function(element, options) {
            var semanticZoom = element.querySelector("#zoom").winControl;
            var zoomedInListView = element.querySelector("#zoomedInListView").winControl;
            var zoomedOutListView = element.querySelector("#zoomedOutListView").winControl;

            zoomedOutListView.itemTemplate = element.querySelector(".zoomedOutItemTemplate");
            zoomedOutListView.itemDataSource = MusicTab.Data.groups.dataSource;
            zoomedOutListView.groupDataSource = null;
            zoomedOutListView.layout = new ui.GridLayout({ groupHeaderPosition: "top" });

            zoomedInListView.groupHeaderTemplate = OutListViewHeaderTemplate;//element.querySelector(".headertemplate");
            zoomedInListView.itemTemplate = OutListViewTemplate; //element.querySelector(".itemtemplate");
            zoomedInListView.oniteminvoked = this._itemInvoked.bind(this);

            if (appView.value === appViewState.snapped) {
                // If the app is snapped, configure the zoomed-in ListView
                // to show groups and lock the SemanticZoom control
                zoomedInListView.itemDataSource = MusicTab.Data.groups.dataSource;
                zoomedInListView.groupDataSource = null;
                zoomedInListView.layout = new ui.ListLayout();
                semanticZoom.locked = true;
            } else {
                // If the app isn't snapped, configure the zoomed-in ListView
                // to show items and groups and unlock the SemanticZoom control

                MusicTab.Data.groups.forEach(function (group) {
                    var length = MusicTab.Data.getItemsFromGroup(group).length;
                    group.tabsCount = length;
                });

                zoomedInListView.itemDataSource = MusicTab.Data.items.dataSource;
                zoomedInListView.groupDataSource = MusicTab.Data.groups.dataSource;
                zoomedInListView.layout = new ui.GridLayout({ groupHeaderPosition: "top", groupInfo: groupInfo });
                semanticZoom.locked = false;
            }

            semanticZoom.element.focus();

            document.getElementById("submitGroupButton").addEventListener("click", submitAdd, false);
            document.getElementById("cmdBrowse").addEventListener("click", MusicTab.Helpers.browse, false);
           /* document.getElementById("cmdImport").addEventListener("click", function () {
                MusicTab.Tablatures.Import.run();
            }, false);*/
            document.getElementById("addGroupFlyout").addEventListener("afterhide", onDismiss, false);
            document.getElementById("cmdGoToChords").addEventListener("click", function () {
                nav.navigate("/pages/tools/chords/chords.html");
            }, false);
            document.getElementById("cmdGoToFret").addEventListener("click", function () {
                nav.navigate("/pages/tools/fretTrainer/fretTrainer.html");
            }, false);
            document.getElementById("cmdGoToScales").addEventListener("click", function () {
                nav.navigate("/pages/tools/scales/scales.html");
            }, false);
        },

        // This function updates the page layout in response to viewState changes.
        updateLayout: function(element, viewState, lastViewState) {
            /// <param name="element" domElement="true" />
            /// <param name="viewState" value="Windows.UI.ViewManagement.ApplicationViewState" />
            /// <param name="lastViewState" value="Windows.UI.ViewManagement.ApplicationViewState" />

            var semanticZoom = element.querySelector("#zoom").winControl;
            var zoomedInListView = element.querySelector("#zoomedInListView").winControl;

            if (appView.value === appViewState.snapped) {
                zoomedInListView.itemDataSource = MusicTab.Data.groups.dataSource;
                zoomedInListView.groupDataSource = null;
                zoomedInListView.layout = new ui.ListLayout();
                semanticZoom.zoomedOut = false;
                semanticZoom.locked = true;
            } else {
                zoomedInListView.itemDataSource = MusicTab.Data.items.dataSource;
                zoomedInListView.groupDataSource = MusicTab.Data.groups.dataSource;
                zoomedInListView.layout = new ui.GridLayout({ groupHeaderPosition: "top" });
                semanticZoom.locked = false;

            }
        },


        // This function updates the ListView with new layouts
        _initializeLayout: function(listView, viewState) {
            /// <param name="listView" value="WinJS.UI.ListView.prototype" />

            if (viewState === appViewState.snapped) {
                listView.itemDataSource = MusicTab.Data.groups.dataSource;
                listView.groupDataSource = null;
                listView.layout = new ui.ListLayout();
            } else {
                listView.itemDataSource = MusicTab.Data.items.dataSource;
                listView.groupDataSource = MusicTab.Data.groups.dataSource;
                listView.layout = new ui.GridLayout({ groupHeaderPosition: "top" });
            }
        },

        _itemInvoked: function(args) {
            if (appView.value === appViewState.snapped) {
                // If the page is snapped, the user invoked a group.
                var group = MusicTab.Data.groups.getAt(args.detail.itemIndex);
                this.navigateToGroup(group.key);
            } else {
                // If the page is not snapped, the user invoked an item.
                var item = MusicTab.Data.items.getAt(args.detail.itemIndex);
                if (item.temp) {
                    this.navigateToGroup(item.group.key);
                } else {
                    var reference = MusicTab.Data.getItemReference(item);
                    if (reference[2] && reference[2] == "vextab") {
                        nav.navigate("/pages/vextab/vextab.html", { item: reference, index: args.detail.itemIndex });
                    } else {
                        nav.navigate("/pages/stave/stave.html", { item: reference, index: args.detail.itemIndex });
                    }
                   

                }
            }
        }
    });

   // Show errors if any of the text fields are not filled out when the Login button is clicked

    function submitAdd() {
        var error = false;
        var name = document.getElementById("name").value.trim();
        if (name === "") {
            document.getElementById("nameError").innerHTML = "Name cannot be blank";
            document.getElementById("name").focus();
            error = true;
        } else {
            document.getElementById("nameError").innerHTML = "";
        }

        if (!error) {
            groupAdded = true;
            document.getElementById("addGroupFlyout").winControl.hide();
            // add here
            MusicTab.Data.db.open()
                .done(function(server) {
                    // check whether group exists
                    server.query("groups").filter(function(item) {
                        return item.title.toLowerCase() == name.toLowerCase() || name == "!"; //reserved
                    }).execute().done(function (results) {
                        var key = name.toLowerCase();
                        // insert only if it doesn't exist
                        if (results.length == 0) {
                                var insertGroup = function(description, backgroundImage, groupImage) {
                                server.groups.add({
                                    title: name,
                                    key: key,
                                    shortTitle: name,
                                    description: description,
                                    backgroundImage: backgroundImage,
                                    groupImage: groupImage,
                                    tabsCount: 0
                                }).done(function(group) {

                                    MusicTab.Data.items.push({
                                        id: MusicTab.Helpers.getGuid(),
                                        temp: true,
                                        group: group[0],
                                        backgroundImage: "images/actions/add.png",
                                    });

                                    // navigate to the created group
                                    nav.navigate("/pages/groupDetail/groupDetail.html", { groupKey: key });
                                });
                            };

                            var fetcher = new MusicTab.LastFm.Fetcher();
                            fetcher.get(name, function(result) {
                                var description = result.description == "" ? defaultDescription : result.description;
                                var backgroundImage = result.image == null ? defaultBackgroundImage : result.image;
                                var groupImage = result.image == null ? defaultGroupImage : result.image;
                                insertGroup(description, backgroundImage, groupImage);
                            }, function() {
                                insertGroup(defaultDescription, defaultBackgroundImage, defaultGroupImage);
                            });
                        } else {
                            // navigate to exisiting group
                            if (name != "!") {
                                nav.navigate("/pages/groupDetail/groupDetail.html", { groupKey: key });
                            } else {
                                var msgBox = Windows.UI.Popups.MessageDialog("Unable to create group with this name");
                                msgBox.showAsync();
                            }
                            //var msgBox = Windows.UI.Popups.MessageDialog("The group with the same name is already present");
                            //msgBox.showAsync();
        
                        }
                    });
                });
        }
    }

    // On dismiss of the flyout, reset the fields in the flyout

    function onDismiss() {

        // Clear fields on dismiss
        document.getElementById("name").value = "";
        document.getElementById("nameError").innerHTML = "";

        if (!groupAdded) {
            // WinJS.log && WinJS.log("You have not logged in.", "sample", "status");
        }
    }
})();

