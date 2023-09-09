import gulp from "gulp"
const { src, dest, series } = gulp

import jsonEditor from "gulp-json-editor"
import replace from "gulp-replace"
import uglify from "gulp-uglify"
import * as del from "del"

async function cleanDest() {
	return await del.deleteAsync(["./dest"])
}

function replaceImportFromSrcToDist() {
	return src("./bin/*.js")
		.pipe(replace('from "../src', 'from "../prod'))
		.pipe(dest("dest/bin"))
}

function copySrcFilesToProd() {
	return src("./src/**/*.js").pipe(dest("./dest/prod"))
}

function copyAdditionalFiles() {
	return src(["./package.json", "readme.md"]).pipe(dest("./dest"))
}

function removeScripts() {
	return src("./dest/package.json")
		.pipe(
			jsonEditor(function (json) {
				json.scripts = {}
				delete json.scripts
				delete json.devDependencies
				return json
			})
		)
		.pipe(dest("./dest"))
}

function uglifyFilesInPlace() {
	return src("./dest/**/**/*.js").pipe(uglify()).pipe(dest("./dest"))
}

export default series(
	cleanDest,
	replaceImportFromSrcToDist,
	copySrcFilesToProd,
	uglifyFilesInPlace,
	copyAdditionalFiles,
	removeScripts
)
