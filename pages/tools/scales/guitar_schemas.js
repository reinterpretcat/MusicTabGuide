// FUTURE: Select string/fret groups, one at a time or all at once.
// FUTURE: Progress bar in learning mode.
// FUTURE: Help
// FUTURE: Save progress.

var guitar_schemas = {
    TIME_BETWEEN_PUZZLES_CORRECT: 1000,
    TIME_BETWEEN_PUZZLES_WRONG: 2500,
    STATE: {
	NEW_NOTES: 'new_notes',
	PLAYING: 'playing'
    }
};

guitar_schemas.hasClass = function (el, className) {
    if (!el.className) {
	return false;
    }
    var classes = el.className.split(' ');
    for (var i = 0; i < classes.length; ++i) {
	if (classes[i] == className) {
	    return true;
	}
    }
};

guitar_schemas.addClass = function(el, className) {
    if (!guitar_schemas.hasClass(el, className)) {
	el.className = el.className + ' ' + className;
    }
};

guitar_schemas.removeClass = function(el, className) {
    if (!el.className) {
	return;
    }
    var classes = el.className.split(' ');
    for (var i = 0; i < classes.length; ++i) {
	if (classes[i] == className) {
	    classes.splice(i, 1);
	    el.className = classes.join(' ');
	    return;
	}
    }
};

guitar_schemas.Scores = function() {
    this.learning_rate = 0.4;
    this.max_duration = 20;
    this.durations = new Array();
    for (var i = 12 * 6; i > 0; --i) {
	this.durations.push(null);
    }
};

guitar_schemas.Scores.prototype.index = function(string, fret) {
    return (12 * string) + (fret % 12);
};

guitar_schemas.Scores.prototype.getDuration = function(string, fret) {
    var duration = this.durations[this.index(string, fret)];
    if (duration == null) {
	duration = this.max_duration;
    }
    return duration;
};

guitar_schemas.Scores.prototype.update = function(string, fret,
						  correct, duration) {
    if (duration > 0 && duration < this.max_duration) {
	if (duration < 1) {
	    duration = 1;
	}
	if (!correct) {
	    duration = this.max_duration;
	}
	var old_duration = this.getDuration(string, fret);
	this.durations[this.index(string, fret)] =
	    this.learning_rate * duration +
	    (1.0 - this.learning_rate) * old_duration;
    }
};

guitar_schemas.Scores.prototype.getScore = function(string, fret) {
    var score = this.getDuration(string, fret);
    return score * score;
};


guitar_schemas.Session = function (canvas_id, candidates, paths, enableSound) {
    this.move_on_response_time = 3;
    this.state = null;
    this.scores = new guitar_schemas.Scores();
    this.canvas_id = canvas_id;
    this.selected = null;
    this.correct = null;
    this.candidates = candidates;//this.nonAccidentals(nonAccidentalsOnly);
    this.paths = paths;
    this.notes = new Array();
    this.enableSound = enableSound;

    var canvas = document.getElementById(this.canvas_id);
    this.fretboard = new guitar.Fretboard(canvas, false);
    this.resize();
    canvas.onselectstart = function() { return false; };
};

guitar_schemas.Session.prototype.addEventHandlers = function(play, handed) {
    var me = this;
    this.fretboard.clickHandlers = [];
    this.fretboard.clickHandlers.push(function(string, fret, fretboard) {
	me.clickHandler(string, fret, fretboard);
    });

    guitar.addEventListener(document.getElementById(play), 'click',
			    function (e) {
					return true;
			    });

    guitar.addEventListener(document.getElementById(handed), 'change',
			    function(e) {
				return me.handedChanged(e);
			    });

    guitar.addEventListener(window, 'resize',
			    function(e) {
				return me.resize(e);
			    });
};

guitar_schemas.Session.prototype.setState = function(state) {
    if (state != this.state) {
		this.state = state;
    }
};

guitar_schemas.Session.prototype.newNotes = function(fretType) {
    this.setState(guitar_schemas.STATE.NEW_NOTES);
    this.new_note_count = this.candidates.length;
    this.selected = null;
    this.fretboard.highlighted_string = null;
    this.last_correct = 0;
    for (var i = 0; i < this.candidates.length; ++i) {
		this.notes.push(this.candidates[this.notes.length]);
    }

    var string = fretType;
    this.fretboard.dot_style = guitar.DOT_STYLE.CIRCLE;
    this.fretboard.wood_colour = '#300008';
    this.fretboard.dot_colour = 'white';
    this.fretboard.octave_dots = 2;
    if (string < 1) {
	this.fretboard.dot_style = guitar.DOT_STYLE.BLOCK;
	this.fretboard.octave_dots = 1;
	this.fretboard.first_dot = true;
	this.fretboard.wood_colour = 'black';
	this.fretboard.dot_colour = '#eee';
    } else if (string < 2) {
	this.fretboard.dot_style = guitar.DOT_STYLE.SHARK_TOOTH;
	this.fretboard.wood_colour = 'black';
	this.fretboard.first_dot = true;
    } else if (string < 3) {
	this.fretboard.dot_style = guitar.DOT_STYLE.DIAMOND;
	this.fretboard.octave_dots = 3;
    } else if (string < 4) {
	this.fretboard.wood_colour = '#e9c2a6';
	this.fretboard.dot_colour = 'black';
	this.fretboard.dot_style = guitar.DOT_STYLE.TRIANGLE;
	this.fretboard.first_dot = true;
    } else if (string < 5) {
	// All Defaults
    } else {
        this.fretboard.wood_colour = '#D6A165';
	    this.fretboard.dot_colour = 'black';
    }

    this.drawAll();
};

