const menusRouter = require('express').Router();

module.exports = menusRouter;

const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menusRouter.get('/', (req, res, next) => {
    db.all(`SELECT * from Menu`, (error, rows) => {
        if (error) {
          return;
        } else {
            res.send({menus: rows});
        }
      });
  });

menusRouter.get('/:menuId', (req, res, next) => {
    const menuId = req.params.menuId;
  db.get(`SELECT * from Menu WHERE id=$menuId`, 
    {
        $menuId: menuId  
    }, function(error, rows) {
        if (error) {
          return;
        } else if (!rows) {
            res.status(404).send();
        } else {
            res.send({menu: rows});
        }
    });
});

function checkMenu(menu, res) {
    if (!menu.title) {
        res.status(400).send();
       return;
    }
}

menusRouter.post('/', (req, res, next) => {
  const menu = req.body.menu;
  checkMenu(menu, res);
  
  db.run("INSERT INTO Menu (title) VALUES ($title)",
     {
        $title: menu.title
     }, function(error, rows) {
     if (error) {
       res.status(500).send();
       console.log(error);
       return;
     } else {
       db.get(
            "SELECT * FROM Menu WHERE id = $lastID",
         {
           $lastID: this.lastID
         }
         , (error, rows) => {
             const obj = { menu: rows };
             res.status(201).send(obj);
       });
     }
  });

});

menusRouter.put('/:menuId', (req, res, next) => {
    const menu = req.body.menu;
    const id = req.params.menuId;
    checkMenu(menu, res);
    db.run("UPDATE Menu SET title=$title WHERE id=$menuId",
     {
        $menuId: id,
        $title: menu.title
     }, function(error, rows) {
     if (error) {
       res.status(500).send();
       console.log(error);
       return;
     } else {
       db.get(
            "SELECT * FROM Menu WHERE id = $menuId",
         {
           $menuId: id
         }
         , (error, rows) => {
             const obj = { menu: rows };
             res.send(obj);
       });
     }
  });
});


menusRouter.delete('/:menuId', (req, res, next) => {

    const menuId = req.params.menuId;

    db.serialize(() => {
        db.get(`SELECT * from MenuItem WHERE menu_id=$menuId`, 
            {
                $menuId: menuId  
            }, function(error, rows) {
                if (error) {
                  return;
                } else if (rows) {
                    res.status(400).send();
                }
            });
        db.get(`SELECT * from Menu WHERE id=$menuId`, 
            {
                $menuId: menuId  
            }, function(error, rows) {
                if (error) {
                  return;
                } else if (!rows) {
                    res.status(404).send();
                }
            });
        
        db.run("DELETE FROM Menu WHERE id=$menuId",
            {
               $menuId: menuId
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

menusRouter.get('/:menuId/menu-items', (req, res, next) => {
    const menuId = req.params.menuId;
    
    db.get(`SELECT * from Menu WHERE id=$menuId`, 
      {
          $menuId: menuId  
      }, function(error, rows) {
          if (error) {
            return;
          } else if (!rows) {
              res.status(404).send();
          } else {
            db.all(`SELECT * from MenuItem WHERE menu_id=$menuId`, 
                {
                    $menuId: menuId  
                }, function(error, rows) {
                    if (error) {
                      return;
                    } else if (!rows) {
                        res.send({menuItems: []});
                    } else {
                        res.send({menuItems: rows});
                    }
                });
          }
      });
       
  });

function checkMenuItem(menuItem, res) {
    if (!menuItem.name || !menuItem.inventory || !menuItem.price) {
        res.status(400).send();
       return;
    }
}

menusRouter.post('/:menuId/menu-items', (req, res, next) => {
  const menuItem = req.body.menuItem;
  checkMenuItem(menuItem, res);

  const menuId = req.params.menuId;
  
  db.get(`SELECT * from Menu WHERE id=$menuId`, 
    {
        $menuId: menuId  
    }, function(error, rows) {
        if (error) {
          return;
        } else if (!rows) {
            res.status(404).send();
        } else {
            db.run(`INSERT INTO MenuItem (name, description, inventory, price, menu_id) ` +
                   `VALUES ($name, $description, $inventory, $price, $menu_id)`,
                {
                   $name: menuItem.name,
                   $description: menuItem.description,
                   $inventory: menuItem.inventory,
                   $price: menuItem.price,
                   $menu_id: menuId
                }, function(error) {
                if (error) {
                  res.status(500).send();
                  console.log(error);
                  return;
                } else {
                  db.get(
                       "SELECT * FROM MenuItem WHERE id = $lastID",
                    {
                      $lastID: this.lastID
                    }
                    , (error, rows) => {
                        const obj = { menuItem: rows };
                        res.status(201).send(obj);
                  });
                }
            });
        }
    });
  
});

menusRouter.put('/:menuId/menu-items/:menuItemId', (req, res, next) => {
    const menuItem = req.body.menuItem;
    checkMenuItem(menuItem, res);

    const menuId = req.params.menuId;
    const menuItemId = req.params.menuItemId;

    db.serialize(() => {
        
        db.get(`SELECT * from MenuItem WHERE id=$menuItemId`, 
            {
                $menuItemId: menuItemId  
            }, function(error, rows) {
                if (error) {
                  return;
                } else if (!rows) {
                    res.status(404).send();
                }
            });
        
        db.run(`UPDATE MenuItem SET name=$name, description = $description, inventory = $inventory, ` + 
               `price = $price, menu_id = $menu_id WHERE id=$menuItemId`,
            {
                $name: menuItem.name,
                $description: menuItem.description,
                $inventory: menuItem.inventory,
                $price: menuItem.price,
                $menu_id: menuId,
                $menuItemId: menuItemId
            }, function(error) {
            if (error) {
              res.status(500).send();
              console.log(error);
              return;
            } else {
              db.get(
                   "SELECT * FROM MenuItem WHERE id = $menuItemId",
                {
                  $menuItemId: menuItemId
                }
                , (error, rows) => {
                    const obj = { menuItem: rows };
                    res.send(obj);
              });
            }
        });
        
        
    });
       
});

menusRouter.delete('/:menuId/menu-items/:menuItemId', (req, res, next) => {

    const menuId = req.params.menuId;
    const menuItemId = req.params.menuItemId;

    db.serialize(() => {
        db.get(`SELECT * from Menu WHERE id=$menuId`, 
            {
                $menuId: menuId  
            }, function(error, rows) {
                if (error) {
                  return;
                } else if (!rows) {
                    res.status(404).send();
                }
            });
        db.get(`SELECT * from MenuItem WHERE id=$menuItemId`, 
            {
                $menuItemId: menuItemId  
            }, function(error, rows) {
                if (error) {
                  return;
                } else if (!rows) {
                    res.status(404).send();
                }
            });
        
        db.run("DELETE FROM MenuItem WHERE id=$menuItemId",
            {
               $menuItemId: menuItemId
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