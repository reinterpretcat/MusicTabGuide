var guitar = {
    SINGLE_DOTS: [3, 5, 7, 9],
    NOTE_NAME: ['A', 'A#', 'B', 'C', 'C#',
		'D', 'D#', 'E', 'F', 'F#',
		'G', 'G#'],
    STRING_TUNING: [31, 26, 22, 17, 12, 7],
    DOT_STYLE: {
	CIRCLE: 'circle',
	DIAMOND: 'diamond',
	TRIANGLE: 'triangle',
	SHARK_TOOTH: 'shark tooth',
	BLOCK: 'block'
    }
};

guitar.note = function(string, fret) {
    return guitar.NOTE_NAME[(guitar.STRING_TUNING[string] + fret) % 12];
};

guitar.addEventListener = function(el, type, fn) {
    if (el) {
        if (el.addEventListener) {
	        el.addEventListener(type, fn, false);
	} else {
	    el.attachEvent('on' + type, fn);
	}
    }
};

guitar.Fretboard = function (canvas, nonAccidentalsOnly) {
    this.base_taper_factor = 4.3 / 5.1;
    this.aspect = (6.3 / 33.0) / this.base_taper_factor;
    this.width = 1000;
    this.height = Math.ceil(this.aspect * this.width);
    this.dot_radius = 10;
    this.nut_width = 30;
    this.fret_width = 7;
    this.thinnest_width = 2;
    this.width_increase = 0.2;
    this.open_line_width = 4;
    this.left_handed = false;
    this.wood_colour = '#e9c2a6';
    this.dot_colour = 'black';
    this.highlighted_string_colour = '#ffd';
    this.dot_style = guitar.DOT_STYLE.CIRCLE;
    this.octave_dots = 2;
    this.first_dot = false;
    this,highlighted_string = null;
    this.clickHandlers = [];
    this.nonAccidentalsOnly = nonAccidentalsOnly;
    this.setSizes(canvas);

    var me = this;
    guitar.addEventListener(canvas, 'click', function(e) {
	    return me.clicked(e);
    });
};

guitar.Fretboard.prototype.setSizes = function(canvas) {
    this.half_height = this.height / 2;
    this.vertical_inset = this.dot_radius;
    this.scale_length = (this.width - 
			 (this.nut_width + (this.fret_width / 2))) *
	2;
    this.inter_string_gap = (this.height - (2 * this.vertical_inset)) / 5;

    canvas.setAttribute('width', this.width);
    canvas.setAttribute('height', this.height);
};

guitar.Fretboard.prototype.fretX = function(i) {
    return this.nut_width + this.scale_length * (1 - Math.pow(2, i/-12.0));
}

guitar.Fretboard.prototype.taperFactor = function(x) {
    return ((x / this.width) * (1 - this.base_taper_factor)) +
	    this.base_taper_factor;
};

guitar.Fretboard.prototype.baseY = function(taper_factor) {
    return (1 - taper_factor) * this.height * 0.5;
};

guitar.Fretboard.prototype.taperY = function(x, y) {
    var f = this.taperFactor(x);
    return f * y + this.baseY(f);
};

guitar.Fretboard.prototype.untaperY = function(x, y) {
    var f = this.taperFactor(x);
    return (y - this.baseY(f)) / f;
};

guitar.Fretboard.prototype.taperedRectangle = function(x, y, w, h, context) {
    context.beginPath()
    context.moveTo(x, this.taperY(x, y));
    context.lineTo(x + w, this.taperY(x + w, y));
    context.lineTo(x + w, this.taperY(x + w, y + h));
    context.lineTo(x, this.taperY(x, y + h));
    context.closePath();
};

guitar.Fretboard.prototype.taperedLine = function(x1, y1, x2, y2, context) {
    context.beginPath();
    context.moveTo(x1, this.taperY(x1, y1));
    context.lineTo(x2, this.taperY(x2, y2));
    context.stroke();
};

