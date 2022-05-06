(function (fluid) {
    "use strict";
    var lsu = fluid.registerNamespace("lsu");

    fluid.defaults("lsu.templateRenderer", {
        gradeNames: ["fluid.containerRenderingView"],
        markup: {
            container: ""
        },
        model: {},
        invokers: {
            renderMarkup: {
                funcName: "lsu.templateRenderer.render",
                args: ["{that}", "{that}.options.markup.container", "{that}.model"]
            }
        }
    });

    lsu.templateRenderer.render = function (that, markupTemplate, model) {
        var renderedContent = fluid.stringTemplate(markupTemplate, model);
        return renderedContent;
    };
})(fluid);
