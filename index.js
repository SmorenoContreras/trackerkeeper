const mysql = require("mysql");
const inquirer = require("inquirer");
require("console.table");

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "employeesDB"
});

connection.connect(function (err) {
  if (err) throw err;
  firstPrompt();
});


function firstPrompt() {

  inquirer
    .prompt({
      type: "list",
      name: "task",
      message: "Would you like to do? Please choose an option:",
      choices: [
        "View Employees",
        "View Employees by Department",
        "View Employees by Manager",
        "Add Employee",
        "Remove Employees",
        "Update Employee Role",
        "Add Role",
        "Remove Role",
        "Remove Department",
        "Update Employee Manager",
        "View Department Budget",
        "End"]
    })
    .then(function ({ task }) {
      switch (task) {
        case "View Employees":
          viewEmployee();
          break;
        case "View Employees by Department":
          viewEmployeeByDepartment();
          break;
        case "View Employees by Manager":
          viewEmployeeByManager();
          break;
        case "Add Employee":
          addEmployee();
          break;
        case "Remove Employees":
          removeEmployees();
          break;
        case "Update Employee Role":
          updateEmployeeRole();
          break;
        case "Add Role":
          addRole();
          break;
        case "Remove Role":
          deleteRolePrompt();
          break;
        case "Update Employee Manager":
          updateEmployeeManager();
          break;

        case "Remove Department": 
          deleteDepartmentPrompt()
        break;
        case "View Department Budget":
          viewDepartmentBudget();
          break;


        case "End":
          connection.end();
          break;
      }
    });
}

// Fetch and display department budget
function viewDepartmentBudget() {
  // Fetch the list of departments
  var departmentQuery =
    `SELECT id, name
      FROM department`;

  connection.query(departmentQuery, function (err, departments) {
    if (err) throw err;

    const departmentChoices = departments.map(({ id, name }) => ({
      value: id, name: `${id} ${name}`
    }));

    inquirer
      .prompt({
        type: "list",
        name: "departmentId",
        message: "Select a department to view the budget:",
        choices: departmentChoices,
      })
      .then(function ({ departmentId }) {
        // Fetch and display the budget for the selected department
        var budgetQuery =
          `SELECT d.id, d.name, SUM(r.salary) AS total_budget
            FROM employee e
            LEFT JOIN role r ON e.role_id = r.id
            LEFT JOIN department d ON r.department_id = d.id
            WHERE d.id = ?
            GROUP BY d.id, d.name`;

        connection.query(budgetQuery, [departmentId], function (err, res) {
          if (err) throw err;

          console.table(res);
          console.log(`Budget for the selected department viewed!\n`);

          // After displaying the budget, go back to the main prompt
          firstPrompt();
        });
      });
  });
}

// Fetch and display employees for updating manager
function updateEmployeeManager() {
  var query =
    `SELECT id, CONCAT(first_name, ' ', last_name) AS employee_name
      FROM employee`;

  connection.query(query, function (err, res) {
    if (err) throw err;

    const employeeChoices = res.map(({ id, employee_name }) => ({
      value: id, name: `${id} ${employee_name}`
    }));

    console.table(res);
    console.log("Employees available for manager update!\n");

    // Prompt the user to choose an employee for manager update
    promptUpdateEmployeeManager(employeeChoices);
  });
}

// Prompt user to select an employee for manager update
function promptUpdateEmployeeManager(employeeChoices) {
  inquirer
    .prompt([
      {
        type: "list",
        name: "employeeToUpdate",
        message: "Which employee's manager would you like to update?",
        choices: employeeChoices,
      },
      {
        type: "list",
        name: "newManager",
        message: "Select the new manager for the employee:",
        choices: employeeChoices,
      },
    ])
    .then(function ({ employeeToUpdate, newManager }) {
      // Call the updateEmployeeManager function with the selected employee and new manager
       updateEmployeeManagerExecute(employeeToUpdate, newManager); 
    });
}


// Handle the actual update of the employee's manager
function updateEmployeeManagerExecute(employeeId, newManagerId) {
  var updateEmployeeManagerQuery = `UPDATE employee SET manager_id = ? WHERE id = ?`;

  connection.query(updateEmployeeManagerQuery, [newManagerId, employeeId], function (err, res) {
    if (err) throw err;

    console.log(`Employee's manager has been updated!\n`);

    firstPrompt();
  });
} 


// Fetch and display employees grouped by manager
function viewEmployeeByManager() {
  var query =
    `SELECT m.id AS manager_id, CONCAT(m.first_name, ' ', m.last_name) AS manager_name, 
            e.id AS employee_id, CONCAT(e.first_name, ' ', e.last_name) AS employee_name
      FROM employee e
      LEFT JOIN employee m ON e.manager_id = m.id`;

  connection.query(query, function (err, res) {
    if (err) throw err;

    // Display employees grouped by manager
    const employeesByManager = {};

    res.forEach(({ manager_id, manager_name, employee_id, employee_name }) => {
      if (!employeesByManager[manager_id]) {
        employeesByManager[manager_id] = {
          manager_id,
          manager_name,
          employees: []
        };
      }

      employeesByManager[manager_id].employees.push({
        employee_id,
        employee_name
      });
    });

    Object.values(employeesByManager).forEach(managerInfo => {
      console.log(`Manager: ${managerInfo.manager_name}`);
      console.table(managerInfo.employees);
      console.log("-------------");
    });

    
    firstPrompt();
  });
}


