(function (fluid) {
    "use strict";
    var lsu = fluid.registerNamespace("lsu");
    fluid.defaults("lsu.onscreen", {
        gradeNames: ["lsu.router.colour"],
        components: {
            grid: {
                options: {
                    listeners: {
                        "onPadDown.handlePadMessage": {
                            funcName: "lsu.onscreen.handlePadMessage",
                            args: ["{lsu.onscreen}", "{arguments}.0"] // midiMessage
                        },
                        "onPadUp.handlePadMessage": {
                            funcName: "lsu.onscreen.handlePadMessage",
                            args: ["{lsu.onscreen}", "{arguments}.0"] // midiMessage
                        }
                    },
                    dynamicComponents: {
                        row: {
                            options: {
                                dynamicComponents: {
                                    pad: {
                                        options: {
                                            listeners: {
                                                "onMessage.sendToNoteOut": "{noteOutputs}.events.sendMessage.fire"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            noteInputs: {
                options: {
                    listeners: {
                        "onNoteOn.sendToNoteOut": "{noteOutputs}.events.sendNoteOn.fire",
                        "onNoteOff.sendToNoteOut": "{noteOutputs}.events.sendNoteOff.fire"
                    },
                    components: {
                        portConnector: {
                            options: {
                                dynamicComponents: {
                                    connection: {
                                        // type: "lsu.launchpadConnection.input.withCapo",
                                        options: {
                                            listeners: {
                                                "onPadDown.handlePadMessage": {
                                                    funcName: "lsu.onscreen.handlePadMessage",
                                                    args: ["{lsu.onscreen}", "{arguments}.0"] // padMessage
                                                },
                                                "onPadUp.handlePadMessage": {
                                                    funcName: "lsu.onscreen.handlePadMessage",
                                                    args: ["{lsu.onscreen}", "{arguments}.0"] // padMessage
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

    lsu.onscreen.handlePadMessage = function (that, padMessage) {
        if (padMessage.row !== 0) {
            var saturation = padMessage.velocity / 127;
            var r = lsu.router.colour.calculateSingleColor(that, "r", saturation);
            var g = lsu.router.colour.calculateSingleColor(that, "g", saturation);
            var b = lsu.router.colour.calculateSingleColor(that, "b", saturation);

            that.applier.change(["gridColours", padMessage.row, padMessage.col], { r: r, g: g, b: b });
        }
    };
})(fluid);
