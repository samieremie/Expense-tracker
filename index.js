#!/usr/bin/env node
import fs from 'fs';

console.log("Welcome to the Expense Tracker!");

const CONFIG_PATH = "./config.json";
const EXPENSES_PATH = "./expenses.json";

/** Load existing config from file or initialize empty file
 * @returns Config object
 */
function loadConfig() {
    if (fs.existsSync(CONFIG_PATH)) {
        const data = fs.readFileSync(CONFIG_PATH);
        try {
            return JSON.parse(data);
        } catch (err) {
            console.error("Error parsing config.json, resetting file.");
            return {};
        }
    }
    const defaultConfig = { monthlyBudget: 0 };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), "utf-8");
    return defaultConfig;
}

/** Save config to file
 * @param {Array} config 
 */
function saveConfig(config) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

/** Load existing expenses from file or initialize empty array
 * @returns Array of expenses
 */
function loadExpenses() {
    if (fs.existsSync(EXPENSES_PATH)) {
        const data = fs.readFileSync(EXPENSES_PATH);
        try {
            return JSON.parse(data);
        } catch (err) {
            console.error("Error parsing expenses.json, resetting file.");
            return [];
        }
    } 
    // file doesn’t exist → return empty list
    return [];
}

/** Save expenses to file
 * @param {Array} expenses 
 */
function saveExpenses(expenses) {
    fs.writeFileSync(EXPENSES_PATH, JSON.stringify(expenses, null, 2));
}

/**
 * Function used to parse command line arguments
 * @returns {command: string, options: Object}
 */
function parseArgs() {
    const args = process.argv.slice(2);

    const command = args[0];
    const options = {};

    for (let i = 1; i < args.length; i++) {
        if (args[i].startsWith('--')) {
            const key = args[i].replace('--', '');
            const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
            options[key] = value;
            if (value !== true) i++;
        }
    }

    return { command, options };
}

/**
 * Function to add a new expense
 * @param {*} amount 
 * @param {*} description 
 */
function addExpense(amount, description, category) {
    const expenses = loadExpenses();
    const expensesID = expenses.length > 0 ? expenses[expenses.length - 1].id + 1 : 1;
    if (isNaN(amount) || amount <= 0) {
        console.log("Please provide a valid positive number for amount.");
        return;
    }
    const date = new Date();
    const newExpense = { 
        id: expensesID, 
        category,
        date: date.toISOString().split('T')[0], 
        amount: parseFloat(amount),
        description 
    };

    // Check if the new expense exceeds the budget
    const config = loadConfig();
    const month = date.getMonth() + 1; // getMonth() is zero-based
    const totalExpenses = computeExpenses(month, expenses) + newExpense.amount;
    if (totalExpenses > config.monthlyBudget) {
        console.log(`⚠️ Warning: Adding this expense exceeds your monthly budget of $${config.monthlyBudget.toFixed(2)}.`);
    }

    expenses.push(newExpense);
    saveExpenses(expenses);
    console.log("# Expense added successfully (ID: " + newExpense.id + ")");
}

/**
 * Function to list all expenses
 */
function listExpenses(category = null) {
    let expenses = loadExpenses();
    if (category) {
        expenses = expenses.filter(expense => expense.category.toLowerCase() === category.toLowerCase());
    }
    if (expenses.length === 0) {
        console.log("No expenses found.");
    } else {
        console.log("# ID\t| Category\t| Date\t\t| Amount\t\t| Description");
        expenses.forEach(expense => {
            console.log(`# ${expense.id}\t| ${expense.category}\t| ${expense.date}\t| $${expense.amount.toFixed(2)}\t\t| ${expense.description}`);
        });
    }
}

/**
 * Function to show summary of expenses for a given month,
 * if month is 0 or not provided, show summary for all time
 * @param {*} month 
 */
function summaryExpenses(month) {
    // Here you would add logic to generate a summary of expenses for the given month
    const expenses = loadExpenses();
    if (month === 0) {
        const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        console.log(`Total expenses: $${total.toFixed(2)}`);
    }
    else if (month < 12 && month > 0) {
        const totalExpenses = computeExpenses(month, expenses);
        console.log(`Total expenses for month ${month}: $${totalExpenses.toFixed(2)}`);
    }
    else {
        console.log("Please provide a valid month (1-12) or nothing for all time summary.");
    }
}

