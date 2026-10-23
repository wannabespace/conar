MySQL and MariaDB connection strings come in more shapes than any other database: URLs, Go DSNs, `.env` blocks, raw `mysql` commands. The good news is you do not have to normalize any of them by hand. Here is how to connect in Tamery.

## The connection string

Choose **MySQL** or **MariaDB** under Engine, or paste a string:

```text
mysql://user:password@localhost:3306/mydb
```

```text
mariadb://user:password@localhost:3306/mydb
```

The default port is **3306**. A Go DSN like `user:pass@tcp(host:3306)/mydb`, an `.env` file, or a `mysql` command line works too. Paste what you have and the form reads it.

## SSL

Use your provider's string with its SSL options. `ssl=true` encrypts the connection and verifies the certificate:

```text
mysql://user:password@db.example.com:3306/mydb?ssl=true
```

Add `sslrejectunauthorized=false` to keep encryption but skip the certificate check, or `ssl=false` to turn it off. With no SSL option set, Tamery tries an encrypted connection without certificate verification and drops to unencrypted only if the server says SSL is unavailable.

## Authentication plugin errors

If the connection fails with something about an unsupported authentication plugin, the server is using an auth method the driver cannot speak. Create the user with `mysql_native_password`, or update the server's auth plugin, and connect again. Tamery tells you this in the error itself, so you are not left guessing.

## MariaDB

Everything works the same as MySQL: rows, SQL, schema. System-versioned tables show their current rows, and you query the history with SQL. Sequences are available through SQL rather than the Navigator.

---

[Download Tamery](/download), paste any of those string formats, and connect. The full reference, including the local proxy for localhost on the web, is in the [MySQL and MariaDB docs](https://docs.tamery.app/connections/mysql).
