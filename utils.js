import { isCancel, cancel, note } from "@clack/prompts";

export const addCancelPrompt = (inputField, cancelationMessage) => {
	if (isCancel(inputField)) {
		cancel(cancelationMessage);
		process.exit(0);
	}
};

export const addNote = (title, message) => {
	note(message, title);
};
