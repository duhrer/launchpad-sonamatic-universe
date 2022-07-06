(function (fluid) {
    "use strict";
    var lsu = fluid.registerNamespace("lsu");
    fluid.defaults("lsu.aftertouch", {
        gradeNames: ["lsu.router.colour"],
        model: {
            channelPressure: 0
        },
        bleedPercentage: 0.25,
        modelListeners: {
            "notes": {
                excludeSource: "init",
                funcName: "lsu.aftertouch.updateDeviceColourMap",
                args: ["{that}"]
            },
            "channelPressure": {
                excludeSource: "init",
                funcName: "lsu.aftertouch.updateDeviceColourMap",
                args: ["{that}"]
            }
        },
        components: {
            noteInputs: {
                options: {
                    listeners: {
                        "onNoteOn.registerNote": {
                            funcName: "lsu.aftertouch.registerNoteOrControl",
                            args: ["{lsu.aftertouch}", "{arguments}.0"] // midiMessage
                        },
                        "onNoteOff.registerNote": {
                            funcName: "lsu.aftertouch.registerNoteOrControl",
                            args: ["{lsu.aftertouch}", "{arguments}.0"] // midiMessage
                        },
                        "onAftertouch.registerPressure": {
                            funcName: "lsu.aftertouch.registerPressure",
                            args: ["{lsu.aftertouch}", "{arguments}.0"] // midiMessage
                        },
                        "onAftertouch.sendToNoteOut": "{noteOutputs}.events.sendAftertouch.fire",
                        "onNoteOn.sendToNoteOut": "{noteOutputs}.events.sendNoteOn.fire",
                        "onNoteOff.sendToNoteOut": "{noteOutputs}.events.sendNoteOff.fire"
                    }
                }
            }
        }
    });

    lsu.aftertouch.generateVelocityGrid = function () {
        var singleRow = fluid.generate(10, 0);
        var allRows = fluid.generate(10, function () {
            return fluid.copy(singleRow);
        }, true);
        return allRows;
    };

    lsu.aftertouch.updateDeviceColourMap = function (that) {
        // TODO: Make velocity grid a new model variable and use that for calculations.
        var velocityGrid = lsu.aftertouch.generateVelocityGrid();
        for (var gridRow = 0; gridRow < 10; gridRow++) {
            for (var gridCol = 0; gridCol < 10; gridCol++) {
                // TODO: Move away from note tracking to collect velocity by row and column using pad messages.
                var velocityNoteNumber = (10 * (gridRow + 1)) + (gridCol + 1);
                var velocity = fluid.get(that, ["model", "notes", velocityNoteNumber]) || 0;
                velocityGrid[gridRow][gridCol] += velocity;
                if (velocity && that.model.channelPressure) {
                    var pressurePercentage = that.model.channelPressure / 127;
                    var adjacentCellVelocityBleed = velocity * pressurePercentage * that.options.bleedPercentage;

                    var rowBelow = gridRow - 1;
                    var rowAbove = gridRow + 1;
                    var colToLeft = gridCol - 1;
                    var colToRight = gridCol + 1;

                    // South
                    if (rowBelow >= 0) {
                        velocityGrid[rowBelow][gridCol] = Math.min(127, velocityGrid[rowBelow][gridCol] + adjacentCellVelocityBleed);
                    }
                    // SouthWest
                    if (rowBelow >= 0 && colToLeft >= 0) {
                        velocityGrid[rowBelow][colToLeft] = Math.min(127, velocityGrid[rowBelow][colToLeft] + adjacentCellVelocityBleed);
                    }
                    // West
                    if (colToLeft >= 0) {
                        velocityGrid[gridRow][colToLeft] = Math.min(127, velocityGrid[gridRow][colToLeft] + adjacentCellVelocityBleed);
                    }
                    // NorthWest
                    if (rowAbove < 10 && colToLeft >= 0) {
                        velocityGrid[rowAbove][colToLeft] = Math.min(127, velocityGrid[rowAbove][colToLeft] + adjacentCellVelocityBleed);
                    }
                    // North
                    if (rowAbove < 10) {
                        velocityGrid[rowAbove][gridCol] = Math.min(127, velocityGrid[rowAbove][gridCol] + adjacentCellVelocityBleed);
                    }
                    // NorthEast
                    if (rowAbove < 10 && colToRight < 10) {
                        velocityGrid[rowAbove][colToRight] = Math.min(127, velocityGrid[rowAbove][colToRight] + adjacentCellVelocityBleed);
                    }
                    // East
                    if (colToRight < 10) {
                        velocityGrid[gridRow][colToRight] = Math.min(127, velocityGrid[gridRow][colToRight] + adjacentCellVelocityBleed);
                    }
                    // SouthEast
                    if (rowBelow >= 0 && colToRight < 10) {
                        velocityGrid[rowBelow][colToRight] = Math.min(127, velocityGrid[rowBelow][colToRight] + adjacentCellVelocityBleed);
                    }
                }
            }
        }

        var newGridColours = lsu.generateDefaultColourMap();

        for (var row = 0; row < 10; row++) {
            for (var col = 0; col < 10; col++) {
                var noteVelocity = fluid.get(velocityGrid, [row, col]) || 0;
                if (noteVelocity) {
                    var rValue = lsu.router.colour.calculateSingleColor(that, "r", noteVelocity / 127);
                    var gValue = lsu.router.colour.calculateSingleColor(that, "g", noteVelocity / 127);
                    var bValue = lsu.router.colour.calculateSingleColor(that, "b", noteVelocity / 127);
                    newGridColours[row][col] = { r: rValue, g: gValue, b: bValue};
                }
            }
        };

        fluid.replaceModelValue(that.applier, "gridColours", newGridColours);
    };

    // TODO: Move away from note tracking to collect velocity by row and column using pad messages.
    lsu.aftertouch.registerNoteOrControl = function (that, midiMessage) {
        if (midiMessage.type === "control") {
            that.applier.change(["notes", midiMessage.number], midiMessage.value);
        }
        else if (midiMessage.note) {
            that.applier.change(["notes", midiMessage.note], midiMessage.velocity);
        }
    };


    lsu.aftertouch.registerPressure = function (that, midiMessage) {
        that.applier.change("channelPressure", fluid.get(midiMessage, "pressure") || 0);
    };
})(fluid);
