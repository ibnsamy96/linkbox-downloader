import fetch from "node-fetch"
import { text, select, confirm, spinner, note } from "@clack/prompts"

import {
	addCancelPrompt,
	parseConfigsFile,
	stringifyConfigsFile,
	generateProxyUrl,
	createProxyAgent,
} from "../helpers.js"
import { formUIReturnState, saveNewConfigs } from "./helpers.js"

async function isProxyReachableAndChangingIP(proxy) {
	const identIPLink = "https://ident.me/ip"
	const proxyUrl = generateProxyUrl(proxy)
	// console.log(proxyUrl)
	const proxyAgent = createProxyAgent(proxyUrl)
	try {
		const response = await Promise.all([
			fetch(identIPLink),
			fetch(identIPLink, { agent: proxyAgent }),
		])
		const data = await Promise.all([response[0].text(), response[1].text()])

		if (data[0] === data[1]) return { reachable: true, changingIP: false }

		return { reachable: true, changingIP: true }
	} catch (error) {
		return { reachable: false }
	}
}

async function addNewProxyUI() {
	const testingProxySpinner = spinner()

	try {
		const host = await text({
			message: "What is the proxy host?",
			placeholder: "Enter only the host, without the protocol.",
			validate: text => {
				const pattern =
					/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

				if (!pattern.test(text))
					return `Text doesn't seem to represent a host value.`
			},
		})
		addCancelPrompt(
			host,
			"Operation cancelled, the proxy path will stay unchanged."
		)

		const port = await text({
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
			port,
			"Operation cancelled, the proxy path will stay unchanged."
		)

		const protocol = await select({
			message: "What protocol do you want to use?",
			options: [
				{ value: "http", label: "HTTP" },
				{ value: "https", label: "HTTPS" },
			],
		})
		addCancelPrompt(
			port,
			"Operation cancelled, the proxy path will stay unchanged."
		)

		const hasAuth = await confirm({
			message: "Does your server has a username & password authentication?",
		})

		let username, password
		if (hasAuth) {
			username = await text({
				message: "What is the username?",
			})
			addCancelPrompt(
				port,
				"Operation cancelled, the proxy path will stay unchanged."
			)
			password = await text({
				message: "What is the password?",
			})
			addCancelPrompt(
				port,
				"Operation cancelled, the proxy path will stay unchanged."
			)
		}

		const proxy = { protocol, host, port, username, password }

		testingProxySpinner.start("Testing the proxy")
		const proxyTestResult = await isProxyReachableAndChangingIP(proxy)
		testingProxySpinner.stop("Finished testing the proxy")

		if (!proxyTestResult.reachable) {
			const shouldContinue = await confirm({
				message:
					"The proxy seems to be unreachable, do you want to save it anyway?",
			})

			if (!shouldContinue) return formUIReturnState(false)
		} else if (!proxyTestResult.changingIP) {
			const shouldContinue = await confirm({
				message:
					"The proxy seems to be not changing the device IP, do you want to save it anyway?",
			})

			if (!shouldContinue) return formUIReturnState(false)
		}

		addNewProxy(proxy)
		return formUIReturnState(true)
	} catch (error) {
		// console.log(error)
		testingProxySpinner.stop("Error happened while testing the proxy!")

		error.cancelationMessage = "Error happened while adding the new proxy."
		throw error
	}
}

async function addNewProxy(newProxy) {
	try {
		const configs = parseConfigsFile()
		const proxies = configs["proxies"] ? JSON.parse(configs["proxies"]) : []
		proxies.push(newProxy)
		configs["proxies"] = JSON.stringify(proxies)
		const newConfigsString = stringifyConfigsFile(configs)
		saveNewConfigs(newConfigsString)
	} catch (error) {
		error.cancelationMessage = "Couldn't update the file."
		throw error
	}
}

function showStoredProxies() {
	const configs = parseConfigsFile()
	const proxies = configs["proxies"] ? JSON.parse(configs["proxies"]) : []

	let proxiesMessage
	if (proxies.length === 0) proxiesMessage = "You didn't add proxies yet."
	else {
		proxiesMessage = []
		proxies.forEach(proxy => {
			proxiesMessage.push(generateProxyUrl(proxy))
		})
		proxiesMessage = proxiesMessage.join("\n")
	}

	note(proxiesMessage, "Your Stored Proxies")
}

export async function showProxiesUI() {
	try {
		await showStoredProxies()

		const neededConfigs = await select({
			message: "Choose the option that suits your needs.",
			options: [
				{
					value: "test_proxy",
					label: "Check reachability and anonymity of one of your proxies.",
				},
				{
					value: "add_proxy",
					label: "Add a new proxy.",
				},
				{
					value: "edit_proxy",
					label: "Edit one of your proxies.",
				},
				{
					value: "remove_proxies",
					label: "Remove one or more of your proxies.",
				},
			],
		})
		addCancelPrompt(
			neededConfigs,
			"Operation cancelled, your proxies will stay unchanged."
		)

		const configsUIs = {
			test_proxy: () => {},
			add_proxy: addNewProxyUI,
			edit_proxy: () => {},
			remove_proxies: () => {},
		}

		const savingState = await configsUIs[neededConfigs]()
		return savingState
	} catch (error) {
		if (!error.cancelationMessage)
			error.cancelationMessage =
				"Error happened while updating your proxy configurations."

		throw error
	}
}
