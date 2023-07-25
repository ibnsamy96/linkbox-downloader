import { isCancel, cancel, note, spinner } from "@clack/prompts"
import * as fs from "fs"
import path from "path"
import paths from "./paths.js"
import { HttpsProxyAgent } from "https-proxy-agent"

export const addCancelPrompt = (inputField, cancelationMessage) => {
	if (isCancel(inputField)) {
		cancel(cancelationMessage)
		process.exit(0)
	}
}

export const addNote = (title, message) => {
	note(message, title)
}

export const addTimer = (startMessage, errorMessage, spinnersArray) => {
	const sp = spinner()
	spinnersArray.push({
		sp,
		errorMessage,
	})
	sp.start(startMessage)
	return sp
}

export const createDirIfNotExist = path => {
	if (!fs.existsSync(path)) {
		fs.mkdirSync(path)
	}
}

export const createFileIfNotExist = path => {
	// const isFileExist = isFileExist(path)
	if (!fs.existsSync(path)) {
		fs.writeFile(path, "", "utf8", () => {})
	}
}

export const generateFilePath = args => {
	// handle path common issues
	args = args.map(arg => arg.trim())
	return path.join(...args) //.replaceAll(" ", "_");
}

export const isFileExist = filePath => {
	// const filePath = path.join(...args);
	// console.log(filePath);
	return !!fs.existsSync(filePath)
}

export function parseConfigsFile(options) {
	const configs = {}
	const data = fs.readFileSync(options?.filePath || paths.configs, "utf8")
	const lines = data.split("\n")

	for (const line of lines) {
		const [attr, val] = line.split("=")
		configs[attr] = val
	}

	return configs
}

export function stringifyConfigsFile(configs) {
	const lines = []

	for (const attr in configs) {
		const line = `${attr}=${configs[attr]}`
		lines.push(line)
	}

	return lines.join("\n")
}

export const generateProxyUrl = proxy => {
	const { protocol, host, port, username, password } = proxy
	const proxyUrl =
		username && password
			? `${protocol}://${username}:${password}@${host}:${port}`
			: `${protocol}://${host}:${port}`
	return proxyUrl
}

export const createProxyAgent = proxyUrl => {
	return new HttpsProxyAgent(proxyUrl)
}
