// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
    "use strict";
    var app = Windows.ApplicationModel.Store.CurrentAppSimulator;
    var topicPath = "/pages/settings/help/topics/";
    WinJS.UI.Pages.define("/pages/settings/help/help.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            this.fragment = element.querySelector("#fragment");
            WinJS.Utilities.query("#back", element)
                .listen("click", this.fragmentLoad.bind(this));
            this.fragmentLoad();
        },

        fragmentLoad: function () {
            var me = this;
            this.resetOutput();

            WinJS.UI.Fragments.renderCopy(topicPath +"list.html",
                this.fragment)
                .done(
                    function () {
                        $("#back").css("display", "none");
                        $("#howto")[0].innerHTML = "How to"
                        $("a[url]").each(function () {
                            $(this).click(function () {
                                var url = $(this).attr("url");
                                $("#howto")[0].innerHTML += (" "+ this.innerHTML);
                                me.resetOutput();
                                WinJS.UI.Fragments.renderCopy(topicPath + url, me.fragment);
                                $("#back").css("display", "block");
                            });
                        });
                        
                    },
                    function (error) {
                       // TODO
                    }
                );
        },

        resetOutput: function () {
            this.fragment.innerHTML = "";
        }
    });

    function clickHandler(type) {

    }

})();
