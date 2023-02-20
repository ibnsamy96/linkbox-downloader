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
linksSpinner.start("Fetching Links");
let mainDirectoryName = pid && (await getBaseFolderName(pid));
// console.log(mainDirectoryName);
const parsedList = await getAllDownloadLinks(shareToken, pid);
linksSpinner.stop("Finished Downloading Links");

saveFetchedUrls(mainDirectoryName, shareLink, parsedList);

// const filesDownloadingSpinner = spinner();
// filesDownloadingSpinner.start("Downloading Files");
// await download(shareToken, pid);
// filesDownloadingSpinner.stop("Finished Downloading Files");

outro(`You're all set!`);
