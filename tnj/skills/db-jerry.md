# db-jerry

Check existing schemas before creating tables or modifying columns.

## Trigger
Before modifying SQL, Prisma, Mongoose schemas. Before adding columns, tables, or indexes.

## Checks
1. Locate schema files: schema.prisma, models.py, init.sql, /migrations/.
2. Before adding a column — check if existing JSON/JSONB columns, metadata fields, or related tables can store the data.
3. Before adding an index — check if a composite index already covers the columns.
4. Prefer ORM relations + `ON DELETE CASCADE` over manual cleanup code.

## Action
- Existing schema covers it → use it. Do NOT migrate.
- Truly needed → write minimal migration.

## Anti-Traps
- Redundant migration: recreating columns that already exist → pipeline failures.
- Index flooding: adding indexes on every column → slow inserts/updates.
- Manual cascades: writing app-level delete loops instead of `ON DELETE CASCADE`.
