(function (fluid) {
    "use strict";
    var lsu = fluid.registerNamespace("lsu");

    lsu.generateDefaultColourMap = function () {
        var singleCellTemplate = { r: 0, g: 0, b: 0};
        var singleRowTemplate = fluid.generate(10, function () { return fluid.copy(singleCellTemplate); }, true);
        var rows = fluid.generate(10, function () { return fluid.copy(singleRowTemplate); }, true);
        return rows;
    };

    lsu.generateEmptyGrid = function (rows, cols) {
        var singleRow = fluid.generate(cols, 0);
        var allRows = fluid.generate(rows, function () {
            return fluid.copy(singleRow);
        }, true);
        return allRows;
    };

})(fluid);
