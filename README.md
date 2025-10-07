# Expense-tracker

CLI tool to track expenses.

project URL: https://roadmap.sh/projects/expense-tracker

## How to use

First clone the repository

```
git clone https://github.com/samieremie/Expense-tracker.git
```

Then open the folder that was created and run following command

```
npm link
```

Now you can use the app like this

```
$ expense-tracker add --description "Dinner" --amount 10 --category <category>
# select category from: 'food', 'transport', 'entertainment', 'utilities', 'other'

$ expense-tracker list

$ expense-tracker summary

$ expense-tracker delete --id 2

$ expense-tracker summary

$ expense-tracker summary --month 8

$ expense-tracker filter --category <category>

# Exports to CSV
$ expense-tracker export

# Set monthly budget
$ expense-tracker set-budget --amount <amount>
```
