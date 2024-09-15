import fs from 'fs';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import runCommand from './utils/run-command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
};

const currentTimestamp = String(new Date().getTime());
const dumpFolder = path.join(__dirname, '..', 'dumps', `${dbConfig.database}-${currentTimestamp}`);

function createDumpFolder() {
    if (!fs.existsSync(dumpFolder)) {
        fs.mkdirSync(dumpFolder, { recursive: true });
    }
}

async function getListTables() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query("SHOW TABLES");
        const tables = rows.map(row => Object.values(row)[0]);
        return tables;
    } catch (error) {
        console.error('Error retrieving tables:', error);
        return [];
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function dumpTable(tableName) {
    const filePath = path.join(dumpFolder, `${tableName}.sql`);
    const dumpCommand = [
        'mysqldump',
        '--compress',
        '--skip-ssl',
        '--quick --single-transaction',
        `--host=${dbConfig.host}`,
        `--user=${dbConfig.user}`,
        `--password=${dbConfig.password}`,
        dbConfig.database,
        tableName,
        `--result-file=${filePath}`
    ].join(' ');
    await runCommand(dumpCommand);
    return tableName;
}

async function main() {
    let isError = false;
    createDumpFolder();
    const tables = await getListTables();
    if (tables.length === 0) {
        console.log('No tables found.');
        return;
    }
    const dumpPromises = tables.map(table => dumpTable(table));
    const message = `Backup ${tables.length} tables on database "${dbConfig.database}" from ${dbConfig.host}`;
    console.time(message);
    const result = await Promise.allSettled(dumpPromises);
    result.forEach(promise => {
        if (promise.status === 'rejected') {
            isError = true;
            console.error(`Fail to backup ${promise.value} table.`);
        }
    });
    if (!isError) console.timeEnd(message);
}
main();