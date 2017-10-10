import {exec, spawn} from 'child_process';
import {existsSync, readdir, readdirSync, lstatSync, readFile} from 'fs';
import {parse, format, normalize} from 'path';
import {Tuple, Let, ithrow} from './tools';
import * as VC from 'vscode';

let cleanHome = parse(normalize('C:/Users/wpsp/clean-bundle-complete'));
let cleanLib = normalize(format(cleanHome) + '/lib');

let readdirPromise = (path: string) => new Promise<string[]>((a,r) => readdir(path, (err,res) => err ? r(err) : a(res)));
let readFilePromise = (path: string) => new Promise<string>((a,r) => readFile(normalize(path), (err,res) => err ? a('') : a(res.toString())));

let searchRecursivelyForDCLs = async (path: string) : Promise<[string, string[]][]> => {
    let lst = (await readdirPromise(path)).map(o => path+'/'+o)
                .filter(p => Let(parse(p).ext, e => !e || e=='.dcl'));
    let [dirs, files] = lst.split<string, string, string[][]>(<any>(o => lstatSync(o).isDirectory()), (l, r) => [l, r]);
    let dcls = files.filter(o => parse(o).ext == '.dcl');
    let modules = (await dcls.mapPromises(async o => 
        ((await readFilePromise(o)).match(/definition module .*/g)||[]).map(o => o.substr(18).trim().split('.'))
    )).flatten().getUniqueValues().map(m => Tuple(path, m));

    return modules.concat((await dirs.mapPromises(searchRecursivelyForDCLs)).flatten());
}
// let libsPaths = [];
// let fetchLibPaths = async () => {
//     let result = (await [cleanLib, '.'].mapPromises(searchRecursivelyForDCLs)).flatten();
//     let paths = new Set<string>();
//     let f = (l:any[]) => '/'+new Array(l.length-1).fill('..').join('/');
//     libsPaths = result.map(([path, module]) => normalize(normalize(path+f(module))+'/')).getUniqueValues();
//     return 0;
// }
// fetchLibPaths();

export let getProjectPath = (dir: string) : string | Error => 
    readdirSync(dir).some(o => o.slice(-4)=='.prj') ? dir :
        parse(dir).root==dir ? new Error('No project file found') : getProjectPath(normalize(dir+'/..'));

let getCommand = () => {
    let isWin = /^win/.test(process.platform);
    if(isWin){
        if(existsSync('C:/Windows/System32/bash.exe')){
            // return (name) => 'bash.exe -c "source ~/.profile; clm -lat '+name+'"';
            return (name) => ['bash.exe', '-c', 'source ~/.profile; cpm make']
        }else{
            return (name) => ['clm', 'make'];
            // return (name) => 'clm -lat '+name+'';            
        }
    }else{
        return (name) => ['clm', 'make'];
    }
};
let cmd: ((name: string) => string[]) = getCommand();

let treatResult = (s: string) => (console.log(s), /^No project file found/.test(s) ? new Error('CPM: '+s) : s);

export let cpm = async (name: string, newLine?: (line: string) => any) => 
    new Promise<string | Error>((a,r) => {
        let c = cmd(name);
        let p = spawn(c[0], c.slice(1));
        let left = '';
        let lines = [];
        let addl = (l: string) => (lines.push(l), newLine && newLine(l), l);
        let end = () => a(treatResult(lines.join('\n')));
        p.stdout.on("data", (chunk) => {
            let s = chunk.toString();
            let i = s.lastIndexOf('\n');
            if(i > -1){
                addl(left + s.substr(0, i))
                left = s.substr(i + 1);
            }else
                left += s;
        });
        p.stdout.on("error", (err) => (addl('ERROR: '+err.toString()), end()));
        p.stdout.on("close", () => ([left, ' ', 'Program done'].map(x => x && addl(x), end())));
    });