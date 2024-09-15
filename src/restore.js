import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import runCommand from './utils/run-command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
    host: process.env.RS_DB_HOST,
    user: process.env.RS_DB_USER,
    password: process.env.RS_DB_PASSWORD,
    database: process.env.RS_DB_DATABASE
};

async function getSQLFiles() {
    try {
        const files = await fs.promises.readdir(process.env.RESTORE_TARGET_DIR);
        return files.filter(file => file.endsWith('.sql'));
    } catch (error) {
        console.error('Error reading dump directory:', error);
        return [];
    }
}

async function restoreFile(fileName) {
    const filePath = path.join(process.env.RESTORE_TARGET_DIR, fileName);
    const restoreCommand = [
        'mysql',
        `--host=${dbConfig.host}`,
        `--user=${dbConfig.user}`,
        `--password=${dbConfig.password}`,
        dbConfig.database,
        `< ${filePath}`
    ].join(' ');
    await runCommand(restoreCommand);
    return fileName;
}

async function main() {
    let isError = false;
    const sqlFiles = await getSQLFiles();
    if (sqlFiles.length === 0) {
        console.log('No .sql files found.');
        return;
    }
    const message = `Restore ${sqlFiles.length} .sql files to database "${dbConfig.database}" on ${dbConfig.host}`;
    console.time(message);
    try {
        for (const file of sqlFiles) {
            await restoreFile(file);
        }
    } catch (error) {
        console.error('Error occurred during restore:', error);
        isError = true;
    }
    if (!isError) {
        console.timeEnd(message);
    }
}

main();