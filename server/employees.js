const employeesRouter = require('express').Router();

module.exports = employeesRouter;

const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

employeesRouter.get('/', (req, res, next) => {
    db.all(`SELECT * from Employee WHERE is_current_employee =1`, (error, rows) => {
        if (error) {
          return;
        } else {
            res.send({employees: rows});
        }
      });
  });

employeesRouter.get('/:employeeId', (req, res, next) => {
    const employeeId = req.params.employeeId;
  db.get(`SELECT * from Employee WHERE id=$employeeId`, 
    {
        $employeeId: employeeId  
    }, function(error, rows) {
        if (error) {
          return;
        } else if (!rows) {
            res.status(404).send();
        } else {
            res.send({employee: rows});
        }
    });
});

function checkEmployee(employee, res) {
    if (!employee.name || !employee.position || !employee.wage) {
        res.status(400).send();
       return;
    }
}

employeesRouter.post('/', (req, res, next) => {
  const employee = req.body.employee;
  checkEmployee(employee, res);
  
  db.run("INSERT INTO Employee (name, position, wage) VALUES ($name, $position, $wage)",
     {
        $name: employee.name,
        $position: employee.position, 
        $wage: employee.wage
     }, function(error, rows) {
     if (error) {
       res.status(500).send();
       console.log(error);
       return;
     } else {
       db.get(
            "SELECT * FROM Employee WHERE id = $lastID",
         {
           $lastID: this.lastID
         }
         , (error, rows) => {
             const obj = { employee: rows };
             res.status(201).send(obj);
       });
     }
  });

});

employeesRouter.put('/:employeeId', (req, res, next) => {
    const employee = req.body.employee;
    const id = req.params.employeeId;
    checkEmployee(employee, res);
    db.run("UPDATE Employee SET name=$name, position=$position, wage=$wage WHERE id=$employeeId",
     {
        $employeeId: id,
        $name: employee.name,
        $position: employee.position, 
        $wage: employee.wage
     }, function(error, rows) {
     if (error) {
       res.status(500).send();
       console.log(error);
       return;
     } else {
       db.get(
            "SELECT * FROM Employee WHERE id = $employeeId",
         {
           $employeeId: id
         }
         , (error, rows) => {
             const obj = { employee: rows };
             res.send(obj);
       });
     }
  });
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
    const employee = req.body.employee;
    const id = req.params.employeeId;
    db.run("UPDATE Employee SET is_current_employee='0' WHERE id=$employeeId",
     {
        $employeeId: id
     }, function(error) {
     if (error) {
       res.status(500).send();
       return;
     } else {
       db.get(
            "SELECT * FROM Employee WHERE id = $employeeId",
         {
           $employeeId: id
         }
         , (error, rows) => {
             const obj = { employee: rows };
             res.send(obj);
       });
     }
  });
});

employeesRouter.get('/:employeeId/timesheets', (req, res, next) => {
    const employeeId = req.params.employeeId;
    
    db.get(`SELECT * from Employee WHERE id=$employeeId`, 
      {
          $employeeId: employeeId  
      }, function(error, rows) {
          if (error) {
            return;
          } else if (!rows) {
              res.status(404).send();
          } else {
            db.all(`SELECT * from Timesheet WHERE employee_id=$employeeId`, 
                {
                    $employeeId: employeeId  
                }, function(error, rows) {
                    if (error) {
                      return;
                    } else if (!rows) {
                        res.send({timesheets: []});
                    } else {
                        res.send({timesheets: rows});
                    }
                });
          }
      });
       
  });

function checkTimesheet(timesheet, res) {
    if (!timesheet.hours || !timesheet.rate || !timesheet.date) {
        res.status(400).send();
       return;
    }
}

employeesRouter.post('/:employeeId/timesheets', (req, res, next) => {
  const timesheet = req.body.timesheet;
  checkTimesheet(timesheet, res);

  const employeeId = req.params.employeeId;
  
  db.get(`SELECT * from Employee WHERE id=$employeeId`, 
    {
        $employeeId: employeeId  
    }, function(error, rows) {
        if (error) {
          return;
        } else if (!rows) {
            res.status(404).send();
        } else {
            db.run(`INSERT INTO Timesheet (hours, rate, date, employee_id) ` +
                   `VALUES ($hours, $rate, $date, $employee_id)`,
                {
                   $hours: timesheet.hours,
                   $rate: timesheet.rate,
                   $date: timesheet.date,
                   $employee_id: employeeId
                }, function(error) {
                if (error) {
                  res.status(500).send();
                  console.log(error);
                  return;
                } else {
                  db.get(
                       "SELECT * FROM Timesheet WHERE id = $lastID",
                    {
                      $lastID: this.lastID
                    }
                    , (error, rows) => {
                        const obj = { timesheet: rows };
                        res.status(201).send(obj);
                  });
                }
            });
        }
    });
  
});

employeesRouter.put('/:employeeId/timesheets/:timesheetId', (req, res, next) => {
    const timesheet = req.body.timesheet;
    checkTimesheet(timesheet, res);

    const employeeId = req.params.employeeId;
    const timesheetId = req.params.timesheetId;

    db.serialize(() => {
        db.get(`SELECT * from Employee WHERE id=$employeeId`, 
            {
                $employeeId: employeeId  
            }, function(error, rows) {
                if (error) {
                  return;
                } else if (!rows) {
                    res.status(404).send();
                }
            });
        db.get(`SELECT * from Timesheet WHERE id=$timesheetId`, 
            {
                $timesheetId: timesheetId  
            }, function(error, rows) {
                if (error) {
                  return;
                } else if (!rows) {
                    res.status(404).send();
                }
            });
        
        db.run(`UPDATE Timesheet SET hours=$hours, rate = $rate, date = $date, ` + 
               `employee_id = $employee_id WHERE id=$timesheetId`,
            {
                $hours: timesheet.hours,
                $rate: timesheet.rate,
                $date: timesheet.date,
                $employee_id: employeeId,
                $timesheetId: timesheetId
            }, function(error) {
            if (error) {
              res.status(500).send();
              console.log(error);
              return;
            } else {
              db.get(
                   "SELECT * FROM Timesheet WHERE id = $timesheetId",
                {
                  $timesheetId: timesheetId
                }
                , (error, rows) => {
                    const obj = { timesheet: rows };
                    res.send(obj);
              });
            }
        });
        
        
    });
       
});

employeesRouter.delete('/:employeeId/timesheets/:timesheetId', (req, res, next) => {

    const employeeId = req.params.employeeId;
    const timesheetId = req.params.timesheetId;

    db.serialize(() => {
        db.get(`SELECT * from Employee WHERE id=$employeeId`, 
            {
                $employeeId: employeeId  
            }, function(error, rows) {
                if (error) {
                  return;
                } else if (!rows) {
                    res.status(404).send();
                }
            });
        db.get(`SELECT * from Timesheet WHERE id=$timesheetId`, 
            {
                $timesheetId: timesheetId  
            }, function(error, rows) {
                if (error) {
                  return;
                } else if (!rows) {
                    res.status(404).send();
                }
            });
        
        db.run("DELETE FROM Timesheet WHERE id=$timesheetId",
            {
               $timesheetId: timesheetId
            }, function(error) {
            if (error) {
              res.status(500).send();
              return;
            } else {
                res.status(204).send();
            }
        });
        
    });
   
});
