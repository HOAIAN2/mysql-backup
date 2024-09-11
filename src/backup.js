const mysql = require('mysql2/promise');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

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

function dumpTable(tableName) {
    return new Promise((resolve, reject) => {
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
        exec(dumpCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error dumping table ${tableName}:`, stderr);
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
}

async function main() {
    createDumpFolder();
    const tables = await getListTables();
    if (tables.length === 0) {
        console.log('No tables found.');
        return;
    }
    const dumpPromises = tables.map(table => dumpTable(table));
    const maxThreads = Math.min(dumpPromises.length, os.cpus().length);

    const message = `Backup ${tables.length} tables on database "${dbConfig.database}" from ${dbConfig.host}`;
    console.time(message);
    for (let i = 0; i < dumpPromises.length; i += maxThreads) {
        const chunk = dumpPromises.slice(i, i + maxThreads);
        await Promise.all(chunk);
    }
    console.timeEnd(message);
}
main();