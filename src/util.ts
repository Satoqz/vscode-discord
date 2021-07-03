import type { TextDocument } from "vscode";
import icons from "./icons.json";

export class PathInfo {
  constructor(private doc: TextDocument) {}

  private setFolderAndFileName() {
    const segments = this.doc.fileName.split(/\/+|\\+/).filter((v) => v);
    this._fileName = segments.pop();
    this._folder = segments.pop() ?? "/";
  }

  private _fileName?: string;
  public get fileName() {
    if (!this._fileName) {
      this.setFolderAndFileName();
    }
    return this._fileName;
  }

  private _folder?: string;
  public get folder() {
    if (!this._folder) {
      this.setFolderAndFileName();
    }
    return this._folder;
  }

  private _extension?: string;
  public get extension() {
    if (!this._extension) {
      if (this._fileName) this._extension = this._fileName.split(".").pop();
      else {
        this._extension = this.doc.fileName.split(".").pop();
      }
    }
    return this._extension;
  }

  private _icon?: string;
  public get icon() {
    if (!this._icon) {
      let icon = icons.find((i) =>
        i.matches.includes(this._fileName ?? this.fileName)
      );
      if (!icon)
        icon = icons.find((i) =>
          i.matches.includes(this._extension ?? this.extension)
        );
      if (!icon)
        icon = icons.find((i) => i.matches.includes(this.doc.languageId));
      this._icon = icon ? icon.key : "text";
    }
    return this._icon;
  }
}
