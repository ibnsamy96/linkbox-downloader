#!/usr/bin/env node
import { platform } from "os";
import { spawn } from "child_process";
import startApp from "../src/index.js";

const args = process.argv.slice(2);

const scriptIndex = args.findIndex((x) => x === "dir" || x === "dev");
const script = scriptIndex === -1 ? args[0] : args[scriptIndex];

// console.log(args);

switch (script) {
	case "dir":
		const path = "./";
		let explorer;
		switch (platform()) {
			case "win32":
				explorer = "explorer";
				break;
			case "linux":
				explorer = "xdg-open";
				break;
			case "darwin":
				explorer = "open";
				break;
		}
		spawn(explorer, [path], { detached: true }).unref();
		break;

	case "dev":
		startApp(true);
		break;

	default:
		startApp();
		break;
}
