import { text, select, confirm, spinner } from "@clack/prompts"

import {
	addCancelPrompt,
	parseConfigsFile,
	stringifyConfigsFile,
	generateProxyUrl,
} from "../../helpers.js"
import {
	formUIReturnState,
	saveNewConfigs,
	getStoredProxies,
	isProxyReachableAndChangingIP,
} from "../helpers.js"

async function chooseProxy() {
	const proxies = getStoredProxies()

	if (proxies.length === 0) {
		note("You didn't add any proxies yet.", "No Proxies to Edit")
		return formUIReturnState(false)
	}

	const chosenProxyIndex = await select({
		message: "Which proxies do you want to delete?",
		options: proxies.map((proxy, index) => ({
			value: index,
			label: generateProxyUrl(proxy),
		})),
	})
	addCancelPrompt(
		chosenProxyIndex,
		"Operation cancelled, your proxies weren't deleted."
	)

	return { index: chosenProxyIndex, proxy: proxies[chosenProxyIndex] }
}

async function saveEditedProxy(oldProxyIndex, newProxy) {
	try {
		const configs = parseConfigsFile()
		const proxies = configs["proxies"] ? JSON.parse(configs["proxies"]) : []
		proxies[oldProxyIndex] = newProxy
		configs["proxies"] = JSON.stringify(proxies)
		const newConfigsString = stringifyConfigsFile(configs)
		saveNewConfigs(newConfigsString)
	} catch (error) {
		error.cancelationMessage = "Couldn't update the file."
		throw error
	}
}

export async function editProxyUI() {
	let testingProxySpinner
	try {
		const { index: oldProxyIndex, proxy: oldProxy } = await chooseProxy()

		console.log(oldProxy)
		console.log(oldProxy)

		const host = await text({
			message: "What is the new proxy host?",
			initialValue: "" + oldProxy.host,
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
			message: "What is the new proxy port?",
			initialValue: oldProxy.port,
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
				initialValue: oldProxy.username || "",
				validate: text => {
					if (text.length === 0) return "Username can't be empty"
				},
			})
			addCancelPrompt(
				port,
				"Operation cancelled, the proxy path will stay unchanged."
			)
			password = await text({
				message: "What is the password?",
				initialValue: oldProxy.password || "",
				validate: text => {
					if (text.length === 0) return "Password can't be empty"
				},
			})
			addCancelPrompt(
				port,
				"Operation cancelled, the proxy path will stay unchanged."
			)
		}

		const newProxy = { protocol, host, port, username, password }

		testingProxySpinner = spinner()
		testingProxySpinner.start("Testing the new proxy")
		const proxyTestResult = await isProxyReachableAndChangingIP(newProxy)
		testingProxySpinner.stop("Finished testing the new proxy")

		// console.log(proxyTestResult)
		// console.log(proxyTestResult)
		if (!proxyTestResult.reachable) {
			const shouldContinue = await confirm({
				message:
					"The proxy seems to be unreachable, do you want to save your changes anyway?",
			})

			if (!shouldContinue) return formUIReturnState(false)
		} else if (proxyTestResult.needAuth) {
			const shouldContinue = await confirm({
				message:
					"The proxy is reachable but it needs auth info. Do you want to save your changes anyway?",
			})

			if (!shouldContinue) return formUIReturnState(false)
		} else if (!proxyTestResult.isReturnValid) {
			const shouldContinue = await confirm({
				message:
					"The proxy is reachable but I can't check its anonymity. Do you want to save your changes anyway?",
			})

			if (!shouldContinue) return formUIReturnState(false)
		} else if (!proxyTestResult.changingIP) {
			const shouldContinue = await confirm({
				message:
					"The proxy isn't changing the device IP, do you want to save your changes anyway?",
			})

			if (!shouldContinue) return formUIReturnState(false)
		}

		saveEditedProxy(oldProxyIndex, newProxy)
		return formUIReturnState(true)
	} catch (error) {
		// console.log(error)
		if (testingProxySpinner)
			testingProxySpinner.stop("Error happened while testing the proxy!")

		error.cancelationMessage = "Error happened while editing the proxy."
		throw error
	}
}
