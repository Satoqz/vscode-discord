//this is horrible, i made it for fun only, okay ????? OKAY !!!!!
import { workspace, TextDocumentChangeEvent, window, debug, ExtensionContext, StatusBarAlignment, StatusBarItem, TextEditor } from "vscode";
import { Client, register, Presence } from "discord-rpc";
import { imageKeys } from "./imageKeys";

const rpcData: Presence = {};

const clientId = "732565262704050298";

const rpc = new Client({ transport: "ipc" });

let statusBar: StatusBarItem;

let activeTimeout: NodeJS.Timeout;

export function activate(context: ExtensionContext) {

	statusBar = window.createStatusBarItem(StatusBarAlignment.Left, 100);
	context.subscriptions.push(statusBar);
	statusBar.text = "Connecting to Discord...";
	statusBar.show();
	statusBar.tooltip

	activateRPC();

}

function activateRPC() {

	// connect to discord
	register(clientId);

	rpc.login({ clientId }).catch(console.error);

	// once connected, start sending rich presence requests and listening to the vscode api
	rpc.on("ready", () => {
		
		statusBar.text = "Connected to Discord";

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

		// determine activity verb
		const activity: string = debug.activeDebugSession ? "Debugging" : "Editing";
		
		rpcData.details = `${activity} ${resolveFileName(e.document.fileName)}`;

		//current line count sometimes lacks behind when removing a lot of lines, wo we'll sync it
		const currentLine = window.activeTextEditor.selection.active.line + 1 > e.document.lineCount ? e.document.lineCount : window.activeTextEditor.selection.active.line + 1;

		setImageByLang(e.document.languageId);

		// if there are unsaved changes, add it behind the comma
		rpcData.largeImageText = `${e.document.languageId} file, on line ${currentLine}/${e.document.lineCount}${e.document.isDirty ? ", unsaved changes" : ""}`;
		
		setActive(true);

		setRPC();
	});

	window.onDidChangeActiveTextEditor((e: TextEditor) => {

		// determine activity verb
		// file has only been opened, so just "viewing"
		const activity: string = debug.activeDebugSession ? "Debugging" : "Viewing";
	
		rpcData.details = `${activity} ${resolveFileName(e.document.fileName)}`;

		// new file, new timer
		rpcData.startTimestamp = new Date();

		// catch missing workspace
		rpcData.state = workspace.name ? `in ${workspace.name}` : "No workspace 😳";

		setImageByLang(e.document.languageId);

		rpcData.largeImageText = `${e.document.languageId} file, ${e.document.lineCount} line${e.document.lineCount == 1 ? "" : "s"}`;

		setActive(true);

		setRPC();
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

function setImageByLang(id: string) {
	const image = imageKeys.find(i => i.matches.includes(id));
	// fallback to standard icon if no language-specific image was found
	rpcData.largeImageKey = image ? image.key : "vscode";
}

// will remove the path and leave the actual filename
const resolveFileName = (file: string): string | undefined => file.split("\\").pop();