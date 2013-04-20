(function () {
    "use strict";
    var appdata = Windows.Storage.ApplicationData;
    var learnedNotes;
    var won;
    var played;

    WinJS.UI.Pages.define("/pages/tools/fretTrainer/fretTrainer.html", {
        ready: function (element, options) {

            document.getElementById("resetProgressButton").addEventListener("click", resetProgress, false);
            document.getElementById("accidentalsToggle").addEventListener("change", accidentalsChanged, false);
            document.getElementById("soundToggle").addEventListener("change", soundChange, false);
            document.getElementById("stringsProgress").addEventListener("change", stringsProgressChanged, false);
            document.getElementById("hideNote").addEventListener("change", hideNoteChanged, false);
     
            startTrainer();  
        },
        
        unload: function () {
            // save progress
            if (guitar_trainer.SessionObject.notes && isProgressMode()) {
                saveState();
            }
            if (guitar_trainer.SessionObject.Sound) {
                guitar_trainer.SessionObject.Sound.pause();
            }
        }
    });
    
    function saveState() {
        appdata.current.roamingSettings.values["fret.learnedNotes"] = guitar_trainer.SessionObject.notes.length;
        appdata.current.roamingSettings.values["fret.won"] = guitar_trainer.SessionObject.won;
        appdata.current.roamingSettings.values["fret.played"] = guitar_trainer.SessionObject.played;
    }
    
    function loadState() {
        learnedNotes = appdata.current.roamingSettings.values["fret.learnedNotes"];
        won = appdata.current.roamingSettings.values["fret.won"];
        played = appdata.current.roamingSettings.values["fret.played"];
    }
    
    function isProgressMode() {
        return document.getElementById("stringsProgress").selectedIndex == 0;
    }

    function accidentalsChanged(e) {
        appdata.current.roamingSettings.values["fret.nonAccidentalsOnly"] = !e.target.winControl.checked;
        if (isProgressMode()) {
            resetProgress();
        }
        else {
            reloadTrainer();
        }
    }

    function hideNoteChanged(e) {
        //var state = e.target.winControl.checked;
        var element = document.getElementById("spec");
        WinJS.Utilities.toggleClass(element, "hidden");
    }

    function soundChange(e) {
        appdata.current.roamingSettings.values["fret.enableSound"] = e.target.winControl.checked;
        guitar_trainer.SessionObject.enableSound = e.target.winControl.checked;
    }

    function resetProgress() {
        learnedNotes = 3;
        won = 0;
        played = 0;
        
        reloadTrainer();
    }
    
    function stringsProgressChanged(e) {
        var index = e.target.selectedIndex;
        if(index == 0) {
            // progress mode
            loadState();
            reloadTrainer();
            return;
        }

        var mult = 12;
        if(appdata.current.roamingSettings.values["fret.nonAccidentalsOnly"]) {
            mult = 7;
        }

        won = 0;
        played = 0;
        learnedNotes =  mult * index;
        reloadTrainer();
    }
    
    function reloadTrainer() {
        
        // TODO move functionality to Session object
        guitar_trainer.SessionObject.notes = [];
        guitar_trainer.SessionObject.candidates = guitar_trainer.SessionObject.nonAccidentals(appdata.current.roamingSettings.values["fret.nonAccidentalsOnly"]);
        guitar_trainer.SessionObject.newNotes(learnedNotes);
        guitar_trainer.SessionObject.drawAll();

        if (guitar_trainer.SessionObject.Sound) {
            guitar_trainer.SessionObject.Sound.pause();
        }
        guitar_trainer.SessionObject.won = won;
        guitar_trainer.SessionObject.played = played;
        drawScore();
        
    }
    
    function drawScore() {
        document.getElementById("score").innerHTML = won + '/' + played + '<wbr /> ' + (played == 0 ? 0 : (Math.round((100.0 * won) / played).toFixed(0))) + '%';
    }

    function startTrainer() {

        try {
            
            won = appdata.current.roamingSettings.values["fret.won"];
            if (won == undefined) {
                won = 0;
            }
            
            played = appdata.current.roamingSettings.values["fret.played"];
            if (played == undefined) {
                played = 0;
            }
            
            drawScore();

            learnedNotes = appdata.current.roamingSettings.values["fret.learnedNotes"];
            if (learnedNotes == undefined) {
                learnedNotes = 3;
            }

            var nonAccidentalsOnly = appdata.current.roamingSettings.values["fret.nonAccidentalsOnly"];
            if (nonAccidentalsOnly == undefined) {
                nonAccidentalsOnly = true;
                appdata.current.roamingSettings.values["fret.nonAccidentalsOnly"] = true;
            }
            document.getElementById("accidentalsToggle").winControl.checked = !nonAccidentalsOnly;

            var enableSound = appdata.current.roamingSettings.values["fret.enableSound"];
            if (enableSound == undefined) {
                enableSound = true;
                appdata.current.roamingSettings.values["fret.enableSound"] = true;
            }
            document.getElementById("soundToggle").winControl.checked = enableSound;

            guitar_trainer.load(learnedNotes, nonAccidentalsOnly, enableSound, won, played);
        }
        catch(err) {
            appdata.current.roamingSettings.values["fret.learnedNotes"] = 3;
        }
    }
})();
