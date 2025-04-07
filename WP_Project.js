const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'event_management',
  port: 3306
};

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
app.use(express.static(path.join(__dirname, 'public')));

// Database initialization
async function initializeDatabase() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // 1. Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('student', 'admin') NOT NULL,
        committee_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 2. Committees table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS committees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        school VARCHAR(255),
        section VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 3. Status table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS status (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 4. Events table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        committee_id INT NOT NULL,
        event_name VARCHAR(255) NOT NULL,
        date_filled DATE NOT NULL,
        venue VARCHAR(255) NOT NULL,
        date_from DATE NOT NULL,
        date_to DATE NOT NULL,
        time_slot VARCHAR(100),
        duration VARCHAR(100),
        extra_requirements TEXT,
        catering_requirements TEXT,
        status_id INT NOT NULL,
        admin_comment TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (committee_id) REFERENCES committees(id),
        FOREIGN KEY (status_id) REFERENCES status(id)
      )
    `);

    // Insert default status values
    await connection.execute(`
      INSERT IGNORE INTO status (name, description) VALUES
      ('Pending', 'Awaiting review'),
      ('Approved', 'Approved by admin'),
      ('Rejected', 'Rejected by admin'),
      ('Completed', 'Event has occurred'),
      ('Cancelled', 'Event was cancelled')
    `);

    // Insert sample committees
    await connection.execute(`
      INSERT IGNORE INTO committees (name, school, section) VALUES
      ('Sports Committee', 'Main School', 'Athletics'),
      ('Cultural Committee', 'Arts Department', 'Performing Arts'),
      ('Colloquium Committee', 'Science Department', 'Research')
    `);

    // Insert sample users
    const sampleUsers = [
      { username: 'SportsCom', password: 'Sports123', role: 'student', committee_id: 1 },
      { username: 'Cultural', password: 'Cult123', role: 'student', committee_id: 2 },
      { username: 'Colloquium', password: 'Collo123', role: 'student', committee_id: 3 },
      { username: 'KrishBurla', password: 'Krish2005$', role: 'admin' },
      { username: 'NamanBhatia', password: 'Naman2005$', role: 'admin' }
    ];

    for (const user of sampleUsers) {
      await connection.execute(
        'INSERT IGNORE INTO users (username, password, role, committee_id) VALUES (?, ?, ?, ?)',
        [user.username, user.password, user.role, user.committee_id || null]
      );
    }

    await connection.end();
    console.log('Database initialized with 4 tables and sample data');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

initializeDatabase();

// Authentication middleware
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/');
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/');
  next();
}

// Routes

// Add routes to serve other HTML files
app.get('/studentHome.html', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'studentHome.html'));
});

app.get('/admin/dashboard.html', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'adminDashboard.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Updated login route in WP_Project.js
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      error: 'Username and password are required',
      errorType: !username ? 'username' : 'password'
    });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT u.*, c.name as committee_name FROM users u LEFT JOIN committees c ON u.committee_id = c.id WHERE username = ?',
      [username]
    );
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(401).json({ 
        error: 'Username not found',
        errorType: 'username'
      });
    }

    const user = rows[0];
    
    // Compare passwords (in a real app, use bcrypt for hashed passwords)
    if (user.password !== password) {
      return res.status(401).json({ 
        error: 'Incorrect password',
        errorType: 'password'
      });
    }

    req.session.user = user;
    
    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard.html');
    } else {
      return res.redirect('/studentHome.html');
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Student status data
app.get('/student/status-data', requireLogin, async (req, res) => {
  if (req.session.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [events] = await connection.execute(`
      SELECT e.*, s.name as status_name, e.admin_comment
      FROM events e
      JOIN status s ON e.status_id = s.id
      WHERE user_id = ?
      ORDER BY date_filled DESC
    `, [req.session.user.id]);
    await connection.end();
    res.json({ events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Form submission
app.post('/submit-event', requireLogin, async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Get the Pending status ID
    const [status] = await connection.execute(
      "SELECT id FROM status WHERE name = 'Pending'"
    );
    
    if (status.length === 0) {
      await connection.end();
      return res.status(500).json({ error: 'Pending status not found' });
    }

    // Insert the event
    const [result] = await connection.execute(
      `INSERT INTO events (
        user_id, committee_id, event_name, date_filled, venue,
        date_from, date_to, time_slot, duration, 
        extra_requirements, catering_requirements, status_id
      ) VALUES (?, ?, ?, STR_TO_DATE(?, '%d-%m-%Y'), ?, STR_TO_DATE(?, '%d-%m-%Y'), 
        STR_TO_DATE(?, '%d-%m-%Y'), ?, ?, ?, ?, ?)`,
      [
        req.session.user.id,
        req.session.user.committee_id || 1, // Default to committee 1 if not set
        req.body.eventName,
        req.body.dateFilled,
        req.body.venue,
        req.body.dateFrom,
        req.body.dateTo,
        req.body.timeSlot,
        req.body.duration,
        req.body.extraRequirements,
        req.body.cateringRequirements,
        status[0].id
      ]
    );

    await connection.end();
    
    if (result.affectedRows === 1) {
      return res.redirect('/status.html');
    } else {
      return res.status(500).json({ error: 'Failed to insert event' });
    }
  } catch (error) {
    console.error('Event submission error:', error);
    return res.status(500).json({ 
      error: 'Database error',
      detailedError: error.message 
    });
  }
});

// Admin dashboard data
app.get('/admin/dashboard-data', requireAdmin, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [events] = await connection.execute(`
      SELECT e.*, u.username, c.name as committee_name, s.name as status_name
      FROM events e
      JOIN users u ON e.user_id = u.id
      JOIN committees c ON e.committee_id = c.id
      JOIN status s ON e.status_id = s.id
      ORDER BY e.date_filled DESC
    `);
    await connection.end();
    res.json({ events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Admin view event details
app.get('/admin/view-event-data', requireAdmin, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [event] = await connection.execute(`
      SELECT e.*, u.username, c.name as committee_name, s.name as status_name
      FROM events e
      JOIN users u ON e.user_id = u.id
      JOIN committees c ON e.committee_id = c.id
      JOIN status s ON e.status_id = s.id
      WHERE e.id = ?
    `, [req.query.id]);
    await connection.end();
    
    if (event.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json(event[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update event status
app.post('/admin/update-status', requireAdmin, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [status] = await connection.execute(
      "SELECT id FROM status WHERE name = ?",
      [req.body.status]
    );
    
    await connection.execute(
      'UPDATE events SET status_id = ?, admin_comment = ? WHERE id = ?',
      [status[0].id, req.body.comment, req.body.eventId]
    );
    await connection.end();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Update failed' });
  }
});

const PORT = process.env.PORT || 3000;
// Add this route to serve the view-event.html file
app.get('/admin/view-event.html', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'view-event.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});