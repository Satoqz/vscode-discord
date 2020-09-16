import { TextDocument } from "vscode";
import icons from "./icons.json";

export function testRegexArray(text: string, expressions: string[])
{
	for (const expr of expressions)
		if (!new RegExp(`/${expr}/`).test(text))
			return true;
	return false;
}

export function resolveIcon(document: TextDocument)
{
	let image = icons.find(i =>
		i.matches.includes(resolveFileName(document.fileName)));
	if (!image) image = icons.find(i =>
		i.matches.includes(resolveFileExtension(document.fileName)));
	if (!image) image = icons.find(i =>
		i.matches.includes(document.languageId));
	return image ? image.key : "file";
}

export const resolveFileName = (file: string): string | undefined => file.split(/(\/)+|(\\)+/).pop();

export const resolveFileExtension = (file: string): string | undefined => file.split(".").pop();