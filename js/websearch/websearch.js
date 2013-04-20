(function () {
    "use strict";

   /* var gg = new MusicTab.Search.UltimateGuitar();
     gg.search("opeth").done(function (result) {
         var gg = result;
     });

    gg.download("227519").done(function (data) {
        if (data.error) {
            // error here
            return;
        }
        var response = data.response;

        //TODO save tab 
    });*/

    var searchGroupUrlFormat = "http://app.ultimate-guitar.com/search.php?value=c&iphone=1&tab_type_group=all&app_name=tabs&type[]=500&order=title_srt&order_mode=ASC&band_name="
    var searchSongUrlFormat = "http://app.ultimate-guitar.com/search.php?value=c&iphone=1&tab_type_group=all&app_name=tabs&type[]=500&order=title_srt&order_mode=ASC&song_name="
    var detailsUrlFormat = "http://app.ultimate-guitar.com/iphone/tab.php?app_platform=&id=";

    MusicTab.namespace('MusicTab.Search.UltimateGuitar');

    MusicTab.Search.UltimateGuitar = klass(null, {
        __construct: function () {
        },

        _getSearchUrl: function (format, query, page) {
            if (!page) {
                page = 1;
            }
            return searchGroupUrlFormat + query + "&page=" + page;
        },

        _getDetailsUrl: function (id) {
            return detailsUrlFormat + id;
        },

        search: function (query, page) {
            var me = this;
            return WinJS.xhr({ url: this._getSearchUrl(searchGroupUrlFormat, query, page) })
                .then(
                  function (xhr) {
                      return {
                          response: xhr.responseXML
                      };
                  },
                  function () {
                      return {
                          error: true
                      };
                  }).then(function (result) {
                      if (result.error || !result.response) {
                          return {
                              error: true
                          };
                      }
                      return me._parseResultSet(result.response);
                     });

            // NOTE search song and artist
           /* var operations = [];
            var queries = [
                { type: "group", url: this._getSearchUrl(searchGroupUrlFormat, query, page) },
                { name: "song", url: this._getSearchUrl(searchSongUrlFormat, query, page) }];

            // NOTE wrap i in closure
            var closureFunc = function (index) {
                operations.push(WinJS.xhr({ url: queries[index].url }).then(
                  function (xhr) {
                      return {
                          type: queries[index].type,
                          response: xhr.responseXML
                      };
                  },
                  function () {
                      return {
                          type: queries[index].type,
                          error: true
                      };
                  }));
            };

            for (var i = 0; i < queries.length; i++) {
                closureFunc(i);
            }

            return WinJS.Promise.join(operations).then(function (responses) {
                var results = {};

                $(responses).each(function () {
                    if (this.error) {
                        results.type = this.type;
                        results.error = true;
                    } else {
                        results.type = this.type;
                        results.result = me._parseResultSet(this.response);
                    }
                });

                return results;
            });*/
        },

        _parseResultSet: function (xml) {
            /*
             <results count="94" page="1" pages="2" total="69" total_found="69" one_band="" order="title_srt" bands_found="1">
                <result name="a fair judgement" artist="opeth" version="1" url="http://app.ultimate-guitar.com/iphone/tab.php?id=227519" rating="4" votes="9" type_2="" type="tab pro" id="227519"/>
            */
            var me = this;
            var results = [];
            var nodes = xml.querySelectorAll("results > result");
            $(nodes).each(function() {
                results.push({
                    artist: me._getAttributeValue(this, "artist"),
                    name: me._getAttributeValue(this, "name"),
                    id: me._getAttributeValue(this, "id"),
                    rating: me._getAttributeValue(this, "rating")
                });
            });

            var pageCount = me._getAttributeValue(xml.querySelector("results"), "pages");
            return {
                pageCount: pageCount,
                results: results
            };

        },

        download: function (id) {
            var me = this;
            return WinJS.xhr({ url: this._getDetailsUrl(id) }).then(
                function (xhr) {
                    if (xhr.responseXML) {
                        return WinJS.Promise.as({
                            response: xhr.responseXML
                        });
                    }
                    return me._getError(true);
                },
                function(err) {
                    return me._getError(true);
                }).then(function(data) {
                    if (data.error) {
                        return data;
                    }
                    // parse xml
                    var url = me._parseJsonUrl(data.response);

                    // unable to parse
                    if (url.error) {
                        return me._getError(true);
                    }

                    return WinJS.xhr({ url: url })
                        .then(function(xhr) {
                            return {
                                response: xhr.responseText
                            };
                        }, function(err) {
                            return me._getError();
                        });
                });
        },

        _getAttributeValue: function(node, name){
            try {
                var attrs = node.attributes;
                var result = $.grep(attrs, function (attr) {
                    return attr.nodeName == name;
                });

                if (result.length > 0 && result[0].value) {
                    return result[0].value;
                }
            } catch (err) {
            }

            return null;
        },

        _parseJsonUrl: function (xml) {
            var node = xml.querySelector("tab");
            return this._getAttributeValue(node, "gp_url");
        },

        _getError: function (wrap) {
            if (wrap) {
                return WinJS.Promise.as({
                    error: true
                });
            }
            return {
                error: true
            };
        }
    });

})();