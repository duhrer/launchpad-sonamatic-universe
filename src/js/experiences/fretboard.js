(function (fluid) {
    "use strict";
    var lsu = fluid.registerNamespace("lsu");

    fluid.defaults("lsu.fretboard.uiOutputConnection", {
        gradeNames: ["lsu.uiOutputConnection"],

        model: {
            capoShift: 0
        },

        modelListeners: {
            capoShift: {
                funcName: "lsu.fretboard.uiOutputConnection.redrawFretMarkers",
                args: ["{that}"]
            }
        }
    });

    // Add markings for 3, 5, 7, 9, 12, et cetera on row 0.  Octave markings are distinct from the rest.
    lsu.fretboard.uiOutputConnection.redrawFretMarkers = function (that) {
        var fretMarkerOffsets = [3,5,7,9]; // We handle full octaves, i.e. 12 separately.

        var fretMarkings = [];
        for (var col = 0; col < 10; col++) {
            var shiftedCol = col + that.model.capoShift;
            var colOffset = (48 + shiftedCol) % 12; // Add more than the max capoShift so that all numbers remain positive.
            if (colOffset === 0) {
                fretMarkings.push({ r: 1, g: 1, b: 1});
            }
            else if (fretMarkerOffsets.includes(colOffset)) {
                fretMarkings.push({ r: 0.25, g: 0.25, b: 0.25});
            }
            else {
                fretMarkings.push({ r: 0, g: 0, b: 0});
            }
        }

        var transaction = that.applier.initiate();
        transaction.fireChangeRequest({ path: ["gridColours", 7], value: fretMarkings});
        transaction.fireChangeRequest({ path: ["gridColours", 8], value: fretMarkings});
        transaction.commit();
    };

    fluid.defaults("lsu.fretboard", {
        // The colour grade ties together the models for all rows, which we don't want, as each device controls its
        // own "capo" shift.
        gradeNames: ["lsu.router"],

        model: {
            capoShifts: {}
        },

        components: {
            grid: {
                options: {
                    model: {
                        capoShift: 0
                    },

                    // In the "guitarE" tunings, whose range is 40-89 by default, may need to be adjusted for other tunings.
                    maxCapoShift: 36,

                    modelListeners: {
                        capoShift: {
                            funcName: "lsu.fretboard.uiOutputConnection.redrawFretMarkers",
                            args: ["{that}"]
                        }
                    },
                    listeners: {
                        "onPadDown.updateCapo": {
                            funcName: "lsu.launchpadConnection.input.withCapo.updateCapo",
                            args: ["{that}", "{arguments}.0"] // padMessage
                        }
                    },

                    dynamicComponents: {
                        row: {
                            options: {
                                dynamicComponents: {
                                    pad: {
                                        options: {
                                            model: {
                                                capoShift: "{grid}.model.capoShift"
                                            },
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
                                        type: "lsu.launchpadConnection.input.withCapo",
                                        options: {
                                            // TODO: Add handler to highlight played pads on output.
                                            // listeners: {
                                            //     "onPadDown.handlePadMessage": {
                                            //         funcName: "lsu.fretboard.handlePadMessage",
                                            //         args: ["{lsu.fretboard}", "{arguments}.0"] // padMessage
                                            //     },
                                            //     "onPadUp.handlePadMessage": {
                                            //         funcName: "lsu.fretboard.handlePadMessage",
                                            //         args: ["{lsu.fretboard}", "{arguments}.0"] // padMessage
                                            //     }
                                            // },
                                            // TODO: Add relay for held notes as well.
                                            modelRelay: {
                                                source: "capoShift",
                                                target: {
                                                    context: "fretboard",
                                                    segs: ["capoShifts", "{source}.name"]
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
                                        type: "lsu.fretboard.uiOutputConnection",
                                        options: {
                                            model: {
                                                colourScheme: "{lsu.fretboard}.model.colourScheme"
                                            },

                                            // Model relay from router map to capoShift.
                                            modelRelay: {
                                                source: {
                                                    context: "fretboard",
                                                    segs: ["capoShifts", "{source}.name"]
                                                },
                                                target: "capoShift"
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
})(fluid);
