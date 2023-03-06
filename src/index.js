#!/usr/bin/env node

// import download from "./downloader.js";
import download, {
	parseLink,
	getAllDownloadLinks,
	saveFetchedUrls,
	getBaseFolderName,
} from "./downloader.js";
import { intro, outro, text, spinner, cancel, select } from "@clack/prompts";
import { addCancelPrompt } from "./helpers.js";

export default async function main(devMode = false) {
	const spinners = [];

	try {
		intro(`Welcome to LinkBox Downloader`);

		if (Number(process.versions.node.split(".").shift()) < 18) {
			const error = new Error("Node version is below 18.");
			error.cancelationMessage =
				"The app is only available for node >= 18 due to using some of the latest features presented in this version.";
			throw error;
		}

		const shareLink = await text({
			message: "What is the link to be downloaded?",
			placeholder: "https://www.linkbox.to/a/s/<share-token>?pid=<folder-pid>",
			validate: (text) => {
				const linkboxRegex =
					/^https?:\/\/(?:www\.)?linkbox\.to\/[a-z]\/[a-z]\/[a-zA-Z0-9]+(\?pid=[0-9]+)?$/;
				if (!linkboxRegex.test(text))
					return `Text doesn't seem to represent a linkbox link.`;
			},
		});

		addCancelPrompt(shareLink, "Operation canceled.");

		const { shareToken, pid } = parseLink(shareLink);

		const linksSpinner = spinner();
		spinners.push({
			sp: linksSpinner,
			errorMessage: "❎ Directory links couldn't be fetched",
		});
		linksSpinner.start("⏳ Fetching directory links");
		linksSpinner.isOn = true;
		let baseDirectoryName = pid && (await getBaseFolderName(pid));
		// console.log(mainDirectoryName);
		const parsedList = await getAllDownloadLinks(shareToken, pid);
		linksSpinner.stop("✅ All directory links are fetched");
		linksSpinner.isOn = false;
		// console.log(parsedList);

		const savingLinksSpinner = spinner();
		spinners.push({
			sp: savingLinksSpinner,
			errorMessage: "❎ Links couldn't saved to a log file",
		});
		savingLinksSpinner.start("⏳ Saving links to a log file");
		savingLinksSpinner.isOn = true;
		saveFetchedUrls(baseDirectoryName, shareLink, parsedList);
		savingLinksSpinner.stop("✅ Links are saved to a log file");
		savingLinksSpinner.isOn = false;

		const filesDownloadingSpinner = spinner();
		// spinners.push({
		// 	sp: filesDownloadingSpinner,
		// 	errorMessage: "❎ At least one file couldn't be downloaded.",
		// });
		filesDownloadingSpinner.start("");
		filesDownloadingSpinner.stop("Started downloading files...");
		await download(["downloads"], parsedList, baseDirectoryName);

		// console.log(`/-- Downloaded All Folders --/`);
		outro(`Downloaded all folders and files, come visit soon ^^`);
	} catch (error) {
		spinners.forEach((spObject) => {
			if (spObject.sp.isOn) spObject.sp.stop(spObject.errorMessage);
		});

		cancel(error.cancelationMessage);

		if (!devMode) {
			// outro(`I wish that the issue is solved soon!`);
			process.exit(0);
		}

		intro(`Error Tracer`);

		const isErrorNeedsToBeTraced = await select({
			message:
				"An error happened, do you want to trace it for debugging purposes or just to know it?",
			options: [
				{ value: true, label: "Yes, trace it." },
				{ value: false, label: "No, the cancelation message was enough." },
			],
		});
		addCancelPrompt(isErrorNeedsToBeTraced, "Operation canceled.");

		if (isErrorNeedsToBeTraced) throw error;
		outro(`I wish you luck solving the issue ^^`);
	}
}
