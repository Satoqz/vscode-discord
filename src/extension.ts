// this is horrible, i made it for fun only, okay ????? OKAY !!!!!
import { workspace, TextDocumentChangeEvent, window, debug, ExtensionContext, StatusBarAlignment, StatusBarItem, TextEditor, languages, TextDocument, DiagnosticSeverity } from "vscode";
import { Client, register, Presence } from "discord-rpc";
import imageKeys from "./imageKeys.json";

const rpcData: Presence = {};

const clientId = "732565262704050298";

const rpc = new Client({ transport: "ipc" });

let statusBar: StatusBarItem;

let activeTimeout: NodeJS.Timeout;

let errorCount: number = 0;

export function activate(context: ExtensionContext) {

	statusBar = window.createStatusBarItem(StatusBarAlignment.Left, 100);
	context.subscriptions.push(statusBar);
	statusBar.text = "$(vm-connect)";
	statusBar.tooltip = "Connecting to Discord...";
	statusBar.show();

	activateRPC();

}

function activateRPC() {

	// connect to discord
	register(clientId);
	rpc.login({ clientId }).catch(console.error);

	// once connected, start sending rich presence requests and listening to the vscode api
	rpc.on("ready", () => {
		
		statusBar.text = "$(vm-active)";
		statusBar.tooltip = "Connected to Discord";

		// set "vscode just launched" presence
		rpcData.details = "No file opened";
		rpcData.state = workspace.name ? `in ${workspace.name}` : "No workspace 😳";
		rpcData.smallImageKey = "active";
		rpcData.smallImageText = "Active in VSCode";
    	rpcData.largeImageKey = "vscode";
		rpcData.largeImageText = "What will they code?!? 😳";
		rpcData.instance = true;
		setRPC();

		// refresh presence every minute to catch unfocusing the window
		activeTimeout = setInterval(() => {

			if(window.state.focused) setActive(true);
			else setActive(false);

			setRPC();

		}, 1000*60);

		registerVSCodeEvents();
	});
}

function registerVSCodeEvents() {

	workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => {

		if(e.document.fileName.endsWith(".git")) return;

		if(e.document.languageId == "scminput") {
			rpcData.largeImageKey = "git";
			rpcData.details = "Writing a commit message";
		}
		else {
			// determine activity verb
			const activity: string = debug.activeDebugSession ? "Debugging" : "Editing";
		
			rpcData.details = `${activity} ${resolveFileName(e.document.fileName)} | ${errorCount} problem${errorCount == 1?"":"s"} found`;

			//current line count sometimes lacks behind when removing a lot of lines, wo we'll sync it
			const currentLine = window.activeTextEditor.selection.active.line + 1 > e.document.lineCount ? e.document.lineCount : window.activeTextEditor.selection.active.line + 1;

			setImageByLang(e.document);

			// if there are unsaved changes, add it behind the comma
			rpcData.largeImageText = `${e.document.languageId} file, on line ${currentLine}/${e.document.lineCount}${e.document.isDirty ? ", unsaved changes" : ""}`;
		}
		
		
		setActive(true);

		setRPC();
	});

	window.onDidChangeActiveTextEditor((e: TextEditor) => {
		// will be undefined if no TextEditor is open anymore (editor closed instead of switched)
		if(e) {
			// determine activity verb
			// file has only been opened, so just "viewing"
			const activity: string = debug.activeDebugSession ? "Debugging" : "Viewing";
		
			rpcData.details = `${activity} ${resolveFileName(e.document.fileName)} | ${errorCount} problem${errorCount == 1?"":"s"} found`;

			// catch missing workspace
			rpcData.state = workspace.name ? `in ${workspace.name}` : "No workspace 😳";

			setImageByLang(e.document);

			rpcData.largeImageText = `${e.document.languageId} file, ${e.document.lineCount} line${e.document.lineCount == 1 ? "" : "s"}`;

			setActive(true);

			// new file status, new timer
			rpcData.startTimestamp = new Date();

			setRPC();
		}
		else {
			/*	
			when the file is only switched, this will still be triggered a short time before the actual event
			To prevent an unnecessary call, let's log the old status, wait half a second and check whether it is still the same
			Only continue if the status is still the same, indicating that the editor has actually been closed and not just changed
			*/
			const temp = rpcData.details;
			setTimeout(() => {
				if(temp == rpcData.details) {
					rpcData.details = "No file opened";

					rpcData.largeImageKey = "vscode";

					rpcData.largeImageText = "Nothing going on 😢";

					rpcData.state = workspace.name ? `in ${workspace.name}` : "No workspace 😳";

					// new file status, new timer
					rpcData.startTimestamp = new Date();

					setRPC();
				}
			}, 500);
		}
	});

	//catch debug session start and stop immediately
	debug.onDidStartDebugSession(() => {
		setActive(true);
		// remove activity verb and put "Debugging"
		rpcData.details = `Debugging ${rpcData.details.split(" ").slice(1, Infinity).join(" ")}`;
		setRPC();
	});

	debug.onDidTerminateDebugSession(() => {
		// same thing in reverse
		rpcData.details = `Viewing ${rpcData.details.split(" ").slice(1, Infinity).join(" ")}`;
		setRPC();
	});

	languages.onDidChangeDiagnostics(() => {
		const diag = languages.getDiagnostics();
		let counted: number = 0;
		diag.forEach(i => {
			if(i[1]) {
				i[1].forEach(i => {
					if(i.severity == DiagnosticSeverity.Warning || i.severity == DiagnosticSeverity.Error) counted++;
				});
			}
		});
		errorCount = counted;
	});
}

function setRPC() {
	if(true) rpc.setActivity(rpcData);
}

function setActive(active: boolean) {
	//refresh activity status, will require calling setRPC() afterwards
	activeTimeout.refresh();
	rpcData.smallImageKey = active ? "active" : "inactive";
	rpcData.smallImageText = `${active ? "Active" : "Inactive"} in VSCode`;
}

function setImageByLang(document: TextDocument) {
	let image = imageKeys.find(i => i.matches.includes(resolveFileName(document.fileName)));
	if(!image) image = imageKeys.find(i => i.matches.includes(resolveFileExtension(document.fileName)));
	if(!image) image = imageKeys.find(i => i.matches.includes(document.languageId));
	// fallback to standard file icon if no language-specific image was found
	rpcData.largeImageKey = image ? image.key : "file";
}

// will remove the path and leave the actual filename
const resolveFileName = (file: string): string | undefined => file.split(/(\/)+|(\\)+/).pop();

const resolveFileExtension = (file: string): string | undefined => file.split(".").pop();
