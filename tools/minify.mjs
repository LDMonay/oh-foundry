import { minify } from "terser";

/**
 * This plugin forces ESM minification in the `renderChunk` hook for ES module files.
 * @returns {import("vite").Plugin}
 */
export function forceMinifyEsm() {
    return {
        name: "forceMinifyEsm",
        renderChunk: {
            order: "post",
            async handler(code, chunk, outputOptions) {
                if (outputOptions.format === "es" && chunk.fileName.endsWith(".mjs")) {
                    return await minify(code, {
                        keep_classnames: true,
                        ecma: 2020,
                        module: true,
                        compress: { unsafe: true },
                        sourceMap: { content: chunk.map },
                    });
                }
                return { code, map: chunk.map };
            },
        },
    };
}
