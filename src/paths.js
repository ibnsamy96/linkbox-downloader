import {
	createDirIfNotExist,
	createFileIfNotExist,
	generateFilePath,
	parseConfigsFile,
} from "./helpers.js"
import path from "path"
import { homedir } from "os"
import fs from "fs"

const base = path.join(homedir(), "linkbox-downloader")
createDirIfNotExist(base)

const logs = path.join(base, "linkbox_logs")
createDirIfNotExist(logs)

const configs = generateFilePath([base, ".configs"])
createFileIfNotExist(configs)

const downPathConfig = parseConfigsFile({ filePath: configs })["download-dir"]
const downloads = downPathConfig || path.join(base, "downloads")
createDirIfNotExist(downloads)

export default { base, downloads, logs, configs }
