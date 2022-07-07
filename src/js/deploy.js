// TODO: Discuss reconciling this with the docpad and fluid-sandbox approaches and generalising for reuse.
/* eslint-env node */
"use strict";
var fluid = require("infusion");
fluid.setLogging(true);

var lsu = fluid.registerNamespace("lsu");

var path = require("path");

var copy = require("recursive-copy");
var fs = require("fs");
var mkdirp = require("mkdirp");
var rimraf = require("rimraf");

fluid.registerNamespace("lsu.generator");

lsu.generator.makeBundle = function (that) {
    var resolvedBasePath = fluid.module.resolvePath(that.options.baseDir);
    var promises = [];

    if (fs.existsSync(that.options.targetDir)) {
        promises.push(function () {
            var existingDirCleanPromise = fluid.promise();
            rimraf(that.options.targetDir, function (error) {
                if (error) {
                    existingDirCleanPromise.reject(error);
                }
                else {
                    existingDirCleanPromise.resolve();
                }
            });

            return existingDirCleanPromise;
        });
    }

    promises.push(function () {
        var dirCreationPromise = fluid.promise();
        var mkdirpPromise = mkdirp(that.options.targetDir);
        mkdirpPromise.then(dirCreationPromise.resolve, dirCreationPromise.reject);
        return dirCreationPromise;
    });

    fluid.each(fluid.makeArray(that.options.bundle), function (singleItemPath) {
        var itemSrcPath = path.resolve(resolvedBasePath, singleItemPath);
        var itemDestPath = path.resolve(that.options.targetDir, singleItemPath);

        // Return a promise-returning function so that only one call will be in flight at a time.
        promises.push(function () {
            return copy(itemSrcPath, itemDestPath);
        });
    });

    var sequence = fluid.promise.sequence(promises);

    sequence.then(
        function () { fluid.log("Finished, output saved to '", that.options.targetDir, "'..."); },
        fluid.fail
    );

    return sequence;
};

fluid.defaults("lsu.generator", {
    gradeNames: ["fluid.component"],
    baseDir: "%launchpad-sonamatic-universe",
    targetDir: "/Users/duhrer/Source/projects/duhrer.github.io/demos/launchpad-sonamatic-universe",
    bundle: [
        "./index.html",
        "./src",

        "./node_modules/youme/src/js/core.js",
        "./node_modules/youme/src/js/system.js",
        "./node_modules/youme/src/js/messageEventHolders.js",
        "./node_modules/youme/src/js/connection.js",
        "./node_modules/youme/src/js/multiPortConnector.js",
        "./node_modules/youme/src/js/ui/templateRenderer.js",
        "./node_modules/youme/src/js/ui/multiSelectBox.js",
        "./node_modules/youme/src/js/ui/multiPortSelectorView.js",
        "./node_modules/youme/src/css/youme.css",

        "./node_modules/bergson/dist/bergson-only.js",

        "./node_modules/infusion/dist/infusion-all.js",
        "./node_modules/tone/build/Tone.js"
    ],
    listeners: {
        "onCreate.createBundle": {
            funcName: "lsu.generator.makeBundle",
            args:     ["{that}"]
        }
    }
});

lsu.generator();
