import { text, confirm } from "@clack/prompts"
import path from "path"
import fs from "fs"

import {
	addCancelPrompt,
	createDirIfNotExist,
	stringifyConfigsFile,
	parseConfigsFile,
} from "../helpers.js"
import { formUIReturnState, saveNewConfigs } from "./helpers.js"

export async function useDefaultDownloadLocation() {
	try {
		const configs = parseConfigsFile()
		configs["download-dir"] = ""
		const newConfigsString = stringifyConfigsFile(configs)
		saveNewConfigs(newConfigsString)
		return formUIReturnState(true)
	} catch (error) {
		// const error = new Error("File path is unchanged.")
		error.cancelationMessage = "Couldn't update the file."
		throw error
		// console.error(err)
	}
}

async function updateDownloadFolder(newDownloadPath) {
	try {
		const configs = parseConfigsFile()
		configs["download-dir"] = newDownloadPath
		const newConfigsString = stringifyConfigsFile(configs)
		saveNewConfigs(newConfigsString)
	} catch (error) {
		// const error = new Error("File path is unchanged.")
		error.cancelationMessage = "Couldn't update the file."
		throw error
		// console.error(err)
	}
}

export async function showDownloadLocationUI() {
	try {
		let proposedDownloadDir = await text({
			message: "Where to download your files?",
			placeholder:
				"Write a the full absolute path of the downloads directory you want.",
			validate: text => {
				if (!path.isAbsolute(text))
					return `Text doesn't seem to represent an absolute path.`
			},
		})
		addCancelPrompt(
			proposedDownloadDir,
			"Operation cancelled, the downloads path will stay unchanged."
		)

		proposedDownloadDir = path.normalize(proposedDownloadDir)

		const isPathExist = fs.existsSync(proposedDownloadDir)
		if (isPathExist) {
			// do the job
			updateDownloadFolder(proposedDownloadDir)
			return formUIReturnState(true)
		}

		const shouldContinue = await confirm({
			message:
				"Your path doesn't exist, do you want me to create the directory for you?",
		})

		if (!shouldContinue) return formUIReturnState(false)

		createDirIfNotExist(proposedDownloadDir)
		updateDownloadFolder(proposedDownloadDir)
		return formUIReturnState(true)
	} catch (error) {
		// const error = new Error("File path is unchanged.")
		error.cancelationMessage =
			"Error happened while working on updating the file path."
		throw error
	}
}