function viewEmployee() {
  console.log("Viewing employees\n");

  var query =
    `SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department, r.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager
  FROM employee e
  LEFT JOIN role r
	ON e.role_id = r.id
  LEFT JOIN department d
  ON d.id = r.department_id
  LEFT JOIN employee m
	ON m.id = e.manager_id`

  connection.query(query, function (err, res) {
    if (err) throw err;

    console.table(res);
    console.log("Employees viewed!\n");

    firstPrompt();
  });

}



// Make a department array

function viewEmployeeByDepartment() {
  console.log("Viewing employees by department\n");

  var query =
    `SELECT d.id, d.name, r.salary AS budget
  FROM employee e
  LEFT JOIN role r
	ON e.role_id = r.id
  LEFT JOIN department d
  ON d.id = r.department_id
  GROUP BY d.id, d.name`

  connection.query(query, function (err, res) {
    if (err) throw err;

  

    const departmentChoices = res.map(data => ({
      value: data.id, name: data.name
    }));

    console.table(res);
    console.log("Department view succeed!\n");

    promptDepartment(departmentChoices);
  });

}

// User choose the department list, then employees pop up

function promptDepartment(departmentChoices) {

  inquirer
    .prompt([
      {
        type: "list",
        name: "departmentId",
        message: "Which department would you choose?",
        choices: departmentChoices
      }
    ])
    .then(function (answer) {
      console.log("answer ", answer.departmentId);

      var query =
        `SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department 
  FROM employee e
  JOIN role r
	ON e.role_id = r.id
  JOIN department d
  ON d.id = r.department_id
  WHERE d.id = ?`

      connection.query(query, answer.departmentId, function (err, res) {
        if (err) throw err;

        console.table("response ", res);
        console.log("Employees are viewed!\n");

        firstPrompt();
      });
    });
}


function addEmployee() {
  console.log("Inserting an employee!")

  var query =
    `SELECT r.id, r.title, r.salary 
      FROM role r`

  connection.query(query, function (err, res) {
    if (err) throw err;

    const roleChoices = res.map(({ id, title, salary }) => ({
      value: id, title: `${title}`, salary: `${salary}`
    }));

    console.table(res);
    console.log("RoleToInsert!");

    promptInsert(roleChoices);
  });
}

function promptInsert(roleChoices) {

  inquirer
    .prompt([
      {
        type: "input",
        name: "first_name",
        message: "What is the employee's first name?"
      },
      {
        type: "input",
        name: "last_name",
        message: "What is the employee's last name?"
      },
      {
        type: "list",
        name: "roleId",
        message: "What is the employee's role?",
        choices: roleChoices
      },
    
    ])
    .then(function (answer) {
      console.log(answer);

      var query = `INSERT INTO employee SET ?`
   
      connection.query(query,
        {
          first_name: answer.first_name,
          last_name: answer.last_name,
          role_id: answer.roleId,
          manager_id: answer.managerId,
        },
        function (err, res) {
          if (err) throw err;

          console.table(res);
          console.log("Inserted successfully!\n");

          firstPrompt();
        });
      // console.log(query.sql);
    });
}



function removeEmployees() {
  console.log("Deleting an employee");

  var query =
    `SELECT e.id, e.first_name, e.last_name
      FROM employee e`

  connection.query(query, function (err, res) {
    if (err) throw err;

    const deleteEmployeeChoices = res.map(({ id, first_name, last_name }) => ({
      value: id, name: `${id} ${first_name} ${last_name}`
    }));

    console.table(res);
    console.log("ArrayToDelete!\n");

    promptDelete(deleteEmployeeChoices);
  });
}


function promptDelete(deleteEmployeeChoices) {

  inquirer
    .prompt([
      {
        type: "list",
        name: "employeeId",
        message: "Which employee do you want to remove?",
        choices: deleteEmployeeChoices
      }
    ])
    .then(function (answer) {

      var query = `DELETE FROM employee WHERE ?`;
     
      connection.query(query, { id: answer.employeeId }, function (err, res) {
        if (err) throw err;

        console.table(res);
        console.log("Deleted!\n");

        firstPrompt();
      });
    
    });
}


function updateEmployeeRole() { 
  employeeArray();

}

function employeeArray() {
  console.log("Updating an employee");

  var query =
    `SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department, r.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager
  FROM employee e
  JOIN role r
	ON e.role_id = r.id
  JOIN department d
  ON d.id = r.department_id
  JOIN employee m
	ON m.id = e.manager_id`

  connection.query(query, function (err, res) {
    if (err) throw err;

    const employeeChoices = res.map(({ id, first_name, last_name }) => ({
      value: id, name: `${first_name} ${last_name}`      
    }));

    console.table(res);
    console.log("employeeArray To Update!\n")

    roleArray(employeeChoices);
  });
}

