// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
    "use strict";

    var appdata = Windows.Storage.ApplicationData;
    var group;
    
    WinJS.UI.Pages.define("/pages/settings/preferences/Preferences.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            var me = this;
            // remember
            var toggle = document.querySelector("#remember").winControl;

            var remember = appdata.current.roamingSettings.values["remember"];
            remember = !remember ? false : remember; // false if value doesn’t exist
            toggle.checked = remember;

            toggle.addEventListener("change", function (e) {
                // NOTE
                if (e.target.winControl) {
                    appdata.current.roamingSettings.values["remember"] = e.target.winControl.checked;
                }
            });
            
            var recent = document.querySelector("#recent");
            var currentRecent = appdata.current.roamingSettings.values["recent"];
            if(!currentRecent) {
                currentRecent = 6;
            }

            recent.value = currentRecent;
            recent.addEventListener("change", function (e) {
                appdata.current.roamingSettings.values["recent"] = e.target.value;
                me._clearRecent();
            });

            MusicTab.Data.db.open().done(function(server) {
                server.query("groups").filter("key", "!").execute().done(function(results) {
                    if (results.length > 0) {
                        group = results[0];
                    }
                });
            });
       },
        
        unload: function () {
            // TODO: Respond to navigations away from this page.
        },

        updateLayout: function (element, viewState, lastViewState) {
            /// <param name="element" domElement="true" />

            // TODO: Respond to changes in viewState.
        },
        
        _clearRecent: function(){
            if (group) {
                MusicTab.Data.db.open().done(function(server) {
                    // try {

                    MusicTab.Data.removeFromList(function(el) {
                        return el.groupId == group.id;
                    }, false, function(el) {
                        server.tabs.remove(el.id);
                    });
                    // } catch (err) {
                    // NOTE
                    // }
                });
               
            }
        },
    });
})();
