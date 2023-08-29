import * as Vite from "vite";
import fs from "fs-extra";
import path from "node:path";

/** @type {() => Vite.Plugin} */
export default function hotReload() {
    /** @type {Vite.ResolvedConfig} */
    let config;

    return {
        name: "hot-reload",
        configResolved(resolvedConfig) {
            config = resolvedConfig;
        },
        handleHotUpdate(context) {
            if (!context.server) return;

            const filePath = path.relative(config.publicDir, context.file);

            // Ignore changes to files in the dist folder
            if (filePath.startsWith("../dist")) return;

            if (filePath.endsWith(".hbs") || filePath.endsWith(".json")) {
                console.log(`Copying ${context.file} to dist/${filePath}`);
                fs.promises.copyFile(context.file, `dist/${filePath}`);
            }
        },
    };
}