function roleArray(employeeChoices) {
  console.log("Updating an role");

  var query =
    `SELECT r.id, r.title, r.salary 
  FROM role r`
  let roleChoices;

  connection.query(query, function (err, res) {
    if (err) throw err;

    roleChoices = res.map(({ id, title, salary }) => ({
      value: id, title: `${title}`, salary: `${salary}`      
    }));

    console.table(res);
    console.log("roleArray to Update!\n")

    promptEmployeeRole(employeeChoices, roleChoices);
  });
}

function promptEmployeeRole(employeeChoices, roleChoices) {

  inquirer
    .prompt([
      {
        type: "list",
        name: "employeeId",
        message: "Which employee do you want to set with the role?",
        choices: employeeChoices
      },
      {
        type: "list",
        name: "roleId",
        message: "Which role do you want to update?",
        choices: roleChoices
      },
    ])
    .then(function (answer) {

      var query = `UPDATE employee SET role_id = ? WHERE id = ?`
      // when finished prompting, insert a new item into the db with that info
      connection.query(query,
        [ answer.roleId,  
          answer.employeeId
        ],
        function (err, res) {
          if (err) throw err;

          console.table(res);
          console.log(res.affectedRows + "Updated successfully!");

          firstPrompt();
        });
  
    });
}



function addRole() {

  var query =
    `SELECT d.id, d.name, r.salary AS budget
    FROM employee e
    JOIN role r
    ON e.role_id = r.id
    JOIN department d
    ON d.id = r.department_id
    GROUP BY d.id, d.name`

  connection.query(query, function (err, res) {
    if (err) throw err;

    const departmentChoices = res.map(({ id, name }) => ({
      value: id, name: `${id} ${name}`
    }));

    console.table(res);
    console.log("Department array!");

    promptAddRole(departmentChoices);
  });
}

function promptAddRole(departmentChoices) {

  inquirer
    .prompt([
      {
        type: "input",
        name: "roleTitle",
        message: "Role title?"
      },
      {
        type: "input",
        name: "roleSalary",
        message: "Role Salary"
      },
      {
        type: "list",
        name: "departmentId",
        message: "Department?",
        choices: departmentChoices
      },
    ])
    .then(function (answer) {

      var query = `INSERT INTO role SET ?`

      connection.query(query, {
        title: answer.roleTitle,
        salary: answer.roleSalary,
        department_id: answer.departmentId
      },
        function (err, res) {
          if (err) throw err;

          console.table(res);
          console.log("Role Inserted!");

          firstPrompt();
        });

    });
}

function deleteRolePrompt() {
  var query =
    `SELECT id, title
      FROM role`;

  connection.query(query, function (err, res) {
    if (err) throw err;

    const deleteRoleChoices = res.map(({ id, title }) => ({
      value: id, name: `${id} ${title}`
    }));

    console.table(res);
    console.log("Roles available for deletion!\n");

    // Prompt the user to choose a role for deletion
    promptDeleteRole(deleteRoleChoices);
  });
}

// Function to prompt user to select a role for deletion
function promptDeleteRole(deleteRoleChoices) {
  inquirer
    .prompt([
      {
        type: "list",
        name: "roleToDelete",
        message: "Which role would you like to delete?",
        choices: deleteRoleChoices,
      },
    ])
    .then(function ({ roleToDelete }) {
      // Call the deleteRole function with the selected role ID
      deleteRole(roleToDelete);
    });
}

function deleteRole(roleId) {
  var deleteQuery = `DELETE FROM role WHERE id = ?`;

  connection.query(deleteQuery, [roleId], function (err, res) {
    if (err) throw err;

    console.log(`Role has been deleted!\n`);

    // After the deletion, go back to the main prompt
    firstPrompt();
  });
}

function deleteDepartmentPrompt() {
  var query =
    `SELECT id, name
      FROM department`;

  connection.query(query, function (err, res) {
    if (err) throw err;

    const deleteDepartmentChoices = res.map(({ id, name }) => ({
      value: id, name: `${id} ${name}`
    }));

    console.table(res);
    console.log("Departments available for deletion!\n");

    // Prompt the user to choose a department for deletion
    promptDeleteDepartment(deleteDepartmentChoices);
  });
}

function promptDeleteDepartment(deleteDepartmentChoices) {
  inquirer
    .prompt([
      {
        type: "list",
        name: "departmentToDelete",
        message: "Which department would you like to delete?",
        choices: deleteDepartmentChoices,
      },
    ])
    .then(function ({ departmentToDelete }) {
      // Call the deleteDepartment function with the selected department ID
      deleteDepartment(departmentToDelete);
    });
}

// Handle the actual deletion of the selected department
function deleteDepartment(departmentId) {
  var deleteQuery = `DELETE FROM department WHERE id = ?`;

  connection.query(deleteQuery, [departmentId], function (err, res) {
    if (err) throw err;

    console.log(`Department has been deleted!\n`);

    firstPrompt();
  });
}


