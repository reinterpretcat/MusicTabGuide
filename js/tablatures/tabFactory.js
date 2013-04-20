MusicTab.namespace('MusicTab.Tablatures');

MusicTab.Tablatures.TabFactory = klass(null, {
    __construct: function (title, type, file, helper, success) {
        this.title = title;
        this.type = type;
        this.helper = helper;

        this.init(file, success);
    },
    
    init: function (file, success) {
        if (this.type == "ug_json") {
            this._jsonTab(file, success);
        } else {
            this._alphaTab(file, success);
        }
    },


    getBinaryFromXHR: function(responseText, xhr) {
        var result = "";
        for (var i = 0; i < responseText.length; i++) {
            var code = responseText.charCodeAt(i) & 0xff;
            result += String.fromCharCode(code);
        }
        return result;
    },


    _jsonTab: function (file, success) {
        var title = this.title;
        var helper = this.helper;
        Windows.Storage.FileIO.readBufferAsync(file).done(function (buffer) {
            var reader = Windows.Storage.Streams.DataReader.fromBuffer(buffer);
            var str = reader.readString(buffer.length);
          
            var zip = new JSZip();
            var result = zip.load(str, { base64: true, compression: "DEFLATE" });
            var content = result.files.filename.data;
            MusicTab.Tablatures.UgTabTransformer.transform(title, JSON.parse(content), helper, success);
        });
    },

    _alphaTab: function (file, success) {
        var closure = this.helper;
        Windows.Storage.FileIO.readBufferAsync(file).done(function (buffer) {
            var length = buffer.length;
            var reader = Windows.Storage.Streams.DataReader.fromBuffer(buffer);
            var array = [];
            while (length) {
                array.push(reader.readByte());
                length--;
            }

            var factory = new alphatab.tablature.model.DrawingSongModelFactory();

            alphatab.file.SongLoader.loadSong(array, factory, function (song) {
                MusicTab.Tablatures.AlphaTabTransformer.transform(song, closure, success);
            });
        });
       
    }
});



MusicTab.Tablatures.TabFactory.create = function (title, type, file, helper, success) {
    new MusicTab.Tablatures.TabFactory(title, type, file, helper, success);
}