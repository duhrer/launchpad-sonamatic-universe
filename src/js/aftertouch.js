(function (fluid) {
    "use strict";
    var lsu = fluid.registerNamespace("lsu");
    fluid.defaults("lsu.aftertouch", {
        gradeNames: ["lsu.router.colour"],
        members: {
            shouldRedraw: true
        },
        model: {
            velocityGrid: "@expand:lsu.generateEmptyGrid(10, 10)",
            notes: {},
            channelPressure: 0
        },
        bleedPercentage: 0.25,
        modelListeners: {
            velocityGrid: {
                funcName: "fluid.set",
                args: ["{that}", "shouldRedraw", true]
            },
            channelPressure: {
                funcName: "fluid.set",
                args: ["{that}", "shouldRedraw", true]
            }
        },
        invokers: {
            "updateColourGrid": {
                funcName: "lsu.aftertouch.updateColourGrid",
                args: ["{that}"]
            }
        },
        listeners: {
            "onCreate.startPolling": {
                funcName: "lsu.aftertouch.startPolling",
                args: ["{berg.scheduler}", "{that}.updateColourGrid"] // scheduler, callback
            }
        },
        components: {
            // We use a bergson scheduler to poll for updates because aftertouch events are fired far too quickly for
            // even a Pro MK3 to keep up with.
            scheduler: {
                type: "berg.scheduler",
                options: {
                    components: {
                        clock: {
                            type: "berg.clock.raf",
                            options: {
                                freq: 60 // times per second
                            }
                        }
                    }
                }
            },
            noteInputs: {
                options: {
                    listeners: {
                        "onAftertouch.registerPressure": {
                            funcName: "lsu.aftertouch.registerPressure",
                            args: ["{lsu.aftertouch}", "{arguments}.0"] // midiMessage
                        },

                        // Relay to output(s).
                        "onAftertouch.sendToNoteOut": "{noteOutputs}.events.sendAftertouch.fire",
                        "onNoteOn.sendToNoteOut": "{noteOutputs}.events.sendNoteOn.fire",
                        "onNoteOff.sendToNoteOut": "{noteOutputs}.events.sendNoteOff.fire"
                    },
                    components: {
                        portConnector: {
                            options: {
                                dynamicComponents: {
                                    connection: {
                                        options: {
                                            listeners: {
                                                "onPadDown.updateVelocityGrid": {
                                                    funcName: "lsu.aftertouch.handlePadChange",
                                                    args: ["{lsu.aftertouch}", "{arguments}.0"] // padMessage
                                                },
                                                "onPadUp.updateVelocityGrid": {
                                                    funcName: "lsu.aftertouch.handlePadChange",
                                                    args: ["{lsu.aftertouch}", "{arguments}.0"] // padMessage
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    lsu.aftertouch.startPolling = function (scheduler, callback) {
        scheduler.schedule({
            type: "repeat",
            freq: 10, // times per second
            callback: callback
        });

        scheduler.start();
    };

    lsu.aftertouch.updateColourGrid = function (that) {
        if (that.shouldRedraw) {
            // Clear this first to avoid lapping ourselves.
            that.shouldRedraw = false;

            var blurredVelocityGrid = lsu.generateEmptyGrid(10, 10);
            for (var gridRow = 0; gridRow < 10; gridRow++) {
                for (var gridCol = 0; gridCol < 10; gridCol++) {
                    var velocity = fluid.get(that, ["model", "velocityGrid", gridRow, gridCol]) || 0;
                    if (velocity && that.model.channelPressure) {
                        var pressurePercentage = that.model.channelPressure / 127;
                        var adjacentCellVelocityBleed = velocity * pressurePercentage * that.options.bleedPercentage;

                        var rowBelow = gridRow - 1;
                        var rowAbove = gridRow + 1;
                        var colToLeft = gridCol - 1;
                        var colToRight = gridCol + 1;

                        // Centre
                        blurredVelocityGrid[gridRow][gridCol] = Math.min(127, blurredVelocityGrid[gridRow][gridCol] + velocity);

                        // South
                        if (rowBelow >= 0) {
                            blurredVelocityGrid[rowBelow][gridCol] = Math.min(127, blurredVelocityGrid[rowBelow][gridCol] + adjacentCellVelocityBleed);
                        }
                        // SouthWest
                        if (rowBelow >= 0 && colToLeft >= 0) {
                            blurredVelocityGrid[rowBelow][colToLeft] = Math.min(127, blurredVelocityGrid[rowBelow][colToLeft] + adjacentCellVelocityBleed);
                        }
                        // West
                        if (colToLeft >= 0) {
                            blurredVelocityGrid[gridRow][colToLeft] = Math.min(127, blurredVelocityGrid[gridRow][colToLeft] + adjacentCellVelocityBleed);
                        }
                        // NorthWest
                        if (rowAbove < 10 && colToLeft >= 0) {
                            blurredVelocityGrid[rowAbove][colToLeft] = Math.min(127, blurredVelocityGrid[rowAbove][colToLeft] + adjacentCellVelocityBleed);
                        }
                        // North
                        if (rowAbove < 10) {
                            blurredVelocityGrid[rowAbove][gridCol] = Math.min(127, blurredVelocityGrid[rowAbove][gridCol] + adjacentCellVelocityBleed);
                        }
                        // NorthEast
                        if (rowAbove < 10 && colToRight < 10) {
                            blurredVelocityGrid[rowAbove][colToRight] = Math.min(127, blurredVelocityGrid[rowAbove][colToRight] + adjacentCellVelocityBleed);
                        }
                        // East
                        if (colToRight < 10) {
                            blurredVelocityGrid[gridRow][colToRight] = Math.min(127, blurredVelocityGrid[gridRow][colToRight] + adjacentCellVelocityBleed);
                        }
                        // SouthEast
                        if (rowBelow >= 0 && colToRight < 10) {
                            blurredVelocityGrid[rowBelow][colToRight] = Math.min(127, blurredVelocityGrid[rowBelow][colToRight] + adjacentCellVelocityBleed);
                        }
                    }
                }
            }

            var newGridColours = lsu.generateDefaultColourMap();

            for (var row = 1; row < 10; row++) {
                for (var col = 0; col < 10; col++) {
                    var noteVelocity = fluid.get(blurredVelocityGrid, [row, col]) || 0;
                    if (noteVelocity) {
                        var rValue = lsu.router.colour.calculateSingleColor(that, "r", noteVelocity / 127);
                        var gValue = lsu.router.colour.calculateSingleColor(that, "g", noteVelocity / 127);
                        var bValue = lsu.router.colour.calculateSingleColor(that, "b", noteVelocity / 127);
                        newGridColours[row][col] = { r: rValue, g: gValue, b: bValue};
                    }
                }
            };

            // Preserve the colour controls.
            newGridColours[0] = fluid.copy(that.model.gridColours[0]);

            fluid.replaceModelValue(that.applier, "gridColours", newGridColours);
        }
    };

    lsu.aftertouch.handlePadChange = function (that, padMessage) {
        if (padMessage.row && padMessage.col) {
            var velocity = fluid.get(padMessage, "velocity") || 0;
            that.applier.change(["velocityGrid", padMessage.row, padMessage.col], velocity);
        }
    };

    lsu.aftertouch.registerPressure = function (that, midiMessage) {
        that.applier.change("channelPressure", fluid.get(midiMessage, "pressure") || 0);
    };
})(fluid);
