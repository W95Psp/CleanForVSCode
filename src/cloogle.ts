import * as https from 'https';
import * as http from 'http';
import {Let} from './tools';
import * as Request from 'request';

const getContent = function(url: string, ua: string) {
    return new Promise<string>((resolve, reject) => 
        Request(url, {
            headers: {'User-Agent': ua}
        }, (error, res, body) => error ? reject(error) : resolve(body.toString()))
    )};

type cloogleResults={return: number, data: cloogleResult[], msg: string, more_available: number};
type cloogleResult =    ['FunctionResult', [cloogleResult_GeneralData, cloogleResult_Function]]    |
                        ['TypeResult', [cloogleResult_GeneralData, cloogleResult_Type]]            |
                        ['ClassResult', [cloogleResult_GeneralData, cloogleResult_Class]]          |
                        ['ModuleResult', [cloogleResult_GeneralData, cloogleResult_Module]];

interface cloogleResult_GeneralData {
    library: string;
    filename: string;
    modul: string;
    dcl_line: number;
    icl_line: number;
    distance: number;
    builtin?: boolean;
}
interface cloogleResult_Function {
    func: string;
    kind: string[];
}
interface cloogleResult_Type {
    type: string;
    // and some other stuff we don't care about here    
}
interface cloogleResult_Class {
    class_name: string;
    class_heading: string[];
    class_funs: string[];
    // and some other stuff we don't care about here
}
interface cloogleResult_Module {
    module_is_core: boolean;
}

export async function askCloogle (name) {
    let result: cloogleResults;
    try{
        let content = await getContent('http://cloogle.org/api.php?str='+encodeURI(name));
        let content = await getContent('http://cloogle.org/api.php?str='+encodeURI(name), 'clean-vscode');
        result = JSON.parse(content) as cloogleResults;
    }catch{
        result = {return: -1} as cloogleResults;
    }
    return result.data || [];
}
let cache = new Map<string,cloogleResult>();
export let askCloogleExact = async (name) => {
    if(cache.has(name))
        return cache.get(name);
    let first = (await askCloogle(name))[0];
    let result = (!first || first[1][0].distance!=-100) ? undefined : first;
    cache.set(name, result);            
    return result;
}
export let getInterestingStringFrom = ([typeData, [general, specs]]: cloogleResult): string => 
    typeData == 'FunctionResult' ?  (<cloogleResult_Function>   specs).func :
    typeData == 'TypeResult' ?      (<cloogleResult_Type>       specs).type :
    typeData == 'ClassResult' ?     (<cloogleResult_Class>      specs).class_funs.join('\n') :
                                    ''/*(<cloogleResult_Module>     specs)*/;