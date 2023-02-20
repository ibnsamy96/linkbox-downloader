import * as fs from "fs";
import Downloader from "nodejs-file-downloader";
import path from "path";
import { URL } from "url";

// const generateMainDirectoryLink = (folderId) =>
// 	`https://www.linkbox.to/api/file/share_out_list/?pageSize=50&shareToken=${folderId}&pid=0`;

const generateSubFolderOrFileLink = (shareToken, pid) =>
	`https://www.linkbox.to/api/file/share_out_list/?pageSize=50&shareToken=${shareToken}&pid=${pid}`;

const generateFolderBaseInfoLink = (pid) =>
	`https://www.linkbox.to/api/file/folder_base_info?dirId=${pid}&lan=en`;

const getData = async function (url) {
	const req = await fetch(url);
	const data = await req.json();
	return data;
};

const parseListPIDs = (list) => {
	const foldersList = list;
	foldersList.sort((a, b) => {
		if (a.name_sort > b.name_sort) return 1;
		else if (a.name_sort < b.name_sort) return -1;
		else return 0;
	});

	return foldersList.map((item) => {
		const element = {};
		// element.name = item.name.trim();
		element.type = item.type;
		element.pid = item.id;
		// if (item.type == "dir") {
		// 	// element.name =
		// } else
		const numericName = item.name.replace(/الحلقة|الموسم/, "");
		// const numericName = item.name.replace("الحلقة", "");
		if (item.type == "video") {
			element.name = "E" + parseInt(numericName);
			element.url = item.url;
		} else if (item.type == "dir") {
			element.name = "Season " + parseInt(numericName);
		}

		return element;
	});
};

const clearLastLine = () => {
	process.stdout.moveCursor(0, -1); // up one line
	process.stdout.clearLine(1); // from cursor to end
};

const isEpisodeDownloaded = (...args) => {
	const filePath = path.join("downloads", ...args);
	// console.log(filePath);
	return !!fs.existsSync(filePath);
};

const downloadEpisode = async (
	url,
	dirName = "general",
	fileName = "undefined"
) => {
	console.log(`⏳ ${fileName} of ${dirName} is started.`);
	console.log(``);
	const downloader = new Downloader({
		url,
		maxAttempts: 3,
		directory: "./downloads/" + dirName.trim(),
		onBeforeSave: (deducedName) => {
			const ext = deducedName.split(".")[1];
			return (
				"S" + parseInt(dirName.replace("Season", "")) + fileName + "." + ext
			);
		},
		onProgress: function (percentage, chunk, remainingSize) {
			clearLastLine();
			console.log(
				`  %${percentage} / Remaining: ${(
					remainingSize /
					(1024 * 1024)
				).toFixed(2)}MB`
			);
			// console.log("  Remaining bytes: ", remainingSize);
		},
	});
	try {
		const { filePath, downloadStatus } = await downloader.download();
		clearLastLine();
		clearLastLine();
		console.log(`✅ ${fileName} of ${dirName} is downloaded.`);
	} catch (error) {
		console.log("Download failed.", error);
	}
};

export const parseLink = (link) => {
	const url = new URL(link);
	const [mainPart] = link.split("?");
	const shareToken = mainPart.split("/").pop();
	// console.log(link);
	// console.log(url);
	// console.log(queryPart);
	const pid = url.search && url.searchParams.get("pid");
	// const pid = queryPart && URL
	return { shareToken, pid };
};

export const getAllDownloadLinks = async (shareToken, pid) => {
	const requestLink = generateSubFolderOrFileLink(shareToken, pid);
	const responseJSON = await getData(requestLink);
	// // console.log(requestLink);
	// // console.log(responseJSON);
	// return responseJSON;

	const contentList = extractResponseContentList(responseJSON);
	// console.log(contentList);
	const parsedList = await recursiveCascadeToLeastFile(contentList);
	// console.log(parsedList);
	// console.log(parsedList[0]);

	// const parsedList = parseListPIDs(responseJSON.data.list);
	// const completeList = await cascadeToLeastVideo(parsedList);
	// console.log(completeList[0].sub);

	function extractResponseContentList(responseJSON) {
		return responseJSON.data.list;
	}

	async function recursiveCascadeToLeastFile(list) {
		if (!list || list.constructor.name !== "Array") return;

		list.sort((a, b) => {
			if (a.name_sort > b.name_sort) return 1;
			else if (a.name_sort < b.name_sort) return -1;
			else return 0;
		});

		const completeList = [];

		for (const pidObject of list) {
			const neededPidObject = {
				type: pidObject.type,
				name: pidObject.name,
			};
			if (pidObject.type === "dir") {
				neededPidObject.id = pidObject.id;

				const requestLink = generateSubFolderOrFileLink(
					shareToken,
					pidObject.id
				);
				const responseJSON = await getData(requestLink);
				const contentList = extractResponseContentList(responseJSON);
				const parsedList = await recursiveCascadeToLeastFile(contentList);
				completeList.push({ ...neededPidObject, sub: parsedList });
			} else {
				neededPidObject.url = pidObject.url;
				neededPidObject.item_id = pidObject.item_id;
				completeList.push(neededPidObject);
			}
		}
		return completeList;
	}

	return parsedList;
};

