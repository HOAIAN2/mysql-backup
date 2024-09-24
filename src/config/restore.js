const restoreSettings = {
    targetDir: process.env.RESTORE_TARGET_DIR,
    restoreProgram: process.env.RESTORE_PROGRAM,
    extraArgs: process.env.RESTORE_EXTRA_ARGS,
    includes: process.env.RESTORE_TABLES ? process.env.RESTORE_TABLES.split(',').map(file => file.trim()) : '*',
    parallel: true,
    connection: {
        host: process.env.RESTORE_HOST,
        user: process.env.RESTORE_USER,
        password: process.env.RESTORE_PASSWORD,
        database: process.env.RESTORE_DATABASE
    }
};

export default restoreSettings;