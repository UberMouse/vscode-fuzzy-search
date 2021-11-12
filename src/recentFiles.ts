import * as vscode from 'vscode';
import { search as fuzzySearch } from 'fast-fuzzy';
import * as path from 'path';

export default class RecentFiles {
  recentFiles: {key:string, filePath:string}[];
  searchResults: string[];
  workspaceState: vscode.Memento;

  constructor(context: vscode.ExtensionContext) {
    this.workspaceState = context.workspaceState;
    this.recentFiles = this.workspaceState.get('recents', []);
    this.searchResults = [];
  }

  shortenFilePath(filePath: string) {
    const parsed = path.parse(filePath);
    const workspacePath =
    vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0].uri.path;
    return filePath.replace(`${workspacePath}` || '', '') + parsed.base;
  }

  addFile(filePath: string) {
    const existing = this.recentFiles.find(result => result.filePath === filePath);
    if (existing) {
      this.recentFiles = this.recentFiles.filter(result => result !== existing);
      this.recentFiles.unshift(existing);
    } else {
      this.recentFiles.unshift({key:this.shortenFilePath(filePath), filePath: filePath});
    }
    this.workspaceState.update('recents', this.recentFiles);
  }

  includes(filePath: string) {
    return !!this.recentFiles.find(item => item.filePath === filePath);
  }

  search(text: string) {
    const searchTerm = text.trim();
    const results =
      searchTerm.length > 0
        ? fuzzySearch(text, this.recentFiles, { threshold: 0.7, keySelector: (obj) => obj.key })
        : this.recentFiles;

    this.searchResults = results.map(r => r.filePath);
  }
}
