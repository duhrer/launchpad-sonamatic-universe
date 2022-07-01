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
            grid: {
                options: {
                    listeners: {
                        "onPadMessage.handlePadMessage": {
                            funcName: "lsu.aftertouch.handlePadMessage",
                            args: ["{that}", "{arguments}.0"] // midiMessage
                        }
                    }
                }
            },
            noteInput: {
                options: {
                    listeners: {
                        "onAftertouch.registerPressure": {
                            funcName: "lsu.aftertouch.registerPressure",
                            args: ["{lsu.aftertouch}", "{arguments}.0"] // midiMessage
                        },
                        "onAftertouch.sendToNoteOut": "{noteOutput}.events.sendAftertouch.fire",
                        "onNoteOn.sendToNoteOut": "{noteOutput}.events.sendNoteOn.fire",
                        "onNoteOff.sendToNoteOut": "{noteOutput}.events.sendNoteOff.fire"
                    }
                }
            }
        }
    });

    lsu.aftertouch.generateVelocityGrid = function () {
        var singleRow = fluid.generate(8, 0);
        var allRows = fluid.generate(8, function () {
            return fluid.copy(singleRow);
        }, true);
        return allRows;
    };

    lsu.aftertouch.updateDeviceColourMap = function (that) {
        var velocityGrid = lsu.aftertouch.generateVelocityGrid();
        for (var gridRow = 0; gridRow < 8; gridRow++) {
            for (var gridCol = 0; gridCol < 8; gridCol++) {
                var velocityNoteNumber = (10 * (gridRow + 1)) + (gridCol + 1);
                var velocity = fluid.get(that, ["model", "notes", velocityNoteNumber]);
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
                    // TODO: Doesn't do anything at the moment.
                    // NorthWest
                    if (rowAbove < 8 && colToLeft >= 0) {
                        velocityGrid[rowAbove][colToLeft] = Math.min(127, velocityGrid[rowAbove][colToLeft] + adjacentCellVelocityBleed);
                    }
                    // TODO: Doesn't do anything at the moment.
                    // North
                    if (rowAbove < 8) {
                        velocityGrid[rowAbove][gridCol] = Math.min(127, velocityGrid[rowAbove][gridCol] + adjacentCellVelocityBleed);
                    }
                    // TODO: Doesn't do anything at the moment.
                    // NorthEast
                    if (rowAbove < 8 && colToRight < 8) {
                        velocityGrid[rowAbove][colToRight] = Math.min(127, velocityGrid[rowAbove][colToRight] + adjacentCellVelocityBleed);
                    }
                    // TODO: Doesn't do anything at the moment.
                    // East
                    if (colToRight < 8) {
                        velocityGrid[gridRow][colToRight] = Math.min(127, velocityGrid[gridRow][colToRight] + adjacentCellVelocityBleed);
                    }
                    // SouthEast
                    if (rowBelow >= 0 && colToRight < 8) {
                        velocityGrid[rowBelow][colToRight] = Math.min(127, velocityGrid[rowBelow][colToRight] + adjacentCellVelocityBleed);
                    }
                }
            }
        }

        var newDeviceColours = fluid.generate(128, 0);

        for (var row = 0; row < 8; row++) {
            for (var col = 0; col < 8; col++) {
                var noteNumber = (10 * (row + 1)) + (col + 1);
                var noteVelocity = velocityGrid[row][col];
                if (noteVelocity) {
                    var rValue = lsu.router.colour.calculateSingleColor(that, "r", noteVelocity / 127);
                    var gValue = lsu.router.colour.calculateSingleColor(that, "g", noteVelocity / 127);
                    var bValue = lsu.router.colour.calculateSingleColor(that, "b", noteVelocity / 127);
                    newDeviceColours[noteNumber] = { r: rValue, g: gValue, b: bValue};
                }
            }
        };

        that.applier.change("deviceColours", newDeviceColours);
    };

    lsu.aftertouch.handlePadMessage = function (that, midiMessage) {
        if (midiMessage.type === "control") {
            that.applier.change(["controls", midiMessage.number], midiMessage.value);
        }
        else if (midiMessage.type === "note") {
            that.applier.change(["notes", midiMessage.note], midiMessage.velocity);
        }
    };


    lsu.aftertouch.registerPressure = function (that, midiMessage) {
        that.applier.change("channelPressure", fluid.get(midiMessage, "pressure") || 0);
    };
})(fluid);
