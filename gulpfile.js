import gulp from "gulp"
const { src, dest, series } = gulp

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
	return src("./src/*.js").pipe(uglify()).pipe(dest("./dest/prod"))
}

function copyAdditionalFiles() {
	return src(["./package.json", "readme.md"]).pipe(dest("./dest"))
}

function uglifyFilesInPlace() {
	return src("./prod/**/*.js").pipe(uglify()).pipe(dest("./prod"))
}

export default series(
	cleanDest,
	replaceImportFromSrcToDist,
	copySrcFilesToProd,
	uglifyFilesInPlace,
	copyAdditionalFiles
)
