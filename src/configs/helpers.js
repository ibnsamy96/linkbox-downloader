import fs from "fs"
import fetch from "node-fetch"

import paths from "../paths.js"
import {
	parseConfigsFile,
	createProxyAgent,
	generateProxyUrl,
} from "../helpers.js"

export function formUIReturnState(result) {
	const returnStates = {
		done: "done",
		cancel: "cancel",
	}
	if (result) return returnStates.done
	return returnStates.cancel
}

export function saveNewConfigs(newConfigsString) {
	fs.writeFileSync(paths.configs, newConfigsString, "utf8")
}

export function getStoredProxies() {
	const configs = parseConfigsFile()
	const proxies = configs["proxies"] ? JSON.parse(configs["proxies"]) : []
	return proxies
}

// The function tests proxies by sending two requests to "https://ident.me/ip" which should return only the device IP, and based on the returns of the two requests it detects if the proxy is reachable and is changing IP
export async function isProxyReachableAndChangingIP(proxy) {
	const identIPLink = "https://ident.me/ip"
	const proxyUrl = generateProxyUrl(proxy)
	const proxyAgent = createProxyAgent(proxyUrl)
	const testResult = {
		reachable: false,
		needAuth: false,
		isReturnValid: false,
		changingIP: false,
	}

	try {
		const response = await Promise.all([
			fetch(identIPLink),
			fetch(identIPLink, { agent: proxyAgent }),
		])
		const data = await Promise.all([response[0].text(), response[1].text()])

		// console.log(data)

		// If no error happened in fetching, then proxy is reachable
		testResult.reachable = true

		const isProxyNeedAuth = response[1].status == 407 // 407 means proxy needs authentication
		if (isProxyNeedAuth) {
			testResult.needAuth = isProxyNeedAuth
			return testResult
		}

		// if the requests returned letters not just the device ip, then the proxy request is valid
		const isReturnValid = !(/[a-z]/i.test(data[0]) || /[a-z]/i.test(data[1]))
		if (!isReturnValid) return testResult
		else testResult.isReturnValid = true

		// if the IPs of the two requests are the same, then the proxy is not changing IPs
		if (data[0] === data[1]) return testResult
		else testResult.changingIP = true

		return testResult
	} catch (error) {
		console.log(proxyUrl + error.message)
		return testResult
	}
}
