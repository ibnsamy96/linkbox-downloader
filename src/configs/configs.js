import { intro, outro, text, cancel, select, confirm } from "@clack/prompts"
import path from "path"
import fs from "fs"

import {
	addCancelPrompt,
	createDirIfNotExist,
	stringifyConfigsFile,
	parseConfigsFile,
} from "../helpers.js"

import { formUIReturnState, saveNewConfigs } from "./helpers.js"
import { showProxiesUI } from "./proxies.js"

async function useDefaultDownloadFolder() {
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

async function updateDownloadFolderUI() {
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

export default async function main() {
	// const spinners = []

	try {
		intro(`Welcome to LinkBox Downloader Configurations`)

		if (Number(process.versions.node.split(".").shift()) < 18) {
			const error = new Error("Node version is below 18.")
			error.cancelationMessage =
				"The app is only available for node >= 18 due to using some of the latest features presented in this version."
			throw error
		}

		const neededConfigs = await select({
			message: "What do you want to update in the utility configs?",
			options: [
				{ value: "down_path", label: "Change the download directory." },
				{
					value: "default_down_path",
					label: "Use the default download directory.",
				},
				{
					value: "edit_proxies",
					label: "Edit proxies, Add, remove, update or just test them.",
				},
			],
		})

		const configsUIs = {
			down_path: updateDownloadFolderUI,
			default_down_path: useDefaultDownloadFolder,
			edit_proxies: showProxiesUI,
		}

		const savingState = await configsUIs[neededConfigs]()

		switch (savingState) {
			case formUIReturnState(true):
				outro(`Your updates are saved ^^`)
				break
			case formUIReturnState(false):
				outro(`No configs were changed.`)
				break

			default:
				break
		}
	} catch (error) {
		cancel(
			error.cancelationMessage +
				`\n\n` +
				` No configs were changed, Please try again!`
		)

		// outro()
	}
}
