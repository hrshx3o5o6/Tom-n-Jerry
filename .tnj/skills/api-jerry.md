# api-jerry

Check existing endpoints before creating new routes.

## Trigger
Before exposing new REST, GraphQL, or gRPC endpoints. Before creating API controllers, router files, or handlers.

## Checks
1. Search for route patterns: `router.get`, `app.use`, `@Route`, `urls.py`.
2. Review API response models — does a related endpoint already return the needed data?
3. Check if existing list endpoints support query parameters that cover the need (e.g., `/api/orders?status=pending` makes `/api/orders/pending` redundant).

## Action
- Existing endpoint covers it → reuse. Do NOT create new route/controller.
- Custom logic needed → implement directly.

## Anti-Traps
- Single-use endpoints: creating `/api/widget/top-left` when `/api/widgets` with query params suffices.
- Security redundancy: new custom routes skip auth wrappers that standard controllers already have.
