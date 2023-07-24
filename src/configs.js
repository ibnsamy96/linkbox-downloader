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

async function updateProxies(newProxy) {
	try {
		const configs = parseConfigsFile()
		const proxies = configs["proxies"] ? JSON.parse(configs["proxies"]) : []
		proxies.push(newProxy)
		configs["proxies"] = JSON.stringify(proxies)
		const newConfigsString = unParseConfigsFile(configs)
		fs.writeFileSync(paths.configs, newConfigsString, "utf8")
	} catch (error) {
		// const error = new Error("File path is unchanged.")
		error.cancelationMessage = "Couldn't update the file."
		throw error
		// console.error(err)
	}
}

async function useProxiesUI() {
	try {
		const proposedHost = await text({
			message: "What is the proxy host?",
			placeholder: "Enter only the host, without the protocol.",
			validate: text => {
				const pattern =
					/^(?:\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|\[[a-fA-F\d:]+\])$/

				if (!pattern.test(text))
					return `Text doesn't seem to represent a host value.`
			},
		})
		addCancelPrompt(
			proposedHost,
			"Operation cancelled, the proxy path will stay unchanged."
		)

		const proposedPort = await text({
			message: "What is the proxy port?",
			placeholder: "Enter only the port.",
			validate: text => {
				const pattern =
					/^(?:[1-9]\d{0,4}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/

				if (!pattern.test(text))
					return `Text doesn't seem to represent a port value.`
			},
		})
		addCancelPrompt(
			proposedPort,
			"Operation cancelled, the proxy path will stay unchanged."
		)

		const proposedProtocol = await select({
			message: "What protocol do you want to use?",
			options: [
				{ value: "http", label: "HTTP" },
				{ value: "https", label: "HTTPS" },
			],
		})
		addCancelPrompt(
			proposedPort,
			"Operation cancelled, the proxy path will stay unchanged."
		)

		const hasAuth = await confirm({
			message: "Does your server has a username/password authentication?",
		})

		let proposedUser, proposedPass
		if (hasAuth) {
			proposedUser = await text({
				message: "What is the username?",
			})
			addCancelPrompt(
				proposedPort,
				"Operation cancelled, the proxy path will stay unchanged."
			)
			proposedPass = await text({
				message: "What is the password?",
			})
			addCancelPrompt(
				proposedPort,
				"Operation cancelled, the proxy path will stay unchanged."
			)
		}

		const proxy = {
			protocol: proposedProtocol,
			host: proposedHost,
			port: proposedPort,
			username: proposedUser,
			password: proposedPass,
		}
		// TODO check if proxy isn't connecting ask the user before submit
		updateProxies(proxy)
		return returnStates.done
		// const isPathExist = fs.existsSync(proposedDownloadDir)
		// if (isPathExist) {
		// 	updateDownloadFolder(proposedDownloadDir)
		// 	return returnStates.done
		// }

		// const shouldContinue = await confirm({
		// 	message:
		// 		"Your path doesn't exist, do you want me to create the directory for you?",
		// })

		// if (!shouldContinue) return returnStates.cancel

		// createDirIfNotExist(proposedDownloadDir)
		// updateDownloadFolder(proposedDownloadDir)
		// return returnStates.done
	} catch (error) {
		error.cancelationMessage =
			"Error happened while working on changing the proxy settings."
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
					value: "add_proxy",
					label: "Use proxy, Add host and port and use them.",
				},
			],
		})

		const configsUIs = {
			down_path: updateDownloadFolderUI,
			default_down_path: useDefaultDownloadFolder,
			add_proxy: useProxiesUI,
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
