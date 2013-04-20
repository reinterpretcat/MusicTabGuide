// FUTURE: Select string/fret groups, one at a time or all at once.
// FUTURE: Progress bar in learning mode.
// FUTURE: Help
// FUTURE: Save progress.

var guitar_trainer = {
    TIME_BETWEEN_PUZZLES_CORRECT: 1000,
    TIME_BETWEEN_PUZZLES_WRONG: 2500,
    STATE: {
	NEW_NOTES: 'new_notes',
	PLAYING: 'playing'
    }
};

guitar_trainer.hasClass = function(el, className) {
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

guitar_trainer.addClass = function(el, className) {
    if (!guitar_trainer.hasClass(el, className)) {
	el.className = el.className + ' ' + className;
    }
};

guitar_trainer.removeClass = function(el, className) {
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

guitar_trainer.Scores = function() {
    this.learning_rate = 0.4;
    this.max_duration = 20;
    this.durations = new Array();
    for (var i = 12 * 6; i > 0; --i) {
	this.durations.push(null);
    }
};

guitar_trainer.Scores.prototype.index = function(string, fret) {
    return (12 * string) + (fret % 12);
};

guitar_trainer.Scores.prototype.getDuration = function(string, fret) {
    var duration = this.durations[this.index(string, fret)];
    if (duration == null) {
	duration = this.max_duration;
    }
    return duration;
};

guitar_trainer.Scores.prototype.update = function(string, fret,
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

guitar_trainer.Scores.prototype.getScore = function(string, fret) {
    var score = this.getDuration(string, fret);
    return score * score;
};


guitar_trainer.Session = function (canvas_id, nonAccidentalsOnly, enableSound, won, played) {
    this.move_on_response_time = 3;
    this.state = null;
    this.scores = new guitar_trainer.Scores();
    this.canvas_id = canvas_id;
    this.selected = null;
    this.correct = null;
    this.won = won;
    this.played = played;
    this.candidates = this.nonAccidentals(nonAccidentalsOnly);
    this.notes = new Array();
    this.enableSound = enableSound;

    var canvas = document.getElementById(this.canvas_id);
    this.fretboard = new guitar.Fretboard(canvas, nonAccidentalsOnly);
    this.resize();
    canvas.onselectstart = function() { return false; };
};

guitar_trainer.Session.prototype.addEventHandlers = function(play, handed) {
    var me = this;
    this.fretboard.clickHandlers = [];
    this.fretboard.clickHandlers.push(function(string, fret, fretboard) {
	me.clickHandler(string, fret, fretboard);
    });

    guitar.addEventListener(document.getElementById(play), 'click',
			    function(e) {
				me.newPuzzle();
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

guitar_trainer.Session.prototype.setState = function(state) {
    if (state != this.state) {
	this.state = state;

	var parent = document.getElementById('instructions');
	if (parent) {
	    var el = parent.firstChild;
	    while (el) {
		if (guitar_trainer.hasClass(el, this.state)) {
		    guitar_trainer.removeClass(el, 'hidden');
		} else {
		    guitar_trainer.addClass(el, 'hidden');
		}
		el = el.nextSibling;
	    }
	}
    
	var specDiv = document.getElementById('spec');
	if (state == guitar_trainer.STATE.PLAYING) {
	    guitar_trainer.removeClass(specDiv, 'hidden');
	} else {
	    guitar_trainer.addClass(specDiv, 'hidden');
	}

	if (this.animation) {
	    this.animate(false);
	}
    }
};

guitar_trainer.Session.prototype.newNotes = function(note_count, congrats) {
    this.setState(guitar_trainer.STATE.NEW_NOTES);
    this.new_note_count = note_count;
    this.selected = null;
    this.fretboard.highlighted_string = null;
    this.last_correct = 0;
    for (var i = 0; i < note_count; ++i) {
	this.notes.push(this.candidates[this.notes.length]);
    }

    var string = this.notes[this.notes.length - 1][0];
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

    this.drawAll(congrats ? 1 : null);

    if (congrats && !this.animation) {
	this.animation_alpha = 1;
	var me = this;
	this.animation = setInterval(function() {
	    me.animate(true);
	    return true;
	},
				     100);
    }
};

guitar_trainer.Session.prototype.animate = function(keep_going) {
    if (this.animation) {
	this.animation_alpha -= (1.01 - this.animation_alpha) * 0.2;
	if (!keep_going || this.animation_alpha <= 0.05) {
	    clearInterval(this.animation);
	    this.animation = null;
	    this.drawAll();
	} else {
	    this.drawAll(this.animation_alpha);
	}
    }
};

guitar_trainer.Session.prototype.nonAccidentals = function(nonAccidentalsOnly) {
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

guitar_trainer.Session.prototype.readyToMoveOn = function() {
    if (this.notes.length >= this.candidates.length) {
	return false;
    }
    if (this.last_correct < 3) {
	return false;
    }
    var last_note = this.notes[this.notes.length - 1];
    if (this.scores.getDuration(last_note[0], last_note[1]) >
	this.move_on_response_time) {
	return false;
    }
    var average = 0;
    for (var i = 0; i < this.notes.length; ++i) {
	var note = this.notes[i];
	average += this.scores.getDuration(note[0], note[1]);
    }
    average /= this.notes.length;
    return average <= this.move_on_response_time;
};

guitar_trainer.Session.prototype.isSelectedCorrect = function() {
    return this.selected != null && this.correct != null &&
	this.selected[0] == this.correct[0] &&
	this.selected[1] == this.correct[1];
};

guitar_trainer.Session.prototype.drawAll = function(congrats_alpha) {
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

	if (this.state == guitar_trainer.STATE.NEW_NOTES) {
	    context.globalAlpha = alpha * 0.8;
	    this.fretboard.drawNonAccidentals(context, '#ddf', true, 'black');

	    context.globalAlpha = alpha;
	    for (var i = 1; i <= this.new_note_count; ++i) {
		var note = this.notes[this.notes.length - i];
		this.fretboard.drawNoteDot(context, '#ff6',
					   note[0], note[1],
					   true, 'black');
	    }
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

	if (congrats_alpha) {
	    context.globalAlpha = congrats_alpha;
	    context.textAlign = 'center';
	    context.textBaseline = 'alphabetic';
	    context.lineWidth = 1;
	    context.fillStyle = '#ff6';
	    context.save();
	    var x = canvas.width / 2;
	    var y = this.fretboard.vertical_inset +
		2 * this.fretboard.inter_string_gap -
		(this.fretboard.thinnest_width *
		 (1 + 2 * this.fretboard.width_increase));
	    this.fretboard.positionedLeftToRight(context, x,
						 this.fretboard.taperY(x, y));
	    context.font = (canvas.height / 2) + 'px serif';
	    context.fillText('Congratulations', 0, 0);
            context.restore();
	    y = this.fretboard.vertical_inset +
		5 * this.fretboard.inter_string_gap -
		(this.fretboard.thinnest_width *
		 (1 + 5 * this.fretboard.width_increase));
	    this.fretboard.positionedLeftToRight(context, x,
						 this.fretboard.taperY(x, y));
	    context.font = (canvas.height / 5.5) + 'px serif';
	    context.fillText('You\'ve unlocked a new note.', 0, 0);
	}

        context.restore();
    }
};

guitar_trainer.Session.prototype.clickHandler = function(string, fret,
							 fretboard) {
    // Only accept the first click as the answer.
    if (this.state == guitar_trainer.STATE.PLAYING && !this.selected) {
	this.selected = [this.correct[0], fret];

	// How quickly did they get it?
	var duration = (new Date().getTime() - this.puzzleStarted) / 1000.0;

	// Open or 12th fret are equivalent.
	var orignal_fret = this.correct[1];
	if (this.correct[1] == fret % 12) {
	    // Must not change immutable object from this.notes.
	    this.correct = [this.correct[0], fret];
	}

	// Were they correct?
	var won = this.isSelectedCorrect();
	this.scores.update(this.correct[0], orignal_fret, won, duration);
	var last_note = this.notes[this.notes.length - 1];
	if (this.correct[0] == last_note[0] &&
	    this.correct[1] % 12 == last_note[1] % 12) {
	    if (won) {
		++this.last_correct;
	    } else {
		this.last_correct = 0;
	    }
	}
	++this.played;
	if (won) {
	    ++this.won;
	}

	// Draw results.
	this.drawAll();
	var score = document.getElementById('score');
	score.innerHTML = this.won + '/' + this.played + '<wbr /> ' +
	    Math.round((100.0 * this.won) / this.played).toFixed(0) + '%';
	guitar_trainer.removeClass(document.getElementById('score_box'),
				   'hidden');

	// Start a new puzzle after a delay.
        var delay = this.isSelectedCorrect() ?
            guitar_trainer.TIME_BETWEEN_PUZZLES_CORRECT : guitar_trainer.TIME_BETWEEN_PUZZLES_WRONG;
	if (this.readyToMoveOn()) {
	    this.newNotesAfterDelay(delay, 1);
	} else {
	    this.newPuzzleAfterDelay(delay);
	}
    }
    else {
        this.playSound(string, fret, false);
    }
};

guitar_trainer.Session.prototype.newNotesAfterDelay = function(ms, count) {
    var me = this;
    setTimeout(function() { me.newNotes(count, true); }, ms);
};

guitar_trainer.Session.prototype.newPuzzleAfterDelay = function(ms) {
    var me = this;
    setTimeout(function() { me.newPuzzle(); }, ms);
};

guitar_trainer.Session.prototype.newPuzzle = function() {
    this.setState(guitar_trainer.STATE.PLAYING);
    var newFret;
    do {
	var sum = 0.0;
	for (var i = 0; i < this.notes.length; ++i) {
	    var note = this.notes[i];
	    sum += this.scores.getScore(note[0], note[1]);
	}
	var threshold = Math.random() * sum;
	var sum = 0.0;
	for (var i = 0; i < this.notes.length; ++i) {
	    var note = this.notes[i];
	    sum += this.scores.getScore(note[0], note[1]);
	    if (sum >= threshold) {
		newFret = note;
		break;
	    }
	}
    } while (this.correct && 
	     this.correct[0] == newFret[0] && 
	     this.correct[1] % 12 == newFret[1] % 12);

    this.selected = null;
    this.correct = newFret;
    this.fretboard.highlighted_string = this.correct[0];
    this.puzzleStarted = new Date().getTime();

    var stringDiv = document.getElementById('string');
    stringDiv.innerHTML = this.correct[0] + 1;
    var noteDiv = document.getElementById('note');
    
    noteDiv.innerHTML = guitar.note(this.correct[0], this.correct[1]);

    this.playSound(this.correct[0], this.correct[1], true);
    this.drawAll();
    
};

guitar_trainer.Session.prototype.playSound = function (string, fret, loop) {
    
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

guitar_trainer.Session.prototype.handedChanged = function(event) {
    this.fretboard.left_handed = event.currentTarget.selectedIndex != 0;
    this.drawAll();
    return true;
};

guitar_trainer.Session.prototype.resize = function(event) {
    var canvas = document.getElementById(this.canvas_id);
    if (canvas) {
	canvas.style.height = Math.ceil(this.fretboard.aspect *
					canvas.clientWidth) + 'px';
    }
    return true;
};

guitar_trainer.load = function (newNoteCount, nonAccidentalsOnly, enableSound, won, played) {
    var canvas = document.getElementById('fretboard');
    var supportsCanvas = canvas && canvas.getContext;

    var el = document.getElementById('sections_container');
    if (el) {
	el = el.firstChild;
    }
    while (el) {
	if (el.id == 'no_js') {
	    guitar_trainer.addClass(el, 'hidden');
	} else if (el.id == 'no_canvas') {
	    if (!supportsCanvas) {
		guitar_trainer.removeClass(el, 'hidden');
	    }
	} else if (supportsCanvas) {
	    guitar_trainer.removeClass(el, 'hidden');
	}
	el = el.nextSibling;
    }

    if (supportsCanvas) {
        this.SessionObject = new guitar_trainer.Session('fretboard', nonAccidentalsOnly, enableSound, won, played);
        this.SessionObject.addEventHandlers('play', 'handed');
        if (!newNoteCount) {
            newNoteCount = 3;
        }
        this.SessionObject.newNotes(newNoteCount);
    }

    return true;
};