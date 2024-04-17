document.addEventListener("DOMContentLoaded", function () {

    function resultsDisplay(result) {
        var successMessage = document.getElementById("successMessage");
        successMessage.textContent = result;
        successMessage.style.display = "block";
        setTimeout(function () {
            successMessage.style.display = "none";
        }, 2500);
    }

    function showSelectedForm() {
        var selectedOption = document.getElementById("add_drop").value;
        console.log("Selected Option = ", selectedOption);

        // Hide all form elements
        var forms = document.querySelectorAll('[id^="add_entry_"]');
        forms.forEach(function (form) {
            form.style.display = 'none';
        });
        
        // Show the selected form
        var selectedForm = document.getElementById('add_entry_' + selectedOption);
        console.log('Selected form:', selectedForm);
        if (selectedForm) {
            selectedForm.style.display = 'grid';
        }

        var accountTypeDropdown = document.getElementById('member_account_type');
        accountTypeDropdown.addEventListener('change', function() {
            var initialBalanceField = document.getElementById('member_initial_balance');
            if (this.value === 'checking') {
                initialBalanceField.style.display = 'grid';
            } else {
                initialBalanceField.style.display = 'none';
            }
        });

        resultsDisplay("Add Entry: table selected");
    }

    // event listener for dropdown
    var tableDrop = document.getElementById("add_drop");
    tableDrop.addEventListener("change", showSelectedForm);

    showSelectedForm();

    function showSelectedQueryForm() {
        var selectedTable = document.getElementById("query_drop").value;
        console.log("Selected Table = ", selectedTable);
    
        // Hide all column dropdowns
        var columnDropdowns = document.querySelectorAll('[id^="query_column_"]');
        columnDropdowns.forEach(function (dropdown) {
            dropdown.style.display = 'none';
        });
        
        // Show the selected column dropdown
        var selectedColumnDropdown = document.getElementById('query_column_' + selectedTable);
        console.log('Selected Column Dropdown:', selectedColumnDropdown);
        if (selectedColumnDropdown) {
            selectedColumnDropdown.style.display = 'block';
        }
    }
    
    // Add event listener to the Table dropdown
    var queryTableDrop = document.getElementById("query_drop");
    queryTableDrop.addEventListener("change", showSelectedQueryForm);
    
    showSelectedQueryForm(); 


    // BEGGINING OF DATA COLLECTION

    // Transaction_Date and other such dates (except for dob)
    // are automatically handled by the database

    //ADD ENTRY
    function AddMember(event, table) {
        event.preventDefault();
        const DriverForm = {
            name: document.getElementById('member_name').value,
            dob: document.getElementById('member_dob').value,
            email: document.getElementById('member_email').value,
            phone: document.getElementById('member_phone').value,
            account_type: document.getElementById('member_account_type').value,
            initial_balance: '0'  // Set initial balance to '0' by default
        }
    
        if (DriverForm.account_type === 'Savings') {
            // Set initial balance to '0' and disable the input field
            document.getElementById('member_initial_balance').value = '0';
            document.getElementById('member_initial_balance').disabled = true;
        } else {
            // Enable the initial balance input field
            document.getElementById('member_initial_balance').disabled = false;
        }
    
        console.log(DriverForm);
    
        for (const key in DriverForm) {
            if (!DriverForm[key]) {
                alert('New entry contains empty field(s). All fields must contain a value.');
                return;
            }
        }
    
        fetch(`http://localhost:3000/api/add-${table.toLowerCase()}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(DriverForm)
        })
        .then(response => response.json())
        .then(result => {
            resultsDisplay("New Member has been made successfully.");
    
            // Clear input fields
            document.getElementById('member_name').value = '';
            document.getElementById('member_dob').value = '';
            document.getElementById('member_email').value = '';
            document.getElementById('member_phone').value = '';
            document.getElementById('member_account_type').value = '';
            document.getElementById('member_initial_balance').value = '';
    
            // Fetch updated data
            fetchData(`http://localhost:3000/api/${table.toLowerCase()}`);
    
            // Extract member_id from the response
            const member_id = result.member_id;
            console.log("This Member's ID is = " + result.member_id);
    
            // Add a new account entry using the extracted member_id
            const AccountForm = {
                member_id: member_id,
                account_type: DriverForm.account_type,
                balance: DriverForm.initial_balance
            };
    
            // Add the account
            AddAccount(member_id, DriverForm.account_type, AccountForm.balance);
        })
        .catch(error => console.error('Error:', error));
    }

    function AddAccount(member_id, account_type, initial_balance) {
        const AccountData = {
            member_id: member_id,
            account_type: account_type,
            balance: initial_balance
        }
    
        // Send POST request to add accountf
        fetch('http://localhost:3000/api/add-accounts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(AccountData)
        })
        .then(response => response.json())
        .then(result => {
            console.log('Account added successfully:', result);
            resultsDisplay("New Account for Member has been made successfully.");
            fetchData(`http://localhost:3000/api/accounts`);
        })
        .catch(error => console.error('Error:', error));
    }

    function AddTransaction(event, table) {
        event.preventDefault();
        const transactionForm = {
            account_id: document.getElementById('transaction_account_id').value,
            transaction_type: document.getElementById('transaction_transaction_type').value,
            amount: document.getElementById('transaction_amount').value,
            description: document.getElementById('transaction_description').value
        };
    
        // Add validation for transactionForm fields
    
        fetch(`http://localhost:3000/api/add-${table.toLowerCase()}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transactionForm)
        })
        .then(response => response.json())
        .then(result => {
            // Once the transaction is successfully added, update the account balance
            UpdateAccountBalance(transactionForm.account_id, transactionForm.transaction_type, parseFloat(transactionForm.amount));
            
            resultsDisplay("Transaction has been made successfully.");
            fetchData(`http://localhost:3000/api/${table.toLowerCase()}`);
        })
        .catch(error => console.error('Error:', error));
    }
    
    function UpdateAccountBalance(accountId, transactionType, amount) {
        const updateData = {
            account_id: accountId,
            transaction_type: transactionType,
            amount: amount
        };
    
        fetch(`http://localhost:3000/api/update-balance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update account balance');
            }
            return response.json();
        })
        .then(result => {
            resultsDisplay("Account Balance has been updated successfully.");
            fetchData(`http://localhost:3000/api/accounts`);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error: ' + error.message);
        });
    }



    document.getElementById('add_submit_Members').addEventListener('click', function(event) {
        console.log("Add Member has been clicked :D");
        AddMember(event, 'Members');
    });
    document.getElementById('add_submit_Transactions').addEventListener('click', function(event) {
        console.log("Add Transaction has been clicked :D");
        AddTransaction(event, 'Transactions');
    });



    // REMOVE ENTRY
    function deleteEntry(event) {
        event.preventDefault();

        const table = document.getElementById("delete_drop").value;
        const id = document.getElementById("delete_id").value;

        if (!id) {
            window.alert("Please enter an ID to delete.");
            return;
        } else if (!/^\d+$/.test(id)) {
            alert('Please enter a valid numerical ID number.');
            return;
        }

        const confirmed = window.confirm(`Are you sure you want to delete entry with ID ${id} from ${table} table?`);
        if (confirmed) {
            fetch(`http://localhost:3000/api/delete-${table.toLowerCase()}/${id}`, {
                method: "DELETE"
            })
            .then(response => response.json())
            .then(result => {
                // Display success message or handle any errors
                console.log(result);
                resultsDisplay(result.message);
                document.getElementById("delete_id").value = "";
                fetchData(`http://localhost:3000/api/${table.toLowerCase()}`);
            })
            .catch(error => console.error("Error:", error));
        }
    }

    const deleteButton = document.getElementById("delete_submit");
    deleteButton.addEventListener("click", deleteEntry);

    

    // QUERYING DATABASE
    document.getElementById("query_submit").addEventListener("click", function (event) {
        event.preventDefault();
    
        const table = document.getElementById("query_drop").value;
        const id = document.getElementById("query_id").value;
        const column = document.getElementById(`query_column_${table}`).value;
        const contain = document.getElementById("query_contain").value;
    
        const queryData = { table, id, column, contain };
    
        fetch(`http://localhost:3000/api/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(queryData)
        })
        .then(response => response.json())
        .then(result => {
            // Process the query result
            console.log(result);
            createDriversTable(result); // Pass the result directly to the function
            resultsDisplay("Query has been made successfully.");
        })
        .catch(error => console.error('Error:', error));
    });



    // DISPLAY TABLE CONTENTS
    // For displaying tables below
    function fetchData(endpoint) {
        return fetch(endpoint) // Make an HTTP GET request to the backend API endpoint
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Parse the JSON data
        })
        .then(drivers => {
            console.log(drivers);
            createDriversTable(drivers);
        })
        .catch(error => {
            console.error('Error fetching data:', error); // Handle any errors that occur during the fetch
        });
    }

    
    fetchData('http://localhost:3000/api/members');

    var tablesDisplayDrop = document.getElementById("table_drop");
    tablesDisplayDrop.addEventListener('change', function() {
        const selectedTable = tablesDisplayDrop.value;
        if (selectedTable === 'Members') {
            console.log("Drivers Works");
            fetchData('http://localhost:3000/api/members');
            resultsDisplay("Tables: Members table selected");

        } else if (selectedTable === 'Accounts') {
            console.log("Vehicles Works");
            fetchData('http://localhost:3000/api/accounts');
            resultsDisplay("Tables: Accounts table selected");

        } else if (selectedTable === 'Transactions') {
            console.log("Passengers Works");
            fetchData('http://localhost:3000/api/transactions');
            resultsDisplay("Tables: Transactions table selected");

        } else {
            tableDisplay.innerHTML = '';
        }
    });

    //Create actual table data based on JSON data
    function createDriversTable(data) {
        console.log("in createDriversTable, data = ");
        console.log(data);

        const table = document.createElement('table');
        table.classList.add('driver-table');

        // create table headers
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = Object.keys(data[0]);
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create table body
        const tbody = document.createElement('tbody');
        data.forEach(item => {
            const row = document.createElement('tr');
            Object.values(item).forEach(value => {
                const td = document.createElement('td');
                td.textContent = value;
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        const tableDisplay = document.querySelector('.table_display');
        tableDisplay.innerHTML = '';
        tableDisplay.appendChild(table);
    }
});