import * as fs from "fs";
import Downloader from "nodejs-file-downloader";
import path from "path";

const generateMainDirectoryLink = (folderId) =>
	`https://www.linkbox.to/api/file/share_out_list/?pageSize=50&shareToken=${folderId}&pid=0`;

const generateSubFolderOrFileLink = (folderId, pid) =>
	`https://www.linkbox.to/api/file/share_out_list/?pageSize=50&shareToken=${folderId}&pid=${pid}`;

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

// const createDirectory = (dirName) => {
// 	if (!fs.existsSync(dirName)) {
// 		fs.mkdirSync(dirName);
// 	}
// };

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

(async function main() {
	const dirId = "wIVJVO4";
	const folderPID = "2952179";
	const requestLink = generateSubFolderOrFileLink(dirId, folderPID);
	const responseJSON = await getData(requestLink);
	const parsedList = parseListPIDs(responseJSON.data.list);
	const completeList = await cascadeToLeastVideo(parsedList);
	// console.log(completeList[0].sub);

	async function cascadeToLeastVideo(list) {
		const completeList = [];
		for (const pidObject of list) {
			if (pidObject.type != "dir") continue;
			const requestLink = generateSubFolderOrFileLink(dirId, pidObject.pid);
			// console.log(requestLink);
			const responseJSON = await getData(requestLink);
			const parsedList = parseListPIDs(responseJSON.data.list);
			completeList.push({ ...pidObject, sub: parsedList });
			clearLastLine();
			console.log(`${pidObject.name} urls are fetched.`);
		}
		clearLastLine();
		console.log(`✅ All urls are fetched.`);
		return completeList;
	}

	// console.log(completeList[0]);

	for (const season of completeList) {
		console.log(`/-- Starting ${season.name} --/`);
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
})();
