(function (fluid) {
    "use strict";
    var lsu = fluid.registerNamespace("lsu");

    // Required to work around issues using {sourcePath} with arrays.
    lsu.generateNumberKeyedMap = function (numEntries) {
        var map = {};
        for (var a = 0; a < numEntries; a++) {
            map[a] = 0;
        }
        return map;
    };
})(fluid);