guitar.Fretboard.prototype.draw = function(context) {
    if (this.left_handed) {
	context.scale(-1, 1);
	context.translate(-this.width, 0);
    }

    // Neck
    context.lineWidth = 0.5;
    context.strokeStyle = 'black';
    context.fillStyle = this.wood_colour;
    this.taperedRectangle(0, 0, this.width, this.height, context);
    context.fill();
    //context.stroke();

    // Nut
    context.fillStyle = '#ddd';
    this.taperedRectangle(0, 0, this.nut_width, this.height, context);
    context.fill();

    context.strokeStyle = 'grey';
    context.lineWidth = 2;
    var x = this.fretX(0);
    this.taperedLine(x, 0, x, this.height, context);

    // Frets
    context.strokeStyle = '#7f9099';
    context.lineWidth = this.fret_width;
    for (var i = 1; i <= 12; ++i) {
	var x = this.fretX(i);
	this.taperedLine(x, 0, x, this.height, context);
    }

    // Fretboard Dots
    context.fillStyle = this.dot_colour;
    context.beginPath();
    if (this.first_dot) {
	this.decorateFret(context, 1);
    }
    for (var i = 0; i < guitar.SINGLE_DOTS.length; ++i) {
        this.decorateFret(context, guitar.SINGLE_DOTS[i]);
    }
    this.decorateFret(context, 12);
    context.fill();

    // Strings
    var y = this.vertical_inset;
    for (var i = 0; i < 6; ++i) {
	var isSelected = i == this.highlighted_string;
	if (isSelected) {
	    context.strokeStyle = this.highlighted_string_colour;
	} else {
	    context.strokeStyle = '#b2c3cc';
	}
	context.lineWidth = this.thinnest_width * (1 + i * this.width_increase);
	this.taperedLine(0, y, this.width, y, context);
	y += this.inter_string_gap;
    }
};

guitar.Fretboard.prototype.decorateFret = function(context, fret) {
    var w = this.fretX(fret) - this.fretX(fret - 1);
    w *= 0.6;
    var x = (this.fretX(fret - 1) + this.fretX(fret)) / 2.0;
    var dots = this.octave_dots;
    if (fret != 12 && dots > 1) {
	dots -= 1;
    }
    if (this.dot_style == guitar.DOT_STYLE.TRIANGLE) {
	dots = 2;
    }
    if (this.dot_style == guitar.DOT_STYLE.SHARK_TOOTH) {
	dots = 1;
    }

    if (dots == 3) {
	var y = this.height * 0.275;
	this.drawDot(context, x, y, w);
        this.drawDot(context, x, this.height / 2, w);
	this.drawDot(context, x, this.height - y, w);
    } else if (dots == 2) {
	var y = this.height * 0.275;
	this.drawDot(context, x, y, w);
	this.drawDot(context, x, this.height - y, w);
    } else {
        this.drawDot(context, x, this.height / 2, w);
    }
};

guitar.Fretboard.prototype.drawDot = function(context, x, y, w) {
    context.beginPath();
    if (this.dot_style == guitar.DOT_STYLE.BLOCK) {
	var x_off = w / 2;
	var y_off = this.height * 0.35;
	context.moveTo(x - x_off, y - y_off);
	context.lineTo(x - x_off, y + y_off);
	context.lineTo(x + x_off, y + y_off);
	context.lineTo(x + x_off, y - y_off);
	context.closePath();
    } else if (this.dot_style == guitar.DOT_STYLE.SHARK_TOOTH) {
	var x_off = w / 2;
	var y_off = this.height * 0.35;
	context.moveTo(x - x_off, y + y_off);
	context.lineTo(x + x_off, y + y_off);
	context.lineTo(x + x_off, y - y_off);
	context.closePath();
    } else if (this.dot_style == guitar.DOT_STYLE.TRIANGLE) {
	var offset = this.height / 5;
	if (y < this.height / 2) {
	    context.moveTo(x, y - 2 * this.dot_radius);
	} else {
	    offset = -offset;
	    context.moveTo(x, y + 2 * this.dot_radius);
	}
	context.lineTo(x - this.dot_radius, y + offset);
	context.lineTo(x + this.dot_radius, y + offset);
	context.closePath();
    } else if (this.dot_style == guitar.DOT_STYLE.DIAMOND) {
	context.moveTo(x, y - this.dot_radius);
	context.lineTo(x - this.dot_radius, y);
	context.lineTo(x, y + this.dot_radius);
	context.lineTo(x + this.dot_radius, y);
	context.closePath();
    } else {
	context.arc(x, y, this.dot_radius, 0, 2 * Math.PI, false);
    }
    context.fill();
};


guitar.Fretboard.prototype.positionedLeftToRight = function(context, x, y) {
    context.translate(x, y);
    if (this.left_handed) {
	context.scale(-1, 1);
    }
};

