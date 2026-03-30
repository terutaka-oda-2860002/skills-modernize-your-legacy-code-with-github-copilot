#!/usr/bin/env node

/**
 * Account Management System
 * Modernized from COBOL to Node.js
 *
 * Original COBOL architecture:
 * - main.cob: UI and menu processing
 * - operations.cob: Business logic (TOTAL, CREDIT, DEBIT)
 * - data.cob: Data persistence
 *
 * This Node.js application maintains the original business logic,
 * data integrity, and menu options.
 */

const prompt = require('prompt-sync')({ sigint: true });

/**
 * DataManager - Manages persistent storage (based on data.cob)
 * Maintains the account balance with READ/WRITE operations
 */
class DataManager {
  constructor() {
    this.storageBalance = 1000.00; // Initial balance in PIC 9(6)V99 format
  }

  /**
   * READ operation - Retrieve current balance from storage
   * Equivalent to: CALL 'DataProgram' USING 'READ', BALANCE
   */
  read() {
    return this.storageBalance;
  }

  /**
   * WRITE operation - Update balance in storage
   * Equivalent to: CALL 'DataProgram' USING 'WRITE', BALANCE
   */
  write(newBalance) {
    // Validate that balance is within PIC 9(6)V99 range (0.00 to 999999.99)
    if (newBalance < 0 || newBalance > 999999.99) {
      throw new Error(`Balance out of valid range: ${newBalance}`);
    }
    this.storageBalance = parseFloat(newBalance.toFixed(2));
  }

  /**
   * Get formatted balance with 2 decimal places
   */
  getFormattedBalance() {
    return this.storageBalance.toFixed(2);
  }
}

/**
 * AccountOperations - Business logic layer (based on operations.cob)
 * Handles TOTAL, CREDIT, and DEBIT operations
 */
class AccountOperations {
  constructor(dataManager) {
    this.dataManager = dataManager;
  }

  /**
   * TOTAL operation - Display current balance
   * Equivalent to COBOL: IF OPERATION-TYPE = 'TOTAL'
   *   CALL 'DataProgram' USING 'READ', FINAL-BALANCE
   *   DISPLAY "Current balance: " FINAL-BALANCE
   */
  viewBalance() {
    try {
      const balance = this.dataManager.read();
      console.log(`Current balance: ${balance.toFixed(2)}`);
      return balance;
    } catch (error) {
      console.error(`Error reading balance: ${error.message}`);
      return null;
    }
  }

  /**
   * CREDIT operation - Add funds to account
   * Equivalent to COBOL:
   *   DISPLAY "Enter credit amount: "
   *   ACCEPT AMOUNT
   *   CALL 'DataProgram' USING 'READ', FINAL-BALANCE
   *   ADD AMOUNT TO FINAL-BALANCE
   *   CALL 'DataProgram' USING 'WRITE', FINAL-BALANCE
   *   DISPLAY "Amount credited. New balance: " FINAL-BALANCE
   */
  creditAccount(amount) {
    try {
      // Validate amount is positive and within data type range
      if (amount < 0 || amount > 999999.99) {
        console.error('Invalid credit amount. Must be between 0.00 and 999999.99');
        return false;
      }

      // Read current balance
      const currentBalance = this.dataManager.read();

      // Calculate new balance
      const newBalance = parseFloat((currentBalance + amount).toFixed(2));

      // Check for overflow (PIC 9(6)V99 max is 999999.99)
      if (newBalance > 999999.99) {
        console.error('Credit amount would exceed maximum balance (999999.99)');
        return false;
      }

      // Write new balance
      this.dataManager.write(newBalance);

      console.log(`Amount credited. New balance: ${newBalance.toFixed(2)}`);
      return true;
    } catch (error) {
      console.error(`Error during credit operation: ${error.message}`);
      return false;
    }
  }

