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

        model: {
            notes: "@expand:fluid.generate(128, 0)",
            controls: "@expand:fluid.generate(128,0)",
            port: false,
            deviceType: "unknown"
        },

        modelListeners: {
            port: {
                funcName: "lsu.router.setDeviceType",
                args: ["{that}"]
            }
        },

        setupMessages: {
            // YouMe takes care of the framing bytes for these, so we can omit the leading bytes (`F0h`) and trailing
            // bytes (`00h` and `F7h`).
            launchpadPro: [
                // Boilerplate sysex to set mode and layout, see the Launchpad Pro Programmer's Reference Guide.
                // All sysex messages for the Launchpad Pro have the same header (framing byte removed):
                // 00h 20h 29h 02h 10h

                // Select "standalone" mode (33 is the mode select, 1 is the value for standalone).
                { type: "sysex", data: [0, 0x20, 0x29, 0x02, 0x10, 33, 1] },

                // Select "programmer" layout (44 is the layout select, 3 is the value for programmer).
                { type: "sysex", data: [0, 0x20, 0x29, 0x02, 0x10, 44, 3]}
            ],
            launchpadPro3:  [
                // Sysex to set the layout to "programmer", see the Launchpad Pro MK3 Programmer's Reference Guide.
                // All sysex messages for the Launchpad Pro MK3 have the same header (framing byte removed):
                // 00h 20h 29h 02h 0Eh

                // The command to change the mode to programmer mode is:
                // Hex Version: 00h 20h 29h 02h 0Eh 0Eh <Mode>
                // Where <mode> is 0 for live mode, 1 for programmer mode
                { type: "sysex", data: [0, 0x20, 0x29, 0x02, 0x0E, 0x0E, 0x1]},

                // The command to change the layout (minus framing bytes is):
                // 00h 20h 29h 02h 0Eh 00h <layout> <page>
                // <layout> - Hex: 11h / Decimal: 17 --- Programmer Mode
                // <page> - Hex: 00h / Decimal: 0 --- for any other view
                { type: "sysex", data: [0, 0x20, 0x29, 0x02, 0x0E, 0x11, 0]}
            ]
        },

        invokers: {
            sendToUi: {
                func: "{uiOutput}.events.sendMessage.fire",
                args: ["{arguments}.0"] // outputComponent, message
            }
        },

        components: {
            grid: {
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
                type: "youme.portSelectorView.input",
                container: "{that}.dom.noteInput",
                options: {
                    desiredPortSpec: { name: "Launchpad Pro" },
                    listeners: {
                        "onControl.registerControlValue": {
                            funcName: "lsu.router.handleControl",
                            args: ["{lsu.router}", "{arguments}.0"] // midiMessage
                        },
                        "onNoteOn.registerControlValue":  {
                            funcName: "lsu.router.handleNote",
                            args: ["{lsu.router}", "{arguments}.0"] // midiMessage
                        },
                        "onNoteOff.registerControlValue": {
                            funcName: "lsu.router.handleNote",
                            args: ["{lsu.router}", "{arguments}.0"] // midiMessage
                        }
                    },
                    selectBoxLabel: "Note Input"
                }
            },
            noteOutput: {
                type: "youme.portSelectorView.output",
                container: "{that}.dom.noteOutput",
                options: {
                    selectBoxLabel: "Note Output"
                }
            },
            uiOutput: {
                type: "youme.portSelectorView.output",
                container: "{that}.dom.uiOutput",
                options: {
                    desiredPortSpec: { name: "Launchpad Pro" },
                    selectBoxLabel: "UI Output",
                    components: {
                        portConnector: {
                            options: {
                                listeners: {
                                    "onPortOpen.setupDevice": {
                                        funcName: "lsu.router.setupDevice",
                                        args:     ["{lsu.router}"]
                                    }
                                },
                                model: {
                                    connectionPort: "{lsu.router}.model.port"
                                }
                            }
                        }
                    }
                }
            }
        }
    });

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

    lsu.router.setDeviceType = function (that) {
        var deviceType = "unknown";
        var deviceName = fluid.get(that, "model.port.name");
        if (typeof deviceName === "string") {
            if (deviceName.match(/^Launchpad Pro MK3.+MIDI$/)) {
                deviceType = "launchpadPro3";
            }
            else if (deviceName.match(/^Launchpad Pro.+Standalone Port$/)) {
                deviceType = "launchpadPro";
            }
        }
        that.applier.change("deviceType", deviceType);
    };

    lsu.router.setupDevice = function (that) {
        var sysexPayload = fluid.get(that, ["options", "setupMessages", that.model.deviceType]);
        fluid.each(sysexPayload, function (sysexMessage) {
            that.sendToUi(sysexMessage);
        });
    };

    fluid.defaults("lsu.router.colour", {
        gradeNames: ["lsu.router"],
        model: {
            brightness: 63, // Full brightness on the Launchpad Pro
            contrast:   1,
            colourLevels: "{that}.options.colourSchemes.white",
            deviceColours: "@expand:fluid.generate(128, 0)"
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
                    // TODO: This will also need to be more flexible, particularly for much older launchpads.
                    modelRelay: {
                        source: "{lsu.router.colour}.model.deviceColours",
                        target: "gridColours",
                        singleTransform: {
                            type: "lsu.router.colour.deviceToGridColours"
                        }
                    }
                }
            },
            uiOutput: {
                options: {
                    components: {
                        portConnector: {
                            options: {
                                dynamicComponents: {
                                    connection: {
                                        options: {
                                            model: {
                                                port: "{lsu.router}.model.port"
                                            },
                                            listeners: {
                                                "onPortOpen.paintKeys": {
                                                    funcName: "lsu.router.colour.paintDevice",
                                                    args: ["{lsu.router.colour}"]
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

            "deviceColours": {
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

    lsu.router.colour.deviceToGridColours = function (deviceColours) {
        var gridColours = lsu.grid.generateDefaultColourMap();

        fluid.each(deviceColours, function (padColour, note) {
            var row = 9 - Math.floor(note / 10);
            var col = note % 10;
            if (row > 0 && row < 9  && col > 0 && col < 9) {
                gridColours[row][col] = {
                    r: padColour.r * 4,
                    g: padColour.g * 4,
                    b: padColour.b * 4
                };
            }
        });

        return gridColours;
    };

    // TODO: Figure out how we want to control brightness and contrast.
    lsu.router.colour.calculateSingleColor = function (that, channel, value, isLaunchpadPro3) {
        var colourLevel = fluid.get(that.model.colourLevels, channel);
        var scaleFactor = isLaunchpadPro3 ? 2 : 1;
        var calculatedColourLevel = Math.round(that.model.brightness * colourLevel * value * scaleFactor);
        return calculatedColourLevel;
    };

    lsu.router.colour.getDeviceHeaders = function (that){
        if (that.model.deviceType === "launchpadPro") {
            return [
                // common header (for Launchpad Pro)
                0, 0x20, 0x29, 0x02, 0x10,
                // "RGB Grid Sysex" command
                0xF,
                // 0: all pads, 1: square drum pads only.  We use "all pads" to match the behaviour of the pro MK3.
                0
            ];
        }
        else if (that.model.deviceType === "launchpadPro3") {
            return [
                // common header (for Launchpad Pro 3)
                0, 0x20, 0x29, 0x02, 0xe,
                // RGB Mode on the Pro 3
                0x3
            ];
        }

        return [];
    };

    lsu.router.colour.colourArrayFromDeviceColours = function (that, isLaunchpadPro3) {
        var colourArray = [];

        // The first row (from the bottom) are the colour controls.

        // Leave a space for the nonexistent leading column.
        colourArray.push([0,0,0]);

        var hightIntensity = isLaunchpadPro3 ? 127 : 63;
        var lowIntensity = isLaunchpadPro3 ? 0x10 : 0x08;

        // Paint each of the colour controls.

        var cellIndex = 1;
        fluid.each(that.options.colourSchemes, function (colourScheme, colourSchemeName) {
            var intensity = (colourSchemeName === that.model.colourSchemeName) ? hightIntensity : lowIntensity;
            var colourData = [colourScheme.r * intensity, colourScheme.g * intensity, colourScheme.b * intensity];

            // The pro 3 has an extended format in which you send the cell index and a flag for solid/blinking/pulsing.
            var cellData = isLaunchpadPro3 ? [3, cellIndex].concat(colourData) : colourData;
            colourArray.push(cellData);
            cellIndex++;
        });

        // Leave a space for the nonexistent trailing column.
        colourArray.push([0,0,0]);

        for (var row = 1; row < 10; row++) {
            for (var col = 0; col < 10; col++ ) {
                var noteNumber = (row * 10) + col;
                if (isLaunchpadPro3) {
                    // Solid
                    colourArray.push(3);
                    // Our note index
                    colourArray.push(noteNumber);
                }

                var rValue = fluid.get(that, ["model", "deviceColours", noteNumber, "r"]) || 0;
                colourArray.push(lsu.router.colour.calculateSingleColor(that, "r", rValue / 256, isLaunchpadPro3));

                var gValue = fluid.get(that, ["model", "deviceColours", noteNumber, "g"]) || 0;
                colourArray.push(lsu.router.colour.calculateSingleColor(that, "g", gValue / 256, isLaunchpadPro3));

                var bValue = fluid.get(that, ["model", "deviceColours", noteNumber, "b"]) || 0;
                colourArray.push(lsu.router.colour.calculateSingleColor(that, "b", bValue / 256, isLaunchpadPro3));
            }
        }
        return fluid.flatten(colourArray);
    };

    lsu.router.colour.generateColourArray = function (that) {
        if (that.model.deviceType === "launchpadPro") {
            return lsu.router.colour.colourArrayFromDeviceColours(that);
        }
        else if (that.model.deviceType === "launchpadPro3") {
            return lsu.router.colour.colourArrayFromDeviceColours(that, true);
        }

        return [];
    };

    lsu.router.colour.paintDevice = function (that) {
        var headers = lsu.router.colour.getDeviceHeaders(that);
        var colourArray = lsu.router.colour.generateColourArray(that);
        var data = headers.concat(colourArray);

        if (data.length) {
            that.sendToUi({
                type: "sysex",
                data: data
            });
        }

        if (that.model.deviceType === "launchpadPro") {
            // Paint the "side velocity" (Pro) or "badge button" (Pro MK3) (0x63) a colour that matches the colour scheme.
            // Pro: F0h 00h 20h 29h 02h 10h 0Ah <velocity> <Colour> F7h
            // MK3: F0h 00h 20h 29h 02h 10h 0Ah <velocity> <Colour> F7h
            that.sendToUi({ type: "sysex", data: [0, 0x20, 0x29, 0x02, 0x10, 0xA, 0x63, that.model.colourLevels.velocity]});
        }
        else if (that.model.deviceType === "launchpadPro3") {
            that.sendToUi({ type: "noteOn", channel: 0, note: 0x63, velocity: that.model.colourLevels.velocity});
        }

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
            window.location.assign("../../index.html");
        }
    };
})(fluid);
