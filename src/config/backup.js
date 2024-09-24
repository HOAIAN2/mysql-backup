const backupSettings = {
    dumpProgram: process.env.DUMP_PROGRAM,
    extraArgs: process.env.DUMP_EXTRA_ARGS,
    connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    }
};

export default backupSettings;