export const saveFetchedUrls = async (baseFolderName, url, parsedList) => {
	// console.log(parsedList);

	const now = new Date();
	// const now = new Date().toString();
	const metadata = {
		date: now.toLocaleString(),
		directory_name: baseFolderName,
		directory_url: url,
		files: parsedList,
	};
	// console.log(metadata);

	try {
		// console.log(now);
		fs.writeFile(
			`linkbox_log.${now.toISOString()}.json`.replace(/:/g, "_"),
			JSON.stringify(metadata),
			"utf8",
			() => {}
		);
		// console.log("saveFetchedUrls");
	} catch (error) {
		console.error(`Couldn't save file.`, error);
	}
};

export const getBaseFolderName = async (pid) => {
	const requestLink = generateFolderBaseInfoLink(pid);
	const responseJSON = await getData(requestLink);
	// console.log(responseJSON.data.name);
	return responseJSON.data.name;
};

export default async function main(shareToken, pid, completeList) {
	// console.log(completeList);

	// const shareToken = "wIVJVO4";
	// const pid = "2952179";
	// console.log(shareToken, pid);
	// console.log({ mainDirectoryName });
	// addNote("mainDirectoryName", mainDirectoryName);

	// const responseJSON = await getAllDownloadLinks(shareToken, pid);
	// console.log(responseJSON);

	// const contentList = extractResponseContentList(responseJSON);
	// const parsedList = await recursiveCascadeToLeastFile(contentList);
	// console.log(parsedList);
	// console.log(parsedList[0]);

	// // const parsedList = parseListPIDs(responseJSON.data.list);
	// // const completeList = await cascadeToLeastVideo(parsedList);
	// // console.log(completeList[0].sub);

	// function extractResponseContentList(responseJSON) {
	// 	return responseJSON.data.list;
	// }

	// async function recursiveCascadeToLeastFile(list) {
	// 	const completeList = [];

	// 	for (const pidObject of list) {
	// 		if (pidObject.type === "dir") {
	// 			const requestLink = generateSubFolderOrFileLink(
	// 				shareToken,
	// 				pidObject.pid
	// 			);
	// 			const responseJSON = await getData(requestLink);
	// 			const contentList = extractResponseContentList(responseJSON);
	// 			const parsedList = await recursiveCascadeToLeastFile(contentList);
	// 			completeList.push({ ...pidObject, sub: parsedList });
	// 			console.log(`${pidObject.name} urls are fetched.`);
	// 			// const parsedList = parseListPIDs(responseJSON.data.list);
	// 			continue;
	// 		} else {
	// 			completeList.push(pidObject);
	// 		}

	// 		return completeList;
	// 	}
	// }

	// async function cascadeToLeastVideo(list) {
	// 	const completeList = [];
	// 	for (const pidObject of list) {
	// 		if (pidObject.type != "dir") continue;
	// 		const requestLink = generateSubFolderOrFileLink(
	// 			shareToken,
	// 			pidObject.pid
	// 		);
	// 		// console.log(requestLink);
	// 		const responseJSON = await getData(requestLink);
	// 		const parsedList = parseListPIDs(responseJSON.data.list);
	// 		completeList.push({ ...pidObject, sub: parsedList });
	// 		clearLastLine();
	// 		console.log(`${pidObject.name} urls are fetched.`);
	// 	}
	// 	clearLastLine();
	// 	console.log(`✅ All urls are fetched.`);
	// 	return completeList;
	// }

	// console.log(completeList[0]);

	for (const season of completeList) {
		console.log(`/-- ${season.name} --/`);
		for (const episode of season.sub) {
			const fileName =
				"S" +
				parseInt(season.name.replace("Season", "")) +
				episode.name +
				".mp4";
			if (!isEpisodeDownloaded(season.name, fileName)) {
				await downloadEpisode(episode.url, season.name, episode.name);
			} else {
				console.log(
					`✅ ${episode.name} of ${season.name} was downloaded in a previous session.`
				);
			}
		}
	}

	console.log(`/-- Downloaded All Folders --/`);
}
