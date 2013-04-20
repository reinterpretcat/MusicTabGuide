
(function () {
    "use strict";

    function copyFileToAppDataFolder(fileName, folder, newFileName) {
        // Copy file from the package to the AppData folder
        return Windows.Storage.StorageFile.getFileFromApplicationUriAsync(Windows.Foundation.Uri("ms-appx:///data/" + fileName))
            .then(function (file) {
                return file.copyAsync(folder, newFileName, Windows.Storage.NameCollisionOption.replaceExisting);
            });
    }

    function getGuid() {
        return 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }


    function getLocalPath(file) {
        return "ms-appdata:///Local/" + file;
    }
    
    function getSupportedFormats() {
        return [".gp3", ".gp4", ".gp5", ".gpx", ".xml"];
    }
    
    function browse() {
        var picker = Windows.Storage.Pickers.FileOpenPicker();
        picker.fileTypeFilter.replaceAll(MusicTab.Helpers.getSupportedFormats());
        picker.viewMode = Windows.Storage.Pickers.PickerViewMode.list;
        picker.commitButtonText = "Open";

        // Launch the picker in open mode
        picker.pickSingleFileAsync().then(function (file) {
            if (file) {
                WinJS.Navigation.navigate("/pages/stave/stave.html", {
                    file: file
                });
            }
        });
    }
    
    function getTempTabTitle(){
        return "temp tab";
    }

    function removeTab() {

    }
    
    WinJS.Namespace.define("MusicTab.Helpers", {
        copyFileToAppDataFolder: copyFileToAppDataFolder,
        getGuid: getGuid,
        rootFolder: Windows.Storage.ApplicationData.current.localFolder,
        MaxInt: 4294967295,
        getLocalPath: getLocalPath,
        getSupportedFormats: getSupportedFormats,
        browse: browse,
        getTempTabTitle: getTempTabTitle
    });

})();