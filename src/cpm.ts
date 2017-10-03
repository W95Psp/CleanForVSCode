import {exec} from 'child_process';
import {existsSync} from 'fs';
import * as VC from 'vscode';

let getCommand = () => {
    let isWin = /^win/.test(process.platform);
    if(isWin){
        if(existsSync('C:/Windows/System32/bash.exe')){
            // return (projectName) => 'bash.exe -c "source ~/.profile; clm -lat '+projectName+'"';
            return (projectName) => 'bash.exe -c "source ~/.profile; clm make"';
        }else{
            throw 'NOT SUPPORTED YET';
            // return (projectName) => 'clm -lat '+projectName+'';            
        }
    }else{
        throw 'NOT SUPPORTED YET';
    }
};
let cmd: ((projectName: string) => string) = getCommand();

let treatResult = (s: string) => /^No project file found/.test(s) ? new Error('CPM: '+s) : s;
export let cpm = async (projectName: string) => 
    new Promise<string | Error>((a,r) =>
        exec('bash.exe -c "source ~/.profile; clm -lat essai"', (error, stdout, stderr) => a(stderr))
    );