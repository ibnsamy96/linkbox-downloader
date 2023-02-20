import { isCancel, cancel } from "@clack/prompts";

export const addCancelPrompt = (inputField, cancelationMessage) => {
	if (isCancel(inputField)) {
		cancel(cancelationMessage);
		process.exit(0);
	}
};
