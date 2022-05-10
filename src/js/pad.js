(function (fluid) {
    "use strict";
    var lsu = fluid.registerNamespace("lsu");

    fluid.defaults("lsu.pad.base", {
        gradeNames: ["lsu.templateRenderer"],
        events: {
            onMessage: null
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
        clickKeys: ["Enter", " "],
        col: -1,
        row: -1,
        model: {
            velocity: 0,
            padColour: {
                r: 0,
                g: 0,
                b: 0
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
        var backgroundColourCss = fluid.stringTemplate(template, { r: r, g: g, b: b });
        that.container.attr("style", backgroundColourCss );
    };

    fluid.defaults("lsu.pad.note", {
        gradeNames: ["lsu.pad"],
        markup: {
            container: "<button class='lsu-pad lsu-pad-note'></button>"
        },
        clickVelocity: 100, // Roughly 80% of what's possible (127).
        note: 0,
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
            }
        }
    });

    lsu.pad.note.handleDown = function (that, event) {
        that.focus();
        event.preventDefault();
        that.events.onMessage.fire({ type: "note", channel: 0, note: that.options.note, velocity: that.options.clickVelocity});
    };

    lsu.pad.note.handleUp = function (that, event) {
        event.preventDefault();
        that.events.onMessage.fire({ type: "note", channel: 0, note: that.options.note, velocity: 0});
    };

    fluid.defaults("lsu.pad.control", {
        gradeNames: ["lsu.pad"],
        markup: {
            container: "<button class='lsu-pad lsu-pad-control'></button>"
        },
        clickValue: 100, // Roughly 80% of what's possible (127).
        control: 0,
        model: {
            controls: {}
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
        that.events.onMessage.fire({ type: "control", channel: 0, number: that.options.control, value: that.options.clickValue});
    };

    lsu.pad.control.handleUp = function (that, event) {
        event.preventDefault();
        that.events.onMessage.fire({ type: "control", channel: 0, number: that.options.control, value: 0});
    };
})(fluid);
