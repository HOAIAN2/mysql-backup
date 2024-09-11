# Mysql-backup

This is a MySQL / MariaDB dump tool written in NodeJS to dump multiple databases at once for better performance. This tool is depend on `mariadb-dump` or `mysqldump` so make sure that you have one of these tools installed on your system.

## Prerequisites

- NodeJS 20.6 or later
- `mysqldump`

## Usage

Create `.env` file on root of project

```env
DB_HOST=localhost
DB_USER=admin_backup
DB_PASSWORD=password
DB_DATABASE=database
```

Run backup with env file

```console
npm run backup
```

Restore (Comming soon)