  /**
   * DEBIT operation - Withdraw funds from account
   * Key business rule: Only allow withdrawal if balance >= amount
   *
   * Equivalent to COBOL:
   *   DISPLAY "Enter debit amount: "
   *   ACCEPT AMOUNT
   *   CALL 'DataProgram' USING 'READ', FINAL-BALANCE
   *   IF FINAL-BALANCE >= AMOUNT
   *     SUBTRACT AMOUNT FROM FINAL-BALANCE
   *     CALL 'DataProgram' USING 'WRITE', FINAL-BALANCE
   *     DISPLAY "Amount debited. New balance: " FINAL-BALANCE
   *   ELSE
   *     DISPLAY "Insufficient funds for this debit."
   *   END-IF
   */
  debitAccount(amount) {
    try {
      // Validate amount
      if (amount < 0 || amount > 999999.99) {
        console.error('Invalid debit amount. Must be between 0.00 and 999999.99');
        return false;
      }

      // Read current balance
      const currentBalance = this.dataManager.read();

      // Critical business rule: Check if sufficient funds available
      if (currentBalance < amount) {
        console.log('Insufficient funds for this debit.');
        return false;
      }

      // Calculate new balance
      const newBalance = parseFloat((currentBalance - amount).toFixed(2));

      // Write new balance
      this.dataManager.write(newBalance);

      console.log(`Amount debited. New balance: ${newBalance.toFixed(2)}`);
      return true;
    } catch (error) {
      console.error(`Error during debit operation: ${error.message}`);
      return false;
    }
  }
}

/**
 * AccountUI - User Interface layer (based on main.cob)
 * Handles menu display and user interaction
 */
class AccountUI {
  constructor(accountOps) {
    this.accountOps = accountOps;
    this.continueFlag = true;
  }

  /**
   * Display main menu
   * Equivalent to COBOL:
   *   DISPLAY "--------------------------------"
   *   DISPLAY "Account Management System"
   *   DISPLAY "1. View Balance"
   *   ... etc
   */
  displayMenu() {
    console.clear && console.clear();
    console.log('--------------------------------');
    console.log('Account Management System');
    console.log('1. View Balance');
    console.log('2. Credit Account');
    console.log('3. Debit Account');
    console.log('4. Exit');
    console.log('--------------------------------');
  }

  /**
   * Main event loop
   * Equivalent to COBOL:
   *   PERFORM UNTIL CONTINUE-FLAG = 'NO'
   *     DISPLAY menu
   *     ACCEPT USER-CHOICE
   *     EVALUATE USER-CHOICE
   *       WHEN 1: CALL 'Operations' USING 'TOTAL'
   *       WHEN 2: CALL 'Operations' USING 'CREDIT'
   *       WHEN 3: CALL 'Operations' USING 'DEBIT'
   *       WHEN 4: MOVE 'NO' TO CONTINUE-FLAG
   *     END-EVALUATE
   *   END-PERFORM
   */
  run() {
    while (this.continueFlag) {
      this.displayMenu();

      const choice = prompt('Enter your choice (1-4): ');

      switch (choice) {
        case '1':
          this.handleViewBalance();
          break;
        case '2':
          this.handleCreditAccount();
          break;
        case '3':
          this.handleDebitAccount();
          break;
        case '4':
          this.handleExit();
          break;
        default:
          console.log('Invalid choice, please select 1-4.');
      }

      // Wait for user input before continuing (except on exit)
      if (this.continueFlag) {
        prompt('Press Enter to continue...');
      }
    }
  }

  /**
   * Handle View Balance menu option (1)
   */
  handleViewBalance() {
    console.log();
    this.accountOps.viewBalance();
  }

  /**
   * Handle Credit Account menu option (2)
   */
  handleCreditAccount() {
    console.log();
    const amountStr = prompt('Enter credit amount: ');

    try {
      const amount = parseFloat(amountStr);

      if (isNaN(amount)) {
        console.log('Invalid amount. Please enter a valid number.');
        return;
      }

      this.accountOps.creditAccount(amount);
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  }

  /**
   * Handle Debit Account menu option (3)
   */
  handleDebitAccount() {
    console.log();
    const amountStr = prompt('Enter debit amount: ');

    try {
      const amount = parseFloat(amountStr);

      if (isNaN(amount)) {
        console.log('Invalid amount. Please enter a valid number.');
        return;
      }

      this.accountOps.debitAccount(amount);
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  }

  /**
   * Handle Exit menu option (4)
   * Equivalent to COBOL: STOP RUN
   */
  handleExit() {
    this.continueFlag = false;
    console.log('Exiting the program. Goodbye!');
  }
}

/**
 * Main Application Entry Point
 */
class AccountManagementSystem {
  constructor() {
    this.dataManager = new DataManager();
    this.accountOps = new AccountOperations(this.dataManager);
    this.ui = new AccountUI(this.accountOps);
  }

  start() {
    this.ui.run();
  }
}

// Application startup
if (require.main === module) {
  const app = new AccountManagementSystem();
  app.start();
}

// Export for testing purposes
module.exports = {
  DataManager,
  AccountOperations,
  AccountUI,
  AccountManagementSystem,
};
