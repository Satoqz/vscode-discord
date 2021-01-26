import { TextDocument } from "vscode";
import icons from "./icons.json";

export function resolveIcon(document: TextDocument)
{
	let icon = icons.find(i =>
		i.matches.includes(resolveFileName(document.fileName)));
	if (!icon)
		icon = icons.find(i =>
			i.matches.includes(resolveFileExtension(document.fileName)));
	if (!icon)
		icon = icons.find(i =>
			i.matches.includes(document.languageId));

	return icon ? icon.key : "text";
}

export const resolveFileName = (file: string) =>
	file.split(/(\/)+|(\\)+/).pop();

export const resolveFileExtension = (file: string) =>
	file.split(".").pop();