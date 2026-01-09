/**
 * initialization command
 */

import { Command } from "commander";

import fs from 'fs-extra';
import path, { dirname } from 'path';
import { execSync } from 'child_process';
import prompts from 'prompts';
import chalk from 'chalk';

import { log } from "../cli_util.mjs";

import { fileURLToPath } from 'url';

const initCommand = new Command("init").description("Initialize the project").action(async () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    function getPackageManager(root) {
        if (fs.existsSync(path.join(root, 'yarn.lock'))) return 'yarn';
        if (fs.existsSync(path.join(root, 'pnpm-lock.yaml'))) return 'pnpm';
        return 'npm';
    }

    function getInstallCommand(manager) {
        if (manager === "yarn") return "yarn add getsyntux";
        if (manager === "pnpm") return "pnpm add getsyntux";
        return "npm install getsyntux";
    }

    /**
     * verifying
     */

    const userRoot = process.cwd();
    const packageJsonPath = path.join(userRoot, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
        log(chalk.red('Failed to find package.json. Run this command from your project root.'));
        process.exit(1);
    }

    /**
     * installing
     */

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
    };

    if (allDeps['getsyntux']) {
        log('library has already been installed. Continuing...');
    } else {
        log('library not detected in package.json. Please install to continue...');
        const packageManager = getPackageManager(userRoot);
        const command = getInstallCommand(packageManager);
        const response = await prompts({
            type: 'select',
            name: 'install',
            message: `Run ${command}?`,
            choices: [{ title: 'Yes' }, { title: 'No' }],
        })

        if (response.install !== 0) {
            log('installation cancelled.');
            process.exit(0);
        }

        try {
            execSync(command, { stdio: 'inherit' });
            log('installed from ' + chalk.green(packageManager) + ' successfully.');
        } catch (error) {
            log('installation ' + chalk.red('failed') + ' from ' + packageManager + '.');
            process.exit(1);
        }
    }

    /**
     * copying
     */

    const templateDir = path.resolve(__dirname, '../templates')
    const targetDir = path.resolve(process.cwd(), 'lib/getsyntux');

    if (!fs.existsSync(templateDir)) {
        log(chalk.red("failed to find template directory. This is not your fault."));
        process.exit(1);
    }

    log('generating files...');

    if (fs.existsSync(targetDir)) {
        const files = fs.readdirSync(targetDir);
        if (files.length > 0) {
            log('target directory lib/getsyntux already contains files.');
            const response = await prompts({
                type: 'select',
                name: 'copy',
                message: `Empty directory?`,
                choices: [{ title: 'Yes' }, { title: 'No' }],
            })

            if (response.copy !== 0) {
                log('installation cancelled.');
                process.exit(0);
            }

            fs.emptyDirSync(targetDir);
        }
    }

    fs.copySync(templateDir, targetDir, {
        overwrite: true,
        errorOnExist: false
    })
    log(chalk.green('installation complete.'));
})

export default initCommand;