guitar_schemas.Session.prototype.nonAccidentals = function(nonAccidentalsOnly) {
    var notes = new Array();
    for (var string = 5; string >= 0; --string) {
	for (var fret = 0; fret < 12; ++fret) {
	    if (!nonAccidentalsOnly || guitar.note(string, fret).length == 1) {
		    notes.push([string, fret]);
	    }
	}
    }
    return notes;
};

guitar_schemas.Session.prototype.drawAll = function(congrats_alpha) {
    var canvas = document.getElementById(this.canvas_id);
    if (canvas.getContext) {
        var context = canvas.getContext("2d");
        context.save();
	context.clearRect(0, 0, canvas.width, canvas.height);

	this.fretboard.draw(context);

	var alpha;
	if (congrats_alpha) {
	    alpha = (1 - congrats_alpha);
	} else {
	    alpha = 1;
	}

	if (this.state == guitar_schemas.STATE.NEW_NOTES) {
	    //context.globalAlpha = alpha * 0.8;
	   // this.fretboard.drawNonAccidentals(context, '#ddf', true, 'black');

	    context.globalAlpha = alpha;

	    if (this.paths && this.paths.length > 0) {
	        for (var i = 0; i < this.paths.length; i++) {
	            this.fretboard.drawPaths(context, i % 2 == 0 ? "red" : "#00FFFF", this.paths[i], true, 'black');
	        }
	        
	    }
	    else {
	        for (var i = 1; i <= this.new_note_count; ++i) {
	            var note = this.notes[this.notes.length - i];
	            this.fretboard.drawNoteDot(context, '#ff6',
                               note[0], note[1],
                               true, 'black');
	        }
	    }

	    // paths

	    context.globalAlpha = 1;
	}

	if (this.selected) {
	    this.fretboard.drawNoteDot(context, '#1f1',
				       this.correct[0], this.correct[1],
				       true, 'black');
	}
	if (this.selected && this.correct && !this.isSelectedCorrect()) {
	    this.fretboard.drawNoteDot(context, 'red',
				       this.selected[0], this.selected[1]);
	}

	

        context.restore();
    }
};

guitar_schemas.Session.prototype.clickHandler = function(string, fret,
							 fretboard) {
  this.playSound(string, fret, false);
  this.drawAll();
};

guitar_schemas.Session.prototype.newNotesAfterDelay = function(ms, count) {
    var me = this;
    setTimeout(function() { me.newNotes(count, true); }, ms);
};

guitar_schemas.Session.prototype.newPuzzleAfterDelay = function(ms) {
    var me = this;
    setTimeout(function() { me.newPuzzle(); }, ms);
};

guitar_schemas.Session.prototype.playSound = function (string, fret, loop) {
    
    if (!this.enableSound) {
        return;
    }

    var offset = ((guitar.STRING_TUNING[string] + fret -3) % 12) + 1; // 3 as started from C in audio, but from A in guitar array
    var octave = Math.floor((guitar.STRING_TUNING[string] + fret - 3) / 12) + 1;
    try {
        if (this.Sound) {
            this.Sound.pause();
        }
        this.Sound = new Audio("/sounds/acoustic/C" + octave + "/" + offset + ".mp3");
        this.Sound.loop = loop;
        this.Sound.play();
    }catch (err) {
        
    }
};

guitar_schemas.Session.prototype.handedChanged = function(event) {
    this.fretboard.left_handed = event.currentTarget.selectedIndex != 0;
    this.drawAll();
    return true;
};

guitar_schemas.Session.prototype.resize = function(event) {
    var canvas = document.getElementById(this.canvas_id);
    if (canvas) {
	canvas.style.height = Math.ceil(this.fretboard.aspect *
					canvas.clientWidth) + 'px';
    }
    return true;
};

guitar_schemas.load = function (fretType, candidates, paths, enableSound) {
    var canvas = document.getElementById('fretboard');
    //var supportsCanvas = canvas && canvas.getContext;

   /* var el = document.getElementById('sections_container');
    if (el) {
	el = el.firstChild;
    }
    while (el) {
	if (el.id == 'no_js') {
	    guitar_schemas.addClass(el, 'hidden');
	} else if (el.id == 'no_canvas') {
	    if (!supportsCanvas) {
		guitar_schemas.removeClass(el, 'hidden');
	    }
	} else if (supportsCanvas) {
	    guitar_schemas.removeClass(el, 'hidden');
	}
	el = el.nextSibling;
    }*/

   // if (supportsCanvas) {
        this.SessionObject = new guitar_schemas.Session('fretboard', candidates, paths, enableSound);
        this.SessionObject.addEventHandlers('play', 'handed');
        this.SessionObject.newNotes(fretType);
   // }

    return true;
};