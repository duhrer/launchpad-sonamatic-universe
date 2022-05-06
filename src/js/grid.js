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
        // We don't need to use {sourcePath}, so we can safely use an array
        colDefs: [],
        dynamicComponents: {
            pad: {
                type: "{source}.type",
                container: "{that}.container",
                sources: "{that}.options.colDefs",
                options: {
                    col: "{source}.col",
                    row: "{source}.row",
                    note: "{source}.note",
                    control: "{source}.control",
                    cols: "{lsu.row}.options.cols",
                    rows: "{lsu.row}.options.row",
                    model: {
                        // focus: "{lsu.row}.model.focus",
                        // notes: "{lsu.row}.model.notes",
                        // noteColours: "{lsu.row}.model.noteColours",
                        // controls: "{lsu.row}.model.controls",
                        // controlColours: "{lsu.row}.model.controlColours"
                        focus: "{lsu.grid}.model.focus",
                        notes: "{lsu.grid}.model.notes",
                        noteColours: "{lsu.grid}.model.noteColours",
                        controls: "{lsu.grid}.model.controls",
                        controlColours: "{lsu.grid}.model.controlColours"
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
        rows: 0,
        model: {
            focus: { col: 0, row: 0 },
            notes: "@expand:lsu.generateNumberKeyedMap(128)",
            noteColours: "@expand:lsu.generateNumberKeyedMap(128)",
            controls: "@expand:lsu.generateNumberKeyedMap(128)",
            controlColours: "@expand:lsu.generateNumberKeyedMap(128)"
        },
        // We don't need to use {sourcePath}, so we can safely use an array for now.
        rowDefs: [],
        dynamicComponents: {
            row: {
                sources: "{that}.options.rowDefs",
                type: "lsu.row",
                container: "{that}.container",
                options: {
                    rows: "{lsu.grid}.options.rows",

                    colDefs: "{source}"
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
