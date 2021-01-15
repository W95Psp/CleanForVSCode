'use strict';
import {
	TextDocument, Position, CancellationToken, ExtensionContext,CompletionItemProvider,CompletionItem,Range,
	languages,window,commands, MarkdownString, DiagnosticCollection, Diagnostic, DiagnosticSeverity,
	ShellExecution, Uri, workspace, QuickPickItem, OutputChannel, env
} from 'vscode';
import { normalize, format, parse } from 'path';
import { askCloogle, askCloogleExact, getInterestingStringFrom, toQuickPickItem } from './cloogle';
import { Let, Tuple, MakeList } from './tools';
import { cpm, getProjectPath, useBOW } from './cpm';
import { spawn } from 'child_process';

let config_useExportedTypes = workspace.getConfiguration("cleanlang").useExportedTypes === true;
let config_preferExportedTypes = workspace.getConfiguration("cleanlang").preferExportedTypes === true;

export function activate(context: ExtensionContext) {
	let computedTypes = {};

	console.log('CleanLang is active.');

	let disposable = commands.registerCommand('extension.clean.cloogle', async () : Promise<any> => {
		let editor = window.activeTextEditor;
		if (!editor) {
			return;
		}

		let selection = editor.selection;
		if (selection.start === selection.end) {
			return;
		}

		let text = editor.document.getText(selection).trim();

		let results = (await askCloogle(text)).map(result => toQuickPickItem(result));

		if (results.length == 0) {
			return;
		}
		window.showQuickPick(results).then((item) => {
			if (item) {
				env.openExternal(Uri.parse(item.itemLocation));
			}
		});
	});

	context.subscriptions.push(disposable);

	let regexpParseErrors = /^\s*(Warning|Type error|Error|Overloading .rror|Uniqueness .rror|Parse .rror) \[([\w\.]+),(\d+)(?:;(\d+))?(?:,([^,]*))?]:(.*)((\n\s.*)*)/mg;

	let newDiagnosticCollection = () => languages.createDiagnosticCollection('clean');
	let diagnostics = newDiagnosticCollection();

	let lastOut: OutputChannel;
	let cpmMake = async () => {
		let editor = window.activeTextEditor;

		let path = getProjectPath(parse(window.activeTextEditor.document.fileName).dir);
		if (path instanceof Error) {
			window.showErrorMessage('Could not detect any *.prj file in any parent directories');
			return false;
		}

		diagnostics.clear();

		lastOut && lastOut.dispose();
		process.chdir(path);
		let out = window.createOutputChannel("CPM");
		lastOut = out;
		out.show();
		let cpmResult = await cpm('essai', l => {
			out.appendLine(l);
			if(config_useExportedTypes){
				let t = l.match(/^(\w*`?|[-~@#$%^?!+*<>\/|&=:.]+)\s*::\s*(.*)[\s\n]*$/);
				if(t)
					computedTypes[t[1]] = t[2];
			}
		});

		if(cpmResult instanceof Error){
			window.showErrorMessage(cpmResult.message);
			return false;
		}

		let errors = MakeList(() => Let(regexpParseErrors.exec(<string>cpmResult), value => ({ value, done: !value })))
			.filter(o => o)
			.map(([,errorName,fName,l,c,oth,msg,more,]) => Tuple(errorName,fName,l,c,oth,msg,(more||'').split('\n').map(o => o.trim())));

		let derrors = errors.map(([n,fName,l,c,,msg,more]) => Tuple(
			Uri.file(path+'/'+fName.replace(/\.(?=.{4})/g, '/')),
			[new Diagnostic(
				c!==undefined && (+c).toString() === c.toString() ?
					new Range(new Position(+l, +c), new Position(+l, +c + 1))
						:
							new Range(new Position(+l-1, 0), new Position(+l, 0)),
						n+': '+msg+'\n'+(more||[]).join('\n')
			, n=='Warning' ? DiagnosticSeverity.Warning : DiagnosticSeverity.Error
			)]
		));
		diagnostics.set(derrors);

		let executable = (cpmResult.match(/^Linking '(.*?)'$/m) || [])[1] || '';

		return {executable, out};
	};

	let disposableCpmMake = commands.registerCommand('extension.cpmMake', cpmMake);
	let disposableCpmMakeExec = commands.registerCommand('extension.cpmMakeExec', async () => {
		let result = await cpmMake();

		if(result === false)
			return;

		let t = window.createTerminal("Clean program", useBOW ? "C:/Windows/System32/bash.exe" : undefined)
		t.show();
		t.sendText('./'+result.executable);
	});

	context.subscriptions.push(disposableCpmMake);
	context.subscriptions.push(disposableCpmMakeExec);
}

export function deactivate() {}
