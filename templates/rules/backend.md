# Tom n Jerry — Backend Context Pack

Inject when: CWD contains `pom.xml`, `build.gradle`, `requirements.txt`, `go.mod`, `Cargo.toml`, `routes/`, `app.use`, `urls.py`, or `Router`.

## Framework Conventions
- Read framework config files before adding middleware or routes
- Match existing error handling patterns (error middleware, exception handlers, result types)
- Use framework-native validation before adding joi/zod/pydantic

### Next.js
- Use middleware before custom API routes
- Use layouts for shared UI — not wrapper components
- Server actions before custom API endpoints for form handling
- Check `next.config.js` for existing rewrites/redirects

### Express / Node
- Use existing middleware chain — don't create a new one
- Check for `express-rate-limit`, `helmet`, `cors`, `morgan` in package.json
- Reuse existing route patterns and controller structure

### Spring Boot
- Check auto-configuration before custom beans
- Use starters before manual dependency setup
- Check security chain before adding custom filters

### Django
- Use class-based generic views before function views
- Check `django-filter` before custom filtering logic
- Use Django admin before custom admin panels

## API Routes
- Search for existing endpoints before creating new ones
- Check if endpoints accept query/filter params covering the need
- Reuse standard controllers to inherit auth, validation, rate limiting

## Database
- Inspect schemas before adding columns or tables
- Check if existing JSON/JSONB columns can store new fields
- Check if existing indexes cover the query pattern
- Prefer ORM relations and `ON DELETE CASCADE` over manual cleanup

## Testing Convention
- Check test runner config before adding new one
- Look for existing factories, fixtures, mocks before writing new ones
- Match existing test patterns (naming, assertions, setup)
