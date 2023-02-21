// import download from "./downloader.js";
import download, {
	parseLink,
	getAllDownloadLinks,
	saveFetchedUrls,
	getBaseFolderName,
} from "./downloader.js";
import {
	intro,
	outro,
	text,
	spinner,
	note,
	cancel,
	select,
} from "@clack/prompts";
import { addCancelPrompt } from "./utils.js";

const spinners = [];

try {
	intro(`Welcome to LinkBox Downloader`);

	const shareLink = await text({
		message: "What is the link to be downloaded?",
		placeholder: "https://www.linkbox.to/a/s/<share-token>?pid=<folder-pid>",
		// validate: (text) => {
		// 	const linkboxRegex =
		// 		/^https?:\/\/(?:www\.)?linkbox\.to\/[a-z]\/[a-z]\/[a-zA-Z0-9]+(\?pid=[0-9]+)?$/;
		// 	if (!linkboxRegex.test(text))
		// 		return `Text doesn't seem to represent a linkbox link.`;
		// },
	});

	addCancelPrompt(shareLink, "Operation canceled.");

	const { shareToken, pid } = parseLink(shareLink);

	const linksSpinner = spinner();
	spinners.push({
		sp: linksSpinner,
		errorMessage: "❎ Directory links couldn't be fetched",
	});
	linksSpinner.start("⏳ Fetching directory links");
	let baseDirectoryName = pid && (await getBaseFolderName(pid));
	// console.log(mainDirectoryName);
	const parsedList = await getAllDownloadLinks(shareToken, pid);
	linksSpinner.stop("✅ All directory links are fetched");
	// console.log(parsedList);

	const savingLinksSpinner = spinner();
	spinners.push({
		sp: savingLinksSpinner,
		errorMessage: "❎ Links couldn't saved to a log file",
	});
	savingLinksSpinner.start("⏳ Saving links to a log file");
	saveFetchedUrls(baseDirectoryName, shareLink, parsedList);
	savingLinksSpinner.stop("✅ Links are saved to a log file");

	// const filesDownloadingSpinner = spinner();
	// filesDownloadingSpinner.start("Downloading Files");
	await download(["downloads"], parsedList, baseDirectoryName);

	console.log(`/-- Downloaded All Folders --/`);

	// filesDownloadingSpinner.stop("Finished Downloading Files");
	outro(`You're all set!`);
} catch (error) {
	spinners.forEach((spObject) => {
		spObject.sp.stop(spObject.errorMessage);
	});

	const isErrorNeedsToBeTraced = await select({
		message:
			"An error happened, do you want to trace it for debugging purposes or just to know it?",
		options: [
			{ value: true, label: "Yes, trace it." },
			{ value: false, label: "No, just give me the cancelation message." },
		],
	});

	if (isErrorNeedsToBeTraced) throw error;

	cancel(error.cancelationMessage);
	process.exit(0);
}
