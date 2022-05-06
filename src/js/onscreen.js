(function (fluid) {
    "use strict";
    var lsu = fluid.registerNamespace("lsu");
    fluid.defaults("lsu.onscreen", {
        gradeNames: ["lsu.router.colour"],
        modelListeners: {
            "controls.*": {
                excludeSource: "init",
                funcName: "lsu.onscreen.updateColourMap",
                args: ["{that}", "{change}.path", "{change}.value", "controlColours"] // changePath, changeValue, mapKey
            },
            "notes.*": {
                excludeSource: "init",
                funcName: "lsu.onscreen.updateColourMap",
                args: ["{that}", "{change}.path", "{change}.value", "noteColours"] // changePath, changeValue, mapKey
            }
        },
        components: {
            noteInput: {
                options: {
                    listeners: {
                        "noteOn.sendToNoteOut": {
                            funcName: "{lsu.onscreen}.sendToNoteOut",
                            args: ["{arguments}.0"] // midiMessage
                        },
                        "noteOff.sendToNoteOut": {
                            funcName: "{lsu.onscreen}.sendToNoteOut",
                            args: ["{arguments}.0"] // midiMessage
                        }
                    }
                }
            }
        }
    });

    lsu.onscreen.updateColourMap = function (that, changePath, changeValue, mapKey) {
        var scaledChangeValue = changeValue ? changeValue / 128 : 0;
        var r = lsu.router.colour.calculateSingleColor(that, "r", scaledChangeValue);
        var g = lsu.router.colour.calculateSingleColor(that, "g", scaledChangeValue);
        var b = lsu.router.colour.calculateSingleColor(that, "b", scaledChangeValue);
        that.applier.change([mapKey, changePath[1]], { r: r, g: g, b: b });
    };
})(fluid);
