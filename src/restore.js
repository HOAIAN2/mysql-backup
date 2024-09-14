const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dumpDir = path.join(__dirname, '..', 'dumps', process.env.RESTORE_TARGET_DIR);

const fileList = fs.readdirSync(dumpDir).filter(file => file.endsWith('.sql'));

const message = `Restore ${fileList.length} .sql files`;
console.time(message);
fileList.forEach(file => {
    const command = [
        'mysql',
        `--host=${process.env.RS_DB_HOST}`,
        `--user=${process.env.RS_DB_USER}`,
        `--password=${process.env.RS_DB_PASSWORD}`,
        `--init-command="SET FOREIGN_KEY_CHECKS=0;"`,
        process.env.RS_DB_DATABASE,
        `< ${path.join(dumpDir, file)}`
    ].join(' ');
    execSync(command);
});
console.timeEnd(message);