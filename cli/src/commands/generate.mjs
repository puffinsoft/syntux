/**
 * schema generation command
*/
import { Command } from "commander";

import path from "path";
import { withCustomConfig } from "react-docgen-typescript";

import prompts from "prompts";
import chalk from "chalk";
import fs from "fs-extra";

import { log } from "../cli_util.mjs";

const generateDefsCommand = new Command("generate-defs").description("Generate a definition for a component")
    .argument("<path>", "path to component file")
    .action(async (rawPath) => {
        const userRoot = process.cwd();
        const tsConfigPath = path.join(userRoot, "tsconfig.json");

        const parser = withCustomConfig(tsConfigPath, {
            shouldExtractLiteralValuesFromEnum: true,
        });

        const filePath = path.resolve(rawPath);

        if (!fs.existsSync(filePath)) {
            log("file [" + filePath + "] " + chalk.red("not found."));
            process.exit(1);
        }

        log("parsing file...");
        const docs = parser.parse(filePath);

        if (docs.length == 0) {
            log("there are no components with props in that file. Stopping now.");
            process.exit(0);
        }

        log(`found ${docs.length} component(s) with prop definitions [${docs.map(e => e.displayName).join(", ")}]`);

        function generatePropSignature(props) {
            const signature = Object.entries(props).map(([key, value]) => {
                return `${key}${value.required ? "" : "?"}: ${value.type.name}`;
            }).join(", ");

            if (!signature) return "{}"; // usually for class components
            return "{ " + signature + " }";
        }

        const userContexts = [];

        let index = 0;
        for (const component of docs) {
            log(chalk.bold(`component #${index + 1}`) + ": " + component.displayName);
            const response = await prompts({
                type: "text",
                name: "userContext",
                message: "What does this component do? (optional)"
            });

            userContexts.push(response.userContext.replaceAll("\"", "\\\""));
            index++;
        }

        function generateSignature(component, props, userContext) {
            if (!userContext) {
                return `{ name: "${component.displayName}", props: "${props}", component: ${component.displayName} }`;
            } else {
                return `{ name: "${component.displayName}", props: "${props}", component: ${component.displayName}, context: "${userContext}" }`;
            }
        }

        console.log();
        log("generated definitions (safe to copy & paste directly):");
        docs.forEach((component, index) => {
            const props = generatePropSignature(component.props);
            console.log(generateSignature(component, props, userContexts[index]) + ", ");
        });
    });

export default generateDefsCommand;
