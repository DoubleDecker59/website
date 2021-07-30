const uuid = require('uuid');
const express = require('express');
 const path = require('path'); 
const conf = require('conf'); 
const handlebars = require('express-handlebars');
const session = require('express-session');

const app = express();
app.use(session( {
    resave: false,
    saveUninitialized:false,
    name:'sid',
    secret: 'SecretValue',
    cookie: {
        maxAge: 7200000,
        sameSite: true,
    }
}))
const handlebars_inst = handlebars.create({
    extname: 'handlebars',
    compilerOptions: {
        preventIndent: true
    },
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials')
});
app.engine('handlebars', handlebars_inst.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname,'views', 'pages'));
let created = false;
let loggedin = false;
const data = new conf();

let loginError;
let update = false;
app.use(express.json()); 
 //REDIRECTS
app.use(express.urlencoded({   extended: false })); 
app.get('/', (reg,res) => {
    res.redirect('/home'); 
}); 
app.get('/user', (reg,res) => {
    res.redirect('/user'); 
}); 
app.get('/logout', (req,res) => {
    req.session.destroy();
    res.redirect('/home')
}); 
app.get('/user', (req,res) => {
    res.redirect('/user/' + req.session.userId)
});
//SIMPLE ROUTES - NO ACCESS REQUIRED
app.route('/home')  
.get((req, res) => { 
  res.status(200);
  res.render('home', {
  active1:'active',
      })          
}); 
app.route('/games')  
.get((req, res) => { 
  res.status(200);
  res.render('games', {
  active7:'active',
      })          
}); 
app.route('/games/space')  
.get((req, res) => { 
  res.status(200);
  res.render('space', {
  active7:'active',
      })          
}); 
app.route('/games/farm')  
.get((req, res) => { 
  res.status(200);
  res.render('farm', {
  active7:'active',
      })          
}); 
app.route('/games/tower')  
.get((req, res) => { 
  res.status(200);
  res.render('tower', {
  active7:'active',
      })          
}); 
app.route('/about')  
.get((req, res) => { 
  res.status(200);
  res.render('about', {
  active2:'active',
      })          
}); 
app.route('/files')  

.get((req, res) => { 
    const userId = req.session.userId;
    if(userId === undefined) {
       loginError = true; 
       res.redirect('/login');
    }
    else {
        res.render('edit', {
            loggedIn: {
            },
            active4:'active'
        })
    }
   
});

//COMPLICATED ROUTES - ACCESS OF SOME KIND REQUIRED
app.route('/login')  
.get((req, res) => { 
 const userId = req.session.userId;
 if(userId === undefined) {
    if (loginError === true) {
        loginError = false;
        res.render('login', {
            alert: {
                    level: 'warning',
                    title: 'Authenitcation Error',
                    message: 'You must be logged in to create a new user'
                },
            active3:'active'
        })
    }
    else {
        res.status(200);
        res.render('login', {
            active3:'active',
        })
    }
 }
 else {
     res.redirect('/user/' + req.session.userId);
 }
       
})
       .post((req, res) => {   // some debug info   
        console.log(req.body); 
        invalidAccess = false;
        const user = data.get(req.body.username);
        if(user === undefined) {
            res.status(401).render('login', {
                alert: {
                        level: 'danger',
                        title: 'Login Error',
                        message: 'Incorrect Username or Password'
                    },
                active3:'active'
            })
        }
        else if(user.password !== req.body.password) {
            res.status(401).render('login', {
                alert: {
                        level: 'danger',
                        title: 'Login Error',
                        message: 'Incorrect Username or Password'
                    },
                active2:'active'
            })
        }
        else {
            req.session.userId = user.username;
            loggedin = true;
            console.log("Username: " + user.username);
            res.redirect('/user/' + user.username); 
        }
       
}); 
app.route('/new')  

