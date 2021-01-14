import {exec} from 'child_process';
import * as VC from 'vscode';

// let export CLM
exec('bash.exe -c "source ~/.profile; clm -lat essai"', (error, stdout, stderr) => {

});
