const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// parses json requests
app.use(bodyParser.json());

app.use(cors());

// connection to car-trips.db
const db = new sqlite3.Database('banking_app.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to banking-trips.db successfully!');
    }
});


// DISPLAYING TABLES

app.get('/api/accounts', (req, res) => {
    const query = 'SELECT * FROM Accounts';

    db.all(query, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/members', (req, res) => {
    const query = 'SELECT * FROM Members';

    db.all(query, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/transactions', (req, res) => {
    const query = 'SELECT * FROM Transactions';

    db.all(query, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});



// ADDING ENTRIES

app.post('/api/add-members', (req, res) => {
    const data = req.body;
    console.log("Console logging");
    console.log(data);

    const query = 'INSERT INTO Members (name, dob, email, phone, account_type, initial_balance) VALUES (?, ?, ?, ?, ?, ?)';
    const { name, dob, email, phone, account_type, initial_balance } = data;

    db.run(query, [name, dob, email, phone, account_type, initial_balance], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const member_id = this.lastID; // Get the last inserted member_id
        res.json({ message: 'Member added successfully', member_id: member_id });
    });
});


app.post('/api/add-transactions', (req, res) => {
    const data = req.body;

    const query = 'INSERT INTO Transactions (account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?)';
    const { account_id, transaction_type, amount, description } = data;

    db.run(query, [account_id, transaction_type, amount, description], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        res.json({ message: 'Transaction added successfully', transaction_id: this.lastID });
    });
});

app.post('/api/add-accounts', (req, res) => {
    const accountData = req.body;

    const query = 'INSERT INTO Accounts (member_id, account_type, balance) VALUES (?, ?, ?)';
     
    const { member_id, account_type, balance } = accountData;

    db.run(query, [member_id, account_type, balance], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Account added successfully', account_id: this.lastID });
    });
});


app.post('/api/update-balance', (req, res) => {
    const data = req.body;
    const { account_id, transaction_type, amount } = data;
    
    console.log('ID = ', account_id);
    console.log('Type = ', transaction_type);
    console.log('Amount = ', amount + '\n\n');

    // Retrieve current balance for the account
    const query = 'SELECT balance FROM Accounts WHERE account_id = ?';

    db.get(query, [account_id], (err, row) => {
        if (err) {
            console.error('Error retrieving balance:', err.message);
            return res.status(500).json({ error: 'Error retrieving balance' });
        }
        if (!row) {
            console.error('Account not found');
            return res.status(404).json({ error: 'Account not found' });
        }

        let currentBalance = row.balance;
        console.log("Balance = " + currentBalance);

        let updatedBalance;

        if (transaction_type === 'deposit') {
            updatedBalance = currentBalance + amount;
        } else {
            updatedBalance = currentBalance - amount;
        }

        console.log('Transaction data:', data);
        console.log('Transaction type:', transaction_type);
        console.log('Current balance:', currentBalance);

        // Check for overdraft
        if (updatedBalance < 0) {
            console.error('Transaction rejected: Account overdrawn');
            return res.status(400).json({ error: 'Transaction rejected: Account overdrawn' });
        }

        // Update the balance in the database
        const updateQuery = 'UPDATE Accounts SET balance = ? WHERE account_id = ?';
        
        db.run(updateQuery, [updatedBalance, account_id], (err) => {
            if (err) {
                console.error('Error updating balance:', err.message);
                return res.status(500).json({ error: 'Error updating balance' });
            }
            console.log('Account balance updated successfully');
            res.json({ message: 'Account balance updated successfully' });
        });
    });
});


app.delete('/api/delete-members/:id', (req, res) => {
    const id = req.params.id;
    const query = 'DELETE FROM Members WHERE member_id = ?';

    db.run(query, [id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Member deleted successfully' });
    });
});

app.delete('/api/delete-accounts/:id', (req, res) => {
    const id = req.params.id;
    const query = 'DELETE FROM Accounts WHERE account_id = ?';

    db.run(query, [id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Vehicle deleted successfully' });
    });
});

app.delete('/api/delete-transactions/:id', (req, res) => {
    const id = req.params.id;
    const query = 'DELETE FROM Transactions WHERE transaction_id = ?';

    db.run(query, [id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Passenger deleted successfully' });
    });
});



app.post('/api/query', (req, res) => {
    const { table, id, column, contain } = req.body;
    const singularTableName = table.slice(0, -1);

    let query = `SELECT ${column} FROM ${table}`;

    let whereClause = '';

    if (id) {
        const idColumnName = `${singularTableName}_id`;
        whereClause += ` ${idColumnName} = ${id}`;
    }
    if (contain && !id) {
        whereClause += ` ${column} LIKE '%${contain}%'`;
    } else if (contain && id) {
        whereClause += ` AND ${column} LIKE '%${contain}%'`;
    }

    if (whereClause) {
        query += ` WHERE${whereClause}`;
    }

    db.all(query, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});



const PORT = 3000;
// starts server
app.listen(PORT, () => {
    console.log('Server is running on http://localhost:3000');
});