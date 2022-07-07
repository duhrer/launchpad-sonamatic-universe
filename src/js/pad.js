// TODO: Rewrite to only send column and row, let the router figure out the notes.
(function (fluid) {
    "use strict";
    var lsu = fluid.registerNamespace("lsu");

    fluid.defaults("lsu.pad.base", {
        gradeNames: ["lsu.templateRenderer"],
        events: {
            onMessage: null,
            onPadDown: null,
            onPadUp: null
        },
        markup: {
            container: "<div class='lsu-pad'></div>"
        },
        col: -2,
        row: -2,
        cols: 10,
        rows: 10,
        model: {
            focus: { col: -1, row: -1 }
        },
        invokers: {
            renderMarkup: {
                funcName: "lsu.templateRenderer.render",
                args: ["{that}", "{that}.options.markup.container", "{that}.model"]
            }
        }
    });

    fluid.defaults("lsu.pad.blank", {
        gradeNames: ["lsu.pad.base"],
        markup: {
            container: "<div class='lsu-pad lsu-pad-blank'></div>"
        },
        modelListeners: {
            "focus.col": {
                excludeSource: ["local", "init"],
                funcName: "lsu.pad.blank.handleFocusColumnChange",
                args: ["{that}", "{change}.value", "{change}.oldValue"] // newValue, oldValue
            },
            "focus.row": {
                excludeSource: ["local", "init"],
                funcName: "lsu.pad.blank.handleFocusRowChange",
                args: ["{that}", "{change}.value", "{change}.oldValue"] // newValue, oldValue
            }
        }
    });

    // Focus should skip past "blanks" to the next pad.
    lsu.pad.blank.handleFocusColumnChange = function (that, newValue, oldValue) {
        if (that.model.focus.col === that.options.col && that.model.focus.row === that.options.row) {
            var diff = oldValue ? newValue - oldValue : newValue;
            var bumpedValue = (that.options.cols + newValue + diff) % that.options.cols;
            that.applier.change("focus.col", bumpedValue);
        }
    };

    lsu.pad.blank.handleFocusRowChange = function (that, newValue, oldValue) {
        if (that.model.focus.col === that.options.col && that.model.focus.row === that.options.row) {
            var diff = oldValue ? newValue - oldValue : newValue;
            var bumpedValue = (that.options.rows + newValue + diff) % that.options.rows;
            that.applier.change("focus.row", bumpedValue);
        }
    };

    fluid.defaults("lsu.pad", {
        gradeNames: ["lsu.pad.base"],
        markup: {
            container: "<div class='lsu-pad'></div>"
        },
        templates: {
            noBackgroundColour: "background-color: none",
            backgroundColour: "background-color: rgb(%r, %g, %b)"
        },

        tuning: lsu.tunings.launchpadPro.guitarE,

        clickKeys: ["Enter", " "],
        col: -1,
        row: -1,
        model: {
            capoShift: 0,

            velocity: 0,
            padColour: {
                r: 0,
                g: 0,
                b: 0
            },
            focus: {
                row: -1,
                col: -1
            }
        },
        invokers: {
            focus: {
                funcName: "lsu.pad.focus",
                args: ["{that}"]
            },
            handleDown: {
                funcName: "fluid.notImplemented"
            },
            handleUp: {
                funcName: "fluid.notImplemented"
            },
            handleKeydown: {
                funcName: "lsu.pad.handleKeyEvent",
                args: ["{that}", "{arguments}.0", "{that}.handleDown"] // event, callback
            },
            handleKeyup: {
                funcName: "lsu.pad.handleKeyEvent",
                args: ["{that}", "{arguments}.0", "{that}.handleUp"] // event, callback
            }
        },
        listeners: {
            "onCreate.bindFocus": {
                this: "{that}.container",
                method: "focus",
                args: ["{that}.focus"]
            },
            "onCreate.bindMousedown": {
                this: "{that}.container",
                method: "mousedown",
                args: ["{that}.handleDown"]
            },
            "onCreate.bindMouseup": {
                this: "{that}.container",
                method: "mouseup",
                args: ["{that}.handleUp"]
            },
            "onCreate.bindKeydown": {
                this: "{that}.container",
                method: "keydown",
                args: ["{that}.handleKeydown"]
            },
            "onCreate.bindKeyup": {
                this: "{that}.container",
                method: "keyup",
                args: ["{that}.handleKeyup"]
            }
        },
        modelListeners: {
            "padColour": {
                funcName: "lsu.pad.applyColour",
                args: ["{that}"]
            },
            "focus.*": {
                funcName: "lsu.pad.checkFocus",
                args: ["{that}"]
            }
        }
    });

    lsu.pad.handleKeyEvent = function (that, event, callback) {
        if (that.options.clickKeys.indexOf(event.key) !== -1) {
            callback(event);
        }
    };

    lsu.pad.checkFocus = function (that) {
        if (that.model.focus.col === that.options.col && that.model.focus.row === that.options.row) {
            that.container.focus();
        }
    };

    lsu.pad.focus = function (that) {
        that.applier.change("focus.row", that.options.row);
        that.applier.change("focus.col", that.options.col);
    };

    lsu.pad.applyColour = function (that) {
        var r = fluid.get(that, "model.padColour.r") || 0;
        var g = fluid.get(that, "model.padColour.g") || 0;
        var b = fluid.get(that, "model.padColour.b") || 0;
        var template = (r || g || b) ? that.options.templates.backgroundColour : that.options.templates.noBackgroundColour;
        var scaledValues = {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
        var backgroundColourCss = fluid.stringTemplate(template, scaledValues);
        that.container.attr("style", backgroundColourCss );
    };

    fluid.defaults("lsu.pad.note", {
        gradeNames: ["lsu.pad"],
        markup: {
            container: "<button class='lsu-pad lsu-pad-note'></button>"
        },

        clickVelocity: 100, // Roughly 80% of what's possible (127).

        // TODO: Refactor to make everything row/column based, perhaps collapsing the above into this.
        model: {
            note: "{that}.options.note"
        },
        invokers: {
            handleDown: {
                funcName: "lsu.pad.note.handleDown",
                args: ["{that}", "{arguments}.0"] // event
            },
            handleUp: {
                funcName: "lsu.pad.note.handleUp",
                args: ["{that}", "{arguments}.0"] // event
            }
        },
        listeners: {
            "onCreate.bindKeydown": {
                this: "{that}.container",
                method: "keydown",
                args: ["{that}.handleKeydown"]
            },
            "onCreate.bindKeyup": {
                this: "{that}.container",
                method: "keyup",
                args: ["{that}.handleKeyup"]
            }
        }
    });

    lsu.pad.note.handleDown = function (that, event) {
        that.focus();
        event.preventDefault();

        // Add support for the same kind of tuning that devices support.
        var tuningNote = fluid.get(that, ["options", "tuning", "note", that.options.note]);
        var note = tuningNote !== undefined ? tuningNote : that.options.note;

        note += that.model.capoShift;

        // Keyboard events can easily repeat, so make sure to stop any existing notes if we retrigger because of
        // a repeat.
        that.events.onMessage.fire({ type: "noteOff", channel: 0, note: note, velocity: 0});

        that.events.onMessage.fire({ type: "noteOn", channel: 0, note: note, velocity: that.options.clickVelocity});
        that.events.onPadDown.fire({ row: that.options.row, col: that.options.col, velocity: that.options.clickVelocity});
    };

    lsu.pad.note.handleUp = function (that, event) {
        event.preventDefault();

        // Add support for the same kind of tuning that devices support.
        var tuningNote = fluid.get(that, ["options", "tuning", "note", that.options.note]);
        var note = tuningNote !== undefined ? tuningNote : that.options.note;

        note += that.model.capoShift;

        that.events.onMessage.fire({ type: "noteOff", channel: 0, note: note, velocity: 0});
        that.events.onPadUp.fire({ row: that.options.row, col: that.options.col, velocity: 0});
    };

    fluid.defaults("lsu.pad.control", {
        gradeNames: ["lsu.pad"],
        markup: {
            container: "<button class='lsu-pad lsu-pad-control lsu-pad-control-%control'></button>"
        },
        clickValue: 100, // Roughly 80% of what's possible (127).
        control: 0,
        model: {
            control: "{that}.options.control"
        },
        invokers: {
            handleDown: {
                funcName: "lsu.pad.control.handleDown",
                args: ["{that}", "{arguments}.0"] // event
            },
            handleUp: {
                funcName: "lsu.pad.control.handleUp",
                args: ["{that}", "{arguments}.0"] // event
            }
        }
    });

    lsu.pad.control.handleDown = function (that, event) {
        that.focus();
        event.preventDefault();

        // Add support for the same kind of tuning that devices support.
        var tuningNote = fluid.get(that, ["options", "tuning", "control", that.options.control]);
        if (tuningNote !== undefined) {
            tuningNote += that.model.capoShift;
            that.events.onMessage.fire({ type: "noteOn", channel: 0, note: tuningNote, velocity: that.options.clickValue});
        }
        else {
            that.events.onMessage.fire({ type: "control", channel: 0, number: that.options.control, value: that.options.clickValue});
        }

        that.events.onPadDown.fire({ row: that.options.row, col: that.options.col, velocity: that.options.clickValue});
    };

    lsu.pad.control.handleUp = function (that, event) {
        event.preventDefault();

        // Add support for the same kind of tuning that devices support.
        var tuningNote = fluid.get(that, ["options", "tuning", "control", that.options.control]);
        if (tuningNote !== undefined) {
            tuningNote += that.model.capoShift;
            that.events.onMessage.fire({ type: "noteOff", channel: 0, note: tuningNote, velocity: 0});
        }
        else {
            that.events.onMessage.fire({ type: "control", channel: 0, number: that.options.control, value: 0});
        }

        that.events.onPadUp.fire({ row: that.options.row, col: that.options.col, velocity: 0});
    };
})(fluid);
