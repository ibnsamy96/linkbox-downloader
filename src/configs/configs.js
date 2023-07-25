import { intro, outro, cancel, select } from "@clack/prompts"

import { formUIReturnState } from "./helpers.js"
import { showProxiesUI } from "./proxies.js"
import {
	showDownloadLocationUI,
	useDefaultDownloadLocation,
} from "./download-location.js"

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
			down_path: showDownloadLocationUI,
			default_down_path: useDefaultDownloadLocation,
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
