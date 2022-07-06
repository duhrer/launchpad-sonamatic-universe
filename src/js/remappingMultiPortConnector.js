(function (fluid) {
    "use strict";
    var lsu = fluid.registerNamespace("lsu");

    fluid.registerNamespace("lsu.remappingMultiPortConnector");

    lsu.remappingMultiPortConnector.relay = function (that, midiMessage, portConnector, eventName) {
        // TODO: Add "capo" support to shift all pitches up or down.

        var remappedMessage = fluid.copy(midiMessage);

        var relayEventName = eventName;
        var remappingKey = ["noteOn", "noteOff"].includes(midiMessage.type) ? "note" : midiMessage.type;
        var tuning = fluid.get(portConnector, ["options", "tunings", that.model.deviceType, remappingKey]);
        if (tuning && ["noteOn", "noteOff", "control", "aftertouch"].includes(midiMessage.type)) {
            if (midiMessage.type === "control") {
                if (tuning[midiMessage.number] !== undefined) {
                    var messageType = midiMessage.value ? "noteOn" : "noteOff";
                    relayEventName = midiMessage.value ? "onNoteOn" : "onNoteOff";
                    remappedMessage = {
                        type: messageType,
                        channel: midiMessage.channel,
                        note: tuning[midiMessage.number],
                        velocity: midiMessage.value
                    };
                }
            }
            // Exclude channel pressure aftertouch, but remap poly aftertouch.
            else if (midiMessage.note !== undefined) {
                if (tuning[midiMessage.note]) {
                    remappedMessage.note = tuning[midiMessage.note] + that.model.capoShift;
                }
                else {
                    remappedMessage.note += that.model.capoShift;
                }
            }
        }

        portConnector.events[relayEventName].fire(remappedMessage);
    };

    fluid.defaults("lsu.remappingMultiPortConnector.inputs", {
        gradeNames: ["youme.multiPortConnector.inputs"],

        tunings: {
            launchpad: lsu.tunings.launchpad.guitarE,
            launchpadPro: lsu.tunings.launchpadPro.guitarE,
            launchpadPro3: lsu.tunings.launchpadPro.guitarE // Same tuning.
        },

        dynamicComponents: {
            connection: {
                type: "lsu.launchpadConnection.input",
                options: {
                    listeners: {
                        // Override the default direct relay from connection->portConnector so that we can transform
                        // controls, notes, and note-related messages like aftertouch.
                        "onAftertouch.relay": {
                            funcName: "lsu.remappingMultiPortConnector.relay",
                            args: ["{that}", "{arguments}.0", "{youme.multiPortConnector.inputs}", "onAftertouch"] // midiMessage, portConnector, eventName
                        },
                        "onMessage.relay": {
                            funcName: "lsu.remappingMultiPortConnector.relay",
                            args: ["{that}", "{arguments}.0", "{youme.multiPortConnector.inputs}", "onMessage"] // midiMessage, portConnector, eventName
                        },
                        "onNoteOff.relay": {
                            funcName: "lsu.remappingMultiPortConnector.relay",
                            args: ["{that}", "{arguments}.0", "{youme.multiPortConnector.inputs}", "onNoteOff"] // midiMessage, portConnector, eventName
                        },
                        "onNoteOn.relay": {
                            funcName: "lsu.remappingMultiPortConnector.relay",
                            args: ["{that}", "{arguments}.0", "{youme.multiPortConnector.inputs}", "onNoteOn"] // midiMessage, portConnector, eventName
                        },
                        "onPitchbend.relay": {
                            funcName: "lsu.remappingMultiPortConnector.relay",
                            args: ["{that}", "{arguments}.0", "{youme.multiPortConnector.inputs}", "onPitchbend"] // midiMessage, portConnector, eventName
                        }
                    }
                }
            }
        }
    });
})(fluid);
