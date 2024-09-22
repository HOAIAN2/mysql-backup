import { exec as execCallback } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCallback);

export default async function runCommand(command = '') {
    const { stdout, stderr } = await exec(command);
    if (stderr) {
        Promise.reject(stderr);
    }
    return stdout;
}
