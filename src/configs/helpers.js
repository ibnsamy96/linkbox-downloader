import fs from "fs"
import paths from "../paths.js"

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
