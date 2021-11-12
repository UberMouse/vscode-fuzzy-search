import * as vscode from 'vscode';
import filePathToQuickPickItem from './helpers/filePathToQuickPickItem';
import RecentFiles from './recentFiles';
import Search from './search';
import { QuickPickItem } from './types';

export default class FuzzySearch {
  private search = new Search();
  private recentFiles: RecentFiles;
  private quickPick = vscode.window.createQuickPick<QuickPickItem>();
  private timeout: any;

  constructor(context: vscode.ExtensionContext) {
    this.recentFiles = new RecentFiles(context);
    this.onDidChangeValue = this.onDidChangeValue.bind(this);
    this.onAccept = this.onAccept.bind(this);

    this.search.onData(searchItems => {
      try {
        const quickPickItems = [...new Set([...this.recentFiles.searchResults, ...searchItems])]
          .slice(0, 10)
          .map((filePath) =>
            filePathToQuickPickItem(filePath, this.recentFiles.searchResults.includes(filePath))
          );

        this.quickPick.items = quickPickItems;
      } finally {
        this.quickPick.busy = false;
      }
    });

    this.quickPick.placeholder = "Fuzzy search";
    this.quickPick.matchOnDescription = true;
    (this.quickPick as any).sortByLabel = false;

    this.quickPick.onDidChangeValue(this.onDidChangeValue);
    this.quickPick.onDidAccept(this.onAccept);

    this.quickPick.show();

    this.find('');
  }

  private onDidChangeValue(value: string) {
    this.find(value);
  }

  private find(value: string) {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      this.quickPick.busy = true;
      const searchTerm = value.toString();
      this.recentFiles.search(searchTerm);
      this.search.search(searchTerm);
    }, 200);
  }

  onAccept(e: any) {
    const selectedItem = this.quickPick.selectedItems[0].filePath;
    if (selectedItem) {
      this.recentFiles.addFile(selectedItem);
      vscode.workspace.openTextDocument(vscode.Uri.file(selectedItem)).then((doc) => {
        vscode.window.showTextDocument(doc);
      });
    }
    this.quickPick.hide();
  }
}
