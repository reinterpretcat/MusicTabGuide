(function () {
    "use strict";

    var tab;
    var item;
    var width;
    var height;
    var appdata = Windows.Storage.ApplicationData;
    var scale = appdata.current.roamingSettings.values["scale"];
    var dispProp = Windows.Graphics.Display.DisplayProperties;
    var latestOrientation = Windows.Graphics.Display.DisplayProperties.currentOrientation;
    if (!scale) {
        scale = 0.8;
    }
    var staveHelper;
    var context;
    var paginator;
    var Track = WinJS.Binding.define({
        name: "",
        instrument: "",
        selected: false,
        index: 0
    });
    
    var Title = WinJS.Binding.define({
        title: "",
        artist: "",
        album: "",
        instrument: ""
    });


    var tracks = [];

    var currentTrack = 0;
    var tracksAttached = false;
    
    WinJS.UI.Pages.define("/pages/stave/stave.html", {
        ready: function (element, options) {

            toggleProgress();

            // set appBar's button handlers
            document.getElementById("cmdBack").addEventListener("click", function () {
                WinJS.Navigation.back();
            }, false);
            
            document.getElementById("cmdHome").addEventListener("click", function () {
                WinJS.Navigation.navigate(Application.navigator.home);
            }, false);
           
            document.getElementById("cmdBrowse").addEventListener("click", function () {
                //cleanup
                //tracks = [];
                //tracksAttached = false;
                MusicTab.Helpers.browse();
            }, false);
            
            var appBar = document.getElementById("appBar");
            appBar.addEventListener("beforeshow", attachTracks, false);
            
          

            // NOTE FOR TESTING ONLY
          /*  Windows.Storage.StorageFile.getFileFromApplicationUriAsync(Windows.Foundation.Uri("ms-appx:///data/opeth_forest_of_october.gp4")).done(function (file) {
                Windows.Storage.FileIO.readBufferAsync(file).done(function (buffer) {
                    readFromBuffer(buffer);
                });

            });*/
           
            document.getElementById("confirmDeleteButton").addEventListener("click", function (e) {
                MusicTab.Data.db.open({ server: "TabsDb", version: 1 }).done(function (server) {

                    MusicTab.Data.CollectionHelpers.removeTab(item, function () {
                        //document.getElementById("deleteFlyout").winControl.hide();
                        //document.getElementById("appBar").winControl.hide();
                        WinJS.Navigation.back();
                    });


                });
            }, false);

            document.getElementById("pin").addEventListener("click", function (e) {
                var uri = new Windows.Foundation.Uri("ms-appx:///" + item.tileImage);

                var tile = new Windows.UI.StartScreen.SecondaryTile(
                    item.id, // Tile ID
                    item.title, // Tile short name
                    item.title, // Tile display name
                    JSON.stringify(MusicTab.Data.getItemReference(item)), // Activation argument
                    Windows.UI.StartScreen.TileOptions.showNameOnLogo, // Tile options
                    uri                                          // Tile logo URI
                );

                tile.requestCreateAsync();
            });
            
          /*  var orientationSensor = Windows.Devices.Sensors.OrientationSensor.getDefault();
            
            if (orientationSensor != null) {
                orientationSensor.addEventListener("orientationchanged", function() {
                    // showTab(0);
                    var gg = "";
                });
            }*/


            dispProp.addEventListener("orientationchanged", onOrientationChanged, false);


            // scale
            var scaleToggle = $("#scale")[0];

            $("#scale > option").each(function () {
                this.selected = false;
                if (this.value == scale) {
                    this.selected = true;
                }
            });

            scaleToggle.addEventListener("change", function (e) {
                appdata.current.roamingSettings.values["scale"] = e.target.value;
                scale = e.target.value;
                toggleProgress();
                initEnvironment();
                processTab();
            });

            
            attachScroll();
           // browse file
            if (options.file) {
                if (options.file.path) {
                    readFromFile(options.file);
                }
                else {
                    WinJS.Navigation.navigate(Application.navigator.home);
                }
            }
            else {
                //collection file
                item = options && options.item ? MusicTab.Data.resolveItemReference(options.item) : MusicTab.Data.items.getAt(0);
                if (item) {
                    MusicTab.Data.CollectionHelpers.addToRecent(item);
                    MusicTab.Helpers.rootFolder.getFileAsync(item.path).done(function (file) {
                        readFromFile(file, item);
                    });
                } else {
                    // temporary tab was deleted
                    WinJS.Navigation.navigate(Application.navigator.home);
                }
            }
        },
        unload: function () {
            dispProp.removeEventListener("orientationchanged", onOrientationChanged);
        }
    });
    
    function onOrientationChanged() {
        toggleProgress();

        var orientation = Windows.Graphics.Display.DisplayProperties.currentOrientation;
        var needRotate = latestOrientation != orientation;
        latestOrientation = Windows.Graphics.Display.DisplayProperties.currentOrientation;
        initEnvironment(needRotate);

        processTab();
    }
    
    function createTracks() {
        tracks = [];
        for (var i = 0; i < tab.tracks.length; i++) {
            tracks.push(new Track({
                name: tab.tracks[i].name,
                instrument: tab.tracks[i].instrument,
                selected: tab.tracks[i].selected,
                index: i
            }));
        }
    }
    
    function attachTracks() {
        if (!tracksAttached) {
            var templateElement = document.getElementById("trackTemplate");
            var renderElement = document.getElementById("appBarHeader");
            renderElement.innerHTML = "";

            var count = tracks.length;
            var tileWidth = (width / count) - (count > 3 ? 12 : 14);
            
            for (var i = 0; i < count; i++) {
                templateElement.winControl.render(tracks[i])
                    .done(function(result) {
                        var collection = WinJS.Utilities.query(".tile", result);
                        collection.setStyle("width", tileWidth + "px");
                        var tile = collection[0];
                        tile.addEventListener("click", (function() {
                            var index = WinJS.Utilities.query("[selected]", result)[0].index;
                            if (index != currentTrack){
                                showTab(index);
                                var previous = WinJS.Utilities.query(".selected", renderElement)[0];
                                WinJS.Utilities.removeClass(previous, "selected");
                                WinJS.Utilities.addClass(tile, "selected");
                                currentTrack = index;
                            }
                        }));

                        if (i == 0) {
                            WinJS.Utilities.addClass(tile, "selected");
                        }
                        renderElement.appendChild(result);

                    });
            }
            tracksAttached = true;
        }
    }

    function attachScroll() {
        var scrollBox = document.getElementById("s3-flexbox");

        scrollBox.addEventListener("mousewheel", function (event) {
            var delta = event.wheelDelta;
            var $current = $('div.current');

            if (delta > 0) {
                var $prev = $current.prev();

                if ($prev.length) {
                    $('#s3-flexbox').scrollTo($prev, 300);
                    $current.removeClass('current');
                    $prev.addClass('current');
                }
            } else {
                var $next = $current.next();

                if ($next.length) {
                    $('#s3-flexbox').scrollTo($next, 300);
                    $current.removeClass('current');
                    $next.addClass('current');
                }
            }

            event.preventDefault();
        });
    }

    function toggleProgress() {
        var progress = document.getElementsByClassName("progressRingText")[0];
        WinJS.Utilities.toggleClass(progress, "hidden");
    }
       
    function readFromFile(file, item) {
        try{
            initEnvironment();

            var title = "";
            var type = "";
            if (item) {
                type = item.type;
                title = item.title;
            }

            MusicTab.Tablatures.TabFactory.create(title, type, file, staveHelper, function (parsedTab) {
                tracksAttached = false;
                tab = parsedTab;
                processTab();
            });
            
        }
        catch (err) {
            var msgBox = Windows.UI.Popups.MessageDialog("Unable to view tab: "+ err.message);
            msgBox.showAsync().done(function () {
                WinJS.Navigation.back();
            });
            
        }
    }


    function initEnvironment(needRotate) {
        // initialize environment
        var body = document.getElementsByTagName("body")[0];

        width = WinJS.Utilities.getContentWidth(body);
        height = WinJS.Utilities.getContentHeight(body);

        if (needRotate) {
            // exchange
            var tmp = height;
            height = width;
            width = tmp;
        }
        
        context = new MusicTab.Stave.Context({
            height: height,
            width: width,
            scale: scale,
            placeHolderId: "s3-flexbox",
            tabDivClass:"vex-tabdiv"
        });

        staveHelper = new MusicTab.Stave.Helper(context);
        paginator = new MusicTab.Stave.Paginator({
            context: context,
            staveHelper: staveHelper
        });
        
    }

    function processTab() {
        createTracks();
        showTab(0);
        toggleProgress();
    }
      
    function showTab(trackIndex) {
        var actualWidth = staveHelper.getActualWidth();
        var linePerPage = staveHelper.getLinePerPage();
       
        var measures = tab.tracks[trackIndex].measures;

        var chunks = paginator.split(measures, actualWidth);
        var pages = paginator.doPaging(chunks, linePerPage);
        insertTitle(tab, trackIndex);
        paginator.insertPages(pages, tab.tracks[trackIndex]);
    }
    
    // inserts title page
    function insertTitle(tab, trackIndex) {

        var templateElement = document.getElementById("titleTemplate");
        var renderElement = document.getElementById("s3-flexbox");
        renderElement.innerHTML = "";
        //tab.header
        templateElement.winControl.render(new Title({
            artist: tab.header.artist,
            album: tab.header.album,
            title: tab.header.title,
            music: tab.header.music,
            words: tab.header.words,
            notice: tab.header.notice,
            instrument: tab.tracks[trackIndex].instrument
        })).done(function (result) {
            result.className = "vex-title current";
            renderElement.appendChild(result);
        });
    }
})();