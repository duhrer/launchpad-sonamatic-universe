(function (fluid) {
    // The onscreen grid, which is only responsible for drawing itself and relaying back hit pads.
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
                        "onPadDown.relayToGrid": {
                            func: "{lsu.grid}.events.onPadDown.fire",
                            args: ["{arguments}.0"] // midiMessage
                        },
                        "onPadUp.relayToGrid": {
                            func: "{lsu.grid}.events.onPadUp.fire",
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
            onPadDown: null,
            onPadUp: null
        },
        defaultColour: { r: 0, g: 0, b: 0},
        rows: 0,
        model: {
            focus: { col: 0, row: 0 },

            gridColours: "@expand:lsu.generateDefaultColourMap()"
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

    /**
     * @typedef ColourDef
     * @type {Object}
     * @property {Number} r - The amount of red in the colour, from 0 to 1.
     * @property {Number} g - The amount of green in the colour, from 0 to 1.
     * @property {Number} b - The amount of blue in the colour, from 0 to 1.
     *
     */

    /**
     *
     * Generate a default colour map, with all cells except the colour controls black.
     *
     * @return {Array<Array<ColourDef>>} - An array of colour definitions.
     *
     */
    lsu.grid.generateDefaultColourGrid = function () {
        var singleRow = fluid.generate(10, function () {
            return { r: 0, g: 0, b: 0};
        }, true);
        var allRows = fluid.generate(9, function () {
            return fluid.copy(singleRow);
        }, true);

        allRows.unshift([
            { r: 0,   g: 0,   b: 0 },
            { r: 255, g: 255, b: 255 },
            { r: 255, g: 0,   b: 0 },
            { r: 255, g: 64,  b: 0 },
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
                    var nextRow = (that.model.focus.row + 1) % that.options.rows;
                    that.applier.change("focus.row", nextRow);
                    break;
                case "ArrowDown":
                    var previousRow = (that.options.rows + that.model.focus.row - 1) % that.options.rows;
                    that.applier.change("focus.row", previousRow);
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
        rowDefs: lsu.rowDefs.launchpadPro,

        events: {
            onPadDown: null,
            onPadUp: null
        }
    });
})(fluid);
