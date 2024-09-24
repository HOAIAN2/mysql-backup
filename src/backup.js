import fs from 'fs';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import backupSettings from './config/backup.js';
import runCommand from './utils/run-command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const currentTimestamp = String(new Date().getTime());
const dumpFolder = path.join(__dirname, '..', 'dumps', `${backupSettings.connection.database}-${currentTimestamp}`);

function createDumpFolder() {
    if (!fs.existsSync(dumpFolder)) {
        fs.mkdirSync(dumpFolder, { recursive: true });
    }
}

async function getListTables() {
    let connection;
    try {
        const getListTablesMessage = 'Get list tables';
        console.time(getListTablesMessage);
        connection = await mysql.createConnection(backupSettings.connection);
        const [rows] = await connection.query("SHOW TABLES");
        const tables = rows.map(row => Object.values(row)[0]);
        console.timeEnd(getListTablesMessage);
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
        backupSettings.dumpProgram,
        `--host=${backupSettings.connection.host}`,
        `--user=${backupSettings.connection.user}`,
        `--password=${backupSettings.connection.password}`,
        backupSettings.connection.database,
        tableName,
        `--result-file=${filePath}`,
        process.env.DUMP_EXTRA_ARGS
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
    const backupMessage = `Backup ${tables.length} tables on database "${backupSettings.connection.database}" from ${backupSettings.connection.host}`;
    console.time(backupMessage);
    const result = await Promise.allSettled(dumpPromises);
    result.forEach(promise => {
        if (promise.status === 'rejected') {
            isError = true;
            console.error(`Fail to backup ${promise.value} table.`);
        }
    });
    if (!isError) console.timeEnd(backupMessage);
}
main();