guitar.Fretboard.prototype.drawPaths = function (context, colour, paths, show_name, name_colour) {
    context.strokeStyle = colour;
    context.lineWidth = this.open_line_width;

    for (var i = 0; i < paths.length; i++) {
        context.beginPath();
        for (var j = 0; j<paths[i].length;j++)
        {
            var string = paths[i][j][0];
            var fret = paths[i][j][1];

            var coords = this.getCoords(string, fret);

            if (j == 0) {
                context.moveTo(coords.x, coords.y);
            }
            else {
   
                context.strokeStyle = this.getColor(colour, i, j);;
                context.lineTo(coords.x, coords.y);
            }

        }

        context.stroke();
    }

    
    for (var i = 0; i < paths.length; i++) {
        for (var j = 0; j < paths[i].length; j++) {
            var string = paths[i][j][0];
            var fret = paths[i][j][1];
            var text = paths[i][j][2];

            var coords = this.getCoords(string, fret);

            var color = this.getColor(colour, i, j);

            this.drawNoteDot(context, color, string, fret, show_name, name_colour, text + "(" + guitar.note(string, fret) + ")");
           // context.arc(coords.x, coords.y, coords.r, 0, 2 * Math.PI, false);
        }

    }
    
};

guitar.Fretboard.prototype.getColor = function (colour, i, j) {
    var color = {};
    //if (i % 2 == 0) {
        if (i % 3 == 0) {
            color = colour;
        } else
            if (i % 3 == 1) {
                color = "green";
            } else {
                color = "yellow";
            }
   /* } else {
        if (i % 3 == 0) {
            color = "yellow";
        } else
            if (i % 3 == 1) {
                color = "green";
            } else {
                color = "red";
            }
    }*/
    return color;
};

guitar.Fretboard.prototype.getCoords = function (string, fret, text) {
    var x;
    if (fret > 0) {
        x = (this.fretX(fret) + this.fretX(fret - 1)) / 2.0;
        radius = this.dot_radius;
    } else {
        x = (this.nut_width - 1) / 2.0;
        radius = this.dot_radius - (this.open_line_width / 2.0);
    }
    var y = this.vertical_inset + string * this.inter_string_gap;
    y = this.taperY(x, y);


    if (text) {
        radius += 5;
    }

    return {
        x: x,
        y: y,
        r: radius
    };
}

guitar.Fretboard.prototype.drawNoteDot = function(context, colour,
						  string, fret,
						  show_name, name_colour, text) {
    context.fillStyle = colour;
    context.strokeStyle = colour;
    context.lineWidth = this.open_line_width;
    context.beginPath()

    var coords = this.getCoords(string, fret, text);

    context.arc(coords.x, coords.y, coords.r, 0, 2 * Math.PI, false);
    if (fret > 0) {
	context.fill();
    } else {
	context.stroke();
    }

    if (show_name) {
	context.save();
	this.positionedLeftToRight(context, coords.x, coords.y);

	if (name_colour && fret > 0) {
	    context.fillStyle = name_colour;
	} else {
	    context.fillStyle = 'black';
	}
	context.textAlign = 'center';
	context.textBaseline = 'middle';
	context.lineWidth = 1;
	context.font = this.dot_radius + 2 + 'px sans-serif';
	var arcText = text || guitar.note(string, fret);
	context.fillText(arcText, 0, 0);
	context.restore();
    }
};

guitar.Fretboard.prototype.drawNonAccidentals = function(context, colour,
							 show_name,
							 name_colour) {
    for (var string = 0; string < 6; ++string) {
	for (var fret = 0; fret <= 12; ++fret) {
	    if (!this.nonAccidentalsOnly || guitar.note(string, fret).length == 1) {
		var c = fret == 0 ? '#ddf' : colour;
		this.drawNoteDot(context, c, string, fret,
				 show_name, name_colour);
	    }
	}
    }
};

guitar.Fretboard.prototype.clicked = function(event) {
    var x = event.clientX - event.currentTarget.getBoundingClientRect().left;
    var y = event.clientY - event.currentTarget.getBoundingClientRect().top;
    x *= this.width / event.currentTarget.clientWidth;
    y *= this.height / event.currentTarget.clientHeight;
    if (this.left_handed) {
	x = (this.width - 1) - x;
    }
    var string = Math.round((this.untaperY(x, y) - this.vertical_inset) /
			    this.inter_string_gap);
    var fret = 0;
    for (var i = 0; i < 12; ++i) {
	if (this.fretX(i) > x) {
	    break;
	}
	++fret;
    }
    if (string >= 0 && string < 6) {
	for (var i = 0; i < this.clickHandlers.length; ++i) {
	    this.clickHandlers[i](string, fret, this);
	}
    }
    return true;
};
