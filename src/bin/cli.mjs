#!/usr/bin/env node

const args = process.argv.slice(2);
const suffix = args.length > 0 ? ` ${args.join(" ")}` : "";

console.error("getsyntux: the CLI has moved to @getsyntux/cli.");
console.error(`getsyntux: use: npx @getsyntux/cli${suffix}`);

process.exit(1);
