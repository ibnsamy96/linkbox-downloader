import { intro, outro, cancel, select } from "@clack/prompts"

import { formUIReturnState } from "./helpers.js"
import { showProxiesUI } from "./proxies.js"
import { showDownloadsLocationUI } from "./downloads-location.js"

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
				// { value: "down_path", label: "Change the download directory." },
				// {
				// 	value: "default_down_path",
				// 	label: "Use the default download directory.",
				// },
				{
					value: "download_location",
					label: "Change the downloads location.",
				},
				{
					value: "proxies",
					label: "Edit proxies, Add, remove, update or just test them.",
				},
			],
		})

		const configsUIs = {
			download_location: showDownloadsLocationUI,
			proxies: showProxiesUI,
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
		console.log(error)
		cancel(
			error.cancelationMessage +
				`\n\n` +
				` No configs were changed, Please try again!`
		)

		// outro()
	}
}