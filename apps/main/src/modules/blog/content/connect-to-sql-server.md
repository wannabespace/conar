Connecting to Microsoft SQL Server from a modern machine is mostly a question of the right string and the right auth mode. Here is how to do it in Tamery, including the two things people get stuck on: trusted connections and the `sa` account.

## The connection string

Pick **Microsoft SQL Server** under Engine, or just paste a string and let Tamery read it:

```text
sqlserver://user:password@localhost:1433/mydb
```

`mssql://` works too. The default port is **1433**. You do not have to convert anything first: JDBC, ADO.NET and ODBC strings, and `sqlcmd` commands, all parse. Paste whatever your server or app config already has, and the form fills itself in.

## Azure SQL

Use the server name and database from your Azure details:

```text
sqlserver://user:password@your-server.database.windows.net:1433/mydb?encrypt=true&trustServerCertificate=false
```

Allow your IP in the server's firewall. On the web app, allow the cloud proxy's addresses instead.

## Trusted connection and Windows authentication

This is the one that trips people up. A "trusted connection" (`Trusted_Connection=yes`, or `Integrated Security=SSPI`) means SQL Server uses your Windows login over Kerberos or NTLM. That is a Windows-only mechanism tied to a domain.

Tamery runs on macOS, Windows, Linux and the web, so it connects with **SQL Server Authentication**: a login and a password, over TCP. If the string you have uses integrated security, you connect with a SQL login instead. Turn on Mixed Mode authentication on the server, create a login, grant it what it needs, and use that. Nothing else about the setup changes.

## Default credentials

SQL Server has no default password. The `sa` account is created during install, with whatever password was set then, and on many setups it is disabled on purpose. So "default credentials" is really "whoever installed it chose one."

If you can sign in as `sa`, do not stop there. Create a least-privilege login for day-to-day work and leave `sa` for break-glass only. A database client should connect as the smallest role that does the job.

## Encryption

Connections are encrypted by default, and the certificate is not checked unless you ask. Use `trustServerCertificate=false` to verify it (Azure SQL and anything public), `trustServerCertificate=true` to skip the check on a local server with a self-signed certificate, or `encrypt=false` for no encryption.

---

That is the whole thing. [Download Tamery](/download), paste your string, and you are in. The full reference, including the local proxy for localhost on the web, is in the [SQL Server docs](https://docs.tamery.app/connections/mssql).
