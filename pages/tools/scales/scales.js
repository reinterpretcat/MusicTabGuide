(function () {
    "use strict";
    

    var isTriad = 0;
    var schema = 0;
    var type = 0;
    var currentFret = 5;
    var currentString = 5;

    var vexTabPrefix = "options space=24\ntabstave notation=true\nnotes ";
    var inversionConversionSchema = [[5, 3, 1], [1, 5, 3], [3, 1, 5]];
    var inversionIndexes = [
        [],
        [[[4, 1, 1], [9, 4, 5], [13, 9, 8]], [[4, 0, 1], [9, 4, 4], [12, 9, 8]]],
        [[[0, 1, 2], [5, 4, 6], [9, 9, 9]], [[0, 0, 2], [5, 4, 5], [8, 9, 9]]],
        [[[-1, 1, 2], [4, 4, 6], [8, 9, 9]], [[-1, 0, 2], [4, 4, 5], [7, 9, 9]]],
        [[[-1, 1, 2], [4, 4, 6], [8, 9, 9]], [[-1, 0, 2], [4, 4, 5], [7, 9, 9]]],
        [[[-1, 1, 2], [4, 4, 6], [8, 9, 9]], [[-1, 0, 2], [4, 4, 5], [7, 9, 9]]],
    ];
    

    var scaleSchema = [
        {
            schema: [[1, 2, 3], [4, 5, 6], [7, 8]],
            indexes: [
                        [],
                        [[[0, 2, 4], [0, 2, 4], [6, 7]], [[0, 2, 3], [0, 2, 3], [5, 7]]],
                        [[[0, 2, 4], [1, 3, 5], [2, 3]], [[0, 2, 3], [1, 3, 4], [1, 3]]],
                        [[[0, 2, 4], [0, 2, 4], [2, 3]], [[0, 2, 3], [0, 2, 3], [1, 3]]],
                        [[[0, 2, 4], [0, 2, 4], [1, 2]], [[0, 2, 3], [0, 2, 3], [0, 2]]],
                        [[[0, 2, 4], [0, 2, 4], [1, 2]], [[0, 2, 3], [0, 2, 3], [0, 2]]],
            ]
        },
        {
            schema: [[1, 2], [3, 4, 5], [6, 7, 8]],
            indexes: [
                        [],
                        [[[0, 2], [-1, 0, 2], [4, 6, 7]], [[0, 2], [-2, 0, 2], [3, 5, 7]]],
                        [[[0, 2], [0, 1, 3], [-0, 2,3]], [[0, 2], [-1, 1, 3], [-1, 1, 3]]],
                        [[[0, 2], [-1, 0, 2], [0, 2, 3]], [[0, 2], [-2, 0, 2], [-1, 1, 3]]],
                        [[[0, 2], [-1, 0, 2], [-1, 1, 2]], [[0, 2], [-2, 0, 2], [-2, 0, 2]]],
                        [[[0, 2], [-1, 0, 2], [-1, 1, 2]], [[0, 2], [-2, 0, 2], [-2, 0, 2]]],
            ]
        }
    ];


    WinJS.UI.Pages.define("/pages/tools/scales/scales.html", {
        ready: function (element, options) {

            document.getElementById("scaleSelect").selectedIndex = isTriad;
            document.getElementById("scaleSelect").addEventListener("change", function (e) {
                isTriad = parseInt(this.options[this.selectedIndex].value);
                draw(currentString, currentFret);
            }, false);

            document.getElementById("typeSelect").selectedIndex = type;
            document.getElementById("typeSelect").addEventListener("change", function (e) {
                type = parseInt(this.options[this.selectedIndex].value);
                draw(currentString, currentFret);
            }, false);

            document.getElementById("schemaSelect").selectedIndex = schema;
            document.getElementById("schemaSelect").addEventListener("change", function (e) {
                schema = parseInt(this.options[this.selectedIndex].value);
                draw(currentString, currentFret);
            }, false);
            
            guitar_schemas.load(5, [], [], false);
            guitar_schemas.SessionObject.fretboard.clickHandlers.push(function (string, fret) {
                currentString = string;
                currentFret = fret;
                draw(string, fret, schema, type);
            });
            
            var body = document.getElementsByTagName("body")[0];
            var width = WinJS.Utilities.getContentWidth(body);
            var height = WinJS.Utilities.getContentHeight(body);

            $("#container").css("height", 250);
            var s = 0.8;
            $("#vex-container").attr("width", (width - 20) / s);
            $("#vex-container").attr("height", 220);
            $("#vex-container").attr("scale", s);
            
            draw(currentString, currentFret);
        },

     
    });
    

    function inversionConversion(tonic, stringOffset, conversionIndex) {
        tonic = tonic - 2;//stringOffset >= 0 ? tonic - 2 : tonic - 3;
        var result = [];
        var length = conversionIndex.length;
        for (var i = 0; i < length; i++) {
            var position = [];
            for (var j = 0; j < length; j++) {
                var note = [];
                var string = j + stringOffset;
                var fret = tonic + conversionIndex[i][j];

                // second string
                if (string == 1) {
                    fret++;
                }

                // 
                if (string == -1) {
                    string = 0;
                    //fret += 2;
                }

                if (fret >= 0) {
                    note.push(string); //string
                    note.push(fret); //note
                    note.push(inversionConversionSchema[i][j]) // schema
                    position.push(note);
                }
            }
            result.push(position);
        }

        return result;
    }

    function triadInversions(string, fret, index) {
        var result = [];
        var next = 0;
        switch (string) {
            case 0:
                break;
            case 1:
                result.push(inversionConversion(fret, -1, inversionIndexes[string][index]));
                break;
            case 2:
                result.push(inversionConversion(fret, 0, inversionIndexes[string][index]));
                if (!schema) {
                    next = fret - 2;
                    result.push(inversionConversion(next > 0 ? next : 12 - next, 2, inversionIndexes[4][index]));
                }
                break;
            case 3:
                result.push(inversionConversion(fret, 1, inversionIndexes[string][index]));
                if (!schema) {
                    next = fret - 2;
                    result.push(inversionConversion(next > 0 ? next : 12 - next, 3, inversionIndexes[5][index]));
                }
                break;
            case 4:
                result.push(inversionConversion(fret, 2, inversionIndexes[string][index]));
                if (!schema) {
                    if (fret > 3) {
                        next = fret - 2;
                        result.push(inversionConversion(next > 0 ? next : 12 - next, -1, inversionIndexes[1][index]));
                    } else {
                        next = fret + 2;
                        result.push(inversionConversion(next > 0 ? next : 12 - next, 0, inversionIndexes[2][index]));
                    }
                }
                break;
            case 5:

                result.push(inversionConversion(fret, 3, inversionIndexes[string][index]));
                if (!schema) {
                    if (fret > 3) {
                        next = fret - 3;
                        result.push(inversionConversion(next > 0 ? next : 12 - next, 0, inversionIndexes[2][index]));
                    }
                    else {
                        next = fret + 2;
                        result.push(inversionConversion(next, 1, inversionIndexes[3][index]));
                    }
                }
                break;
        }

        var stave = result;//.reverse();
        var vexTabString = ":8";
        for (var z = 0; z < stave.length; z++) {
            var paths = stave[z];
            for (var i = 0; i < paths.length; i++) {
                var reversed = paths[i].reverse();
                for (var j = 0; j < reversed.length; j++) {
                    var string = reversed[j][0] + 1;
                    var fret = reversed[j][1];
                    vexTabString += " " + fret + "/" + string;
                }
                if (reversed.length == 3) {
                    vexTabString += " " + "^3^";
                }
            }
            vexTabString += " |";
        }
        console.log(vexTabString);
        $("#vex-container").text(vexTabPrefix + vexTabString);
        Vex.Flow.TabDiv.start();
        return result;
    }
    
    function scaleConversion(tonic, stringOffset, schemaIndex, conversionIndex) {
        var result = [];
        var length = conversionIndex.length;
        var position = [];
        for (var i = 0; i < length; i++) {

            for (var j = 0; j < scaleSchema[schemaIndex].schema[i].length; j++) {
                var note = [];
                var string = stringOffset - i;
                var fret = tonic + conversionIndex[i][j];

                // 
                if (string == -1) {
                    string = 0;
                }

                note.push(string); //string
                note.push(fret); //note
                note.push(scaleSchema[schemaIndex].schema[i][j]) // schema
                position.push(note);
            }

        }
        result.push(position);
        return result;
    };

    function scales(string, fret, schemaIndex, typeIndex) {
        var result = [];
        var alternate;
        switch (string) {
            case 0:
                break;
            case 1:
                result.push(scaleConversion(fret, 1, schemaIndex, scaleSchema[schemaIndex].indexes[string][typeIndex]));
                break;
            case 2:
                result.push(scaleConversion(fret, 2, schemaIndex, scaleSchema[schemaIndex].indexes[string][typeIndex]));
                break;
            case 3:
                result.push(scaleConversion(fret, 3, schemaIndex, scaleSchema[schemaIndex].indexes[string][typeIndex]));
                alternate = schemaIndex == 0 ? 1 : 0;
                result.push(scaleConversion(fret + 3, 1, alternate, scaleSchema[alternate].indexes[1][typeIndex]));
                break;
            case 4:
                result.push(scaleConversion(fret, 4, schemaIndex, scaleSchema[schemaIndex].indexes[string][typeIndex]));
                alternate = schemaIndex == 0 ? 1 : 0;
                result.push(scaleConversion(fret + 2, 2, alternate, scaleSchema[alternate].indexes[2][typeIndex]));
                break;
            case 5:
                result.push(scaleConversion(fret, 5, schemaIndex, scaleSchema[schemaIndex].indexes[string][typeIndex]));
                alternate = schemaIndex == 0 ? 1 : 0;
                result.push(scaleConversion(fret + 2, 3, alternate, scaleSchema[alternate].indexes[3][typeIndex]));
        }

        var stave = result;
        var vexTabString = ":8";
        for (var z = 0; z < stave.length; z++) {
            var paths = stave[z];
            for (var i = 0; i < paths.length; i++) {
                var reversed = paths[i];//.reverse();
                for (var j = 0; j < reversed.length; j++) {
                    var string = reversed[j][0] + 1;
                    var fret = reversed[j][1];
                    vexTabString += " " + fret + "/" + string;
                }
            }
            vexTabString += " |";
        }
        console.log(vexTabString);
        $("#vex-container").text(vexTabPrefix + vexTabString);
        Vex.Flow.TabDiv.start();
        return result;

    };


    function draw(string, fret) {
        if (isTriad) {
            guitar_schemas.SessionObject.paths = triadInversions(string, fret, type);
        } else {
            guitar_schemas.SessionObject.paths = scales(string, fret, schema, type);
        }
        guitar_schemas.SessionObject.drawAll();
    }
   
    
})();