/**
 * Help function to compute total expenses for a given month
 * @param {*} month 
 */
function computeExpenses(month, expenses) {
    const targetMonth = parseInt(month);
    const total = expenses
        .filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() + 1 === targetMonth; // getMonth() is zero-based
        })
        .reduce((sum, expense) => sum + expense.amount, 0);
    return total;
}

/**
 * Function to delete an expense by ID
 * @param {*} id 
 */
function deleteExpense(id) {
    const expenses = loadExpenses();
    const targetId = parseInt(id);

    let found = false;
    const updatedExpenses = [];

    for (let i = 0; i < expenses.length; i++) {
        const expense = expenses[i];
        if (expense.id === targetId) {
            found = true; // skip this one (delete it)
            continue;
        }
        if (found) expense.id -= 1; // adjust IDs of subsequent expenses
        updatedExpenses.push(expense);
    }

    if (!found) {
        console.log(`❌ No expense found with ID: ${id}`);
        return;
    }

    saveExpenses(updatedExpenses);
    console.log(`✅ Expense with ID: ${id} deleted successfully.`);
}

/** Function to set monthly budget
 * @param {*} amount 
 */
function setBudget(amount) {
    const config = loadConfig();
    if (isNaN(amount) || amount <= 0) {
        console.log("Please provide a valid positive number for budget amount.");
        return;
    }
    config.monthlyBudget = parseFloat(amount);
    saveConfig(config);
    console.log(`Budget set to $${config.monthlyBudget.toFixed(2)} successfully.`);
}

function extractToCSV() {
    const expenses = loadExpenses();
    if (expenses.length === 0) {
        console.log("No expenses to export.");
        return;
    }
    const header = "ID,Category,Date,Amount,Description\n";
    const rows = expenses.map(expense => 
        `${expense.id},${expense.category},${expense.date},${expense.amount.toFixed(2)},"${expense.description.replace(/"/g, '""')}"`);
    const csvContent = header + rows.join("\n");
    fs.writeFileSync("expenses.csv", csvContent);
    console.log("Expenses exported to expenses.csv successfully.");
}

function main() {
    const { command, options } = parseArgs();
    switch (command) {
        case 'add':
            if (options.category) {
                const isValidCategory = ['food', 'transport', 'entertainment', 'utilities', 'other']
                .includes(options.category.toLowerCase());
                if (!isValidCategory) {
                    console.log("Please provide a valid category: food, transport, entertainment, utilities, other.");
                    return;
                }
                if (options.amount && options.description) {
                    addExpense(options.amount, options.description, options.category);
                } else {
                    console.log("Usage: expense-tracker add --amount <amount> --description <description>");
                }
            } else {
                console.log("Please provide a category using --category <category>.");
            }
            break;
        case 'list':
            listExpenses();
            break;
        case 'summary':
            summaryExpenses(options.month || 0);
            break;
        case 'delete':
            if (options.id) {
                deleteExpense(options.id);
            }
            else {
                console.log("Usage: expense-tracker delete --id <expense_id>");
            }
            break;
        case 'filter':
            if (options.category) {
                listExpenses(options.category); // Placeholder for future implementation
            } else {
                console.log("Usage: expense-tracker filter --category <category>");
            }
            break;
        case 'set-budget':
            if (options.amount) {
                if (options.amount > 0) 
                    setBudget(options.amount);
                else
                    console.log("Please provide a valid positive number for budget amount.");
            } else {
                console.log("Usage: expense-tracker set-budget --amount <amount>");
            }
            break;
        case 'export':
            extractToCSV();
            break;
        default:
            console.log("Please provide a valid command.");
            console.log("Usage: expense-tracker <command> [options]");
            console.log("Commands:");
            console.log("  add --amount <amount> --description <description>  Add a new expense");
            console.log("  list                                               List all expenses");
            console.log("  summary --month <month>                            Show summary of expenses for a month");
            console.log("  delete --id <expense_id>                           Delete an expense by ID");
            console.log("  filter --category <category>                       List expenses by category");
            console.log("  set-budget --amount <amount>                       Set monthly budget");
            console.log("  export                                             Export expenses to CSV");
            break;
    }
}

main();