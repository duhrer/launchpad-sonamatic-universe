(function (fluid) {
    "use strict";
    var lsu = fluid.registerNamespace("lsu");
    fluid.defaults("lsu.onscreen", {
        gradeNames: ["lsu.router.colour"],
        modelListeners: {
            "notes.*": {
                excludeSource: "init",
                funcName: "lsu.onscreen.updateDeviceColourMap",
                args: ["{that}", "{change}.path", "{change}.value", "deviceColours"] // changePath, changeValue, mapKey
            }
        },
        components: {
            grid: {
                options: {
                    listeners: {
                        "onPadMessage.handlePadMessage": {
                            funcName: "lsu.onscreen.handlePadMessage",
                            args: ["{that}", "{arguments}.0"] // midiMessage
                        }
                    }
                }
            },
            noteInput: {
                options: {
                    listeners: {
                        "onNoteOn.sendToNoteOut": "{noteOutput}.events.sendNoteOn.fire",
                        "onNoteOff.sendToNoteOut": "{noteOutput}.events.sendNoteOff.fire"
                    }
                }
            }
        }
    });

    lsu.onscreen.updateDeviceColourMap = function (that, changePath, changeValue, mapKey) {
        var scaledChangeValue = changeValue ? changeValue / 128 : 0;
        var r = lsu.router.colour.calculateSingleColor(that, "r", scaledChangeValue);
        var g = lsu.router.colour.calculateSingleColor(that, "g", scaledChangeValue);
        var b = lsu.router.colour.calculateSingleColor(that, "b", scaledChangeValue);
        that.applier.change([mapKey, changePath[1]], { r: r, g: g, b: b });
    };

    lsu.onscreen.handlePadMessage = function (that, midiMessage) {
        if (midiMessage.type === "control") {
            that.applier.change(["controls", midiMessage.number], midiMessage.value);
        }
        else if (midiMessage.type === "note") {
            that.applier.change(["notes", midiMessage.note], midiMessage.velocity);
        }
    };
})(fluid);
