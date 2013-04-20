(function() {
    "use strict";

    WinJS.Namespace.define("MusicTab.Tablatures", {
        Track: WinJS.Class.define(
            function () {
                this.measures = [];
            },
            {
                index: null,
                name: null,
                instrument: null,
                strings: []
            })
    });
})();