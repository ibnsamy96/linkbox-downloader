import path from "path"
import fs from "fs"
import { exportedForTesting } from "../src/downloader.js"
const { clearLastLine, generateFilePath, isEpisodeDownloaded } =
	exportedForTesting

describe("clearLastLine", () => {
	it("should move the cursor up one line and clear from cursor to end", () => {
		const spy = spyOn(process.stdout, "moveCursor")
		const spy2 = spyOn(process.stdout, "clearLine")
		clearLastLine()
		expect(spy).toHaveBeenCalledWith(0, -1)
		expect(spy2).toHaveBeenCalledWith(1)
	})
})

describe("generateFilePath", () => {
	it("should handle path common issues and join the args", () => {
		const args = ["test/", "file_name"]
		const expectedResult = path.join("test", "file_name")
		expect(generateFilePath(args)).toEqual(expectedResult)
	})
})

describe("isEpisodeDownloaded", () => {
	it("should check if the file exists", () => {
		const spy = spyOn(fs, "existsSync")
		isEpisodeDownloaded("test/file_name")
		expect(spy).toHaveBeenCalledWith("test/file_name")
	})
})
