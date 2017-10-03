'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
    TextDocument, Position, CancellationToken, ExtensionContext,CompletionItemProvider,CompletionItem,Hover,Range,
    languages,window,commands, MarkdownString, DiagnosticCollection, Diagnostic, DiagnosticSeverity
} from 'vscode';
import {normalize, format, parse} from 'path'; 
import { askCloogle, askCloogleExact, getInterestingStringFrom } from './cloogle';
import { Let, Tuple } from './tools';
import { cpm } from './cpm';


class hey implements CompletionItemProvider {
    public async provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): Promise<CompletionItem[]> {
        return [new CompletionItem('hey')];
    }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
    let computedTypes = {};
    
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "clean" is now active!');

    let inv = (s: string) => s.split('').reverse().join(''); 
    languages.registerHoverProvider('clean', {
        async provideHover(document, position, token) {
            let editor = window.activeTextEditor;    
            let regex = /([-~@#$%^?!+*<>\/|&=:.]+|(\w*`|\w+))/;
            let rangeVarName = editor.document.getWordRangeAtPosition(position, regex);
            let varName = editor.document.getText(rangeVarName);
            if(varName in computedTypes)
                return new Hover(computedTypes[varName]);
            else{
                let result = await askCloogleExact(varName);
                if(!result)
                    return;
                let [TypeData, [GeneralData, Specifics]] = result;

                if(GeneralData.builtin)
                    return new Hover({value: ':: '+varName, language: 'clean'});
                
                let link = (line: number, icl=false) => 
                    `https://cloogle.org/src#${GeneralData.library}.${GeneralData.modul}${icl ? ';icl' : ''};line=${line}`;
                let head = new MarkdownString(
                    `[[+]](https://cloogle.org/#${encodeURI(varName)}) ${GeneralData.library}: ${GeneralData.modul} ([dcl:${GeneralData.dcl_line}](${link(GeneralData.dcl_line)}):[icl:${GeneralData.icl_line}](${link(GeneralData.icl_line, true)}))`
                );
                return new Hover([head, {value: getInterestingStringFrom(result), language: 'clean'}]);
            }
        }
    });

    let regexpParseErrors = /^\s*(Type error|Error|Overloading .rror|Uniqueness .rror|Parse .rror) \[\w+.\w+,(\d+)(?:;(\d+))?(?:,([^,]*))?]: (.*)((\n\s.*)*)/;

    let newDiagnosticCollection = () => languages.createDiagnosticCollection('clean');
    let diagnostics = newDiagnosticCollection();
    
    languages.registerCompletionItemProvider('clean', new hey(), 'h');
    
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = commands.registerCommand('extension.sayHello', async () => {
        let editor = window.activeTextEditor;
        
        let path = parse(window.activeTextEditor.document.fileName).dir;

        process.chdir(path);
        let cpmResult = await cpm('essai');
        if(cpmResult instanceof Error)
            return window.showErrorMessage(cpmResult.message);

        let outs = cpmResult.split(/\n(?=[^\s])/).filter(o => o);
        let types = outs.map(m => m.match(/^(\w*`?|[-~@#$%^?!+*<>\/|&=:.]+)\s*::\s*(.*)[\s\n]*$/)).filter(o => o);
        types.forEach(([,n,t]) => computedTypes[n] = t);

        let errors = outs.map(m => m.match(regexpParseErrors))
                .filter(o => o)
                .map(([,errorName,l,c,oth,msg,more,]) => Tuple(errorName,l,c,oth,msg,more.split('\n').map(o => o.trim())));
        
        diagnostics.set(editor.document.uri, errors.map(([n,l,c,,msg,more]) => (
            new Diagnostic(
                c!==undefined && (+c).toString() === c.toString() ?
                    new Range(new Position(+l, +c), new Position(+l, +c + 1))
                        :
                    new Range(new Position(+l-1, 0), new Position(+l, 0)),
                n+': '+msg+'\n'+more.join('\n')
                , DiagnosticSeverity.Error
            )
        )))
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}