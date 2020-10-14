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
	return (
		icons.find(i =>
			i.matches.includes(resolveFileName(document.fileName)))
		?? icons.find(i =>
			i.matches.includes(resolveFileExtension(document.fileName)))
		?? icons.find(i =>
			i.matches.includes(document.languageId))
	).key ?? "file";
}

export const resolveFileName = (file: string) =>
	file.split(/(\/)+|(\\)+/).pop();

export const resolveFileExtension = (file: string) =>
	file.split(".").pop();