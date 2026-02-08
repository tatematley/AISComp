# Database Setup

This folder contains the database schema and migrations for the AIS HR Competition app.

## Quick Start

1. Make sure PostgreSQL is running locally
2. Create the database (if it doesn't exist):
   ```bash
   createdb AISHRComp
   ```
3. Run migrations:
   ```bash
   cd database
   chmod +x migrate.sh
   ./migrate.sh
   ```

## How Migrations Work

- Each `.sql` file in `migrations/` is run in alphabetical order
- Files are named with a number prefix: `001_`, `002_`, etc.
- The initial schema is in `001_initial_schema.sql`
- New changes get added as new numbered files

## Adding New Migrations

When you need to change the database:

1. Create a new file: `migrations/XXX_description.sql` (use the next number)
2. Write your SQL changes
3. Commit and push to Git
4. Tell your teammates to run `./migrate.sh`

Example:
```sql
-- migrations/002_add_resume_column.sql
ALTER TABLE candidate ADD COLUMN resume_url TEXT;
```

## Connection Settings

Default connection (can override with environment variables):
- Host: `localhost`
- User: `postgres`
- Password: `izzy1213`
- Database: `AISHRComp`

Override example:
```bash
DB_PASS=mypassword ./migrate.sh
```