.get((req, res) => { 
    const userId = req.session.userId;
    if(userId === undefined) {
       loginError = true; 
       res.redirect('/login');
    }
    else if(created === true) {
        created =  false;
        res.render('login', {
            loggedIn:{
            },
            alert: {
                    level: 'success',
                    title: 'Account Created',
                    message: 'You have successfully created your account'
                },
            active5:'active'
        })
    }
    else {
        created = false;
        res.render('new', {
            loggedIn: {
            },
            active5:'active'
        })
    }
   
})
       .post((req, res) => {   // some debug info  
         
        created = false;
        console.log(req.body); 
        const user = data.get(req.body.username);
        const useremail = data.get(req.body.email);
        if(req.body.pass1 !== req.body.pass2) {
            res.status(400).render('new', {
                loggedIn: {
                },
                alert: {
                        level: 'danger',
                        title: 'Password Error',
                        message: 'Passwords do not match'
                    },
                active5:'active'
            })
        }
        else if (user !== undefined){
            res.status(400).render('new', {
                loggedIn: {
                },
                alert: {
                        level: 'warning',
                        title: 'Username Error',
                        message: 'Username already taken'
                    },
                active5:'active'
            })
        }
        else if (useremail !== undefined){
            res.status(400).render('new', {
                loggedIn: {
                },
                alert: {
                        level: 'warning',
                        title: 'Email Error',
                        message: 'Email has already been registered'
                    },
                active5:'active'
            })
        }
        else {
            data.set(req.body.username, {
                UUID: uuid.v1(),
                username: req.body.username,
                email: req.body.email,
                password: req.body.pass1,
                phoneNum: req.body.phone
            })
            created = true;
           res.redirect('/new');
            
        }
       
       
}); 
//Button Still redirects to /user/user
let user1;
app.route('/user/:username')  
.get((req, res) => { 
    const userId = req.session.userId;
    user1 = data.get(req.params.username);
    console.log(user1);
    console.log(userId)
    if(user1 !== undefined)  {
        if(userId === user1.username) {
            if(update === true) {
                update = false;
                res.render('user', {
                    active6:'active',
                    loggedIn: {

                    },
                    alert: {
                        level: 'success',
                        title: 'Updated Infomation',
                        message: 'Your profile information has been updated '
                    },
                    username:user1.username,
                    email: user1.email,
                    phone: user1.phoneNum
                });
            }
            else if(loggedin ===true) {
                loggedin = false;
                res.render('user', {
                    active6:'active',
                    loggedIn: {
                    },
                    alert: {
                        level: 'success',
                        title: 'Logged In',
                        message: 'You successfully logged in'
                    },
                    username:user1.username,
                    email: user1.email,
                    phone: user1.phoneNum
                });
            }
            else {
                res.render('user', {
                    active6:'active',
                    loggedIn: {
                    },
                    username:user1.username,
                    email: user1.email,
                    phone: user1.phoneNum
                });
            }
        }
        else if(userId === undefined) {
            res.status(301).redirect('/login');
        }
        else {
            res.status(301).send('Access denied you may not view that page');
        }
    }
     else  {
        res.status(404).send('Error 404: Unknown Page/Resource not found');
        }
  
})

       .post((req, res) => {   // some debug info   
        user1 = data.get(req.params.username);
        console.log(user1.username);
        const user2 = data.get(req.body.username);
        
        if(user2 !== undefined) {
            console.log(user1.username+ user2.username);
            if (user1.username === user2.username)
            {
    
                data.set(req.body.username, {
                    UUID: user1.UUID,
                    username: req.body.username,
                    email: req.body.email,
                    password: user1.password,
                    phoneNum: req.body.phone
                })
                data.delete(user1);
                console.log(data.get(user1.username));
                update = true;
                res.redirect('/user/' + user2.username); 
            }
            else {
                res.status(401).render('user', {
                    active6:'active',
                    loggedIn: {
                    },
                    usererror:'That username is already taken',
                    username: user2.username,
                    email: user1.email,
                    phone: user1.phoneNum
                })
            }
          
        }
        else{
            data.set(req.body.username, {
                UUID: user1.UUID,
                username: req.body.username,
                email: req.body.email,
                password: user1.password,
                phoneNum: req.body.phone
            })
            data.delete(req.params.username);
            console.log(data.get(user1.username));
            update = true;
            req.session.userId = req.body.username;
            res.redirect('/user/' + req.body.username); 
        }        
}); 
app.route('/edit')  

.get((req, res) => { 
    const userId = req.session.userId;
    if(userId === undefined) {
       loginError = true; 
       res.redirect('/login');
    }
    else {
        res.render('edit', {
            loggedIn: {
            },
            active5:'active'
        })
    }
   
})
       .post((req, res) => {   // some debug info  
         
        created = false;
        console.log(req.body); 
        const user = data.get(req.body.username);
        const useremail = data.get(req.body.email);
        if(req.body.pass1 !== req.body.pass2) {
            res.status(400).render('new', {
                loggedIn: {
                },
                alert: {
                        level: 'danger',
                        title: 'Password Error',
                        message: 'Passwords do not match'
                    },
                active5:'active'
            })
        }
        else if (user !== undefined){
            res.status(400).render('new', {
                loggedIn: {
                },
                alert: {
                        level: 'warning',
                        title: 'Username Error',
                        message: 'Username already taken'
                    },
                active5:'active'
            })
        }
        else if (useremail !== undefined){
            res.status(400).render('new', {
                loggedIn: {
                },
                alert: {
                        level: 'warning',
                        title: 'Email Error',
                        message: 'Email has already been registered'
                    },
                active5:'active'
            })
        }
        else {
            data.set(req.body.username, {
                UUID: uuid.v1(),
                username: req.body.username,
                email: req.body.email,
                password: req.body.pass1,
                phoneNum: req.body.phone
            })
            created = true;
           res.redirect('/new');
            
        }      
}); 


app.get('*', function(req, res){
        res.status(404).send('Error 404: Unknown Page/Resource not found');
  });

app.listen(3000, function() { console.log("Listening on port 3000")}); 
