# Security Policy

## Reporting a vulnerability

Please do not disclose suspected vulnerabilities in a public issue.

Contact the repository owner through the GitHub profile associated with this
project and include:

- The affected feature or file
- Steps needed to reproduce the issue
- The potential impact
- Any suggested mitigation

Reports will be reviewed as quickly as possible. Please avoid accessing,
changing, or retaining data that does not belong to you while investigating.

## Public configuration

This repository contains only browser-safe configuration examples. Supabase
publishable keys are designed for frontend use and must always be paired with
Row Level Security and least-privilege database grants. Secret and service-role
keys must never be placed in this repository or shipped to the browser.
