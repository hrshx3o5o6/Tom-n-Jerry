---
name: api-jerry
description: Scan API routing files, controllers, and specs to reuse existing endpoints instead of creating redundant routes.
triggers:
  - When exposing new REST, GraphQL, or gRPC endpoints
  - When writing API controllers or route handlers
  - When consuming data from external or internal backend endpoints
---

# API Jerry

API Jerry checks the existing routing files, API controllers, and Swagger/OpenAPI files to ensure you reuse existing endpoints or response fields instead of creating redundant routes.

## Mission

Avoid API route bloat. Don't add a new controller action or endpoint if an existing route already exposes the target dataset or can handle the data payload with a small query filter.

---

## Explicit Triggers

This skill MUST be executed when:
1. Asked to expose database entities or actions over HTTP/REST/GraphQL.
2. Creating a new API controller, router file, or handler.
3. Hooking up frontend API fetch requests to a backend.

---

## Concrete Checks & Actions

1. **Scan Route Manifests:**
   - Search the workspace for route registration patterns (e.g., `router.get`, `app.use`, `@Route`, `urls.py`).
2. **Review API Serialization Schema:**
   - Inspect API response models to see if the required data properties are already returned in a related endpoint (e.g., `/api/user` response already returning user settings).
3. **Verify Parameterized Filters:**
   - Check if an existing list endpoint (e.g., `/api/orders`) already supports query parameters (like `?status=pending`) that make building a specific endpoint (like `/api/orders/pending`) redundant.

---

## Inline Scenario

* **Vague Plan (Naive):** "I will add a new endpoint `/api/admin/inactive-users` that queries the database for inactive accounts and formats them as a JSON list for the dashboard."
* **Jerry Opportunity Card:**
  - **Type:** reuse
  - **Claim:** The standard `/api/users` endpoint already supports a `status` query parameter.
  - **Evidence:** Seen in `controllers/users.js#L14` where it handles `req.query.status`.
  - **Move:** Fetch `/api/users?status=inactive` instead of writing a new endpoint and controller.
  - **Risk:** Ensure the admin permissions allow access to `/api/users`.
  - **Receipt:** Fetch `/api/users?status=inactive` using curl and check HTTP response is `200 OK` with filtered results.

---

## Antipattern Traps

- **The Single-Use Endpoint Trap:** Creating a specific route for every visual view on the client-side (e.g., `/api/dashboard/top-left-widget`). Reuse general-purpose endpoints.
- **Security Check Redundancy:** Forgetting to apply authentication/authorization wrappers to new custom routes. Reusing standard controllers inherits existing protections.

---

## Output

Emit an opportunity card of type `reuse` listing:
1. The existing API route and controller code to reuse.
2. The endpoint creation task to bypass.
3. The HTTP command or test proving the route correctly returns the data.
