/*
    Extensions of youme.connection to handle input and output across a range of devices.
*/
(function (fluid) {
    "use strict";
    var lsu = fluid.registerNamespace("lsu");

    // Mix-in base grade to add device type tracking.
    fluid.defaults("lsu.launchpadConnection", {
        gradeNames: ["fluid.modelComponent"],

        model: {
            deviceType: "unknown"
        },

        modelListeners: {
            port: {
                funcName: "lsu.launchpadConnection.setDeviceType",
                args: ["{that}"]
            }
        }
    });

    // TODO: Make this a transforming model relay.
    lsu.launchpadConnection.setDeviceType = function (that) {
        var deviceType = "unknown";
        var deviceName = fluid.get(that, "model.port.name");
        if (typeof deviceName === "string") {
            if (deviceName.match(/^Launchpad$/)) {
                deviceType = "launchpad";
            }
            if (deviceName.match(/^Launchpad Pro MK3.+MIDI$/)) {
                deviceType = "launchpadPro3";
            }
            else if (deviceName.match(/^Launchpad Pro.+Standalone Port$/)) {
                deviceType = "launchpadPro";
            }
        }
        that.applier.change("deviceType", deviceType);
    };

    fluid.defaults("lsu.launchpadConnection.input", {
        gradeNames: ["youme.connection.input", "lsu.launchpadConnection", "fluid.modelComponent"],
        events: {
            onPadDown: null,
            onPadUp: null
        },

        model: {
            capoShift: 0
        },

        listeners: {
            "onNoteOn": {
                funcName: "lsu.launchpadConnection.input.relayPadMessage",
                args: ["{that}", "{arguments}.0"] // midiMessage
            },
            "onNoteOff": {
                funcName: "lsu.launchpadConnection.input.relayPadMessage",
                args: ["{that}", "{arguments}.0"] // midiMessage
            },
            "onControl": {
                funcName: "lsu.launchpadConnection.input.relayPadMessage",
                args: ["{that}", "{arguments}.0"] // midiMessage
            },
            "onAftertouch": {
                funcName: "lsu.launchpadConnection.input.relayPadMessage",
                args: ["{that}", "{arguments}.0"] // midiMessage
            }
        }
    });

    lsu.launchpadConnection.firstDefined = function (candidates) {
        var firstUndefined = fluid.find(candidates, function (candidate) {
            return candidate;
        });
        return firstUndefined;
    };

    lsu.launchpadConnection.input.relayPadMessage = function (that, midiMessage) {
        if (["launchpad", "launchpadPro", "launchpadPro3"].includes(that.model.deviceType) && (midiMessage.note !== undefined || midiMessage.number !== undefined) ) {
            var note = lsu.launchpadConnection.firstDefined([midiMessage.note, midiMessage.number]);
            var velocity = lsu.launchpadConnection.firstDefined([midiMessage.velocity, midiMessage.value, midiMessage.pressure]);
            var padMessage = { velocity: velocity };
            if (that.model.deviceType === "launchpad") {
                padMessage.row = (8 - Math.floor(note / 16));
                padMessage.col = (note % 16) + 1;
            }
            // Assume it's a pro-like thing.
            else {
                padMessage.row = Math.floor(note / 10);
                padMessage.col = note % 10;
            }

            var eventName = velocity ? "onPadDown" : "onPadUp";

            that.events[eventName].fire(padMessage);
        }
    };

    fluid.defaults("lsu.launchpadConnection.output", {
        gradeNames: ["youme.connection.output", "lsu.launchpadConnection"]
    });

    fluid.defaults("lsu.uiOutputConnection", {
        gradeNames: ["lsu.launchpadConnection.output"],

        members: {
            launchpadActiveBuffer: 0
        },

        setupMessages: {
            // YouMe takes care of the framing bytes for these, so we can omit the leading bytes (`F0h`) and trailing
            // bytes (`00h` and `F7h`).
            launchpad: [
                // Insanely, the launchpad uses control messages on control 0 instead of sysex.

                // Set the launchpad to the "X-Y Layout"
                // B0h 00h 01h
                { type: "control", channel: 0, number: 0, value: 1},

                // Set the active buffer to the default (0),
                // BOh, 00h, 20-3Dh
                { type: "control", channel: 0, number: 0, value: "@expand:lsu.uiOutputConnection.getBufferByte({that}.launchpadActiveBuffer)"}
            ],
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

        rgbModeHeaders: {
            launchpadPro: [
                // common header (for Launchpad Pro)
                0, 0x20, 0x29, 0x02, 0x10,
                // "RGB Grid Sysex" command
                0xF,
                // 0: all pads, 1: square drum pads only.  We use "all pads" to match the behaviour of the pro MK3.
                0
            ],
            launchpadPro3: [
                // common header (for Launchpad Pro 3)
                0, 0x20, 0x29, 0x02, 0xe,
                // RGB Mode on the Pro 3
                0x3
            ]
        },

        model: {
            gridColours: "@expand:lsu.generateDefaultColourMap()"
        },

        modelListeners: {
            colourScheme: {
                funcName: "lsu.uiOutputConnection.paintBadge",
                args: ["{that}"]
            },
            gridColours: {
                funcName: "lsu.uiOutputConnection.paintDevice",
                args: ["{that}"]
            }
        },

        listeners: {
            "onPortOpen.setupDevice": {
                funcName: "lsu.uiOutputConnection.setupDevice",
                args:     ["{that}"]
            },
            // We have to do this after setup, which clears the side light on the Pro.
            "onPortOpen.paintBadge": {
                priority: "after:setupDevice",
                funcName: "lsu.uiOutputConnection.paintBadge",
                args: ["{that}"]
            }
        }
    });

    lsu.uiOutputConnection.getBufferByte = function (activeBuffer) {
        // From the Launchpad programmer's reference:
        // Bit Name    Meaning
        // 6   -        Must be 0.
        // 5   -        Must be 1.
        // 4   Copy     If set to 1, copy the 'displayed' buffer to the 'updating' buffer.
        // 3   Flash    If set to 1, continuously flip buffers to make LEDs flash.
        // 2   Update   Set buffer 0 or 1 as the 'updating' buffer.
        // 1   -        Must be 0.
        // 0   Display  Set buffer 0 or 1 as the new displaying' buffer.
        //
        // (Also from the manual)
        // Data = (4 x Update (bit 2)) + Display (bit 0) + 0x20 (bit 5) + Flags
        //
        // Our flags flip the Update and Display buffers without copying.

        // activeBuffer: 1 = bit 0 (1), 0 = bit 2 (4)
        var flags = activeBuffer ? 1 : 4;
        var bufferByte = 0x20 + flags;
        return bufferByte;
    };

    lsu.uiOutputConnection.setupDevice = function (that) {
        var sysexPayload = fluid.get(that, ["options", "setupMessages", that.model.deviceType]);
        fluid.each(sysexPayload, function (sysexMessage) {
            that.events.sendMessage.fire(sysexMessage);
        });
    };

    lsu.uiOutputConnection.paintDevice = function (that) {
        switch (that.model.deviceType) {
            case "launchpad":
                var repaintMessages = lsu.uiOutputConnection.generateMK1RepaintMessages(that);
                fluid.each(repaintMessages, that.events.sendMessage.fire);

                // Update the active buffer so we switch next time.
                that.launchpadActiveBuffer = (that.launchpadActiveBuffer + 1) % 2;
                break;
            case "launchpadPro":
            case "launchpadPro3":
                var rgbModeHeaders = fluid.get(that, ["options", "rgbModeHeaders", that.model.deviceType]);
                if (rgbModeHeaders) {
                    var colourArray = lsu.uiOutputConnection.generateProColourArray(that);
                    var sysexData = rgbModeHeaders.concat(colourArray);
                    that.events.sendMessage.fire({type: "sysex", data: sysexData});
                }
                break;
            default:
                break;
        }
    };

    lsu.uiOutputConnection.paintBadge = function (that) {
        if (that.model.deviceType === "launchpadPro") {
            // Paint the "side velocity" (Pro) or "badge button" (Pro MK3) (0x63) a colour that matches the colour scheme.
            // Pro: F0h 00h 20h 29h 02h 10h 0Ah <velocity> <Colour> F7h
            // MK3: F0h 00h 20h 29h 02h 10h 0Ah <velocity> <Colour> F7h
            that.events.sendMessage.fire({ type: "sysex", data: [0, 0x20, 0x29, 0x02, 0x10, 0xA, 0x63, that.model.colourScheme.velocity]});
        }
        else if (that.model.deviceType === "launchpadPro3") {
            that.events.sendMessage.fire({ type: "noteOn", channel: 0, note: 0x63, velocity: that.model.colourScheme.velocity});
        }
    };

    lsu.uiOutputConnection.generateProColourArray = function (that) {
        var maxSaturation = that.model.deviceType === "launchpadPro3" ? 127 : 63;
        var colourArray = [];

        for (var row = 0; row < 10; row++) {
            for (var column = 0; column < 10; column++) {
                var cellNumber = (row * 10) + column;

                if (that.model.deviceType === "launchpadPro3") {
                    // Solid
                    colourArray.push(3);
                    // Our note index
                    colourArray.push(cellNumber);
                }

                var cell = that.model.gridColours[row][column];

                var rValue = fluid.get(cell, "r") || 0;
                colourArray.push(Math.round(rValue * maxSaturation));

                var gValue = fluid.get(cell, "g") || 0;
                colourArray.push(Math.round(gValue * maxSaturation));

                var bValue = fluid.get(cell, "b") || 0;
                colourArray.push(Math.round(bValue * maxSaturation));
            }
        }

        return colourArray;
    };

    lsu.uiOutputConnection.generateMK1RepaintMessages = function (that) {
        var messages = [];

        var colourArray = [];

        // Generate the array of colours we will convert to messages below.
        // The Launchpad MK1 paints from left to right, top to bottom.
        for (var row = 9; row > 0; row--) {
            for (var column = 1; column < 10; column++) {
                // The top row has one less pad, and we have to explicitly skip it.
                if (column !== 9 && row !== 9) {
                    var cellColourDef = fluid.get(that, ["model", "gridColours", row, column]);

                    // Each colour supports 0-3, where 0 is off and 3 is full brightness.
                    var rValue = Math.round((fluid.get(cellColourDef, "r") || 0) * 3);
                    var gValue = Math.round((fluid.get(cellColourDef, "g") || 0) * 3);

                    // From the Launchpad programmer's references, velocity = (10h x green) + red + flags.
                    // Flags can be 12 (normal use), 8 (flashing, nope), 0 (double-buffering)
                    var cellVelocity = (0x10 * gValue) + rValue + 12;
                    colourArray.push(cellVelocity);
                }
            }
        }

        // "Rapid LED" mode uses noteOn messages to channel 3 (actually channel 2, the third from 0, 1, 2) to paint two
        // pads at a time, one with the note value, one with the velocity.
        for (var index = 0; index < (colourArray.length - 1); index += 2) {
            var note = colourArray[index];
            var velocity = colourArray[index + 1];
            messages.push({ type: "noteOn", channel: 2, note: note, velocity: velocity});
        }

        // The manual says to send a "standard" message (80h, 90h, or B0h) to indicate that we're done with the
        // launchpad's rapid LED update mode, which the buffer switch message should accomplish.

        // Switch buffers to display our updates.
        var bufferByte = lsu.uiOutputConnection.getBufferByte(that.launchpadActiveBuffer);
        messages.push({
            type: "control",
            channel: 0,
            number: 0,
            value: bufferByte
        });

        return messages;
    };

    fluid.defaults("lsu.launchpadConnection.input.withCapo", {
        gradeNames: ["lsu.launchpadConnection.input"],
        // In the "guitarE" tunings, whose range is 40-89 by default, may need to be adjusted for other tunings.
        maxCapoShift: 36,

        listeners: {
            "onPadDown.updateCapo": {
                funcName: "lsu.launchpadConnection.input.withCapo.updateCapo",
                args: ["{that}", "{arguments}.0"]
            }
        }
    });

    lsu.launchpadConnection.input.withCapo.updateCapo = function (that, padMessage) {
        if (padMessage.row === 9) {
            var updatedCapoShift = that.model.capoShift;
            switch (padMessage.col) {
                // Up Arrow on the Launchpad and Pro, left on the Pro MK3
                case 1:
                    if (that.model.capoShift + 12 <= that.options.maxCapoShift) {
                        updatedCapoShift += 12;
                    }
                    break;
                // Down Arrow on the Launchpad and Pro, right on the Pro MK3
                case 2:
                    if (that.model.capoShift - 12 >= (that.options.maxCapoShift * -1)) {
                        updatedCapoShift -= 12;
                    }
                    break;
                // Left Arrow on the Launchpad and Pro, "Session" on the Pro MK3
                case 3:
                    if (that.model.capoShift - 1 >= (that.options.maxCapoShift * -1)) {
                        updatedCapoShift--;
                    }
                    break;
                // Right Arrow on the Launchpad and Pro, "Note" on the Pro MK3
                case 4:
                    if (that.model.capoShift + 1 <= that.options.maxCapoShift) {
                        updatedCapoShift++;
                    }
                    break;
                default:
                    break;
            }
            that.applier.change("capoShift", updatedCapoShift);
        }
    };
})(fluid);
