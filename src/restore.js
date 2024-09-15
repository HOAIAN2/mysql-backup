const mysql = require('mysql2/promise');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Database config
const dbConfig = {
    host: process.env.RS_DB_HOST,
    user: process.env.RS_DB_USER,
    password: process.env.RS_DB_PASSWORD,
    database: process.env.RS_DB_DATABASE
};

const dumpDir = path.join(__dirname, '..', 'dumps', process.env.RESTORE_TARGET_DIR);

async function getSQLFiles() {
    try {
        const files = await fs.promises.readdir(dumpDir);
        return files.filter(file => file.endsWith('.sql'));
    } catch (error) {
        console.error('Error reading dump directory:', error);
        return [];
    }
}

function restoreFile(fileName) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(dumpDir, fileName);
        const restoreCommand = [
            'mysql',
            `--host=${dbConfig.host}`,
            `--user=${dbConfig.user}`,
            `--password=${dbConfig.password}`,
            dbConfig.database,
            `< ${filePath}`
        ].join(' ');
        exec(restoreCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error restoring ${fileName}:`, stderr);
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
}

async function main() {
    const sqlFiles = await getSQLFiles();
    if (sqlFiles.length === 0) {
        console.log('No .sql files found.');
        return;
    }
    const maxThreads = Math.min(sqlFiles.length, os.cpus().length);
    const message = `Restoring ${sqlFiles.length} .sql files to database "${dbConfig.database}" on ${dbConfig.host}`;
    console.time(message);
    for (let i = 0; i < sqlFiles.length; i += maxThreads) {
        const chunk = sqlFiles.slice(i, i + maxThreads);
        const restorePromises = chunk.map(file => restoreFile(file));
        await Promise.all(restorePromises);
    }
    console.timeEnd(message);
}

main();
