const sqlite = require('sqlite3');

const db = new sqlite.Database('./database.sqlite');

db.serialize(() => {
  db.run('DROP TABLE IF EXISTS Employee', error => {
    if (error) {
      throw error;
    }
  });
  db.run('CREATE TABLE Employee (id INTEGER PRIMARY KEY, name TEXT NOT NULL, position TEXT NOT NULL, ' + 
  'wage INTEGER NOT NULL, is_current_employee INTEGER NOT NULL DEFAULT 1)', error => {
      if (error) {
        throw error;
      }
    });
  db.run('DROP TABLE IF EXISTS Timesheet', error => {
    if (error) {
      throw error;
    }
  });
  db.run('CREATE TABLE Timesheet (id INTEGER PRIMARY KEY, hours INTEGER NOT NULL, rate INTEGER NOT NULL, ' + 
         'date INTEGER NOT NULL, employee_id INTEGER NOT NULL)', error => {
      if (error) {
        throw error;
      }
    });
  db.run('DROP TABLE IF EXISTS Menu', error => {
    if (error) {
      throw error;
    }
  });
  db.run('CREATE TABLE Menu (id INTEGER PRIMARY KEY, title TEXT NOT NULL)', error => {
      if (error) {
        throw error;
      }
    });
  db.run('DROP TABLE IF EXISTS MenuItem', error => {
      if (error) {
        throw error;
      }
    });
  db.run('CREATE TABLE MenuItem (id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT, inventory INTEGER NOT NULL, ' + 
         'price INTEGER NOT NULL, menu_id INTEGER NOT NULL)', error => {
      if (error) {
        throw error;
      }
    });

});