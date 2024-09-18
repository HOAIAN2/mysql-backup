# Mysql-backup

This is a MySQL / MariaDB dump tool written in NodeJS to dump multiple databases at once for better performance. This tool is depend on `mariadb-dump` or `mysqldump` so make sure that you have one of these tools installed on your system.

## Prerequisites

- NodeJS 20.6 or later
- `mysqldump`

## Usage

Create `.env` file on root of project

```env
DUMP_PROGRAM=mariadb-dump # Change to mysqldump if needed
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_DATABASE=
DUMP_EXTRA_ARGS='--compress --skip-ssl --quick --single-transaction'
```

Run backup with env file

```console
npm run backup
```

Run restore with default mysql

```console
time mysql --user=<ADMIN_BACKUP> --password=<PASSWORD> demo < <(cat /path/to/your/restore/*.sql)
```
