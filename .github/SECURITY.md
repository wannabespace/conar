# Security

Tamery connects to real databases and holds real credentials, so I take security reports seriously.

## Reporting a vulnerability

Please report privately, not in a public issue. Open a draft advisory under the repo's
[Security tab](https://github.com/wannabespace/tamery/security/advisories/new) and I get it directly.

Include what you found, how to reproduce it, and what an attacker could do with it. A proof of concept helps.

I will confirm I received it, work on a fix, and credit you once it ships (unless you would rather stay anonymous).

Please give me a reasonable window to patch before you share the details anywhere.

## Scope

The whole repo is in scope: the app, the API, the proxy, and the share site. Anything that leaks a connection
string, decrypts data without the right key, or lets one account reach another's data is exactly what I want to hear about.
