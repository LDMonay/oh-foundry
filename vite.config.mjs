import fs from "node:fs";
import * as Vite from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import hotReload from "./tools/hot-reload.mjs";
import { forceMinifyEsm } from "./tools/minify.mjs";

const config = Vite.defineConfig(({ command, mode }) => {
    const env = Vite.loadEnv(mode, process.cwd());

    /**
     * Adds the configured route prefix from the env configuration to a string,
     * using `/` as a separator.
     *
     * @param {string} string - The string to prefix.
     * @returns {string} The prefixed string.
     */
    const withRoutePrefix = (string) => (env.VITE_ROUTE_PREFIX ? `${env.VITE_ROUTE_PREFIX}/${string}` : string);

    // Create files for vite dev server
    if (command === "serve") {
        const message = "This file is for a running vite dev server and is not copied to a build";
        fs.writeFileSync("./index.html", `<h1>${message}</h1>\n`);
        fs.writeFileSync("./outerheaven.css", `/* ${message} */\n`);
    }

    return {
        base: command === "build" ? "./" : `/${withRoutePrefix("systems/outerheaven")}`,
        publicDir: "static",
        server: {
            port: 30_001,
            open: false,
            proxy: {
                [`^/(?!${withRoutePrefix("systems/outerheaven/")})`]: "http://localhost:30000/",
                [`/${withRoutePrefix("socket.io")}`]: {
                    target: "ws://localhost:30000",
                    ws: true,
                },
            },
        },
        plugins: [
            forceMinifyEsm(),
            viteStaticCopy({
                targets: [
                    { src: "LICENSE", dest: "." },
                    { src: "README.md", dest: "." },
                ],
            }),
            hotReload(),
        ],
        css: { devSourcemap: true },
        build: {
            outDir: "dist",
            emptyOutDir: false,
            minify: false,
            sourcemap: true,
            target: "es2022",
            lib: {
                name: "outerheaven",
                entry: "outerheaven.mjs",
                formats: ["es"],
                fileName: "outerheaven",
            },
            rollupOptions: {
                output: {
                    assetFileNames: ({ name }) => (name === "style.css" ? "outerheaven.css" : name),
                    entryFileNames: "outerheaven.mjs",
                    sourcemapPathTransform: (relative) => {
                        if (relative.startsWith("../")) return relative.replace("../", "");
                        return relative;
                    },
                },
            },
        },
    };
});

export default config;
