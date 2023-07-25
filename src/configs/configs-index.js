import { intro, outro, cancel, select } from "@clack/prompts"

import { addCancelPrompt } from "../helpers.js"
import { formUIReturnState } from "./helpers.js"
import { showProxiesUI } from "./proxies.js"
import { showDownloadsLocationUI } from "./downloads-location.js"

export default async function main() {
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
				{
					value: "download_location",
					label: "Change the downloads location.",
				},
				{
					value: "proxies",
					label: "Edit and test proxies.",
				},
			],
		})
		addCancelPrompt(
			neededConfigs,
			"Operation cancelled, your configs will stay unchanged."
		)

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
	}
}
