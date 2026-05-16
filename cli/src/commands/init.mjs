/**
 * initialization command
 */

import { Command } from "commander";

import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import prompts from "prompts";
import chalk from "chalk";
import { createRequire } from "module";

import { log } from "../cli_util.mjs";

const initCommand = new Command("init").description("Initialize the project").action(async () => {
    function getPackageManager(root) {
        if (fs.existsSync(path.join(root, "yarn.lock"))) return "yarn";
        if (fs.existsSync(path.join(root, "pnpm-lock.yaml"))) return "pnpm";
        return "npm";
    }

    function getInstallCommand(manager) {
        if (manager === "yarn") return "yarn add getsyntux";
        if (manager === "pnpm") return "pnpm add getsyntux";
        return "npm install getsyntux";
    }

    function createProjectRequire(root) {
        return createRequire(path.join(root, "package.json"));
    }

    function resolveCoreTemplate(root, name) {
        const projectRequire = createProjectRequire(root);
        return projectRequire.resolve(`getsyntux/templates/${name}`);
    }

    async function ensureResolvableCorePackage(root, packageManager) {
        try {
            resolveCoreTemplate(root, "spec.ts");
            resolveCoreTemplate(root, "spec.md");
            return;
        } catch {
            log("library is listed in package.json but is not installed in node_modules.");
        }

        const installCommand = getInstallCommand(packageManager);
        const response = await prompts({
            type: "select",
            name: "install",
            message: `Run ${installCommand}?`,
            choices: [{ title: "Yes" }, { title: "No" }],
        });

        if (response.install !== 0) {
            log("installation cancelled.");
            process.exit(0);
        }

        try {
            execSync(installCommand, { stdio: "inherit" });
            log("installed from " + chalk.green(packageManager) + " successfully.");
        } catch (error) {
            log("installation " + chalk.red("failed") + " from " + packageManager + ".");
            process.exit(1);
        }
    }

    /**
     * verifying
     */

    const userRoot = process.cwd();
    const packageJsonPath = path.join(userRoot, "package.json");

    if (!fs.existsSync(packageJsonPath)) {
        log(chalk.red("Failed to find package.json. Run this command from your project root."));
        process.exit(1);
    }

    /**
     * installing
     */

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
    };
    const packageManager = getPackageManager(userRoot);

    if (allDeps["getsyntux"]) {
        log("library has already been installed. Continuing...");
    } else {
        log("library not detected in package.json. Please install to continue...");
        const command = getInstallCommand(packageManager);
        const response = await prompts({
            type: "select",
            name: "install",
            message: `Run ${command}?`,
            choices: [{ title: "Yes" }, { title: "No" }],
        });

        if (response.install !== 0) {
            log("installation cancelled.");
            process.exit(0);
        }

        try {
            execSync(command, { stdio: "inherit" });
            log("installed from " + chalk.green(packageManager) + " successfully.");
        } catch (error) {
            log("installation " + chalk.red("failed") + " from " + packageManager + ".");
            process.exit(1);
        }
    }

    await ensureResolvableCorePackage(userRoot, packageManager);

    /**
     * copying
     */

    const targetDir = path.resolve(process.cwd(), "lib/getsyntux");
    const templates = [
        { source: resolveCoreTemplate(userRoot, "spec.ts"), target: path.join(targetDir, "spec.ts") },
        { source: resolveCoreTemplate(userRoot, "spec.md"), target: path.join(targetDir, "spec.md") },
    ];

    log("generating files...");

    if (fs.existsSync(targetDir)) {
        const files = fs.readdirSync(targetDir);
        if (files.length > 0) {
            log("target directory lib/getsyntux already contains files.");
            const response = await prompts({
                type: "select",
                name: "copy",
                message: "Empty directory?",
                choices: [{ title: "Yes" }, { title: "No" }],
            });

            if (response.copy !== 0) {
                log("installation cancelled.");
                process.exit(0);
            }

            fs.emptyDirSync(targetDir);
        }
    }

    fs.ensureDirSync(targetDir);
    for (const template of templates) {
        fs.copyFileSync(template.source, template.target);
    }

    log(chalk.green("installation complete."));
});

export default initCommand;
