(function (fluid) {
    "use strict";
    var lsu = fluid.registerNamespace("lsu");

    fluid.defaults("lsu.row", {
        gradeNames: ["lsu.templateRenderer"],
        markup: {
            container: "<div class='lsu-row'></div>"
        },
        cols: "{that}.colDefs.length",
        rows: 10,
        colDefs: [],
        dynamicComponents: {
            pad: {
                type: "{source}.type",
                container: "{that}.container",
                sources: "{that}.options.colDefs",
                options: {
                    col: "{sourcePath}",
                    row: "{lsu.row}.options.row",
                    note: "{source}.note",
                    control: "{source}.control",
                    cols: "{lsu.row}.options.cols",
                    rows: "{lsu.row}.options.rows",
                    listeners: {
                        "onMessage.relayToGrid": {
                            func: "{lsu.grid}.events.onPadMessage.fire",
                            args: ["{arguments}.0"] // midiMessage
                        }
                    },
                    model: {
                        focus: "{lsu.grid}.model.focus"
                    },
                    modelRelay: {
                        source: {
                            context: "row",
                            segs: ["gridColours", "{sourcePath}"]
                        },
                        target: "padColour"
                    }
                }
            }
        }
    });

    fluid.defaults("lsu.grid", {
        gradeNames: ["lsu.templateRenderer"],
        markup: {
            container: "<div class='lsu-grid'></div>"
        },
        events: {
            onPadMessage: null
        },
        defaultColour: { r: 0, g: 0, b: 0},
        rows: 0,
        model: {
            focus: { col: 0, row: 0 },
            notes: "@expand:fluid.generate(128, 0)",
            gridColours: "@expand:lsu.grid.generateDefaultColourMap()",
            controls: "@expand:fluid.generate(128, 0)"
        },
        rowDefs: [],
        dynamicComponents: {
            row: {
                sources: "{that}.options.rowDefs",
                type: "lsu.row",
                container: "{that}.container",
                options: {
                    row: "{sourcePath}",
                    rows: "{lsu.grid}.options.rows",
                    colDefs: "{source}",
                    modelRelay: {
                        source: {
                            context: "grid",
                            segs: ["gridColours", "{sourcePath}"]
                        },
                        target: "gridColours"
                    }
                }
            }
        },
        invokers: {
            handleKeydown: {
                funcName: "lsu.grid.handleKeydown",
                args: ["{that}", "{arguments}.0"] // event
            },
            handlePadMessage: {
                funcName: "lsu.grid.handlePadMessage",
                args: ["{that}", "{arguments}.0"] // midiMessage
            }
        },
        listeners: {
            "onCreate.bindKeydown": {
                this: "{that}.container",
                method: "keydown",
                args: ["{that}.handleKeydown"]
            },
            "onPadMessage.handlePadMessage": {
                funcName: "lsu.grid.handlePadMessage",
                args: ["{that}", "{arguments}.0"] // midiMessage
            }
        }
    });

    lsu.grid.handlePadMessage = function (that, midiMessage) {
        var toUpdate = midiMessage.type === "control" ? "controls" : "notes";
        var arrayIndex = midiMessage.type ===  "control" ? midiMessage.number : midiMessage.note;
        var messageValue = midiMessage.type === "control" ? midiMessage.value : midiMessage.velocity;
        that.applier.change([toUpdate, arrayIndex], messageValue);
    };

    lsu.grid.generateDefaultColourMap = function () {
        var singleRow = fluid.generate(10, function () {
            return { r: 0, g: 0, b: 0};
        }, true);
        var allRows = fluid.generate(9, function () {
            return fluid.copy(singleRow);
        }, true);

        allRows.push([
            { r: 0,   g: 0,   b: 0 },
            { r: 255, g: 255, b: 255 },
            { r: 255, g: 0,   b: 0 },
            { r: 255, g: 64,  b: 0 }, // In HTML the RGB values for orange would be way off, but for the Launchpad Pro it works.
            { r: 255, g: 255, b: 0 },
            { r: 0,   g: 255, b: 0 },
            { r: 0,   g: 255, b: 255 },
            { r: 0,   g: 0,   b: 255 },
            { r: 255, g: 0,   b: 255 },
            {r: 0,    g: 0,   b: 0}
        ]);
        return allRows;
    };

    lsu.grid.handleKeydown = function (that, event) {
        var isArrow = ["ArrowLeft", "ArrowDown", "ArrowUp", "ArrowRight"].indexOf(event.key) !== -1;
        if (isArrow) {
            event.preventDefault();

            switch (event.key) {
                case "ArrowLeft":
                    var previousCol = (that.options.cols + that.model.focus.col - 1) % that.options.cols;
                    that.applier.change("focus.col", previousCol);
                    break;
                case "ArrowRight":
                    var nextCol = (that.model.focus.col + 1) % that.options.cols;
                    that.applier.change("focus.col", nextCol);
                    break;
                case "ArrowUp":
                    var previousRow = (that.options.rows + that.model.focus.row - 1) % that.options.rows;
                    that.applier.change("focus.row", previousRow);
                    break;
                case "ArrowDown":
                    var nextRow = (that.model.focus.row + 1) % that.options.rows;
                    that.applier.change("focus.row", nextRow);
                    break;
                default:
                    break;
            }
        }
    };

    fluid.defaults("lsu.grid.launchpadPro", {
        gradeNames: ["lsu.grid"],
        cols: 10,
        rows: 10,
        rowDefs: lsu.rowDefs.launchpadPro
    });
})(fluid);
