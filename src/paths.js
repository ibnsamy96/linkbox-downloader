import { createDirIfNotExist } from "./helpers.js"
import path from "path"
import { homedir } from "os"

const base = path.join(homedir(), "linkbox-downloader")
createDirIfNotExist(base)

const downloads = path.join(base, "downloads")
createDirIfNotExist(downloads)

const logs = path.join(base, "linkbox_logs")
createDirIfNotExist(logs)

export default { base, downloads, logs }
