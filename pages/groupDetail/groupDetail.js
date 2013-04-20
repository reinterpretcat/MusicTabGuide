(function () {
    "use strict";

    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    var ui = WinJS.UI;
    var items;
    var appBarDiv;
    var appBar;
    var group;
    var imagePath = null;
    var listView;
    
    var ListViewItemTemplate = WinJS.Utilities.markSupportedForProcessing(function ListViewItemTemplate(itemPromise) {
        return itemPromise.then(function (currentItem) {
            var template = {};
            if (currentItem.data.temp) {
                template = document.querySelector(".tempItemTemplate");
            }
            else {
                template = document.querySelector(".itemtemplate");
            }
            return template.winControl.render(currentItem.data);
        }).then(function (result) {
            return result;
        });
    });

    ui.Pages.define("/pages/groupDetail/groupDetail.html", {

        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            appBarDiv = document.getElementById("appBar");
            appBar = document.getElementById('appBar').winControl;
            listView = element.querySelector(".itemslist").winControl;
            group = (options && options.groupKey) ? MusicTab.Data.resolveGroupReference(options.groupKey) : MusicTab.Data.groups.getAt(0);
            
            // NOTE group was removed but application is started from this group
            if(!group) {
                return WinJS.Navigation.navigate(Application.navigator.home);
            }
            items = MusicTab.Data.getItemsFromGroup(group);
            var pageList = items.createGrouped(
                function groupKeySelector(item) { return group.key; },
                function groupDataSelector(item) { return group; }
            );

            element.querySelector("header[role=banner] .pagetitle").textContent = group.title;

            listView.itemDataSource = pageList.dataSource;
            listView.itemTemplate = ListViewItemTemplate;//element.querySelector(".itemtemplate");
            listView.groupDataSource = pageList.groups.dataSource;
            listView.groupHeaderTemplate = element.querySelector(".headertemplate");
            listView.oniteminvoked = this._itemInvoked.bind(this);
            


            this._initializeLayout(listView, Windows.UI.ViewManagement.ApplicationView.value);
            listView.element.focus();

            //listView.selectionChanged = doSelectItem;
            // register  handlers
            document.getElementById("listView").addEventListener("selectionchanged", doSelectItem);
            document.getElementById("cmdGo").addEventListener("click", doClickGo, false);
            document.getElementById("cmdAdd").addEventListener("click", doClickAdd, false);
            //document.getElementById("cmdDelete").addEventListener("click", doClickDelete, false);
            document.getElementById("cmdSelectAll").addEventListener("click", function () {
                listView.selection.selectAll();
            }, false);
            document.getElementById("cmdClearSelection").addEventListener("click", function () {
                listView.selection.clear();
            }, false);

            document.getElementById("confirmDeleteButton").addEventListener("click", doClickDelete, false);
            appBar.hideCommands(appBarDiv.querySelectorAll('.multiSelect'));
            
            document.getElementById("submitEditButton").addEventListener("click", submitEdit, false);
            document.getElementById("chooseImage").addEventListener("click", chooseBackgroundImage, false);
            
            document.getElementById("submitTabEditButton").addEventListener("click", submitTabEdit, false);
            document.getElementById("tabEditFlyout").addEventListener("beforeshow", function () {
                var index = listView.selection.getIndices()[0];
                var item = items.getAt(index);
                document.getElementById("tabTitle").value = item.title;
            }, false);

            document.getElementById("cmdLastfmUpdate").addEventListener("click", lastfmUpdate, false);
            
            document.getElementById("cmdSearchTabs").addEventListener("click", function () {
                WinJS.Navigation.navigate("/pages/websearch/websearch.html", {
                    group: group
                });
            }, false);
            
            document.getElementById("cmdNew").addEventListener("click", function () {
                WinJS.Navigation.navigate("/pages/vextab/vextab.html", { group: MusicTab.Data.getGroupReference(group)});
            }, false);
            
           
            initEdit();
        },

        unload: function () {
            if (items) {
                items.dispose();
            }
        },

        // This function updates the page layout in response to viewState changes.
        updateLayout: function (element, viewState, lastViewState) {
            if (lastViewState !== viewState) {
                if (lastViewState === appViewState.snapped || viewState === appViewState.snapped
                    || lastViewState === appViewState.fullScreenPortrait || viewState == appViewState.fullScreenPortrait
                    ) {
                    var handler = function(e) {
                        listView.removeEventListener("contentanimating", handler, false);
                        e.preventDefault();
                    };
                    listView.addEventListener("contentanimating", handler, false);
                    var firstVisible = listView.indexOfFirstVisible;
                    this._initializeLayout(listView, viewState);
                    if (firstVisible >= 0 && listView.itemDataSource.list.length > 0) {
                        listView.indexOfFirstVisible = firstVisible;
                    }
                }
            }
        },

        // This function updates the ListView with new layouts
        _initializeLayout: function (lv, viewState) {
            /// <param name="lv" value="WinJS.UI.ListView.prototype" />

            if (viewState === appViewState.snapped || viewState === appViewState.fullScreenPortrait) {
                lv.layout = new ui.ListLayout();
            } else {
                lv.layout = new ui.GridLayout({ groupHeaderPosition: "left" });
            }
        },

        _itemInvoked: function (args) {
            var item = items.getAt(args.detail.itemIndex);
            if (item.temp) {
                listView.selection.clear();
                doClickAdd();
            }
        }
    });
    


    /* AppBar functions */
    
    function doClickGo() {
        var index = document.getElementById("listView").winControl.selection.getIndices()[0];
        var item = items.getAt(index);
        if (item.type && item.type == "vextab") {
            WinJS.Navigation.navigate("/pages/vextab/vextab.html", {
                item: MusicTab.Data.getItemReference(item)
            });
        } else {
            WinJS.Navigation.navigate("/pages/stave/stave.html", {
                item: MusicTab.Data.getItemReference(item),
                index: index
            });
        }
    }

    function doClickAdd() {
       
        var picker = Windows.Storage.Pickers.FileOpenPicker();
        picker.fileTypeFilter.replaceAll(MusicTab.Helpers.getSupportedFormats());
        picker.viewMode = Windows.Storage.Pickers.PickerViewMode.list;
        picker.commitButtonText = "Add";

        // Launch the picker in open mode
        picker.pickMultipleFilesAsync().then(function (files) {

            if (files && files.length>0) {
                
                // contains only temp tab
                var first = items.getAt(0);
                if (isTempOnly()) {
                    MusicTab.Data.removeFromList(function (i) {
                        return i.temp && i.id == first.id;
                    }, true);
                }
                MusicTab.Data.db.open().done(function (server) {
                    files.forEach(function (file) {
                        // Application now has read/write access to the picked file
                        WinJS.log && WinJS.log("Picked file: " + file.name, "data", "status");
                        var fileName = MusicTab.Helpers.getGuid();
                        var tab = {
                            path: fileName,
                            added: (new Date()).toDateString(),
                            title: file.name.replace(/\.[^/.]+$/, ""),
                            backgroundImage: getTabImage(file.fileType),
                            tileImage: getTabImage(file.fileType),
                            details: [],
                            groupId: group.id,
                            rating: 0
                        };

                        server.tabs.add(tab).done(function (inserted) {
                            tab.id = inserted[0].id;
                            tab.group = group;
                            items.push(tab);
                            //copy tab file to local
                            file.copyAsync(MusicTab.Helpers.rootFolder, fileName, Windows.Storage.NameCollisionOption.replaceExisting);
                        });
                       
                    });
                });

            } else {
                // The picker was dismissed with no selected file
                WinJS.log && WinJS.log("Operation cancelled.", "data", "status");
            }
        });
    }

    function isTempOnly() {
        return items.length >= 1 && items.getAt(0).temp;
    }

    function getTabImage(fileType) {
        switch (fileType) {
            case ".xml":
                return "images/items/musicxml.png";
            case ".gp3":
                return "images/items/guitarpro3.png";
            case ".gp4":
                return "images/items/guitarpro4.png";
            case ".gp5":
                return "images/items/guitarpro5.png";
            case ".gpx":
                return "images/items/guitarprox.png";
        }
    }

    function doClickDelete() {
        WinJS.log && WinJS.log("Delete button pressed", "data", "status");
        if (listView.selection.count() > 0) {
            MusicTab.Data.db.open().done(function(server) {
                var indices = listView.selection.getIndices();
                for (var i = indices.length - 1; i >= 0; i--) {
                    var item = items.getAt(indices[i]);
                    try {
                        if (item.temp) {
                            throw "tmp";
                        }
                        server.tabs.remove(item.id);
                        MusicTab.Helpers.rootFolder.getFileAsync(item.path).done(function(file) {
                            file.deleteAsync();
                        });
                        items.splice(indices[i], 1);

                        // remove recent tab if present
                        var recent = MusicTab.Data.removeFromList(function (el) {
                            return el.originalId && el.originalId == item.id;
                        }, true);
                        if (recent) {
                            server.tabs.remove(recent.id);
                        }                        

                        
                    } catch (err) {
                        var message = "Unable to delete tab: " + err.message;
                        if (item.temp) {
                            message = "Temporary tab will be removed automatically";
                        }

                        var msgBox = Windows.UI.Popups.MessageDialog(message);
                        msgBox.showAsync();
                    }
                    
                }
                document.getElementById("deleteFlyout").winControl.hide();
                document.getElementById("appBar").winControl.hide();
                //WinJS.Navigation.back();
            });
        }

    }
   
    /* ListView functions */
    function doSelectItem() {
        var count = listView.selection.count();
        if (count > 0) {
            appBar.showCommands(appBarDiv.querySelectorAll('.multiSelect'));
            // Show selection commands in AppBar
            if (count != 1) {
                appBar.hideCommands(appBarDiv.querySelectorAll('#cmdGo'));
                appBar.hideCommands(appBarDiv.querySelectorAll('#cmdTabEdit'));
            }
            else {
                if(isTempOnly()) {
                    appBar.hideCommands(appBarDiv.querySelectorAll('.multiSelect'));
                }
            }
            
            appBar.sticky = true;
            appBar.show();
        } else {
            // Hide selection commands in AppBar
            appBar.hide();
            appBar.hideCommands(appBarDiv.querySelectorAll('.multiSelect'));
            appBar.sticky = false;
        }
    }

    function initEdit() {
        document.getElementById("shortTitle").value = group.shortTitle;
        document.getElementById("name").value = group.title;
        document.getElementById("description").value = group.description;
    }
    
    function submitEdit() {
        var error = false;
        var description = document.getElementById("description").value.trim();
        var shortTitle = document.getElementById("shortTitle").value.trim();
        var name = document.getElementById("name").value.trim();
        if (description === "") {
            document.getElementById("shortTitleError").innerHTML = "ShortTitle cannot be blank";
            document.getElementById("shortTitle").focus();
            error = true;
        } else {
            document.getElementById("shortTitleError").innerHTML = "";
        }
        if (name === "") {
            document.getElementById("nameError").innerHTML = "Name cannot be blank";
            document.getElementById("name").focus();
            error = true;
        } else {
            document.getElementById("nameError").innerHTML = "";
        }

        if (!error) {
           /* MusicTab.Data.db.open()
                .done(function (server) {
                    group.title = name;
                    group.description = description;

                    document.querySelector("header[role=banner] .pagetitle").textContent = group.title;
                    if (imagePath != null && group.backgroundImage != imagePath) {
                        document.querySelector(".group-image").src = imagePath;
                        group.backgroundImage = imagePath;
                    }

                    server.groups.update(group);
                });*/
            updateGroup(name, description, imagePath);
        }
        document.getElementById("editFlyout").winControl.hide();
        document.getElementById("appBar").winControl.hide();
    }
    
    function submitTabEdit() {
        var error = false;
        var title = document.getElementById("tabTitle").value.trim();

        if (title === "") {
            document.getElementById("tabTitleError").innerHTML = "Title cannot be blank";
            document.getElementById("tabTitle").focus();
            error = true;
        } 

        if (!error) {
            MusicTab.Data.db.open()
                .done(function (server) {                   
                    var index = listView.selection.getIndices()[0];
                    var item = items.getAt(index);
                    item.title = title;
                    server.tabs.update(item);

                    var key = listView.currentItem.key;
                    listView.itemDataSource.change(key, item);
                    listView.selection.clear();
                });
        }
        document.getElementById("tabEditFlyout").winControl.hide();
        document.getElementById("appBar").winControl.hide();
    }
    
    function chooseBackgroundImage() {
        var picker = Windows.Storage.Pickers.FileOpenPicker();
        picker.fileTypeFilter.replaceAll([".png", ".jpg"]);
        picker.viewMode = Windows.Storage.Pickers.PickerViewMode.thumbnail;
        picker.commitButtonText = "Add";

        // Launch the picker in open mode
        picker.pickSingleFileAsync().then(function (file) {
            if (file) {
                imagePath = MusicTab.Helpers.getGuid() + ".png";
                file.copyAsync(MusicTab.Helpers.rootFolder, imagePath, Windows.Storage.NameCollisionOption.replaceExisting);
                imagePath = MusicTab.Helpers.getLocalPath(imagePath);

            } else {
                // The picker was dismissed with no selected file
                WinJS.log && WinJS.log("Operation cancelled.", "data", "status");
            }
            document.getElementById("editFlyout").winControl.show();
            document.getElementById("appBar").winControl.show();
        });
    }
    
    function changeRating(ev) {
        var obj = ev.target.winControl;
        if (obj) {
            var id = obj.itemId;
            // TODO it seems like id is null here for tabs of the newest group
            if (id != undefined && obj.userRating !== 0) {
                items.forEach(function(item) {
                    if(item.id == id) {
                        item.rating = obj.userRating;
                        MusicTab.Data.db.open().done(function (server) {
                               server.tabs.update(item);
                        });
                    }
                });
            } 
        }
    }

    WinJS.Namespace.define("MusicTab.Ratings", {
        change: changeRating
    });

    // To protect against untrusted code execution, all functions are required to be marked as supported for processing before they can be used inside a data-win-options attribute in HTML markup.
    WinJS.Utilities.markSupportedForProcessing(changeRating);
    

    function lastfmUpdate() {
        var fetcher = new MusicTab.LastFm.Fetcher();
        fetcher.get(group.title, function (result) {
            updateGroup(group.title, result.description, result.image);
        }, function () {
            
        });
    }
    
    function updateGroup(title, description, image) {
        MusicTab.Data.db.open()
            .done(function(server) {

                server.query("groups").filter(function(item) {
                    return item.title.toLowerCase() == title.toLowerCase() && group.title != title;
                }).execute().done(function(results) {

                    // insert only if it doesn't exist
                    if (results.length == 0) {

                        group.title = title;

                        document.querySelector(".group-description").innerHTML = description;
                        group.description = description;

                        document.querySelector("header[role=banner] .pagetitle").textContent = group.title;
                        if (image != null && group.backgroundImage != image) {
                            document.querySelector(".group-image").src = image;
                            group.backgroundImage = image;
                            group.groupImage = image;
                        }

                        server.groups.update(group);
                    }
                    else {
                        var msgBox = Windows.UI.Popups.MessageDialog("The group with the same name is already present");
                        msgBox.showAsync();
                    }
                });
            });
    }

})();
