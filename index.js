// import download from "./downloader.js";
import download, {
	parseLink,
	getAllDownloadLinks,
	saveFetchedUrls,
	getBaseFolderName,
} from "./downloader.js";
import { intro, outro, text, spinner, note } from "@clack/prompts";
import { addCancelPrompt } from "./utils.js";

intro(`Welcome to LinkBox Downloader`);

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
linksSpinner.start("⏳ Fetching directory links");
let baseDirectoryName = pid && (await getBaseFolderName(pid));
// console.log(mainDirectoryName);
const parsedList = await getAllDownloadLinks(shareToken, pid);
linksSpinner.stop("✅ All directory links are fetched");
// console.log(parsedList);

const savingLinksSpinner = spinner();
savingLinksSpinner.start("⏳ Saving links to a log file");
saveFetchedUrls(baseDirectoryName, shareLink, parsedList);
savingLinksSpinner.stop("✅ Links are saved to a log file");

// const filesDownloadingSpinner = spinner();
// filesDownloadingSpinner.start("Downloading Files");
await download(["downloads"], parsedList, baseDirectoryName);

console.log(`/-- Downloaded All Folders --/`);

// filesDownloadingSpinner.stop("Finished Downloading Files");

outro(`You're all set!`);
