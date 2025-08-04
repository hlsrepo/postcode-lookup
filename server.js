const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS so your Webflow iframe can call it
app.use(cors());

// Serve static frontend
app.use(express.static('public'));

// MySQL connection from environment variables
const connection = mysql.createConnection({
  host: process.env.DB_HOST,       // e.g., '123.45.67.89' or 'mydb.example.com'
  user: process.env.DB_USER,       // e.g., 'root'
  password: process.env.DB_PASS,   // your DB password
  database: process.env.DB_NAME,   // e.g., 'courier_db'
  port: process.env.DB_PORT || 3306
});

connection.connect(err => {
  if (err) {
    console.error('❌ Error connecting to MySQL:', err);
    process.exit(1);
  }
  console.log('✅ Connected to MySQL');
});

// Lookup endpoint
app.get('/lookup', (req, res) => {
  const postcode = req.query.postcode;

  if (!postcode) {
    return res.status(400).json({ error: 'Postcode is required' });
  }

  const query = 'SELECT courier_channel FROM courier_mapping WHERE postcode = ? LIMIT 1';

  connection.query(query, [postcode], (err, results) => {
    if (err) {
      console.error('❌ Error executing query:', err);
      return res.status(500).json({ error: 'Database query error' });
    }

    if (results.length > 0) {
      const courier_channel = results[0].courier_channel;

      // Check if delivery is available
      const deliverableChannels = [
        'laverty-nsw',
        'dorevitch-vic',
        'wdp-wa',
        'abbott',
        'qml-qld'
      ];
      const delivers = deliverableChannels.includes(courier_channel);

      res.json({
        courier_channel,
        delivers,
        message: delivers
          ? '✅ Yes, we deliver to this postcode.'
          : '❌ Sorry, we do not deliver to this postcode.'
      });
    } else {
      res.json({ message: '❌ No courier found for this postcode.' });
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
