(function (fluid) {
    "use strict";
    var lsu = fluid.registerNamespace("lsu");

    fluid.defaults("lsu.router", {
        gradeNames: ["lsu.templateRenderer"],
        markup: {
            container: "<div class='lsu-router'><div class='lsu-grid'></div><div class='lsu-note-inputs'></div><div class='lsu-note-outputs'></div><div class='lsu-ui-outputs'></div></div>"
        },
        selectors: {
            grid: ".lsu-grid",
            noteInputs:  ".lsu-note-inputs",
            noteOutputs: ".lsu-note-outputs",
            uiOutputs:   ".lsu-ui-outputs"
        },

        invokers: {
            sendToUi: {
                func: "{uiOutputs}.events.sendMessage.fire",
                args: ["{arguments}.0"] // outputComponent, message
            }
        },

        components: {
            grid: {
                type: "lsu.grid.launchpadPro",
                container: "{that}.dom.grid",
                options: {
                    model: {
                        gridColours: "{lsu.router}.model.gridColours"
                    }
                }
            },
            noteInputs: {
                type: "youme.multiPortSelectorView.inputs",
                container: "{that}.dom.noteInputs",
                options: {
                    desiredPortSpecs: [{ name: "Launchpad Pro.+(MIDI|Standalone Port)$" }, { name: "^Launchpad$"}],
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
                    selectBoxLabel: "Note Inputs",
                    components: {
                        portConnector: {
                            // type: "youme.multiPortConnector.inputs"
                            type: "lsu.remappingMultiPortConnector.inputs"
                        }
                    }
                }
            },
            noteOutputs: {
                type: "youme.multiPortSelectorView.outputs",
                container: "{that}.dom.noteOutputs",
                options: {
                    selectBoxLabel: "Note Outputs"
                }
            },
            uiOutputs: {
                type: "youme.multiPortSelectorView.outputs",
                container: "{that}.dom.uiOutputs",
                options: {
                    desiredPortSpecs: [{ name: "Launchpad Pro.+(MIDI|Standalone Port)$" }, { name: "^Launchpad$"}],
                    selectBoxLabel: "UI Outputs",
                    components: {
                        portConnector: {
                            options: {
                                dynamicComponents: {
                                    connection: {
                                        type: "lsu.uiOutputConnection"
                                    }
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

    fluid.defaults("lsu.router.colour", {
        gradeNames: ["lsu.router"],
        model: {
            // TODO: Figure out how we want to control brightness.
            brightness: 1,
            colourScheme: "{that}.options.colourSchemes.white",
            colourSchemeName: "white",
            gridColours: "@expand:lsu.generateDefaultColourMap()"
        },
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
        components: {
            grid: {
                options: {
                    model: {
                        brightness: "{lsu.router.colour}.model.brightness",
                        gridColours: "{lsu.router.colour}.model.gridColours"
                    },
                    listeners: {
                        "onPadDown.routerHandlePadMessage": {
                            funcName: "lsu.router.colour.handlePadMessage",
                            args: ["{lsu.router.colour}", "{arguments}.0"] // padMessage
                        },
                        "onPadUp.routerHandlePadMessage": {
                            funcName: "lsu.router.colour.handlePadMessage",
                            args: ["{lsu.router.colour}", "{arguments}.0"] // padMessage
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
                                        options: {
                                            listeners: {
                                                "onPadDown.routerHandlePadMessage": {
                                                    funcName: "lsu.router.colour.handlePadMessage",
                                                    args: ["{lsu.router.colour}", "{arguments}.0"] // padMessage
                                                },
                                                "onPadUp.routerHandlePadMessage": {
                                                    funcName: "lsu.router.colour.handlePadMessage",
                                                    args: ["{lsu.router.colour}", "{arguments}.0"] // padMessage
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
            uiOutputs: {
                options: {
                    components: {
                        portConnector: {
                            options: {
                                dynamicComponents: {
                                    connection: {
                                        options: {
                                            model: {
                                                brightness: "{lsu.router.colour}.model.brightness",
                                                gridColours: "{lsu.router.colour}.model.gridColours",
                                                colourScheme: "{lsu.router.colour}.model.colourScheme"
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
            "colourScheme": {
                funcName: "lsu.router.colour.paintColourControls",
                args: ["{that}"]
            }
        }
    });

    lsu.router.colour.paintColourControls = function (that) {
        var cellIndex = 1;
        var highIntensity = 1;
        var lowIntensity   = 0.125;

        fluid.each(that.options.colourSchemes, function (colourScheme, colourSchemeName) {
            var intensity = (colourSchemeName === that.model.colourSchemeName) ? highIntensity : lowIntensity;
            var rValue = colourScheme.r * intensity;
            var gValue = colourScheme.g * intensity;
            var bValue = colourScheme.b * intensity;
            that.applier.change(["gridColours", 0, cellIndex], {r: rValue, g: gValue, b: bValue});
            cellIndex++;
        });
    };

    lsu.router.colour.handleColourSchemeControl = function (that, controlValue, colourSchemeKey) {
        if (controlValue) {
            var colourScheme = fluid.get(that, ["options", "colourSchemes", colourSchemeKey]);
            if (colourScheme) {
                that.applier.change("colourSchemeName", colourSchemeKey);
                that.applier.change("colourScheme", colourScheme);
            }
        }
    };

    lsu.router.colour.handlePadMessage = function (that, padMessage) {
        if (padMessage.velocity) {
            // Colour controls.
            if (padMessage.row === 0) {
                var colourSchemeKey = false;
                switch (padMessage.col) {
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
                    lsu.router.colour.handleColourSchemeControl(that, padMessage.velocity, colourSchemeKey);
                }
            }
            // Top controls.
            else if (padMessage.row === 9) {
                // "Back" button.
                if (padMessage.col === 8) {
                    if (padMessage.velocity) {
                        window.location.assign("../../index.html");
                    }
                }
            }
        }
    };

    /**
     *
     * @param {Object} that - An `lsu.router.colour` grade or anything else whose model has colourScheme and brightness.
     * @param {String} channel - The colour channel, i.e. "r", "g", or "b".
     * @param {Number} saturation - The desired "saturation" from 0 to 1.  Will be scaled down for each channel.
     * @return {number} - The scaled saturation for the given channel, from 0 to 1.
     */
    lsu.router.colour.calculateSingleColor = function (that, channel, saturation) {
        var colourLevel = fluid.get(that.model.colourScheme, channel);
        var calculatedColourLevel = that.model.brightness * colourLevel * saturation;
        return calculatedColourLevel;
    };
})(fluid);
