import { text, confirm, select } from "@clack/prompts"
import path from "path"
import fs from "fs"

import {
	addCancelPrompt,
	createDirIfNotExist,
	stringifyConfigsFile,
	parseConfigsFile,
} from "../helpers.js"
import { formUIReturnState, saveNewConfigs } from "./helpers.js"

async function saveNewDownloadingLocation(newDownloadPath) {
	try {
		const configs = parseConfigsFile()
		configs["download-dir"] = newDownloadPath
		const newConfigsString = stringifyConfigsFile(configs)
		saveNewConfigs(newConfigsString)
	} catch (error) {
		error.cancelationMessage = "Couldn't update the file."
		throw error
	}
}

async function showCustomDownloadLocationUI() {
	try {
		let downloadLocation = await text({
			message: "Where to download your files?",
			placeholder:
				"Write a the full absolute path of the downloads directory you want.",
			validate: text => {
				if (!path.isAbsolute(text))
					return `Text doesn't seem to represent an absolute path.`
			},
		})
		addCancelPrompt(
			downloadLocation,
			"Operation cancelled, the downloads path will stay unchanged."
		)
		// Used path lib to solve issues entered in the path by the user
		downloadLocation = path.normalize(downloadLocation)

		const doesPathExist = fs.existsSync(downloadLocation)
		if (doesPathExist) {
			saveNewDownloadingLocation(downloadLocation)
			return formUIReturnState(true)
		}

		const shouldContinue = await confirm({
			message:
				"Your path doesn't exist, do you want me to create the directory for you?",
		})

		if (!shouldContinue) return formUIReturnState(false)

		createDirIfNotExist(downloadLocation)
		saveNewDownloadingLocation(downloadLocation)
		return formUIReturnState(true)
	} catch (error) {
		error.cancelationMessage =
			"Error happened while working on updating the file path."
		throw error
	}
}

async function useDefaultDownloadLocation() {
	try {
		const configs = parseConfigsFile()
		configs["download-dir"] = ""
		const newConfigsString = stringifyConfigsFile(configs)
		saveNewConfigs(newConfigsString)
		return formUIReturnState(true)
	} catch (error) {
		error.cancelationMessage = "Couldn't update the file."
		throw error
	}
}

export async function showDownloadsLocationUI() {
	try {
		const neededConfigs = await select({
			message: "Choose the option that suits your needs?",
			options: [
				{
					value: "download_location",
					label: "Use a new custom downloads location.",
				},
				{
					value: "default_download_location",
					label: "Use the default downloads directory.",
				},
			],
		})

		const configsUIs = {
			download_location: showCustomDownloadLocationUI,
			default_download_location: useDefaultDownloadLocation,
		}

		const savingState = await configsUIs[neededConfigs]()

		return savingState
	} catch (error) {
		throw error
	}
}
