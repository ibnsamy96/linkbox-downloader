import {
	text,
	select,
	confirm,
	spinner,
	note,
	multiselect,
} from "@clack/prompts"

import {
	addCancelPrompt,
	parseConfigsFile,
	stringifyConfigsFile,
	generateProxyUrl,
} from "../helpers.js"
import {
	formUIReturnState,
	saveNewConfigs,
	getStoredProxies,
	isProxyReachableAndChangingIP,
} from "./helpers.js"
import { editProxyUI } from "./proxies/edit-proxy.js"

async function testProxyUI() {
	let testingProxySpinner

	try {
		const proxies = getStoredProxies()

		const chosenProxyIndex = await select({
			message: "Which proxy do you want to test?",
			options: proxies.map((proxy, index) => ({
				value: index,
				label: generateProxyUrl(proxy),
			})),
		})
		addCancelPrompt(
			chosenProxyIndex,
			"Operation cancelled, your proxies weren't tested."
		)

		testingProxySpinner = spinner()
		testingProxySpinner.start("Testing the proxy")
		const proxyTestResult = await isProxyReachableAndChangingIP(
			proxies[chosenProxyIndex]
		)
		testingProxySpinner.stop("Finished testing the proxy")

		let testMessage = "The proxy is "

		if (!proxyTestResult.reachable) testMessage += "unreachable."
		else {
			testMessage += "reachable"

			if (!proxyTestResult.isReturnValid)
				testMessage +=
					" but I can't check its anonymity, you might need to add auth info."
			else if (proxyTestResult.changingIP)
				testMessage += " and is changing you IP."
			else testMessage += " but isn't changing your IP."
		}

		note(testMessage, "Test Result")

		return formUIReturnState(false)
	} catch (error) {
		if (testingProxySpinner)
			testingProxySpinner.stop("Error happened while testing the proxy!")

		error.cancelationMessage =
			"Error happened while testing the proxy. Try again or contact the developer."
		throw error
	}
}

async function addNewProxyUI() {
	let testingProxySpinner

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
				validate: text => {
					if (text.length === 0) return "Password can't be empty"
				},
			})
			addCancelPrompt(
				port,
				"Operation cancelled, the proxy path will stay unchanged."
			)
		}

		const proxy = { protocol, host, port, username, password }

		testingProxySpinner = spinner()
		testingProxySpinner.start("Testing the proxy")
		const proxyTestResult = await isProxyReachableAndChangingIP(proxy)
		testingProxySpinner.stop("Finished testing the proxy")

		if (!proxyTestResult.reachable) {
			const shouldContinue = await confirm({
				message:
					"The proxy seems to be unreachable, do you want to save it anyway?",
			})

			if (!shouldContinue) return formUIReturnState(false)
		} else if (!proxyTestResult.isReturnValid) {
			const shouldContinue = await confirm({
				message:
					"The proxy is reachable but I can't check its anonymity, you might need to add auth info. Do you want to save it anyway?",
			})

			if (!shouldContinue) return formUIReturnState(false)
		} else if (!proxyTestResult.changingIP) {
			const shouldContinue = await confirm({
				message:
					"The proxy isn't changing the device IP, do you want to save it anyway?",
			})

			if (!shouldContinue) return formUIReturnState(false)
		}

		addNewProxy(proxy)
		return formUIReturnState(true)
	} catch (error) {
		// console.log(error)
		if (testingProxySpinner)
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

async function deleteProxiesUI() {
	try {
		const proxies = getStoredProxies()

		if (proxies.length === 0) {
			note("You didn't add any proxies yet.", "No Proxies to Delete")
			return formUIReturnState(false)
		}

		const chosenProxiesIndexes = await multiselect({
			required: true,
			message: "Which proxies do you want to delete?",
			options: proxies.map((proxy, index) => ({
				value: index,
				label: generateProxyUrl(proxy),
			})),
		})
		addCancelPrompt(
			chosenProxiesIndexes,
			"Operation cancelled, your proxies weren't deleted."
		)

		deleteProxies(chosenProxiesIndexes)
		return formUIReturnState(true)
	} catch (error) {
		error.cancelationMessage =
			error.cancelationMessage ||
			"Error happened while deleting the proxies. Try again or contact the developer."
		throw error
	}
}

function deleteProxies(proxiesIndexes) {
	try {
		const configs = parseConfigsFile()
		const proxies = getStoredProxies()

		const filteredProxies = proxies.filter((_, index) => {
			const isProxyToBeDeleted = proxiesIndexes.includes(index)
			return !isProxyToBeDeleted
		})

		configs["proxies"] = JSON.stringify(filteredProxies)
		const newConfigsString = stringifyConfigsFile(configs)
		saveNewConfigs(newConfigsString)
	} catch (error) {
		error.cancelationMessage = "Couldn't update the file."
		throw error
	}
}

function showStoredProxies() {
	const proxies = getStoredProxies()
	let proxiesMessage
	if (proxies.length === 0) proxiesMessage = "You didn't add proxies yet."
	else {
		proxiesMessage = []
		proxies.forEach((proxy, index) => {
			proxiesMessage.push(index + 1 + ". " + generateProxyUrl(proxy))
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
					value: "delete_proxies",
					label: "Delete one or more of your proxies.",
				},
			],
		})
		addCancelPrompt(
			neededConfigs,
			"Operation cancelled, your proxies will stay unchanged."
		)

		const configsUIs = {
			test_proxy: testProxyUI,
			add_proxy: addNewProxyUI,
			edit_proxy: editProxyUI,
			delete_proxies: deleteProxiesUI,
		}

		const savingState = await configsUIs[neededConfigs]()
		return savingState
	} catch (error) {
		// console.log(error)
		if (!error.cancelationMessage)
			error.cancelationMessage =
				"Error happened while updating your proxy configurations."

		throw error
	}
}
