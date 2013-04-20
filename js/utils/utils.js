var MusicTab = MusicTab || {};

// namespace function
MusicTab.namespace = function (ns_string) {
    var parts = ns_string.split('.'),
    parent = MusicTab,
    i;
    // strip redundant leading global
    if (parts[0] === "MusicTab") {
        parts = parts.slice(1);
    }
    for (i = 0; i < parts.length; i += 1) {
        // create a property if it doesn't exist
        if (typeof parent[parts[i]] === "undefined") {
            parent[parts[i]] = {};
        }
        parent = parent[parts[i]];
    }
    return parent;
};

// global klass function
klass = function (Parent, props) {
    var Child, F, i;
    // 1.
    // new constructor
    Child = function () {
        if (Child.uber && Child.uber.hasOwnProperty("__construct")) {
            Child.uber.__construct.apply(this, arguments);
        }
        if (Child.prototype.hasOwnProperty("__construct")) {
            Child.prototype.__construct.apply(this, arguments);
        }
    };
    // 2.
    // inherit
    Parent = Parent || Object;
    F = function () { };
    F.prototype = Parent.prototype;
    Child.prototype = new F();
    Child.uber = Parent.prototype;
    Child.prototype.constructor = Child;
    // 3.
    // add implementation methods
    for (i in props) {
        if (props.hasOwnProperty(i)) {
            Child.prototype[i] = props[i];
        }
    }
    // return the "class"
    return Child;
};

mix = function() {
    var arg, prop, child = { };
    for (arg = 0; arg < arguments.length; arg += 1) {
        for (prop in arguments[arg]) {
            if (arguments[arg].hasOwnProperty(prop)) {
                child[prop] = arguments[arg][prop];
            }
        }
    }
    return child;

};

String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

