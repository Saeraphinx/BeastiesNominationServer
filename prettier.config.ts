import { type Config } from "prettier";

const config: Config = {
    trailingComma: `es5`,
    useTabs: false,
    tabWidth: 4,
    semi: true,
    printWidth: 256,
    plugins: ["prettier-plugin-svelte", "prettier-plugin-tailwindcss"],
    overrides: [
        {
            files: "*.svelte",
            options: {
                parser: "svelte",
                tabWidth: 2,
                useTabs: false,
            }
        }
    ],
    tailwindStylesheet: "./src/routes/layout.css",
};

export default config;
