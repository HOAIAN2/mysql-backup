import fs from 'fs';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import restoreSettings from './config/restore.js';
import runCommand from './utils/run-command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getListFiles() {
    const files = (await fs.promises.readdir(restoreSettings.targetDir)).map(file => path.join(restoreSettings.targetDir, file));
    if (Array.isArray(restoreSettings.includes)) {
        return files.filter(file => restoreSettings.includes.includes(file.replace('.sql', '')));
    }
    return files;
}

async function restoreFile(file) {
    const restoreCommand = [
        restoreSettings.restoreProgram,
        `--host=${restoreSettings.connection.host}`,
        `--user=${restoreSettings.connection.user}`,
        `--password=${restoreSettings.connection.password}`,
        restoreSettings.connection.database,
        `< ${file}`,
        restoreSettings.extraArgs
    ].join(' ');
    await runCommand(restoreCommand);
    return file;
}

async function main() {
    const listFiles = await getListFiles();
    const restoreMessage = `Restore ${listFiles.length} files`;
    console.time(restoreMessage);
    if (restoreSettings.parallel) {
        const restorePromises = listFiles.map(file => restoreFile(file));
        const result = await Promise.allSettled(restorePromises);
        result.forEach(promise => {
            if (promise.status === 'rejected') {
                console.log(promise);
            }
        });
    }
    else {
        for (const file of listFiles) {
            await restoreFile(file);
        }
    }
    console.timeEnd(restoreMessage);
}

main();