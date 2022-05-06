(function (fluid) {
    "use strict";
    var lsu = fluid.registerNamespace("lsu");

    fluid.defaults("lsu.router", {
        gradeNames: ["lsu.templateRenderer"],
        markup: {
            container: "<div class='lsu-router'><div class='lsu-grid'></div><div class='lsu-note-input'></div><div class='lsu-note-output'></div><div class='lsu-ui-output'></div></div>"
        },
        selectors: {
            grid: ".lsu-grid",
            noteInput:  ".lsu-note-input",
            noteOutput: ".lsu-note-output",
            uiOutput:   ".lsu-ui-output"
        },

        preferredInputDevice:    "Launchpad Pro 7 Standalone Port",
        preferredUIOutputDevice: "Launchpad Pro 7 Standalone Port",

        model: {
            notes: "@expand:lsu.generateNumberKeyedMap(128)",
            controls: "@expand:lsu.generateNumberKeyedMap(128)"
        },

        // TODO: Set up some kind of context awareness or other means of setting up different launchpads.
        setupMessages: [
            // Boilerplate sysex to set mode and layout, see:
            // https://customer.novationmusic.com/sites/customer/files/novation/downloads/10598/launchpad-pro-programmers-reference-guide_0.pdf
            // All sysex messages for the launchpad pro have the same header (framing byte removed)
            // 00h 20h 29h 02h 10h
            // Select "standalone" mode.
            { type: "sysex", data: [0, 0x20, 0x29, 0x02, 0x10, 33, 1] },
            // Select "programmer" layout
            { type: "sysex", data: [0, 0x20, 0x29, 0x02, 0x10, 44, 3]}
        ],

        invokers: {
            sendToNoteOut: {
                funcName: "lsu.router.sendToOutput",
                args: ["{noteOutput}", "{arguments}.0"] // outputComponent, message
            },
            sendToUi: {
                funcName: "lsu.router.sendToOutput",
                args: ["{uiOutput}", "{arguments}.0"] // outputComponent, message
            }
        },

        components: {
            grid: {
                // TODO: Make this more flexible
                type: "lsu.grid.launchpadPro",
                container: "{that}.dom.grid",
                options: {
                    model: {
                        controls: "{lsu.router}.model.controls",
                        notes: "{lsu.router}.model.notes"
                    }
                }
            },
            noteInput: {
                type: "flock.midi.connectorView",
                container: "{that}.dom.noteInput",
                options: {
                    preferredPort: "{lsu.router}.options.preferredInputDevice",
                    portType: "input",
                    listeners: {
                        "control.registerControlValue": {
                            funcName: "lsu.router.handleControl",
                            args: ["{lsu.router}", "{arguments}.0"] // midiMessage
                        },
                        "noteOn.registerControlValue":  {
                            funcName: "lsu.router.handleNote",
                            args: ["{lsu.router}", "{arguments}.0"] // midiMessage
                        },
                        "noteOff.registerControlValue": {
                            funcName: "lsu.router.handleNote",
                            args: ["{lsu.router}", "{arguments}.0"] // midiMessage
                        }
                    },
                    components: {
                        midiPortSelector: {
                            options: {
                                strings: {
                                    selectBoxLabel: "Note Input"
                                }
                            }
                        }
                    }
                }
            },
            noteOutput: {
                type: "flock.midi.connectorView",
                container: "{that}.dom.noteOutput",
                options: {
                    preferredPort: "{lsu.router}.options.preferredOutputDevice",
                    portType: "output",
                    components: {
                        midiPortSelector: {
                            options: {
                                strings: {
                                    selectBoxLabel: "Note Output"
                                }
                            }
                        }
                    }
                }
            },
            uiOutput: {
                type: "flock.midi.connectorView",
                container: "{that}.dom.uiOutput",
                options: {
                    portType: "output",
                    preferredPort: "{lsu.router}.options.preferredUIOutputDevice",
                    components: {
                        connection: {
                            options: {
                                sysex: true, // Required to configure the Launchpad Pro.
                                listeners: {
                                    "onReady.setupDevice": {
                                        funcName: "fluid.each",
                                        args:     ["{lsu.router}.options.setupMessages", "{lsu.router}.sendToUi"]
                                    }
                                }
                            }
                        },
                        midiPortSelector: {
                            options: {
                                strings: {
                                    selectBoxLabel: "UI Output"
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    lsu.router.sendToOutput = function (outputComponent, message) {
        var outputConnection = fluid.get(outputComponent, "connection");
        if (outputConnection) {
            outputConnection.send(message);
        }
    };

    lsu.router.handleControl = function (that, midiMessage) {
        var controlNumber = fluid.get(midiMessage, "number");
        if (controlNumber) {
            var value = fluid.get(midiMessage, "value") || 0;
            that.applier.change(["controls", controlNumber], value);
        }
    };

    lsu.router.handleNote = function (that, midiMessage) {
        var note = fluid.get(midiMessage, "note");
        if (note) {
            var velocity = fluid.get(midiMessage, "velocity") || 0;
            that.applier.change(["notes", note], velocity);
        }
    };

    fluid.defaults("lsu.router.colour", {
        gradeNames: ["lsu.router"],
        model: {
            brightness: 63,
            contrast:   1,
            colourLevels: "{that}.options.colourSchemes.white",
            noteColours: "@expand:lsu.generateNumberKeyedMap(128)",
            controlColours: "@expand:lsu.generateNumberKeyedMap(128)"
        },
        colourSchemes: {
            white:  { r: 1, g: 1,    b: 1, control: 1, velocity: 1  },
            red:    { r: 1, g: 0,    b: 0, control: 2, velocity: 5 },
            orange: { r: 1, g: 0.25, b: 0, control: 3, velocity: 9  }, // In HTML the RGB values for orange would be way off, but for the Launchpad Pro it works.
            yellow: { r: 1, g: 1,    b: 0, control: 4, velocity: 13 },
            green:  { r: 0, g: 1,    b: 0, control: 5, velocity: 17 },
            blue:   { r: 0, g: 1,    b: 1, control: 6, velocity: 90 },
            indigo: { r: 0, g: 0,    b: 1, control: 7, velocity: 79 },
            violet: { r: 1, g: 0,    b: 1, control: 8, velocity: 53 }
        },
        components: {
            grid: {
                options: {
                    model: {
                        controlColours: "{lsu.router.colour}.model.controlColours",
                        noteColours: "{lsu.router.colour}.model.noteColours"
                    }
                }
            },
            uiOutput: {
                options: {
                    components: {
                        connection: {
                            options: {
                                listeners: {
                                    "onReady.paintKeys": {
                                        funcName: "lsu.router.colour.paintDevice",
                                        args: ["{lsu.router.colour}"]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        modelListeners: {
            "brightness": {
                excludeSource: "init",
                funcName: "lsu.router.colour.paintDevice",
                args: ["{that}"]
            },
            "contrast": {
                excludeSource: "init",
                funcName: "lsu.router.colour.paintDevice",
                args: ["{that}"]
            },
            "colourLevels": {
                excludeSource: "init",
                funcName: "lsu.router.colour.paintDevice",
                args: ["{that}"]
            },

            "noteColours": {
                funcName: "lsu.router.colour.paintDevice",
                args: ["{lsu.router.colour}"]
            },

            // Launchpad Controls

            // Colour Controls
            "controls.1": {
                funcName: "lsu.router.colour.handleColourSchemeControl",
                args: ["{that}", "{arguments}.0", "white"] // controlValue, colourSchemeKey
            },
            "controls.2": {
                funcName: "lsu.router.colour.handleColourSchemeControl",
                args: ["{that}", "{arguments}.0", "red"] // controlValue, colourSchemeKey
            },
            "controls.3": {
                funcName: "lsu.router.colour.handleColourSchemeControl",
                args: ["{that}", "{arguments}.0", "orange"] // controlValue, colourSchemeKey
            },
            "controls.4": {
                funcName: "lsu.router.colour.handleColourSchemeControl",
                args: ["{that}", "{arguments}.0", "yellow"] // controlValue, colourSchemeKey
            },
            "controls.5": {
                funcName: "lsu.router.colour.handleColourSchemeControl",
                args: ["{that}", "{arguments}.0", "green"] // controlValue, colourSchemeKey
            },
            "controls.6": {
                funcName: "lsu.router.colour.handleColourSchemeControl",
                args: ["{that}", "{arguments}.0", "blue"] // controlValue, colourSchemeKey
            },
            "controls.7": {
                funcName: "lsu.router.colour.handleColourSchemeControl",
                args: ["{that}", "{arguments}.0", "indigo"] // controlValue, colourSchemeKey
            },
            "controls.8": {
                funcName: "lsu.router.colour.handleColourSchemeControl",
                args: ["{that}", "{arguments}.0", "violet"] // controlValue, colourSchemeKey
            },

            // "User" Button
            "controls.98": {
                funcName: "lsu.router.colour.handleBackControl",
                args: ["{that}", "{arguments}.0"] // controlValue
            }
        }
    });

    // TODO: Figure out how we want to control brightness and contrast.
    lsu.router.colour.calculateSingleColor = function (that, channel, value) {
        var colourLevel = fluid.get(that.model.colourLevels, channel);
        var calculatedColourLevel = Math.round(that.model.brightness * colourLevel * value);
        return calculatedColourLevel;
    };

    lsu.router.colour.paintDevice = function (that) {
        var header = [
            // common header
            0, 0x20, 0x29, 0x02, 0x10,
            // "RGB Grid Sysex" command
            0xF,
            // 0: all pads, 1: square drum pads only.
            1
        ];

        var colourArray = [];

        // TODO: Works for launchpad pro, will need a more robust strategy to support other devices.
        for (var row = 10; row < 90; row += 10) {
            for (var col = 1; col < 9; col++ ) {
                var noteNumber = row + col;

                var rValue = fluid.get(that, ["model", "noteColours", noteNumber, "r"]) || 0;
                colourArray.push(lsu.router.colour.calculateSingleColor(that, "r", rValue / 256));

                var gValue = fluid.get(that, ["model", "noteColours", noteNumber, "g"]) || 0;
                colourArray.push(lsu.router.colour.calculateSingleColor(that, "g", gValue / 256));

                var bValue = fluid.get(that, ["model", "noteColours", noteNumber, "b"]) || 0;
                colourArray.push(lsu.router.colour.calculateSingleColor(that, "b", bValue / 256));
            }
        }

        var data = header.concat(colourArray);
        that.sendToUi({
            type: "sysex",
            data: data
        });

        // Paint the "side velocity" (0x63) a colour that matches the colour scheme.
        // F0h 00h 20h 29h 02h 10h 0Ah <velocity> <Colour> F7h
        that.sendToUi({ type: "sysex", data: [0, 0x20, 0x29, 0x02, 0x10, 0xA, 0x63, that.model.colourLevels.velocity]});

        fluid.each(that.options.colourSchemes, function (colourScheme) {
            if (colourScheme.control) {
                that.sendToUi({ type: "control", channel: 0, number: colourScheme.control, value: colourScheme.velocity});
            }
        });
    };

    lsu.router.colour.handleColourSchemeControl = function (that, controlValue, colourSchemeKey) {
        if (controlValue) {
            var colourScheme = fluid.get(that, ["options", "colourSchemes", colourSchemeKey]);
            if (colourScheme) {
                that.applier.change("colourLevels", colourScheme);
            }
        }
    };

    lsu.router.colour.handleBackControl = function (that, controlValue) {
        if (controlValue) {
            window.history.back();
        }
    };
})(fluid);
