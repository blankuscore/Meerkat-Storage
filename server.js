const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Initialize SQLite database
const db = new sqlite3.Database('./inventory.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.run(`CREATE TABLE IF NOT EXISTS containers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image_path TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS clothing_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    container_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    image_path TEXT,
    sold INTEGER DEFAULT 0,
    purchase_price REAL,
    sell_price REAL,
    storage_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (container_id) REFERENCES containers(id)
  )`);
}

// API Routes

// Get all containers
app.get('/api/containers', (req, res) => {
  db.all('SELECT * FROM containers ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Create new container
app.post('/api/containers', upload.single('image'), (req, res) => {
  const { name } = req.body;
  const imagePath = req.file ? req.file.path : null;

  if (!name || !imagePath) {
    return res.status(400).json({ error: 'Name and image are required' });
  }

  db.run(
    'INSERT INTO containers (name, image_path) VALUES (?, ?)',
    [name, imagePath],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: this.lastID, name, image_path: imagePath });
      }
    }
  );
});

// Get all items in a container
app.get('/api/containers/:id/items', (req, res) => {
  const containerId = req.params.id;
  db.all(
    'SELECT * FROM clothing_items WHERE container_id = ? ORDER BY created_at DESC',
    [containerId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    }
  );
});

// Create new clothing item
app.post('/api/items', upload.single('image'), (req, res) => {
  const { container_id, name, purchase_price, sell_price, storage_date, notes } = req.body;
  const imagePath = req.file ? req.file.path : null;

  if (!container_id || !name) {
    return res.status(400).json({ error: 'Container ID and name are required' });
  }

  db.run(
    `INSERT INTO clothing_items 
    (container_id, name, image_path, purchase_price, sell_price, storage_date, notes) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [container_id, name, imagePath, purchase_price || null, sell_price || null, storage_date || null, notes || null],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        db.get('SELECT * FROM clothing_items WHERE id = ?', [this.lastID], (err, row) => {
          if (err) {
            res.status(500).json({ error: err.message });
          } else {
            res.json(row);
          }
        });
      }
    }
  );
});

// Update clothing item
app.put('/api/items/:id', (req, res) => {
  const itemId = req.params.id;
  const { name, sold, purchase_price, sell_price, storage_date, notes } = req.body;

  db.run(
    `UPDATE clothing_items 
    SET name = ?, sold = ?, purchase_price = ?, sell_price = ?, storage_date = ?, notes = ?
    WHERE id = ?`,
    [name, sold ? 1 : 0, purchase_price, sell_price, storage_date, notes, itemId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        db.get('SELECT * FROM clothing_items WHERE id = ?', [itemId], (err, row) => {
          if (err) {
            res.status(500).json({ error: err.message });
          } else {
            res.json(row);
          }
        });
      }
    }
  );
});

// Delete clothing item
app.delete('/api/items/:id', (req, res) => {
  const itemId = req.params.id;
  
  db.get('SELECT image_path FROM clothing_items WHERE id = ?', [itemId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Delete the image file if it exists
    if (row && row.image_path && fs.existsSync(row.image_path)) {
      fs.unlinkSync(row.image_path);
    }
    
    db.run('DELETE FROM clothing_items WHERE id = ?', [itemId], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ message: 'Item deleted successfully' });
      }
    });
  });
});

// Delete container
app.delete('/api/containers/:id', (req, res) => {
  const containerId = req.params.id;
  
  // First, get all items in the container and delete their images
  db.all('SELECT image_path FROM clothing_items WHERE container_id = ?', [containerId], (err, items) => {
    if (!err && items) {
      items.forEach(item => {
        if (item.image_path && fs.existsSync(item.image_path)) {
          fs.unlinkSync(item.image_path);
        }
      });
    }
    
    // Delete all items in the container
    db.run('DELETE FROM clothing_items WHERE container_id = ?', [containerId], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Get container image path and delete it
      db.get('SELECT image_path FROM containers WHERE id = ?', [containerId], (err, row) => {
        if (!err && row && row.image_path && fs.existsSync(row.image_path)) {
          fs.unlinkSync(row.image_path);
        }
        
        // Delete the container
        db.run('DELETE FROM containers WHERE id = ?', [containerId], function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
          } else {
            res.json({ message: 'Container deleted successfully' });
          }
        });
      });
    });
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Access from other devices using your Pi's IP address`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});