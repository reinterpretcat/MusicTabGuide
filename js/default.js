// For an introduction to the Grid template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=232446
(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var nav = WinJS.Navigation;
    var appdata = Windows.Storage.ApplicationData;

    app.addEventListener("activated", function (args) {

        // If "Remember where I was" is enabled and roaming settings
        // contains a history, apply it to go back to where the user
        // was before
        var remember = appdata.current.roamingSettings.values["remember"];
        remember = !remember ? false : remember; // false if value is undefined

        if (remember) {
            var history = appdata.current.roamingSettings.values["history"];
            if (history !== undefined) {
                nav.history = JSON.parse(history);
            }
        }

        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.

            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }

            app.onsettings = function (e) {
                e.detail.applicationcommands = {
                    "help": {
                        href: "/pages/settings/help/help.html",
                        title: "Help"
                    },
                    "about": {
                        href: "/pages/settings/about/about.html",
                        title: "About"
                    },
                    "preferences": {
                        href: "/pages/settings/preferences/preferences.html",
                        title: "Preferences"
                    },
                    "privacy": {
                        href: "/pages/settings/privacy/privacy.html",
                        title: "Privacy"
                    }
                };

                WinJS.UI.SettingsFlyout.populateSettings(e);
            };

            // Clear tiles and badges
          /*  notify.TileUpdateManager.createTileUpdaterForApplication().clear();
            notify.BadgeUpdateManager.createBadgeUpdaterForApplication().clear();

            // Register for push notifications
            var profile = net.NetworkInformation.getInternetConnectionProfile();

            if (profile.getNetworkConnectivityLevel() === net.NetworkConnectivityLevel.internetAccess) {
                push.PushNotificationChannelManager.createPushNotificationChannelForApplicationAsync().then(function (channel) {
                    var buffer = wsc.CryptographicBuffer.convertStringToBinary(channel.uri, wsc.BinaryStringEncoding.utf8);
                    var uri = wsc.CryptographicBuffer.encodeToBase64String(buffer);

                    WinJS.xhr({ url: "http://ContosoRecipes8.cloudapp.net?uri=" + uri + "&type=tile" }).then(function (xhr) {
                        if (xhr.status < 200 || xhr.status >= 300) {
                            var dialog = new popups.MessageDialog("Unable to open push notification channel");
                            dialog.showAsync();
                        }
                    });
                });
            }*/

           /* appmodel.Package.current.installedLocation.getFileAsync("data\\license.xml").done(
                 function (file) {
                     Windows.ApplicationModel.Store.CurrentAppSimulator.reloadSimulatorAsync(file).done();
                 });*/

            if (app.sessionState.history) {
                nav.history = app.sessionState.history;
            }
            args.setPromise(WinJS.UI.processAll().then(function () {

                MusicTab.Data.initialize.done(function() {

                   if (args.detail.arguments !== "") {
                        nav.history.current.initialPlaceholder = true;
                        return nav.navigate("/pages/stave/stave.html", { item: JSON.parse(args.detail.arguments) });
                    } else if (nav.location) {
                        nav.history.current.initialPlaceholder = true;
                        return nav.navigate(nav.location, nav.state);
                    } else {
                        return nav.navigate(Application.navigator.home);
                    }
                   
                    //return nav.navigate(Application.navigator.home);
                });

            }));
        }
    });

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. If you need to 
        // complete an asynchronous operation before your application is 
        // suspended, call args.setPromise().

        // If "Remember where I was" is enabled, write the history to
        // roaming settings so it can be restored later
        var remember = appdata.current.roamingSettings.values["remember"];
        remember = !remember ? false : remember; // false if value is undefined

        if (remember) {
            var history = { };
            if(nav.history.backStack.length > 10) {
                history = {
                    backStack: nav.history.backStack.slice(0, 10),
                    current: nav.history.current,
                    forwardStack: nav.history.forwardStack
                };
            }
            else {
                history = nav.history;
            }
            appdata.current.roamingSettings.values["history"] = JSON.stringify(history);
        }

        app.sessionState.history = nav.history;
    };

    app.onerror = function(customEventObject) {

        // Get the error message and name for this exception
      //  var errorMessage = customEventObject.detail.error.message;
      //  var errorName = customEventObject.detail.error.name;
        // Bind them in an optionsObject to pass with the navigation
      //  var optionsObject = { errName: errorName, errMsg: errorMessage };

        // Navigate home with information concerning the error
        WinJS.Navigation.navigate("/pages/groupedItems/groupedItems.html");

        return true; 

        //return false;
    };

    app.start();
})();
