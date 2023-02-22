import { isCancel, cancel, note, spinner } from "@clack/prompts";

export const addCancelPrompt = (inputField, cancelationMessage) => {
	if (isCancel(inputField)) {
		cancel(cancelationMessage);
		process.exit(0);
	}
};

export const addNote = (title, message) => {
	note(message, title);
};

export const addTimer = (startMessage, errorMessage, spinnersArray) => {
	const sp = spinner();
	spinnersArray.push({
		sp,
		errorMessage,
	});
	sp.start(startMessage);
	return sp;
};
