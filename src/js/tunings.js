(function (fluid) {
    "use strict";
    var lsu = fluid.registerNamespace("lsu");

    fluid.registerNamespace("lsu.tunings");

    /*
        The Launchpad Pro (and Pro MK3) have a "programmer" mode and layout.  The rules in the
        `lsu.tunings.launchpadPro` namespace work for both.
     */
    fluid.registerNamespace("lsu.tunings.launchpadPro");

    // TODO: Remove transforms after next commit.
    /*
        the Launchpad Pro's "programmer" tuning to a guitar-like "E" tuning, EADGBE(AD) where:

        1. "low E" (10c) is E3
        2. The first notes in each row are the "open" string.
        3. The 7th and 8th strings repeat the tuning from E, an octave higher.

        10c 11 12 13 14 15 16 17 18 19c        =>        52 53 54 55 56 57 58 59 60 61
        20c 21 22 23 24 25 26 27 28 29c        =>        57 58 59 60 61 62 63 64 65 66
        30c 31 32 33 34 35 36 37 38 39c        =>        62 63 64 65 66 67 68 69 70 71
        40c 41 42 43 44 45 46 47 48 49c        =>        67 68 69 70 71 72 73 74 75 76
        50c 51 52 53 54 55 56 57 58 59c        =>        71 72 73 74 75 76 77 78 79 80
        60c 61 62 63 64 65 66 67 68 69c        =>        76 77 78 79 80 81 82 83 84 85
        70c 71 72 73 74 75 76 77 78 79c        =>        81 82 83 84 85 86 87 88 89 90
        80c 81 82 83 84 85 86 87 88 89c        =>        86 87 88 89 90 91 92 93 94 95

        TODO: Support for tunings other than E, i.e. Drop D or the like.
     */
    // lsu.tunings.launchpadPro.guitarE = {
    //     note: {
    //         "": "",
    //         "note": {
    //             transform: {
    //                 type: "fluid.transforms.valueMapper",
    //                 defaultInputPath: "note",
    //                 match: [
    //                     // TODO: Correct tuning down an octave.
    //                     // Low "E"
    //                     // 10c 11 12 13 14 15 16 17 18 19c => 52 53 54 55 56 57 58 59 60 61
    //                     { inputValue: 11, outputValue: 41 },
    //                     { inputValue: 12, outputValue: 42 },
    //                     { inputValue: 13, outputValue: 43 },
    //                     { inputValue: 14, outputValue: 44 },
    //                     { inputValue: 15, outputValue: 45 },
    //                     { inputValue: 16, outputValue: 46 },
    //                     { inputValue: 17, outputValue: 47 },
    //                     { inputValue: 18, outputValue: 48 },
    //                     // "A"
    //                     // 20c 21 22 23 24 25 26 27 28 29c => 57 58 59 60 61 62 63 64 65 66
    //                     { inputValue: 21, outputValue: 46 },
    //                     { inputValue: 22, outputValue: 47 },
    //                     { inputValue: 23, outputValue: 48 },
    //                     { inputValue: 24, outputValue: 49 },
    //                     { inputValue: 25, outputValue: 50 },
    //                     { inputValue: 26, outputValue: 51 },
    //                     { inputValue: 27, outputValue: 52 },
    //                     { inputValue: 28, outputValue: 53 },
    //                     // "D"
    //                     // 30c 31 32 33 34 35 36 37 38 39c => 62 63 64 65 66 67 68 69 70 71
    //                     { inputValue: 31, outputValue: 51 },
    //                     { inputValue: 32, outputValue: 52 },
    //                     { inputValue: 33, outputValue: 53 },
    //                     { inputValue: 34, outputValue: 54 },
    //                     { inputValue: 35, outputValue: 55 },
    //                     { inputValue: 36, outputValue: 56 },
    //                     { inputValue: 37, outputValue: 57 },
    //                     { inputValue: 38, outputValue: 58 },
    //                     // "G"
    //                     // 40c 41 42 43 44 45 46 47 48 49c => 67 68 69 70 71 72 73 74 75 76
    //                     { inputValue: 41, outputValue: 56 },
    //                     { inputValue: 42, outputValue: 57 },
    //                     { inputValue: 43, outputValue: 58 },
    //                     { inputValue: 44, outputValue: 59 },
    //                     { inputValue: 45, outputValue: 60 },
    //                     { inputValue: 46, outputValue: 61 },
    //                     { inputValue: 47, outputValue: 62 },
    //                     { inputValue: 48, outputValue: 63 },
    //                     // "B"
    //                     // 50c 51 52 53 54 55 56 57 58 59c => 71 72 73 74 75 76 77 78 79 80
    //                     { inputValue: 51, outputValue: 60 },
    //                     { inputValue: 52, outputValue: 61 },
    //                     { inputValue: 53, outputValue: 62 },
    //                     { inputValue: 54, outputValue: 63 },
    //                     { inputValue: 55, outputValue: 64 },
    //                     { inputValue: 56, outputValue: 65 },
    //                     { inputValue: 57, outputValue: 66 },
    //                     { inputValue: 58, outputValue: 67 },
    //                     // "High E"
    //                     // 60c 61 62 63 64 65 66 67 68 69c => 76 77 78 79 80 81 82 83 84 85
    //                     { inputValue: 61, outputValue: 65 },
    //                     { inputValue: 62, outputValue: 66 },
    //                     { inputValue: 63, outputValue: 67 },
    //                     { inputValue: 64, outputValue: 68 },
    //                     { inputValue: 65, outputValue: 69 },
    //                     { inputValue: 66, outputValue: 70 },
    //                     { inputValue: 67, outputValue: 71 },
    //                     { inputValue: 68, outputValue: 72 },
    //                     // "High A"
    //                     // 70c 71 72 73 74 75 76 77 78 79c => 81 82 83 84 85 86 87 88 89 90
    //                     { inputValue: 71, outputValue: 70 },
    //                     { inputValue: 72, outputValue: 71 },
    //                     { inputValue: 73, outputValue: 72 },
    //                     { inputValue: 74, outputValue: 73 },
    //                     { inputValue: 75, outputValue: 74 },
    //                     { inputValue: 76, outputValue: 75 },
    //                     { inputValue: 77, outputValue: 76 },
    //                     { inputValue: 78, outputValue: 77 },
    //                     // "High D"
    //                     // 80c 81 82 83 84 85 86 87 88 89c => 86 87 88 89 90 91 92 93 94 95
    //                     { inputValue: 81, outputValue: 75 },
    //                     { inputValue: 82, outputValue: 76 },
    //                     { inputValue: 83, outputValue: 77 },
    //                     { inputValue: 84, outputValue: 78 },
    //                     { inputValue: 85, outputValue: 79 },
    //                     { inputValue: 86, outputValue: 80 },
    //                     { inputValue: 87, outputValue: 81 },
    //                     { inputValue: 88, outputValue: 82 }
    //                 ]
    //             }
    //         }
    //     },
    //     // TODO: Filter out everything but 0th and 9th controls to notes.
    //     control: {
    //         "type": { literalValue: "noteOn" },
    //         "channel": "channel",
    //         "velocity": "value",
    //         "note": {
    //             transform: {
    //                 type: "fluid.transforms.valueMapper",
    //                 defaultInputPath: "number",
    //                 match: [
    //                     // TODO: Correct tuning down an octave.
    //
    //                     // Low "E"
    //                     // 10c 11 12 13 14 15 16 17 18 19c => 52 53 54 55 56 57 58 59 60 61
    //                     { inputValue: 10, outputValue: 40 },
    //                     { inputValue: 19, outputValue: 49 },
    //                     // "A"
    //                     // 20c 21 22 23 24 25 26 27 28 29c => 57 58 59 60 61 62 63 64 65 66
    //                     { inputValue: 20, outputValue: 45 },
    //                     { inputValue: 29, outputValue: 54 },
    //                     // "D"
    //                     // 30c 31 32 33 34 35 36 37 38 39c => 62 63 64 65 66 67 68 69 70 71
    //                     { inputValue: 30, outputValue: 50 },
    //                     { inputValue: 39, outputValue: 59 },
    //                     // "G"
    //                     // 40c 41 42 43 44 45 46 47 48 49c => 67 68 69 70 71 72 73 74 75 76
    //                     { inputValue: 40, outputValue: 55 },
    //                     { inputValue: 49, outputValue: 64 },
    //                     // "B"
    //                     // 50c 51 52 53 54 55 56 57 58 59c => 71 72 73 74 75 76 77 78 79 80
    //                     { inputValue: 50, outputValue: 59 },
    //                     { inputValue: 59, outputValue: 68 },
    //                     // "High E"
    //                     // 60c 61 62 63 64 65 66 67 68 69c => 76 77 78 79 80 81 82 83 84 85
    //                     { inputValue: 60, outputValue: 64 },
    //                     { inputValue: 69, outputValue: 73 },
    //                     // "High A"
    //                     // 70c 71 72 73 74 75 76 77 78 79c => 81 82 83 84 85 86 87 88 89 90
    //                     { inputValue: 70, outputValue: 69 },
    //                     { inputValue: 79, outputValue: 78 },
    //                     // "High D"
    //                     // 80c 81 82 83 84 85 86 87 88 89c => 86 87 88 89 90 91 92 93 94 95
    //                     { inputValue: 80, outputValue: 74 },
    //                     { inputValue: 89, outputValue: 83 }
    //                 ],
    //                 noMatch: {
    //                     outputValue: false
    //                 }
    //             }
    //         }
    //     }
    // };

    lsu.tunings.launchpadPro.guitarE = {
        note: {
            // Low "E"
            // 10c 11 12 13 14 15 16 17 18 19c => 52 53 54 55 56 57 58 59 60 61
            "11": 41, "12": 42, "13": 43, "14": 44, "15": 45, "16": 46, "17": 47, "18": 48,
            // "A"
            // 20c 21 22 23 24 25 26 27 28 29c => 57 58 59 60 61 62 63 64 65 66
            "21": 46, "22": 47, "23": 48, "24": 49, "25": 50, "26": 51, "27": 52, "28": 53,
            // "D"
            // 30c 31 32 33 34 35 36 37 38 39c => 62 63 64 65 66 67 68 69 70 71
            "31": 51, "32": 52, "33": 53, "34": 54, "35": 55, "36": 56, "37": 57, "38": 58,
            // "G"
            // 40c 41 42 43 44 45 46 47 48 49c => 67 68 69 70 71 72 73 74 75 76
            "41": 56, "42": 57, "43": 58, "44": 59, "45": 60, "46": 61, "47": 62, "48": 63,
            // "B"
            // 50c 51 52 53 54 55 56 57 58 59c => 71 72 73 74 75 76 77 78 79 80
            "51": 60, "52": 61, "53": 62, "54": 63, "55": 64, "56": 65, "57": 66, "58": 67,
            // "High E"
            // 60c 61 62 63 64 65 66 67 68 69c => 76 77 78 79 80 81 82 83 84 85
            "61": 65, "62": 66, "63": 67, "64": 68, "65": 69, "66": 70, "67": 71, "68": 72,
            // "High A"
            // 70c 71 72 73 74 75 76 77 78 79c => 81 82 83 84 85 86 87 88 89 90
            "71": 70, "72": 71, "73": 72, "74": 73, "75": 74, "76": 75, "77": 76, "78": 77,
            // "High D"
            // 80c 81 82 83 84 85 86 87 88 89c => 86 87 88 89 90 91 92 93 94 95
            "81": 75, "82": 76, "83": 77, "84": 78, "85": 79, "86": 80, "87": 81, "88": 82
        },
        control: {
            // Low "E"
            // 10c 11 12 13 14 15 16 17 18 19c => 52 53 54 55 56 57 58 59 60 61
            "10": 40, "19": 49,
            // "A"
            // 20c 21 22 23 24 25 26 27 28 29c => 57 58 59 60 61 62 63 64 65 66
            "20": 45, "29": 54,
            // "D"
            // 30c 31 32 33 34 35 36 37 38 39c => 62 63 64 65 66 67 68 69 70 71
            "30": 50, "39": 59,
            // "G"
            // 40c 41 42 43 44 45 46 47 48 49c => 67 68 69 70 71 72 73 74 75 76
            "40": 55, "49": 64,
            // "B"
            // 50c 51 52 53 54 55 56 57 58 59c => 71 72 73 74 75 76 77 78 79 80
            "50": 59, "59": 68,
            // "High E"
            // 60c 61 62 63 64 65 66 67 68 69c => 76 77 78 79 80 81 82 83 84 85
            "60": 64, "69": 73,
            // "High A"
            // 70c 71 72 73 74 75 76 77 78 79c => 81 82 83 84 85 86 87 88 89 90
            "70": 69, "79": 78,
            // "High D"
            // 80c 81 82 83 84 85 86 87 88 89c => 86 87 88 89 90 91 92 93 94 95
            "80": 74, "89": 83
        }
    };

    /*
        Tunings for the original MK1 launchpad (in X/Y mode) are registered in this namespace.
     */

    fluid.registerNamespace("lsu.tunings.launchpad");

    /*
        The Launchpad MK1 has an "X/Y layout", which these transforms tune to a guitar-like "E" tuning EADGBE(AD), where:

        1. "low E" (10c) is E3
        2. The first notes in each row are the "open" string.
        3. The 7th and 8th strings repeat the tuning from E, an octave higher.

        112 113 114 115 116 117 118 119 120   =>   52 53 54 55 56 57 58 59 60
         96  97  98  99 100 101 102 103 104   =>   57 58 59 60 61 62 63 64 65
         80  81  82  83  84  85  86  87  88   =>   62 63 64 65 66 67 68 69 70
         64  65  66  67  68  69  70  71  72   =>   67 68 69 70 71 72 73 74 75
         48  49  50  51  52  53  54  55  56   =>   71 72 73 74 75 76 77 78 79
         32  33  34  35  36  37  38  39  40   =>   76 77 78 79 80 81 82 83 84
         16  17  18  19  20  21  22  23  24   =>   81 82 83 84 85 86 87 88 89
          0   1   2   3   4   5   6   7   8   =>   86 87 88 89 90 91 92 93 94

     */

    // This is actually up by one step, the launchpad lacks the left-hand "strum" column (0).
    lsu.tunings.launchpad.guitarE = {
        note: {
            // Low "E"
            // 112 113 114 115 116 117 118 119 120 => 41 42 43 44 45 46 47 49
            "112": 41, "113": 42, "114": 43, "115": 44, "116": 45, "117": 46, "118": 47, "119": 48, "120": 49,

            // "A"
            // 96 97 98 99 100 101 102 103 104 => 46 47 48 49 50 51 52 53 54
            "96": 46, "97": 47, "98": 48, "99": 49, "100": 50, "101": 51, "102": 52, "103": 53, "104": 54,

            // "D"
            // 80 81 82 83 84 85 86 87 88 => 51 52 53 54 55 56 57 58 59
            "80": 51, "81": 52, "82": 53, "83": 54, "84": 55, "85": 56, "86": 57, "87": 58, "88": 59,

            // "G"
            // 64 65 66 67 68 69 70 71 72 => 56 57 58 59 60 61 62 63 64
            "64": 56, "65": 57, "66": 58, "67": 59, "68": 60, "69": 61, "70": 62, "71": 63, "72": 64,

            // "B"
            // 48 49 50 51 52 53 54 55 56 => 60 61 62 63 64 65 66 67 68
            "48": 60, "49": 61, "50": 62, "51": 63, "52": 64, "53": 65, "54": 66, "55": 67, "56": 68,

            // "High E"
            // 32 33 34 35 36 37 38 39 40 => 65 66 67 68 69 70 71 72 73
            "32": 65, "33": 66, "34": 67, "35": 68, "36": 69, "37": 70, "38": 71, "39": 72, "40": 73,

            // "High A"
            // 16 17 18 19 20 21 22 23 24 => 70 71 72 73 74 75 76 77 78
            "16": 70, "17": 71, "18": 72, "19": 73, "20": 74, "21": 75, "22": 76, "23": 77, "24": 78,

            // "High D"
            // 0 1 2 3 4 5 6 7 8 => 75 76 77 78 79 80 81 82 83
            "0": 75, "1": 76, "2": 77, "3": 78, "4": 79, "5": 80, "6": 81, "7": 82, "8": 83
        }
    };

    // // This is actually up by one step, the launchpad lacks the left-hand "strum" column (0).
    // lsu.tunings.launchpad.guitarE = {
    //     note: {
    //         "": "",
    //         "note": {
    //             transform: {
    //                 type: "fluid.transforms.valueMapper",
    //                 defaultInputPath: "note",
    //                 match: [
    //                     // Low "E"
    //                     // 112 113 114 115 116 117 118 119 120 => 41 42 43 44 45 46 47 49
    //                     {inputValue: 112, outputValue: 41},
    //                     {inputValue: 113, outputValue: 42},
    //                     {inputValue: 114, outputValue: 43},
    //                     {inputValue: 115, outputValue: 44},
    //                     {inputValue: 116, outputValue: 45},
    //                     {inputValue: 117, outputValue: 46},
    //                     {inputValue: 118, outputValue: 47},
    //                     {inputValue: 119, outputValue: 48},
    //                     {inputValue: 120, outputValue: 49},
    //
    //                     // "A"
    //                     // 96 97 98 99 100 101 102 103 104 => 46 47 48 49 50 51 52 53 54
    //                     {inputValue: 96,  outputValue: 46},
    //                     {inputValue: 97,  outputValue: 47},
    //                     {inputValue: 98,  outputValue: 48},
    //                     {inputValue: 99,  outputValue: 49},
    //                     {inputValue: 100, outputValue: 50},
    //                     {inputValue: 101, outputValue: 51},
    //                     {inputValue: 102, outputValue: 52},
    //                     {inputValue: 103, outputValue: 53},
    //                     {inputValue: 104, outputValue: 54},
    //
    //                     // "D"
    //                     // 80 81 82 83 84 85 86 87 88 => 51 52 53 54 55 56 57 58 59
    //                     {inputValue: 80, outputValue: 51},
    //                     {inputValue: 81, outputValue: 52},
    //                     {inputValue: 82, outputValue: 53},
    //                     {inputValue: 83, outputValue: 54},
    //                     {inputValue: 84, outputValue: 55},
    //                     {inputValue: 85, outputValue: 56},
    //                     {inputValue: 86, outputValue: 57},
    //                     {inputValue: 87, outputValue: 58},
    //                     {inputValue: 88, outputValue: 59},
    //
    //                     // "G"
    //                     // 64 65 66 67 68 69 70 71 72 => 56 57 58 59 60 61 62 63 64
    //                     {inputValue: 64, outputValue: 56},
    //                     {inputValue: 65, outputValue: 57},
    //                     {inputValue: 66, outputValue: 58},
    //                     {inputValue: 67, outputValue: 59},
    //                     {inputValue: 68, outputValue: 60},
    //                     {inputValue: 69, outputValue: 61},
    //                     {inputValue: 70, outputValue: 62},
    //                     {inputValue: 71, outputValue: 63},
    //                     {inputValue: 72, outputValue: 64},
    //
    //                     // "B"
    //                     // 48 49 50 51 52 53 54 55 56 => 60 61 62 63 64 65 66 67 68
    //                     {inputValue: 48, outputValue: 60},
    //                     {inputValue: 49, outputValue: 61},
    //                     {inputValue: 50, outputValue: 62},
    //                     {inputValue: 51, outputValue: 63},
    //                     {inputValue: 52, outputValue: 64},
    //                     {inputValue: 53, outputValue: 65},
    //                     {inputValue: 54, outputValue: 66},
    //                     {inputValue: 55, outputValue: 67},
    //                     {inputValue: 56, outputValue: 68},
    //
    //                     // "High E"
    //                     // 32 33 34 35 36 37 38 39 40 => 65 66 67 68 69 70 71 72 73
    //                     {inputValue: 32, outputValue: 65},
    //                     {inputValue: 33, outputValue: 66},
    //                     {inputValue: 34, outputValue: 67},
    //                     {inputValue: 35, outputValue: 68},
    //                     {inputValue: 36, outputValue: 69},
    //                     {inputValue: 37, outputValue: 70},
    //                     {inputValue: 38, outputValue: 71},
    //                     {inputValue: 39, outputValue: 72},
    //                     {inputValue: 40, outputValue: 73},
    //
    //                     // "High A"
    //                     // 16 17 18 19 20 21 22 23 24 => 70 71 72 73 74 75 76 77 78
    //                     {inputValue: 16, outputValue: 70},
    //                     {inputValue: 17, outputValue: 71},
    //                     {inputValue: 18, outputValue: 72},
    //                     {inputValue: 19, outputValue: 73},
    //                     {inputValue: 20, outputValue: 74},
    //                     {inputValue: 21, outputValue: 75},
    //                     {inputValue: 22, outputValue: 76},
    //                     {inputValue: 23, outputValue: 77},
    //                     {inputValue: 24, outputValue: 78},
    //
    //                     // "High D"
    //                     // 0 1 2 3 4 5 6 7 8 => 75 76 77 78 79 80 81 82 83
    //                     {inputValue: 0, outputValue: 75},
    //                     {inputValue: 1, outputValue: 76},
    //                     {inputValue: 2, outputValue: 77},
    //                     {inputValue: 3, outputValue: 78},
    //                     {inputValue: 4, outputValue: 79},
    //                     {inputValue: 5, outputValue: 80},
    //                     {inputValue: 6, outputValue: 81},
    //                     {inputValue: 7, outputValue: 82},
    //                     {inputValue: 8, outputValue: 83}
    //                 ]
    //             }
    //         }
    //     }
    // };
})(fluid);
