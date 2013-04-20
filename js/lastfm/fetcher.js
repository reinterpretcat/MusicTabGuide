MusicTab.namespace('MusicTab.LastFm.Fetcher');

MusicTab.LastFm.Fetcher = klass(null, {
    __construct: function () {
    },
    
    get: function (name, success, error) {
        var url = "http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=" + name + "&api_key=ccb465be3c57a629f00125734eb84e9b&limit=10&order=popularity&format=json";
        WinJS.xhr({ url: url }).then(function (xhr) {
            var response = JSON.parse(xhr.responseText);

            if (response.error) {
                error();
                return;
            }

            var image = response.artist.image[0]['#text'];
            response.artist.image.forEach(function(item) {
                if(item.size.indexOf("large")> -1) {
                    image = item["#text"];
                }
            });
            
            if(image == "") {
                image = null;
            }

            success({
                description: response.artist.bio.summary,
                image: image
            });
        }, function (err) {
            error();
        });
    }
});