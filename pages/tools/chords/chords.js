(function () {
    "use strict";
    var app = Windows.ApplicationModel.Store.CurrentAppSimulator;
    var container;
    // Display shape chords for all keys
    var keys_E = ["F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "C"];
    var keys_A = ["C#", "Db", "D", "D#", "Eb", "F", "F#", "Gb", "G"];

    var shapes_E = [
        "M E", "m E", "7 E", "m7 E", "M7 E", "m7b5 E", "dim E",
        "sus4 E", "7sus4 E", "13 E"];
    var shapes_A = [
        "M A", "m A", "7 A", "m7 A", "M7 A", "m7b5 A", "dim A",
        "sus2 A", "sus4 A", "7sus4 A", "9 A", "7b9 A", "7#9 A", "13 A"];
    
    WinJS.UI.Pages.define("/pages/tools/chords/chords.html", {
        ready: function (element, options) {
            
            document.getElementById("chordsSelect").addEventListener("change", chordPageChanged, false);

            container = $("#chords-container");
            createOpen();
        }
    });
    
    function chordPageChanged(e) {
        var index = e.target.selectedIndex;
        container.empty();
        if(index == 0) {
            createOpen();
        }else {
            createShape(index - 1);
        }
    }
    
    function createOpen() {
        // Display preset chords (open chords)
        for (var i = 0; i < chord_chart.length; ++i) {
            var section_struct = chord_chart[i];
            var section = createSectionElement(section_struct);

            for (var j = 0; j < section_struct.chords.length; ++j) {
                section.append(createChordElement(section_struct.chords[j]));
            }

            var div = $('<div>').addClass('box');
            div.append(section);
            container.append(div);
        }
    }
    
    function createShape(index) {
        var i = index % 11;
        var keys = keys_E;
        var shape = "E";
        var shapes = shapes_E;
        if(index >= 10) {
            i = index % 10;
            keys = keys_A;
            shapes = shapes_A;
            shape = "A";
        }
        var key = keys[i];
        var section = createSectionElement({
            section: key + " Chords (" + shape + " Shape)",
            description: shape + "-Shaped barre chords in the key of " + key + "."
        });

        for (var j = 0; j < shapes.length; ++j) {
            var chord_elem = createChordElement(
              createChordStruct(key, shape, shapes[j]));
            section.append(chord_elem);
        }
        var div = $('<div>').addClass('box');
        div.append(section);
        container.append(div);
    }

})();