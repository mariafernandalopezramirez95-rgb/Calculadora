const { createClient } = require('@libsql/client');

module.exports = async function (req, res) {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    const result = await client.execute('SELECT 1 as connected;');
    return res.status(200).json({ connected: true, result });
  } catch (err) {
    return res.status(500).json({ connected: false, error: err.message });
  }
};
