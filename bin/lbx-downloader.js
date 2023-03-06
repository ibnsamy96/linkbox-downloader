#!/usr/bin/env node
import { platform } from "os"
import { spawn } from "child_process"
import startApp from "../src/index.js"
import paths from "../src/paths.js"

const args = process.argv.slice(2)

const scriptIndex = args.findIndex(x => x === "dir" || x === "dev")
const script = scriptIndex === -1 ? args[0] : args[scriptIndex]

if (script === "dir") {
	const directory = paths.downloadsDirectory.replace("\\", "\\\\")
	const command = {
		win32: "explorer",
		linux: "xdg-open",
		darwin: "open",
	}[platform()]
	spawn(command, [directory], { detached: true }).unref()
} else if (script === "dev") {
	startApp(true)
} else {
	startApp()
}
