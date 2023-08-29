// This if enables following code to be tree-shaken away when not using the development server
if (import.meta.hot) {
    Hooks.on("hotReload", (data) => {
        if (data.packageId !== "outerheaven") return;

        // Intercept handlebars hot reloads to make partials available with shorthand name
        if (data.extension === "hbs") {
            const { content, path } = data;
            const compiled = Handlebars.compile(content);
            Handlebars.registerPartial(path, compiled);
            Handlebars.registerPartial(`oh.${path.split("/").pop().replace(".hbs", "")}`, compiled);
            _templateCache[path] = compiled;
            console.log(`OUTER HEAVEN | Compiled template ${path}`);

            // Rerender opened applications to make use of updated templates
            for (const appId in ui.windows) {
                ui.windows[Number(appId)].render();
            }

            return false;
        }
    });

    import.meta.hot.on("vite:beforeFullReload", () => {
        // HACK: Prevent _all_ full-reloading by throwing in callback if reloads are disabled
        if (import.meta.env.VITE_NO_RELOAD) {
            throw "Reload prevented, VITE_NO_RELOAD is set";
        }
    });
}
