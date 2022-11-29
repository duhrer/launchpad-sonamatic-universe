/* globals Tone */
(function (fluid, Tone) {
    "use strict";
    var lsu = fluid.registerNamespace("lsu");

    fluid.defaults("lsu.polarVortex.uiOutputConnection", {
        gradeNames: ["lsu.uiOutputConnection"],

        model: {
            colOffset: 10,
            rowOffset: 10,
            gridColours: "@expand:lsu.generateDefaultColourMap()"
        },
        modelListeners: {
            regenerateGridColours: {
                path: ["energyGrid", "colourSchemeName"],
                funcName: "lsu.polarVortex.uiOutputConnection.regenerateGridColours",
                args: ["{that}"]
            },
            colourSchemeName: {
                funcName: "lsu.router.colour.paintColourControls",
                args: ["{that}"]
            }
        }
    });

    lsu.polarVortex.uiOutputConnection.regenerateGridColours = function (that) {
        var updatedGridColours = lsu.generateEmptyGrid(10, 10);
        updatedGridColours[0] = that.model.gridColours[0];
        updatedGridColours[9] = that.model.gridColours[9];
        for (var row = 1; row < 9; row++) {
            var energyGridRow = row + that.model.rowOffset;
            for (var col = 0; col < 10; col++) {
                var energyGridCol = col + that.model.colOffset;
                var energy = Math.min(1, fluid.get(that.model.energyGrid, [energyGridRow, energyGridCol]) || 0);
                var rValue = lsu.router.colour.calculateSingleColour(that, "r", energy);
                var gValue = lsu.router.colour.calculateSingleColour(that, "g", energy);
                var bValue = lsu.router.colour.calculateSingleColour(that, "b", energy);
                updatedGridColours[row][col] = { r: rValue, g: gValue, b: bValue };
            }
        }
        // that.applier.change("gridColours", updatedGridColours);
        fluid.replaceModelValue(that.applier, "gridColours", updatedGridColours);
    };

    // Replacement input grade that has offset controls, and which sends a shifted col and row in its pad message.
    fluid.defaults("lsu.polarVortex.noteInputConnection", {
        gradeNames: ["youme.connection.input", "lsu.launchpadConnection", "fluid.modelComponent"],

        events: {
            onPadDown: null,
            onPadUp: null
        },

        maxOffset: 30,

        maxAttraction: 5,
        attractionIncrement: 0.1,

        maxRotation: 45,
        rotationIncrement: 1,

        listeners: {
            "onControl.handleControls": {
                funcName: "lsu.polarVortex.noteInputConnection.handleControls",
                args: ["{that}", "{arguments}.0"]
            },

            "onNoteOn": {
                funcName: "lsu.polarVortex.noteInputConnection.relayPadMessage",
                args: ["{that}", "{arguments}.0"] // midiMessage
            },
            "onNoteOff": {
                funcName: "lsu.polarVortex.noteInputConnection.relayPadMessage",
                args: ["{that}", "{arguments}.0"] // midiMessage
            },
            "onControl": {
                funcName: "lsu.polarVortex.noteInputConnection.relayPadMessage",
                args: ["{that}", "{arguments}.0"] // midiMessage
            },
            // Disable aftertouch.
            "onAftertouch": {
                funcName: "fluid.identity"
            }
        }
    });

    lsu.polarVortex.noteInputConnection.relayPadMessage = function (that, midiMessage) {
        if (["launchpad", "launchpadPro", "launchpadPro3"].includes(that.model.deviceType) && (midiMessage.note !== undefined || midiMessage.number !== undefined) ) {
            var note = lsu.launchpadConnection.firstDefined([midiMessage.note, midiMessage.number]);
            var velocity = lsu.launchpadConnection.firstDefined([midiMessage.velocity, midiMessage.value, midiMessage.pressure]);
            var padMessage = { velocity: velocity };
            if (that.model.deviceType === "launchpad") {
                if (midiMessage.type === "control") {
                    padMessage.row = 9;
                    // Top row of Launchpad controls are numbered 104 105 106 107 108 109 110 111.
                    padMessage.col = note % 103;
                }
                else {
                    padMessage.row = (8 - Math.floor(note / 16));
                    padMessage.col = (note % 16) + 1;
                }
            }
            // Assume it's a pro-like thing.
            else {
                padMessage.row = Math.floor(note / 10);
                padMessage.col = note % 10;
            }

            var eventName = velocity ? "onPadDown" : "onPadUp";

            if (padMessage.row !== 0 && padMessage.row !== 9) {
                padMessage.row += that.model.rowOffset;
                padMessage.col += that.model.colOffset;

                that.events[eventName].fire(padMessage);
            }
        }
    };

    // TODO: Add controls for BPM, et cetera.
    //         The left column is 80, 70, etc., we use that for bpm
    //         else if (midiMessage.number % 10 === 0) {
    //             var row = Math.floor(midiMessage.number / 10) - 1;
    //             that.bpm.setPower(row);
    //         }
    //         // The right column is 89, 79, etc, we use that to control the "base" pitch.
    //         else if (midiMessage.number % 10 === 9) {
    //             var row = Math.floor(midiMessage.number / 10) - 1;
    //             that.pitch.setPower(row);
    //         }
    //     }
    // };

    lsu.polarVortex.noteInputConnection.handleControls = function (that, midiMessage) {
        if (midiMessage.value) {
            if (midiMessage.number >= 1 && midiMessage.number <= 8) {
                var colourSchemeKey = false;
                switch (midiMessage.number) {
                    case 1:
                        colourSchemeKey = "white";
                        break;
                    case 2:
                        colourSchemeKey = "red";
                        break;
                    case 3:
                        colourSchemeKey = "orange";
                        break;
                    case 4:
                        colourSchemeKey = "yellow";
                        break;
                    case 5:
                        colourSchemeKey = "green";
                        break;
                    case 6:
                        colourSchemeKey = "blue";
                        break;
                    case 7:
                        colourSchemeKey = "indigo";
                        break;
                    case 8:
                        colourSchemeKey = "violet";
                        break;
                    default:
                        break;
                }

                if (colourSchemeKey) {
                    lsu.router.colour.handleColourSchemeControl(that, midiMessage.value, colourSchemeKey);
                }
            }
            else if (midiMessage.number >= 91 && midiMessage.number <= 98) {
                var updatedColOffset = that.model.colOffset;
                var updatedRowOffset = that.model.rowOffset;

                switch (midiMessage.number) {
                    // Up Arrow on the Launchpad and Pro, left on the Pro MK3
                    case 91:
                        if (that.model.rowOffset + 1 <= that.options.maxOffset) {
                            updatedRowOffset++;
                        }
                        break;
                    // Down Arrow on the Launchpad and Pro, right on the Pro MK3
                    case 92:
                        if (that.model.rowOffset - 1 >= 0) {
                            updatedRowOffset--;
                        }
                        break;
                    // Left Arrow on the Launchpad and Pro, "Session" on the Pro MK3
                    case 93:
                        if (that.model.colOffset - 1 >= 0) {
                            updatedColOffset--;
                        }
                        break;
                    // Right Arrow on the Launchpad and Pro, "Note" on the Pro MK3
                    case 94:
                        if (that.model.colOffset + 1 <= that.options.maxOffset) {
                            updatedColOffset++;
                        }
                        break;
                    // decrease rotation
                    case 95:
                        // TODO: Make a precision add that includes rounding before dividing.
                        var decreasedRotation = ((100 * that.model.rotation) - (100 * that.options.rotationIncrement)) / 100;
                        if (Math.abs(decreasedRotation) <= that.options.maxRotation) {
                            that.applier.change("rotation", decreasedRotation);
                        }
                        break;
                    // increase rotation
                    case 96:
                        var increasedRotation = ((100 * that.model.rotation) + (100 * that.options.rotationIncrement)) / 100;
                        if (Math.abs(increasedRotation) <= that.options.maxRotation) {
                            that.applier.change("rotation", increasedRotation);
                        }
                        break;
                    // decrease attraction
                    case 97:
                        var decreasedAttraction = ((100 * that.model.attraction) - (100 * that.options.attractionIncrement)) / 100;
                        if (Math.abs(decreasedAttraction) <= that.options.maxAttraction) {
                            that.applier.change("attraction", decreasedAttraction);
                        }
                        break;
                    // increase attraction
                    case 98:
                        var increasedAttraction = ((100 * that.model.attraction) + (100 * that.options.attractionIncrement)) / 100;
                        if (Math.abs(increasedAttraction) <= that.options.maxAttraction) {
                            that.applier.change("attraction", increasedAttraction);
                        }
                        break;
                    default:
                        break;
                }
                that.applier.change("colOffset", updatedColOffset);
                that.applier.change("rowOffset", updatedRowOffset);
            }
        }
    };

    fluid.defaults("lsu.polarVortex.grid", {
        gradeNames: ["lsu.grid.launchpadPro"],
        colourSchemes: "{lsu.polarVortex}.options.colourSchemes",
        model: {
            brightness: "{lsu.polarVortex}.model.brightness",
            colourScheme: "{lsu.polarVortex}.model.colourScheme",
            colourSchemeName: "{lsu.polarVortex}.model.colourSchemeName",
            energyGrid: "{lsu.polarVortex}.model.energyGrid",
            gridColours: "@expand:lsu.generateDefaultColourMap()",

            colOffset: 10,
            rowOffset: 10
        },
        modelListeners: {
            regenerateGridColours: {
                path: ["energyGrid", "colourSchemeName"],
                funcName: "lsu.polarVortex.uiOutputConnection.regenerateGridColours",
                args: ["{that}"]
            },
            colourSchemeName: {
                funcName: "lsu.router.colour.paintColourControls",
                args: ["{that}"]
            }
        }
    });

    fluid.defaults("lsu.polarVortex", {
        // Although we want the colour, we have to use the base grade to avoid entangling all units' colour grids.
        gradeNames: ["lsu.router"],

        selectors: {
            attraction: ".attraction",
            startButton: ".start-button",
            rotation: ".rotation",
            router: ".lsu-router"
        },

        markup: {
            container: "<div class='polar-vortex-outer-container'><button class='start-button'>Start</button><div class='lsu-router' style='display: none;'><div class='lsu-grid'></div><div class='lsu-note-inputs'></div><div class='lsu-ui-outputs'></div><ul><li>Rotation:<span class='rotation'>%rotation</span></li><li>Attraction:<span class='attraction'>%attraction</span></li></ul></div></div>"
        },

        // TODO: Make this a namespaced constant somewhere.
        colourSchemes: {
            white:  { r: 1, g: 1,    b: 1, velocity: 1 },
            red:    { r: 1, g: 0,    b: 0, velocity: 5 },
            orange: { r: 1, g: 0.65, b: 0, velocity: 9 },
            yellow: { r: 1, g: 1,    b: 0, velocity: 13 },
            green:  { r: 0, g: 1,    b: 0, velocity: 17 },
            blue:   { r: 0, g: 1,    b: 1, velocity: 90 },
            indigo: { r: 0, g: 0,    b: 1, velocity: 79 },
            violet: { r: 1, g: 0,    b: 1, velocity: 53 }
        },

        energyFloor: 0.0075, // A little below 1/127, i.e. when the MIDI velocity is already zero.
        decayRate: 0.8, // TODO: Controls for this?

        members: {
            currentBpm: 512,
            tetheredChains: {},
            untetheredChains: []
        },

        model: {
            attraction: -0.2,
            bpm: 512,
            rotation: 30,
            centrePitch: 55,

            // Viewport settings for all pads, used to coordinate between input and associated UI output.
            colOffsets: {},
            rowOffsets: {},

            // Colour settings.

            // TODO: Figure out how we want to control brightness.
            brightness: 1,
            colourScheme: "{that}.options.colourSchemes.white",
            colourSchemeName: "white"
        },

        components: {
            grid: {
                type: "lsu.polarVortex.grid",
                options: {
                    colourSchemes: "{lsu.polarVortex}.options.colourSchemes",
                    model: {
                        brightness: "{lsu.polarVortex}.model.brightness",
                        colourScheme: "{lsu.polarVortex}.model.colourScheme",
                        colourSchemeName: "{lsu.polarVortex}.model.colourSchemeName",
                        energyGrid: "{lsu.polarVortex}.model.energyGrid",
                        gridColours: "@expand:lsu.generateDefaultColourMap()",
                        // TODO: Pass along rotation and attraction and add controls.

                        colOffset: 10,
                        rowOffset: 10
                    },
                    modelListeners: {
                        regenerateGridColours: {
                            path: ["energyGrid", "colourSchemeName"],
                            funcName: "lsu.polarVortex.uiOutputConnection.regenerateGridColours",
                            args: ["{that}"]
                        },
                        colourSchemeName: {
                            funcName: "lsu.router.colour.paintColourControls",
                            args: ["{that}"]
                        }
                    },
                    listeners: {
                        "onPadDown.handlePadMessage": {
                            funcName: "lsu.polarVortex.handlePadMessage",
                            args: ["{lsu.polarVortex}", "{arguments}.0"] // midiMessage
                        },
                        "onPadUp.handlePadMessage": {
                            funcName: "lsu.polarVortex.handlePadMessage",
                            args: ["{lsu.polarVortex}", "{arguments}.0"] // midiMessage
                        }
                    }
                }
            },
            noteInputs: {
                options: {
                    components: {
                        portConnector: {
                            options: {
                                dynamicComponents: {
                                    connection: {
                                        type: "lsu.polarVortex.noteInputConnection",
                                        options: {
                                            colourSchemes: "{lsu.polarVortex}.options.colourSchemes",
                                            model: {
                                                brightness: "{lsu.polarVortex}.model.brightness",
                                                colourScheme: "{lsu.polarVortex}.model.colourScheme",
                                                colourSchemeName: "{lsu.polarVortex}.model.colourSchemeName",
                                                attraction: "{lsu.polarVortex}.model.attraction",
                                                rotation: "{lsu.polarVortex}.model.rotation"
                                            },
                                            modelRelay: [
                                                {
                                                    source: "colOffset",
                                                    target: {
                                                        context: "polarVortex",
                                                        segs: ["colOffsets", "{source}.name"]
                                                    }
                                                },
                                                {
                                                    source: "rowOffset",
                                                    target: {
                                                        context: "polarVortex",
                                                        segs: ["rowOffsets", "{source}.name"]
                                                    }
                                                }
                                            ],
                                            listeners: {
                                                "onPadDown.handlePadMessage": {
                                                    funcName: "lsu.polarVortex.handlePadMessage",
                                                    args: ["{lsu.polarVortex}", "{arguments}.0"] // padMessage
                                                },
                                                "onPadUp.handlePadMessage": {
                                                    funcName: "lsu.polarVortex.handlePadMessage",
                                                    args: ["{lsu.polarVortex}", "{arguments}.0"] // padMessage
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },

            // We need the colour handling and everything else from the (colour) router, but not the note outputs.
            noteOutputs: {
                type: "fluid.component"
            },

            uiOutputs: {
                options: {
                    components: {
                        portConnector: {
                            options: {
                                dynamicComponents: {
                                    connection: {
                                        type: "lsu.polarVortex.uiOutputConnection",
                                        options: {
                                            colourSchemes: "{lsu.polarVortex}.options.colourSchemes",

                                            model: {
                                                brightness: "{lsu.polarVortex}.model.brightness",
                                                colourScheme: "{lsu.polarVortex}.model.colourScheme",
                                                colourSchemeName: "{lsu.polarVortex}.model.colourSchemeName",
                                                energyGrid: "{lsu.polarVortex}.model.energyGrid"
                                            },

                                            // Model relay from router map to row/column offsets.
                                            modelRelay: [
                                                {
                                                    source: {
                                                        context: "polarVortex",
                                                        segs: ["colOffsets", "{source}.name"]
                                                    },
                                                    target: "colOffset"
                                                },
                                                {
                                                    source: {
                                                        context: "polarVortex",
                                                        segs: ["rowOffsets", "{source}.name"]
                                                    },
                                                    target: "rowOffset"
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },

            scheduler: {
                type: "berg.scheduler",
                options: {
                    components: {
                        clock: {
                            type: "berg.clock.raf",
                            options: {
                                freq: 50 // times per second
                            }
                        }
                    }
                }
            }
        },

        invokers: {
            updateChains: {
                funcName: "lsu.polarVortex.updateChains",
                args: ["{that}"]
            },
            handleStartButtonClick: {
                funcName: "lsu.polarVortex.handleStartButtonClick",
                args: ["{that}"]
            }
        },

        listeners: {
            "onCreate.startPolling": {
                funcName: "lsu.polarVortex.startPolling",
                args: ["{that}"]
            },
            "onCreate.bindStartButton": {
                this: "{that}.dom.startButton",
                method: "click",
                args: ["{that}.handleStartButtonClick"]
            }
        },

        modelListeners: {
            attraction: {
                this: "{that}.dom.attraction",
                method: "text",
                args: ["{that}.model.attraction"]
            },
            rotation: {
                this: "{that}.dom.rotation",
                method: "text",
                args: ["{that}.model.rotation"]
            }
        }
    });

    lsu.polarVortex.handleStartButtonClick = function (that) {
        var startButtonElement = that.locate("startButton");
        startButtonElement.hide();

        var routerElement = that.locate("router");
        routerElement.show();
    };

    lsu.polarVortex.handlePadMessage = function (that, padMessage) {
        if (padMessage.row !== 0 && padMessage.row !== 9) {
            // Add a new chain.
            if (padMessage.velocity) {
                var cellDef = lsu.polarVortex.getPolarFromXY(padMessage.col - 1, padMessage.row - 1);
                cellDef.energy = padMessage.velocity;

                var newChain = lsu.polarVortex.createChain(that, cellDef);

                fluid.set(that.tetheredChains, [padMessage.row, padMessage.col], newChain);
            }
            // "Untether" the chain associate with this row/column.
            else {
                var chainToUntether = fluid.get(that.tetheredChains, [padMessage.row, padMessage.col]);
                // Move the current "tethered chain" for this note to the "untethered" area.
                if (chainToUntether) {
                    that.untetheredChains.push(chainToUntether);
                    delete that.tetheredChains[padMessage.row][padMessage.col];
                }
            }
        }
    };

    lsu.polarVortex.inBounds = function (col, row) {
        return (col >= 0 || row >= 0 || col <= 30 || row <= 30);
    };

    // Evaluate all "cells" and add their energy to a single sliced view of all cells, keyed by [row][col]
    //
    // To quote the "Launchpad Pro Programmer's Reference Guide":
    //
    // "The grid starts at the bottom most left LED, with the following group of parameters referring to the next
    //  LED to the right."
    //
    lsu.polarVortex.generateEnergyGrid = function (that) {
        var energyGrid = lsu.polarVortex.generateEmptyGrid();

        var processSingleCell = function (singleCell) {
            // Skip dead cells that lack energy to contribute.
            if (singleCell.energy > 0) {
                var cellXYCoordinates = lsu.polarVortex.getXYfromPolar(singleCell.radius, singleCell.azimuth);

                // Modulo values are negative for negative numbers, which can invert later calculations when
                // the y value of the cell is outside the bottom edge.
                var yLeadingPercentage  = Math.abs(cellXYCoordinates.y % 1);
                var yTrailingPercentage = 1 - yLeadingPercentage;
                var trailingRow         = Math.trunc(cellXYCoordinates.y) + 1;
                var leadingRow          = trailingRow + 1;

                // Modulos are negative for negative numbers, which can invert later calculations when
                // the x value of the cell is outside the left edge.
                var xLeadingPercentage  = Math.abs(cellXYCoordinates.x % 1);
                var xTrailingPercentage = 1 - xLeadingPercentage;
                var trailingCol         = Math.trunc(cellXYCoordinates.x) + 1;
                var leadingCol          = trailingCol + 1;

                var energyAsOpacity     = (singleCell.energy + 1) / 128;

                // Top Left
                if (lsu.polarVortex.inBounds(trailingCol - 1, trailingRow - 1)) {
                    energyGrid[trailingRow][trailingCol] += energyAsOpacity * xTrailingPercentage * yTrailingPercentage;
                }
                // Top Right
                if (lsu.polarVortex.inBounds(leadingCol - 1, trailingRow - 1)) {
                    energyGrid[trailingRow][leadingCol] += energyAsOpacity * xLeadingPercentage * yTrailingPercentage;
                }
                // Bottom Left
                if (lsu.polarVortex.inBounds(trailingCol - 1, leadingRow - 1)) {
                    energyGrid[leadingRow][trailingCol] += energyAsOpacity * xTrailingPercentage * yLeadingPercentage;
                }
                // Bottom Right
                if (lsu.polarVortex.inBounds(leadingCol - 1, leadingRow - 1)) {
                    energyGrid[leadingRow][leadingCol] += energyAsOpacity * xLeadingPercentage * yLeadingPercentage;
                }
            }
        };

        // Tethered chains is now a 2D grid.
        for (var row = 0; row < 30; row++) {
            for (var col = 0; col < 30; col++) {
                var tetheredChain = fluid.get(that.tetheredChains, [row, col]);
                if (tetheredChain) {
                    fluid.each(tetheredChain.cells, processSingleCell);
                }
            }
        }

        fluid.each(that.untetheredChains, function (singleChain) {
            fluid.each(singleChain.cells, processSingleCell);
        });

        return energyGrid;
    };

    // Safely create an empty grid to use for grid-ising the raw position of all cells.
    lsu.polarVortex.generateEmptyGrid = function () {
        var singleRow = fluid.generate(30, 0);
        var grid = fluid.generate(30, function () { return fluid.copy(singleRow); }, true);
        return grid;
    };

    lsu.polarVortex.startPolling = function (that) {
        that.scheduler.schedule({
            type: "repeat",
            freq: 1,
            callback: that.updateChains
        });

        that.scheduler.setTimeScale(60 / that.model.bpm);
        that.scheduler.start();
    };

    lsu.polarVortex.updateChains = function (that) {
        // If our speed has changed, update the scheduler and trigger the next step early to avoid a "stutter".
        if (that.currentBpm !== that.model.bpm) {
            that.currentBpm = that.model.bpm;
            that.scheduler.setTimeScale(60 / that.currentBpm);
            return;
        }

        // Update the position of all existing chain cells.
        // Tethered chains is now a 2D array.
        for (var row = 0; row < 30; row++) {
            for (var col = 0; col < 30; col++) {
                var tetheredChain = fluid.get(that.tetheredChains, [row, col]);
                if (tetheredChain) {
                    lsu.polarVortex.updateChain(that, tetheredChain, true);
                }
            }
        }

        fluid.each(that.untetheredChains, function (untetheredChainRecord) {
            lsu.polarVortex.updateChain(that, untetheredChainRecord, false);
        });

        // Remove any "untethered chains" that have reached the end of their life.
        that.untetheredChains = that.untetheredChains.filter(function (singleChain) {
            return singleChain.cells.length > 0;
        });

        // Update the onscreen visualisation.
        var updatedEnergyGrid = lsu.polarVortex.generateEnergyGrid(that);
        fluid.replaceModelValue(that.applier, "energyGrid", updatedEnergyGrid);
    };

    lsu.polarVortex.createChain = function (that, firstCellDef) {
        var startingGain = firstCellDef.energy / 127;
        var gain         = new Tone.Gain(startingGain).toDestination();

        var startingPanning = lsu.polarVortex.getPanningFromPolar(firstCellDef.radius, firstCellDef.azimuth);
        var panner          = new Tone.Panner(startingPanning);
        panner.connect(gain);

        var startingFrequency = lsu.polarVortex.getFrequencyFromPolar(that, firstCellDef.radius, firstCellDef.azimuth);
        var synth = new Tone.FMSynth();
        synth.connect(panner);
        synth.triggerAttack(startingFrequency);

        var newChain = {
            cells: [firstCellDef],
            gain:   gain,
            panner: panner,
            synth:  synth
        };

        return newChain;
    };

    lsu.polarVortex.updateChain = function (that, chainRecord, isTethered) {
        if (chainRecord.cells.length) {
            var lastCell = chainRecord.cells[chainRecord.cells.length - 1];

            var newRadius  = lastCell.radius + that.model.attraction;
            var newAzimuth = (lastCell.azimuth + that.model.rotation)  % 360;
            var newEnergy  = lastCell.energy * that.options.decayRate;

            // Add a new segment after the last segment if it would not take us out of bounds, and if its energy is
            // above our cutoff (avoids "zombie" notes that hover indefinitely).
            if (newRadius > 0 && newRadius < 5 && newEnergy > that.options.energyFloor) {
                var newCell = {
                    radius:  newRadius,
                    azimuth: newAzimuth,
                    energy:  newEnergy
                };
                chainRecord.cells.push(newCell);
            }

            // If we're not connected to a held note, delete the first segment in the "chain".
            if (!isTethered) {
                chainRecord.cells.shift();
            }
        }

        // Check the length again as we may have shifted our last note away in the previous step.
        if (chainRecord.cells.length) {
            // Tone.js uses "time in seconds" for its transition functions.
            var updateTimeInSeconds = 60 / that.model.bpm;

            // Transition to the new pitch, which is based on the average position of all cells in the chain.
            var averageFrequency = lsu.polarVortex.getChainAverageFrequency(that, chainRecord);
            chainRecord.synth.frequency.rampTo(averageFrequency, updateTimeInSeconds);

            // Transition to the new panning level, which is based on the average position of all cells in the chain.
            var averagePanning = lsu.polarVortex.getChainAveragePanning(chainRecord);
            chainRecord.panner.pan.rampTo(averagePanning, updateTimeInSeconds);

            // Transition to the new volume level, which is based on the average energy of all cells in the chain.
            var averageEnergy = lsu.polarVortex.getChainAverageEnergy(chainRecord);
            var newGain = Math.min(1, Math.max(0, (averageEnergy / 127)));
            chainRecord.gain.gain.rampTo(newGain, updateTimeInSeconds);
        }
        else {
            lsu.polarVortex.deactivateChain(chainRecord);
        }
    };

    lsu.polarVortex.deactivateChain = function (chainRecord) {
        // Stop and then destroy all Tone classes related to this "chain".
        chainRecord.gain.disconnect();
        chainRecord.panner.disconnect();
        chainRecord.synth.disconnect();
        chainRecord.synth.dispose();
        chainRecord.panner.dispose();
        chainRecord.gain.dispose();
    };

    lsu.polarVortex.getXYfromPolar = function (radius, azimuth) {
        var radians = azimuth * Math.PI / 180;
        var x = 13.5 + (Math.cos(radians) * radius);
        var y = 13.5 + Math.sin(radians) * radius;
        return {
            x: x,
            y: y
        };
    };

    lsu.polarVortex.getPolarFromXY = function (x, y) {
        var xOffsetFromCentre = x - 13.5;
        var yOffsetFromCentre = y - 13.5;
        var radius = Math.sqrt((xOffsetFromCentre * xOffsetFromCentre) + (yOffsetFromCentre * yOffsetFromCentre));
        var azimuthRadians = Math.atan2(yOffsetFromCentre, xOffsetFromCentre);
        var azimuthDegrees = (360 + (azimuthRadians * 180 / Math.PI)) % 360;
        return {
            radius: radius,
            azimuth: azimuthDegrees
        };
    };

    lsu.polarVortex.getFrequencyFromPolar = function (that, radius, azimuth) {
        var xYCoords = lsu.polarVortex.getXYfromPolar(radius, azimuth);
        var polarity  = xYCoords.y <= 13.5 ? -1 : 1;
        var pitch = that.model.centrePitch * Math.pow(2, (radius * polarity));
        return pitch;
    };

    lsu.polarVortex.getPanningFromPolar = function (radius, azimuth) {
        var xYCoords = lsu.polarVortex.getXYfromPolar(radius, azimuth);
        var panningLevel = Math.max(-1, Math.min(1, (xYCoords.x - 13.5) / 13.5));
        return panningLevel;
    };

    lsu.polarVortex.getChainAverageFrequency = function (that, chain) {
        var totalFrequency = 0;
        fluid.each(chain.cells, function (cell) {
            totalFrequency += lsu.polarVortex.getFrequencyFromPolar(that, cell.radius, cell.azimuth);
        });
        var averageFrequency = totalFrequency /  chain.cells.length;
        return averageFrequency;
    };

    lsu.polarVortex.getChainAveragePanning = function (chain) {
        var totalPanning = 0;
        fluid.each(chain.cells, function (cell) {
            totalPanning += lsu.polarVortex.getPanningFromPolar(cell.radius, cell.azimuth);
        });
        var averagePanning = totalPanning /  chain.cells.length;
        return averagePanning;
    };

    lsu.polarVortex.getChainAverageEnergy = function (chain) {
        var totalEnergy = 0;
        fluid.each(chain.cells, function (cell) {
            totalEnergy += cell.energy;
        });
        var averageEnergy = totalEnergy / chain.cells.length;
        return averageEnergy;
    };
})(fluid, Tone);
