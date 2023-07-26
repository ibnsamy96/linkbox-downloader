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

export async function isProxyReachableAndChangingIP(proxy) {
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

		const isReturnValid = /[a-z]/i.test(data[0]) || /[a-z]/i.test(data[1])
		if (!isReturnValid) return { reachable: true, isReturnValid }

		if (data[0] === data[1])
			return { reachable: true, isReturnValid, changingIP: false }

		if (data[0] === data[1])
			return { reachable: true, isReturnValid, changingIP: false }

		return { reachable: true, changingIP: true }
	} catch (error) {
		return { reachable: false }
	}
}
