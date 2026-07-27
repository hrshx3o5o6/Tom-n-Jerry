# trap-jerry

Avoid high-risk custom infrastructure: auth, crypto, caching, queues.

## Trigger
Before writing: password hashing, JWT parsing, session management, custom caching, home-rolled queues, background polling loops, custom state machines, file-based sync, custom encryption.

## Standard Paths
- **Auth**: framework middleware, Auth0, Firebase Auth. NOT custom password hashing or JWT parsing.
- **Crypto**: stdlib crypto only. NOT custom XOR, salt, or cipher implementations.
- **Caching**: framework caching or Redis. NOT in-memory caches with manual invalidation.
- **Queues**: BullMQ, Celery, cloud queues. NOT `setInterval` polling loops.
- **Scheduling**: system crontab, GitHub Actions scheduler, Firebase Functions. NOT custom scheduler loops.

## Anti-Traps
- "I can write it in 50 lines" trap: underestimating edge cases in concurrency, auth, cache invalidation.
- Home-grown crypto: always use audited stdlib crypto libraries.
- Queue concurrency: custom schedulers fail under cluster scale with duplicate task runs.
