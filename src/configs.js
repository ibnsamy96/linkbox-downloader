import { intro, outro, text, cancel, select, confirm } from "@clack/prompts"
import {
	addCancelPrompt,
	createDirIfNotExist,
	parseConfigsFile,
} from "./helpers.js"
import paths from "./paths.js"
import path from "path"
import fs from "fs"

const returnStates = {
	done: "done",
	cancel: "cancel",
}

function unParseConfigsFile(configs) {
	const lines = []

	for (const attr in configs) {
		const line = `${attr}=${configs[attr]}`
		lines.push(line)
	}

	return lines.join("\n")
}

async function useDefaultDownloadFolder() {
	try {
		const configs = parseConfigsFile()
		configs["download-dir"] = ""
		const newConfigsString = unParseConfigsFile(configs)
		fs.writeFileSync(paths.configs, newConfigsString, "utf8")
		return returnStates.done
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
		const newConfigsString = unParseConfigsFile(configs)
		fs.writeFileSync(paths.configs, newConfigsString, "utf8")
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
			return returnStates.done
		}

		const shouldContinue = await confirm({
			message:
				"Your path doesn't exist, do you want me to create the directory for you?",
		})

		if (!shouldContinue) return returnStates.cancel

		createDirIfNotExist(proposedDownloadDir)
		updateDownloadFolder(proposedDownloadDir)
		return returnStates.done
	} catch (error) {
		// const error = new Error("File path is unchanged.")
		error.cancelationMessage =
			"Error happened while working on updating the file path."
		throw error
	}
}
async function updateProxyUrl(newProxyUrl) {
	try {
		const configs = parseConfigsFile()
		configs["proxy-url"] = newProxyUrl
		const newConfigsString = unParseConfigsFile(configs)
		fs.writeFileSync(paths.configs, newConfigsString, "utf8")
	} catch (error) {
		// const error = new Error("File path is unchanged.")
		error.cancelationMessage = "Couldn't update the file."
		throw error
		// console.error(err)
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
			],
		})

		// console.log(neededConfigs)

		const configsUIs = {
			down_path: updateDownloadFolderUI,
			default_down_path: useDefaultDownloadFolder,
		}

		const savingState = await configsUIs[neededConfigs]()

		switch (savingState) {
			case returnStates.done:
				outro(`Your updates are saved ^^`)
				break
			case returnStates.cancel:
				outro(`No configs were changed.`)
				break

			default:
				break
		}
	} catch (error) {
		cancel(error.cancelationMessage)

		outro(`No configs were changed, Please try again!`)
	}
}
