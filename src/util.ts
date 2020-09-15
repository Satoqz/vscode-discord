export function testRegexArray(text: string, expressions: string[]) {
	for (const expr of expressions) {
		if (!new RegExp(expr).test(text))
			return true;
	}
	return false;
}

export const resolveFileName = (file: string): string | undefined => file.split(/(\/)+|(\\)+/).pop();

export const resolveFileExtension = (file: string): string | undefined => file.split(".").pop();