#!/bin/bash
# Simple database migration runner
# Usage: ./migrate.sh

# Database connection (uses environment variables or defaults)
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-postgres}"
DB_PASS="${DB_PASS:-izzy1213}"
DB_NAME="${DB_NAME:-AISHRComp}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"

echo "==================================="
echo "  AIS HR Comp Database Migrator"
echo "==================================="
echo ""
echo "Database: $DB_NAME @ $DB_HOST"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql command not found. Please install PostgreSQL.${NC}"
    exit 1
fi

# Run each migration file in order
for migration in "$MIGRATIONS_DIR"/*.sql; do
    if [ -f "$migration" ]; then
        filename=$(basename "$migration")
        echo -e "${YELLOW}Running: $filename${NC}"

        PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$migration" 2>&1

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ $filename completed${NC}"
        else
            echo -e "${RED}✗ $filename failed${NC}"
            exit 1
        fi
        echo ""
    fi
done

echo -e "${GREEN}==================================="
echo "  All migrations completed!"
echo "===================================${NC}"
