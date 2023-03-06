#!/usr/bin/env node
import { platform } from "os"
import { spawn } from "child_process"
import startApp from "../src/index.js"
import paths from "../src/paths.js"

const args = process.argv.slice(2)
const option = args[0]

// const scriptIndex = args.findIndex(x =>
// 	["-o", "--open", "-h", "--help", "-d", "--dev"].includes(x)
// )
// const script = scriptIndex === -1 ? args[0] : args[scriptIndex]

switch (option) {
	case undefined:
		startApp()
		break
	case "-d":
	case "--dev":
		startApp(true)
		break
	case "-o":
	case "--open":
		const directory = paths.downloads
		const command = {
			win32: "explorer",
			linux: "xdg-open",
			darwin: "open",
		}[platform()]
		spawn(command, [directory], { detached: true }).unref()
		break
	case "-h":
	case "--help":
		console.log(`
To use the LBX Downloader, open a terminal or command prompt and type 'lbx-downloader'.
Options
  -o, --open - open the downloads directory
  -d, --dev - start the utility in dev-mode
  -h, --help - display help information
  -v, --version - display version information
	`)
		break
	case "-v":
	case "--version":
		console.log(`linkbox-downloader@v1.0.0`)
		break
	default:
		console.error(`Invalid option: ${option}.`)
		console.log(`Use command 'lbx-downloader -h' to display allowed options.`)
}
