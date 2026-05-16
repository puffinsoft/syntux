#!/usr/bin/env node

import { Command } from "commander";
import initCommand from "./commands/init.mjs";
import generateDefsCommand from "./commands/generate.mjs";

const program = new Command();
program.name("@getsyntux/cli").description("The declarative generative-UI library.");
program.addCommand(initCommand);
program.addCommand(generateDefsCommand);

const args = process.argv.slice(2);
if (args.length === 0) process.argv.splice(2, 0, "init");

program.parse(process.argv);
