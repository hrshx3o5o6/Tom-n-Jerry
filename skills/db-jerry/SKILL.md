---
name: db-jerry
description: Scan database schemas, migrations, and model files to reuse existing tables, fields, or indexes instead of creating redundant columns.
triggers:
  - When modifying SQL, prisma, mongoose, postgres, or migrations
  - When adding new columns or tables to a database schema
  - When dealing with serialization, custom JOINs, or complex indexing
---

# DB Jerry

DB Jerry reviews the existing database architecture (schemas, migrations, ORM models) to ensure you do not build duplicate tables, columns, indexes, or custom serialization code.

## Mission

Protect database integrity. Avoid database migrations that add redundant tables, create circular relationships, duplicate columns, or fail to utilize existing foreign key schemas.

---

## Explicit Triggers

This skill MUST be executed when:
1. Creating or modifying SQL tables, schemas, or migrations.
2. Editing ORM models (Prisma, Mongoose, Hibernate, ActiveRecord, Django models).
3. Implementing custom indices, cache tables, or data-duplication tables.

---

## Concrete Checks & Actions

1. **Inspect Schema Definitions:**
   - Locate and scan files containing the database schema (e.g., `schema.prisma`, `models.py`, `init.sql`, `/migrations/` directories).
2. **Scan for Column Reuse:**
   - Before adding a column like `user_profile_url` or `avatar_link`, verify if there is already a `metadata` JSON field, user profile table, or settings column that can house it.
3. **Verify Index Abundance:**
   - Before adding an index, verify if a composite index already covers the target columns or if the database primary key makes it redundant.
4. **Identify Built-in ORM Features:**
   - Prefer ORM relations and cascading delete rules over manually writing transactional cleanup logic.

---

## Inline Scenario

* **Vague Plan (Naive):** "I will add a new table `user_settings` with columns `dark_mode BOOLEAN`, `email_notifications BOOLEAN`, and a foreign key `user_id` to store dashboard options."
* **Jerry Opportunity Card:**
  - **Type:** reuse
  - **Claim:** The existing `users` table already has a `preferences` JSONB column configured.
  - **Evidence:** Seen in `db/schema.rb#L45` where `preferences` defaults to `{}`.
  - **Move:** Store dashboard options directly inside the `preferences` column instead of creating a new table and executing a schema migration.
  - **Risk:** No schema validation for preferences keys; must handle at application layer.
  - **Receipt:** Run test writing to `preferences` and verify JSON keys are retrievable.

---

## Antipattern Traps

- **The Redundant Schema Migration Trap:** Creating a migration file that recreates columns or tables that already exist, causing pipeline failures during migration runs.
- **Index Flooding:** Adding indexes on every column in a table, causing inserts/updates to run slow.
- **Manual Cascades:** Writing custom application-level cascade deletion loops instead of using database-level `ON DELETE CASCADE`.

---

## Output

Emit an opportunity card of type `reuse` outlining:
1. The database model, column, or relationship to reuse.
2. The migration or schema alteration command to skip.
3. The query or test proving the existing schema supports the desired change.
