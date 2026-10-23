Cloudflare D1 does not hand you a connection string. It connects through Cloudflare's API, so you need three things: an account ID, a database ID, and an API token. Here is how to connect in Tamery.

## Connect to D1

Choose **Cloudflare D1** under Engine and enter your account ID, database ID and API token.

The quick way to fill in the IDs: paste the database's URL from the Cloudflare dashboard, and Tamery pulls both IDs out of it. A `wrangler` config works as a source too.

## The API token

Create the token under **My Profile → API Tokens** with the **Account → D1 → Edit** permission. That is the one scope D1 needs; do not hand it a broader token than that.

The token follows the same sync rules as a password, so you choose whether it travels with the connection to your other devices.

## Works on desktop and web

D1 connects from both apps with no local proxy, since it is a remote HTTP API.

## Two D1 quirks to know

- **No open transactions between runs.** Run a whole `BEGIN … COMMIT` block with **Run all**. D1 returns no rows from statements inside that block, so put any `SELECT` you want to see outside it.
- **Large integers may round.** D1 can round integers above JavaScript's safe range (`2^53 - 1`). If you store IDs or counters that big, read them as text to be safe.

Otherwise it behaves like SQLite: browse and edit rows, run SQL, manage indexes and triggers.

## FAQ

### What do I need to connect to Cloudflare D1?

An account ID, a database ID and an API token. Pasting the database's dashboard URL fills in both IDs for you.

### What permission does the D1 API token need?

Account → D1 → Edit, and nothing broader.

### Does D1 support transactions?

Not held open between runs. Run a whole `BEGIN … COMMIT` block with Run all; D1 returns no rows from statements inside it.

---

[Download Tamery](/download), paste the database URL from your dashboard and an API token, and connect. The full reference is in the [Cloudflare D1 docs](https://docs.tamery.app/connections/sqlite).
