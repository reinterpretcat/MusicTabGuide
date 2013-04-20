(function () {
    "use strict";

    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    var ui = WinJS.UI;
    var search = new MusicTab.Search.UltimateGuitar();

    var listView;
    var list = [];
    var group;
    var width;
    var pageCount = 1;
    var currentPage = 1;
    var me;
    var appBar;
    var appBarDiv;
    var items;
    var groupItems;
    var isDoingDownload = false;
    WinJS.UI.Pages.define("/pages/websearch/websearch.html", {
        ready: function (element, options) {
            me = this;
            group = options.group;
            groupItems = MusicTab.Data.getItemsFromGroup(group);
            appBar = document.getElementById('appBar').winControl;
            appBarDiv = document.getElementById("appBar");

            var query = element.querySelector("#query");
            query.value = group.title;

            listView = element.querySelector(".itemslist").winControl;
            listView.addEventListener("selectionchanged", this.doSelectItem);
            document.getElementById("cmdDownload").addEventListener("click", this.doDownload, false);

            document.getElementById("cmdSelectAll").addEventListener("click", function () {
                listView.selection.selectAll();
            }, false);
            document.getElementById("cmdClearSelection").addEventListener("click", function () {
                listView.selection.clear();
            }, false);

            document.getElementById("cmdPrevious").addEventListener("click", this.doPrevious, false);
            document.getElementById("cmdNext").addEventListener("click", this.doNext, false);


            element.querySelector(".big").addEventListener("click", function () {
                me._doSearch(query.value, currentPage);
            }, false);

            this._reset();
            this._doSearch(query.value, currentPage);
        },

        _doSearch: function (query, page) {
            // TODO toggle progress
            this._showProgress();
            search.search(query, page).done(function (data) {
                me._hideProgress();
                me._reset();
                if (data.error) {
                    listView.itemDataSource = null;
                    me._showNoResults();
                  }
                else {
                    list = new WinJS.Binding.List();
                    pageCount = data.pageCount;
                    currentPage = page;
                    $(data.results).each(function () {
                        list.push(this);
                    });
                    items = list.createFiltered(function (item) {
                        return true;//item.artist.toLowerCase() == query.toLowerCase();
                    });
                    var pageList = items.createGrouped(
                      function groupKeySelector(item) { return group.key; },
                      function groupDataSelector(item) { return group; }
                    );
                    me._databind(document, pageList);
                    me._hideNoResults();
                }
                me._toggleButtonState();
            });

        },

        _databind: function (element, pageList) {
            listView.itemDataSource = pageList.dataSource;
            listView.itemTemplate = element.querySelector(".itemtemplate");
            listView.groupDataSource = pageList.groups.dataSource;
            listView.groupHeaderTemplate = element.querySelector(".headertemplate");
            listView.oniteminvoked = this._itemInvoked.bind(this);

            listView.automaticallyLoadPages = true;
            listView.pagesToLoad = 4;
            listView.pagesToLoadThreshold = 1;

            this._initializeLayout(listView, Windows.UI.ViewManagement.ApplicationView.value);
            //listView.element.focus();
        },

        updateLayout: function (element, viewState, lastViewState) {
            if (lastViewState !== viewState) {
                if (lastViewState === appViewState.snapped || viewState === appViewState.snapped
                    || lastViewState === appViewState.fullScreenPortrait || viewState == appViewState.fullScreenPortrait
                    ) {
                    var handler = function (e) {
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
        _initializeLayout: function (lv, viewState) {
            /// <param name="lv" value="WinJS.UI.ListView.prototype" />

            if (viewState === appViewState.snapped || viewState === appViewState.fullScreenPortrait) {
                lv.layout = new ui.ListLayout();
            } else {
                lv.layout = new ui.GridLayout({ groupHeaderPosition: "left" });
            }
        },
        _itemInvoked: function (args) {
            /*var item = items.getAt(args.detail.itemIndex);
            if (item.temp) {
                listView.selection.clear();
                doClickAdd();
            }*/
        },

        _reset: function () {
            pageCount = 1;
            currentPage = 1;
        },
         doSelectItem: function() {
            var count = listView.selection.count();
            if (count > 0) {
                me._showAppBar();
            } else {
                me._hideAppBar();
            }
         },

         _showAppBar: function () {
             appBar.showCommands(appBarDiv.querySelectorAll('.multiSelect'));
             // Show selection commands in AppBar         
             appBar.sticky = true;
             appBar.show();
         },

         _hideAppBar: function () {
             // Hide selection commands in AppBar
             appBar.hide();
             appBar.hideCommands(appBarDiv.querySelectorAll('.multiSelect'));
             appBar.sticky = false;
         },

         _showNoResults: function () {
             document.querySelector(".noresults").style.display = "block";
             this._hideAppBar();
         },


         _hideNoResults: function () {
             document.querySelector(".noresults").style.display = "none";
         },

         _showProgress: function () {
             this._toggleProgress();
         },

         _hideProgress: function () {
             this._toggleProgress();
         },

         _toggleProgress: function() {
             var progress = document.querySelector(".progress");
             WinJS.Utilities.toggleClass(progress, "hidden");
         },

         _showButton: function (id) {
             //appBar.showCommands(appBarDiv.querySelectorAll('#'+id));
             appBar.getCommandById(id).disabled = false;
         },

         _hideButton: function (id) {
             //appBar.hideCommands(appBarDiv.querySelectorAll('#' + id));
             appBar.getCommandById(id).disabled = true;
         },

         doPrevious: function () {

             if (me._checkDownload()) {
                 return;
             }

             if (currentPage != 1) {
                 listView.selection.clear();
                 currentPage--;
                 me._doSearch(query.value, currentPage);
                 me._toggleButtonState();
             }
        },

         doNext: function () {

             if (me._checkDownload()) {
                 return;
             }

            if (currentPage != pageCount) {
                listView.selection.clear();
                currentPage++;
                me._doSearch(query.value, currentPage);
                me._toggleButtonState();
            }
        },

         _toggleButtonState: function () {
             if (currentPage == 1 || pageCount == 1) {
                 me._hideButton("cmdPrevious");
             }
             else {
                 me._showButton("cmdPrevious");
             }
             if (pageCount - currentPage > 0) {
                 me._showButton("cmdNext");
             }
             else {
                 me._hideButton("cmdNext");
             }
         },


        _checkDownload: function(){
            
            if (isDoingDownload) {
                var msgBox = Windows.UI.Popups.MessageDialog("Wait for downloading end");
                msgBox.showAsync();
                return true;
            }
            return false;
        }, 

        doDownload: function () {

            if (me._checkDownload()) {
                return;
            }

            if (listView.selection.count() > 0) {
                me._showProgress();
                MusicTab.Data.db.open().done(function (server) {
                    var indices = listView.selection.getIndices();
                    var indexCount = indices.length;
                    isDoingDownload = true;

                    var end = function() {
                        indexCount--;
                        if (indexCount == 0) {
                            isDoingDownload = false;
                            me._hideProgress();
                            listView.selection.clear();
                        }
                    };
                    var downloadAndSave = function(el) {
                        search.download(el.id).done(function(data) {
                            if (data.response && !data.error) {
                                var response = data.response;
                                var fileName = MusicTab.Helpers.getGuid();
                                var tab = {
                                    path: fileName,
                                    added: (new Date()).toDateString(),
                                    title: el.name,
                                    backgroundImage: "images/items/guitarproj.png",
                                    tileImage: "images/items/guitarproj.png",
                                    type: "ug_json",
                                    details: [],
                                    groupId: group.id,
                                    rating: el.rating
                                };
                                MusicTab.Helpers.rootFolder.createFileAsync(fileName, Windows.Storage.CreationCollisionOption.replaceExisting)
                                    .then(function(file) {
                                        server.tabs.add(tab);
                                        tab.group = group;
                                        groupItems.push(tab);
                                        end();

                                        var zip = new JSZip();
                                        zip.file("filename", response);
                                        var content = zip.generate({ base64: true, compression: "DEFLATE" });
                                        return Windows.Storage.FileIO.writeTextAsync(file, content);

                                    });
                            }
                            else {
                                end();
                            }
                        });
                    };

                    for (var i = indices.length - 1; i >= 0; i--) {
                        var item = items.getAt(indices[i]);
                        downloadAndSave(item);
                    }
                });
               
            }

        },

    });
    
  

})();