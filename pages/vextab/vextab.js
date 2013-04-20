(function () {
    "use strict";

    var width;
    var height;
    var item;
    var group;
    var groupItems;
    
    var dispProp = Windows.Graphics.Display.DisplayProperties;
    var latestOrientation = Windows.Graphics.Display.DisplayProperties.currentOrientation;

    WinJS.UI.Pages.define("/pages/vextab/vextab.html", {
        ready: function (element, options) {

            // var group = options.group; // TODO key

            // edit
            if (options.item) {
                item = options && options.item ? MusicTab.Data.resolveItemReference(options.item) : null;
                group = item.group;
                document.getElementById("name").value = item.title;
                MusicTab.Data.CollectionHelpers.addToRecent(item);
            } // add new to group
            else if (options.group) {
                item = null;
                group = MusicTab.Data.resolveGroupReference(options.group);
            } else {
                // unknown
                throw "unable to bind vextab to group";
            }

            groupItems = MusicTab.Data.getItemsFromGroup(group);


            document.getElementById("cmdBack").addEventListener("click", function () {
                WinJS.Navigation.back();
            }, false);
            
            document.getElementById("cmdHome").addEventListener("click", function () {
                WinJS.Navigation.navigate(Application.navigator.home);
            }, false);

            document.getElementById("saveButton").addEventListener("click", this.saveClick, false);

            document.getElementById("cmdNewMeasure").addEventListener("click", (function () {
                this.insertText(" notes ");
            }).bind(this), false);

            document.getElementById("cmdNewLine").addEventListener("click", (function () {
                this.insertText("\ntabstave\nnotation=true\n");
            }).bind(this), false);

            document.getElementById("cmdChord").addEventListener("click", (function () {
                this.insertText(" ()");
                this.moveCaretBack();
            }).bind(this), false);

            var body = document.getElementsByTagName("body")[0];

            width = WinJS.Utilities.getContentWidth(body);
            height = WinJS.Utilities.getContentHeight(body);

            dispProp.addEventListener("orientationchanged", onOrientationChanged, false);

            this.initVexTab();

            this.toggleProgress();
            this.renderTutorial();
        },
        
        unload: function () {
            dispProp.removeEventListener("orientationchanged", onOrientationChanged);
        },
        
     

        initVexTab: function () {
            $("#vextab-container").css("height", height);
            $("#vex-container").attr("width", width - 20);
            $("#vex-container").attr("editor_height", 160);
            $("#vex-container").attr("editor_width", width - 140);
        },

        saveClick: function () {
            
            var error = false;
            var name = document.getElementById("name").value.trim();
            if (name === "") {
                document.getElementById("nameError").innerHTML = "Tab title cannot be blank";
                document.getElementById("name").focus();
                error = true;
            } else {
                document.getElementById("nameError").innerHTML = "";
            }

            if (!error) {
                var title = $("#name")[0].value;
                var content = $(".editor").text();
                var isUpdate = item != null && item.title == title;

                MusicTab.Data.db.open().done(function (server) {
                    var fileName;
                    var tab;
                    if (isUpdate) {
                        fileName = item.path;
                        tab = item;
                    } else {
                        fileName = MusicTab.Helpers.getGuid();
                        tab = {
                            path: fileName,
                            added: (new Date()).toDateString(),
                            title: title,
                            backgroundImage: "images/items/text.png",
                            tileImage: "images/items/text.png",
                            type: "vextab",
                            details: [],
                            groupId: group.id,
                            rating: 0
                        };
                    }
                    MusicTab.Helpers.rootFolder.createFileAsync(fileName, Windows.Storage.CreationCollisionOption.replaceExisting)
                        .then(function (file) {
                            if (!isUpdate) {
                                server.tabs.add(tab).done(function (inserted) {
                                    tab.id = inserted[0].id;
                                    tab.group = group;
                                    groupItems.push(tab);
                                });

                            }
                            return Windows.Storage.FileIO.writeTextAsync(file, content).done(function () {
                                WinJS.Navigation.navigate("/pages/groupDetail/groupDetail.html", { groupKey: group.key });
                            });
                        });
                });
            }
        },

        toggleProgress:function() {
            var progress = document.getElementsByClassName("progressRingText")[0];
            WinJS.Utilities.toggleClass(progress, "hidden");
        },

        renderTutorial: function () {
            var me = this;
            WinJS.UI.Fragments.renderCopy("/pages/vextab/tutorial.html",
                 document.querySelector("#tutorialContainer"))
                 .done(
                     function () {
                         me.finishTutorial();
                     },
                     function (error) {
                         me.finishTutorial();
                     }
                 );
        },

        finishTutorial: function () {
            var me = this;
            var end = function () {
                Vex.Flow.TabDiv.start();
                $(".editor").addClass("lined");
                $(".lined").linedtextarea();
                me.toggleProgress();
            };

            if (item) {
                // load content from file
                MusicTab.Helpers.rootFolder.getFileAsync(item.path).done(function (file) {
                    Windows.Storage.FileIO.readBufferAsync(file).done(function (buffer) {
                        var reader = Windows.Storage.Streams.DataReader.fromBuffer(buffer);
                        var text = reader.readString(buffer.length);
                        $("#vex-container").text(text);
                        end();
                    });
                });
            } else {
                end();
            }
        },

        moveCaretBack: function () {
            var pos = this.getCursorPos($(".editor")[0]);
            pos.end = pos.end - 1;
            this.setCursorPos($(".editor")[0], pos);
        },

        insertText: function(text){
            this.insertAtCaret($(".editor")[0], text);
        },

        insertAtCaret:function(element, text) {
            //if (document.selection) {
                element.focus();
                var sel = document.selection.createRange();
                sel.text = text;
                element.focus();
            // }
            /* else if (element.selectionStart || element.selectionStart === 0) {
                var startPos = element.selectionStart;
                var endPos = element.selectionEnd;
                var scrollTop = element.scrollTop;
                element.value = element.value.substring(0, startPos) + text + element.value.substring(endPos, element.value.length);
                element.focus();
                element.selectionStart = startPos + text.length;
                element.selectionEnd = startPos + text.length;
                element.scrollTop = scrollTop;
            } else {
                element.value += text;
                element.focus();
            }*/
        },

        setCursorPos: function (ctrl, pos) {
            if (ctrl.setSelectionRange) {
                ctrl.focus();
                ctrl.setSelectionRange(pos.start, pos.end);
            }
            else if (ctrl.createTextRange) {
                var range = ctrl.createTextRange();
                range.collapse(true);
                range.moveEnd('character', pos.end);
                range.moveStart('character', pos.start);
                range.select();
            }

        },


        getCursorPos: function (input) {

            if ("selectionStart" in input && document.activeElement == input) {
                return {
                    start: input.selectionStart,
                    end: input.selectionEnd
                };
            }
            else if (input.createTextRange) {
                var sel = document.selection.createRange();
                if (sel.parentElement() === input) {
                    var rng = input.createTextRange();
                    rng.moveToBookmark(sel.getBookmark());
                    for (var len = 0;
                             rng.compareEndPoints("EndToStart", rng) > 0;
                             rng.moveEnd("character", -1)) {
                        len++;
                    }
                    rng.setEndPoint("StartToStart", input.createTextRange());
                    for (var pos = { start: 0, end: len };
                             rng.compareEndPoints("EndToStart", rng) > 0;
                             rng.moveEnd("character", -1)) {
                        pos.start++;
                        pos.end++;
                    }
                    return pos;
                }
            }
            return -1;
        },
    });
    
    function onOrientationChanged() {
        var orientation = Windows.Graphics.Display.DisplayProperties.currentOrientation;
        var needRotate = latestOrientation != orientation;
        latestOrientation = Windows.Graphics.Display.DisplayProperties.currentOrientation;

        var body = document.getElementsByTagName("body")[0];
        width = WinJS.Utilities.getContentWidth(body);
        height = WinJS.Utilities.getContentHeight(body);

        if (needRotate) {
            // exchange
            var tmp = height;
            height = width;
            width = tmp;
        }
        $(".linedtextarea").css("width", width + "px");
        $(".vex-canvas").css("width", width - 20);
        $(".editor").css("height", 160 + "px");
        $(".editor").css("width", (width - 216) + "px");
    }

    

})();
