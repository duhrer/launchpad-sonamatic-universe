(function (fluid) {
    "use strict";
    var lsu = fluid.registerNamespace("lsu");

    fluid.registerNamespace("lsu.rowDefs");

    /*
        Each cell definition should look something like:
            type: "{source}.type", // lsu.pad.note, lsu.pad.blank, lsu.pad.control
            col: "{source}.col",
            row: "{source}.row",
            note: "{source}.note",
            control: "{source}.control",
     */

    lsu.rowDefs.launchpadPro = [[
        { type: "lsu.pad.blank", col: 0, row: 0},
        {type: "lsu.pad.control", col: 1, row: 0, control: 91},
        {type: "lsu.pad.control", col: 2, row: 0, control: 92},
        {type: "lsu.pad.control", col: 3, row: 0, control: 93},
        {type: "lsu.pad.control", col: 4, row: 0, control: 94},
        {type: "lsu.pad.control", col: 5, row: 0, control: 95},
        {type: "lsu.pad.control", col: 6, row: 0, control: 96},
        {type: "lsu.pad.control", col: 7, row: 0, control: 97},
        {type: "lsu.pad.control", col: 8, row: 0, control: 98},
        {type: "lsu.pad.blank", col: 9, row: 0}
    ],

    [
        {type: "lsu.pad.control", col: 0, row: 1, control: 80},
        {type: "lsu.pad.note", col: 1, row: 1, note: 81},
        {type: "lsu.pad.note", col: 2, row: 1, note: 82},
        {type: "lsu.pad.note", col: 3, row: 1, note: 83},
        {type: "lsu.pad.note", col: 4, row: 1, note: 84},
        {type: "lsu.pad.note", col: 5, row: 1, note: 85},
        {type: "lsu.pad.note", col: 6, row: 1, note: 86},
        {type: "lsu.pad.note", col: 7, row: 1, note: 87},
        {type: "lsu.pad.note", col: 8, row: 1, note: 88},
        {type: "lsu.pad.control", col: 9, row: 1, control: 89}
    ],

    [
        {type: "lsu.pad.control", col: 0, row: 2, control: 70},
        {type: "lsu.pad.note", col: 1, row: 2, note: 71},
        {type: "lsu.pad.note", col: 2, row: 2, note: 72},
        {type: "lsu.pad.note", col: 3, row: 2, note: 73},
        {type: "lsu.pad.note", col: 4, row: 2, note: 74},
        {type: "lsu.pad.note", col: 5, row: 2, note: 75},
        {type: "lsu.pad.note", col: 6, row: 2, note: 76},
        {type: "lsu.pad.note", col: 7, row: 2, note: 77},
        {type: "lsu.pad.note", col: 8, row: 2, note: 78},
        {type: "lsu.pad.control", col: 9, row: 2, control: 79}
    ],

    [
        {type: "lsu.pad.control", col: 0, row: 3, control: 60},
        {type: "lsu.pad.note", col: 1, row: 3, note: 61},
        {type: "lsu.pad.note", col: 2, row: 3, note: 62},
        {type: "lsu.pad.note", col: 3, row: 3, note: 63},
        {type: "lsu.pad.note", col: 4, row: 3, note: 64},
        {type: "lsu.pad.note", col: 5, row: 3, note: 65},
        {type: "lsu.pad.note", col: 6, row: 3, note: 66},
        {type: "lsu.pad.note", col: 7, row: 3, note: 67},
        {type: "lsu.pad.note", col: 8, row: 3, note: 68},
        {type: "lsu.pad.control", col: 9, row: 3, control: 69}
    ],

    [
        {type: "lsu.pad.control", col: 0, row: 4, control: 50},
        {type: "lsu.pad.note", col: 1, row: 4, note: 51},
        {type: "lsu.pad.note", col: 2, row: 4, note: 52},
        {type: "lsu.pad.note", col: 3, row: 4, note: 53},
        {type: "lsu.pad.note", col: 4, row: 4, note: 54},
        {type: "lsu.pad.note", col: 5, row: 4, note: 55},
        {type: "lsu.pad.note", col: 6, row: 4, note: 56},
        {type: "lsu.pad.note", col: 7, row: 4, note: 57},
        {type: "lsu.pad.note", col: 8, row: 4, note: 58},
        {type: "lsu.pad.control", col: 9, row: 4, control: 59}
    ],

    [
        {type: "lsu.pad.control", col: 0, row: 5, control: 40},
        {type: "lsu.pad.note", col: 1, row: 5, note: 41},
        {type: "lsu.pad.note", col: 2, row: 5, note: 42},
        {type: "lsu.pad.note", col: 3, row: 5, note: 43},
        {type: "lsu.pad.note", col: 4, row: 5, note: 44},
        {type: "lsu.pad.note", col: 5, row: 5, note: 45},
        {type: "lsu.pad.note", col: 6, row: 5, note: 46},
        {type: "lsu.pad.note", col: 7, row: 5, note: 47},
        {type: "lsu.pad.note", col: 8, row: 5, note: 48},
        {type: "lsu.pad.control", col: 9, row: 5, control: 49}
    ],

    [
        {type: "lsu.pad.control", col: 0, row: 6, control: 30},
        {type: "lsu.pad.note", col: 1, row: 6, note: 31},
        {type: "lsu.pad.note", col: 2, row: 6, note: 32},
        {type: "lsu.pad.note", col: 3, row: 6, note: 33},
        {type: "lsu.pad.note", col: 4, row: 6, note: 34},
        {type: "lsu.pad.note", col: 5, row: 6, note: 35},
        {type: "lsu.pad.note", col: 6, row: 6, note: 36},
        {type: "lsu.pad.note", col: 7, row: 6, note: 37},
        {type: "lsu.pad.note", col: 8, row: 6, note: 38},
        {type: "lsu.pad.control", col: 9, row: 6, control: 39}
    ],

    [
        {type: "lsu.pad.control", col: 0, row: 7, control: 20},
        {type: "lsu.pad.note", col: 1, row: 7, note: 21},
        {type: "lsu.pad.note", col: 2, row: 7, note: 22},
        {type: "lsu.pad.note", col: 3, row: 7, note: 23},
        {type: "lsu.pad.note", col: 4, row: 7, note: 24},
        {type: "lsu.pad.note", col: 5, row: 7, note: 25},
        {type: "lsu.pad.note", col: 6, row: 7, note: 26},
        {type: "lsu.pad.note", col: 7, row: 7, note: 27},
        {type: "lsu.pad.note", col: 8, row: 7, note: 28},
        {type: "lsu.pad.control", col: 9, row: 7, control: 29}
    ],

    [
        {type: "lsu.pad.control", col: 0, row: 8, control: 10},
        {type: "lsu.pad.note", col: 1, row: 8, note: 11},
        {type: "lsu.pad.note", col: 2, row: 8, note: 12},
        {type: "lsu.pad.note", col: 3, row: 8, note: 13},
        {type: "lsu.pad.note", col: 4, row: 8, note: 14},
        {type: "lsu.pad.note", col: 5, row: 8, note: 15},
        {type: "lsu.pad.note", col: 6, row: 8, note: 16},
        {type: "lsu.pad.note", col: 7, row: 8, note: 17},
        {type: "lsu.pad.note", col: 8, row: 8, note: 18},
        {type: "lsu.pad.control", col: 9, row: 8, control: 19}
    ],

    [
        {type: "lsu.pad.blank", col: 0, row: 9},
        {type: "lsu.pad.control", col: 1, row: 9, control: 1},
        {type: "lsu.pad.control", col: 2, row: 9, control: 2},
        {type: "lsu.pad.control", col: 3, row: 9, control: 3},
        {type: "lsu.pad.control", col: 4, row: 9, control: 4},
        {type: "lsu.pad.control", col: 5, row: 9, control: 5},
        {type: "lsu.pad.control", col: 6, row: 9, control: 6},
        {type: "lsu.pad.control", col: 7, row: 9, control: 7},
        {type: "lsu.pad.control", col: 8, row: 9, control: 8},
        {type: "lsu.pad.blank", col: 9, row: 9}
    ]];
})(fluid);
