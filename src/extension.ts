'use strict';
import {
	TextDocument, Position, CancellationToken, ExtensionContext,CompletionItemProvider,CompletionItem,Hover,Range,
	languages,window,commands, MarkdownString, DiagnosticCollection, Diagnostic, DiagnosticSeverity,
	ShellExecution, Uri, workspace
} from 'vscode';
import { normalize, format, parse } from 'path';
import { askCloogle, askCloogleExact, getInterestingStringFrom } from './cloogle';
import { Let, Tuple, MakeList } from './tools';
import { cpm, getProjectPath, useBOW } from './cpm';
import { spawn } from 'child_process';

let config_useExportedTypes = workspace.getConfiguration("cleanlang").useExportedTypes === true;
let config_preferExportedTypes  = workspace.getConfiguration("cleanlang").preferExportedTypes === true;

export function activate(context: ExtensionContext) {
	let computedTypes = {};

	console.log('CleanLang is active.');

	languages.registerHoverProvider('clean', {
		async provideHover(document, position, token) {
			let editor = window.activeTextEditor;
			let regex = /([-~@#$%^?!+*<>\/|&=:.]+|(\w*`|\w+))/;
			let rangeVarName = editor.document.getWordRangeAtPosition(position, regex);

			if (!rangeVarName) // undefined if regex not match
				return;
			let varName = editor.document.getText(rangeVarName); // if rangeVarName==undefined, then everything is selected

			let precomputed;
			if(varName in computedTypes)
				precomputed = new Hover(computedTypes[varName]);

			if(precomputed && config_preferExportedTypes) {
				return precomputed;
			} else {
				let results = (await askCloogle(varName)).map(result => {
					let [TypeData, [GeneralData, Specifics]] = result;

					if(GeneralData.builtin && TypeData != 'SyntaxResult')
						return [{value: ':: '+varName, language: 'clean'}];

					let link = (line: number, icl=false) =>
						`https://cloogle.org/src#${GeneralData.library}/${GeneralData.modul.replace(/\./g,'/')}${icl ? ';icl' : ''};line=${line}`;
						let head = new MarkdownString(
							`[[+]](https://cloogle.org/#${encodeURI(varName)}) ${GeneralData.library}: ${GeneralData.modul} ([dcl:${GeneralData.dcl_line}](${link(GeneralData.dcl_line)}):[icl:${GeneralData.icl_line}](${link(GeneralData.icl_line, true)}))`
						);
						let listResults:string[] = Let(getInterestingStringFrom(result), t => t instanceof Array ? t : [t]);
						[head, ...listResults.map(value => ({value, language: 'clean'}))];
				}).flatten();
				if(results.length < 1)
					return new Hover(results);
			}
			return precomputed;
		}
	});

	let regexpParseErrors = /^\s*(Warning|Type error|Error|Overloading .rror|Uniqueness .rror|Parse .rror) \[([\w\.]+),(\d+)(?:;(\d+))?(?:,([^,]*))?]:(.*)((\n\s.*)*)/mg;

	let newDiagnosticCollection = () => languages.createDiagnosticCollection('clean');
	let diagnostics = newDiagnosticCollection();

	let lastOut;
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

	let disposableCpmMake       = commands.registerCommand('extension.cpmMake', cpmMake);
	let disposableCpmMakeExec   = commands.registerCommand('extension.cpmMakeExec', async () => {
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
