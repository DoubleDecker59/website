const uuid = require('uuid');
const express = require('express');
const path = require('path');
const conf = require('conf');
const handlebars = require('express-handlebars');
const session = require('express-session');
var jsdom = require("jsdom");
var JSDOM = jsdom.JSDOM;
const domino = require('domino');
const rfs = require('fs');
const edit = require('./edit.js');
//const DIST_FOLDER = join(process.cwd(),'dist');
//const template = readFileSync(join(DIST_FOLDER,'browser','edit.handlebars')).toString();
//const winObj = domino.createWindow(template);
//global['window'] = winObj;
//global['document'] = winObj.document;
const app = express();
app.use(session({
    resave: false,
    saveUninitialized: false,
    name: 'sid',
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
app.use("/views", express.static(__dirname + "/views"))
console.log(__dirname + "/views")
app.engine('handlebars', handlebars_inst.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views', 'pages'));
let created = false;
const data = new conf();
let four = false;
let success = false;
let loginError;
let update = false;
let createdName;
app.use(express.json());
//REDIRECTS
app.use(express.urlencoded({ extended: false }));
app.get('/', (reg, res) => {
    res.redirect('/home');
});
/*app.get('/user', (reg,res) => {
    res.redirect('/user'); 
}); */
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/home')
});

app.get('/user', (req, res) => {
    res.redirect('/user/' + req.session.userId)
});

//SIMPLE ROUTES - NO ACCESS REQUIRED
app.route('/home')
    .get((req, res) => {
        if (four) {
            four = false;
            handleRender(res, req, 404, 'home', true, 'danger', 'Unknown Page', 'Navigating you back to home', 'active1');
        }
        else if (success) {
            success = false;
            handleRender(res, req, 200, 'home', true, 'info', 'Success', 'You have successfully logged in!', 'active1');
        }
        else {
            handleRender(res, req, 200, 'home', false, '', '', '', 'active1');
        }
    });

app.route('/space')
    .get((req, res) => {
        res.status(200);
        res.render('space', {
            loggedIn: validateSession(req),
            active7: 'active',
        })
    });
app.route('/farm')
    .get((req, res) => {
        res.status(200);
        res.render('farm', {
            loggedIn: validateSession(req),
            active7: 'active',
        })
    });
app.route('/tower')
    .get((req, res) => {
        res.status(200);
        res.render('tower', {
            loggedIn: validateSession(req),
            active7: 'active',
        })
    });
app.route('/games')
    .get((req, res) => {
        res.status(200);
        res.render('games', {
            loggedIn: validateSession(req),
            active7: 'active',
        })
    });
let redirect;
app.route('/games/:redirect')
    .get((req, res) => {
        redirect = req.params.redirect;
        res.redirect('/' + redirect);
    });
app.route('/about')
    .get((req, res) => {
        res.status(200);
        res.render('about', {
            loggedIn: validateSession(req),
            active2: 'active',
        })
    });


//COMPLICATED ROUTES - ACCESS OF SOME KIND REQUIRED
app.route('/login')
    .get((req, res) => {
        if (!validateSession(req)) {
            if (loginError === true) {
                loginError = false;
                handleRender(res, req, 301, 'login', true, 'warning', 'Authentication Error', 'You must be logged in to create a new user', 'active3');
            }
            else {
                res.status(200);
                res.render('login', {
                    active3: 'active',
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
        const user = findIdbyUser(req.body.username);
        if (user === -1) {
            console.log('here');
            handleRender(res, req, 401, 'login', true, 'danger', 'Login Error', 'Incorrect Username or Password', 'active3');
        }
        else if (user.password !== req.body.password) {
            console.log(user.password)

            handleRender(res, req, 401, 'login', true, 'danger', 'Login Error', 'Incorrect Username or Password', 'active3');
        }
        else {
            req.session.userId = user.username;
            console.log("Username: " + user.username);
            success = true;
            res.redirect('/home');
        }

    });
app.route('/new')
    //EDIT NEW TO REFLECT NOT NEEDING EMAIL OR PHONE NUMBER JUST PASSWORD. ALSO CONSIDER PASSWORD RESET METHODS
    .get((req, res) => {
        const userId = findIdbyUser(req.session.userId);
        
        if (!validateSession(req)) {
            loginError = true;
            res.redirect('/login');
        }
        else if (created === true) {
            created = false;
            handleRender(res, req, 200, 'new', true, 'success', 'Account Created', 'You have successfully created: ' + createdName, 'active5');
        }
        else {
            created = false;
            if (userId.permissions.all || userId.permissions.new) {
                res.render('new', {
                    loggedIn: validateSession(req),
                    active5: 'active'
                })
            }
            else {
                //TOOD: add flag for permission errors
                res.redirect('/home');
            }
        }
    })
    .post((req, res) => {   // some debug info  

        created = false;
        console.log(req.body);
        const user = findIdbyUser(req.body.username);
        //const useremail = data.get(req.body.email);
        if (req.body.pass1 !== req.body.pass2) {
            handleRender(res, req, 400, 'new', true, 'danger', 'Password Error', 'Passwords do not match', 'active5');
        }
        else if (user !== -1) {
            handleRender(res, req, 404, 'new', true, 'warning', 'Username Error', 'Username already taken', 'active5');
        }
        else {
            let idnum = data.size + 1;
            data.set(idnum.toString(), {
                UUID: uuid.v1(),
                username: req.body.username,
                password: req.body.pass1,
                permissions: {
                    all: Boolean(req.body.all),
                    new: Boolean(req.body.new),
                    edit: Boolean(req.body.edit),
                    files: Boolean(req.body.files)
                }
            })
            created = true;
            createdName = req.body.username;
            res.redirect('/new');

        }


    });
//Button Still redirects to /user/user
let user1;
app.route('/user/:username')
    .get((req, res) => {
        const userId = req.session.userId;
        user1 = findIdbyUser(req.params.username);
        console.log(user1);
        console.log(userId)
        if (user1 !== -1) {
            if (userId === user1.username) {
                if (update === true) {
                    update = false;
                    res.render('user', {
                        active6: 'active',
                        disabled: 'disabled',
                        loggedIn: validateSession(req),
                        alert: {
                            level: 'success',
                            title: 'Updated Infomation',
                            message: 'Your profile information has been updated '
                        },
                        username: user1.username,
                            all: user1.permissions.all,
                            new: user1.permissions.new,
                            edit: user1.permissions.edit,
                            files: user1.permissions.files
                    });
                }
                else {
                    res.render('user', {
                        active6: 'active',
                        disabled: 'disabled',
                        loggedIn: validateSession(req),
                        username: user1.username,
                       
                            all: user1.permissions.all,
                            new: user1.permissions.new,
                            edit: user1.permissions.edit,
                            files: user1.permissions.files
                        
                    });
                }
            }
            else if (userId === undefined) {
                res.status(301).redirect('/login');
            }
            else {
                //Edit this: Admin should be able to access profiles not his own and edit them as he see fit with permissions. 
                //Part of a larger project to better implement permissions to access certain pages.
                //Todo: Plan out different permission levels
                res.status(301).send('Access denied you may not view that page');
            }
        }
        else {
            res.status(404).send('Error 404: Unknown Page/Resource not found');
        }

    })

    .post((req, res) => {   // some debug info   
        user1 = findIdbyUser(req.params.username);
        console.log(user1.username);
        // const user2 = data.get(req.body.username);
        if (user1.password !== req.body.pass3) {
            //REJECT invalid current password
            handleRender(res, req, 400, 'user', true, 'danger', 'Password Error', 'Current password incorrect', 'active5');
        }
        else if (req.body.pass1 !== req.body.pass2) {
            handleRender(res, req, 400, 'user', true, 'danger', 'Password Error', 'Passwords do not match', 'active5');
        }
        else {
            data.set(user1, {
                UUID: user1.UUID,
                username: user1.username,
                password: req.body.pass1,
                permissions: {
                    all: req.body.all,
                    new: req.body.new,
                    edit: req.body.edit,
                    files: req.body.files
                }
            })
        }
        /*
        if(user2 !== undefined) {
            console.log(user1.username+ user2.username);
            if (user1.username === user2.username)
            {
    
                
                })
                data.delete(user1);
                console.log(data.get(user1.username));
                update = true;
                res.redirect('/user/' + user2.username); 
            }
            else {
                res.status(401).render('user', {
                    active6:'active',
                    loggedIn: validateSession(req),
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
            */
        update = true;
        res.redirect('/user/' + req.body.username);

    });
app.route('/edit')
    //Learn how to get all users, change schema for storing users possibly
    //Learn how to show all users dynamically, then navigate to the page: edit(select user) -> edit/:username(Actually edit the user)
    .get((req, res) => {
        const userId = req.session.userId;
        console.log(userId);
        const user = findIdbyUser(userId);
        console.log(validateSession(req));
        if (!validateSession(req)) {
            loginError = true;
            res.redirect('/login');
        }
        else {
            if (user.permissions.all || user.permissions.edit) {
                var lists = '';
                console.log(data.size);
                for (i = 0; i <= data.size; i++) {
                    let convert = i.toString();
                    let userX = data.get(convert);
                    if(userX === undefined) {

                    }
                    else{
                        console.log(userX);
                        lists += "<a href=\"edit/" + userX.username + "\" class=\"list-group-item list-group-item-action\">" + userX.username + "</a>";
                    }
                   
                }
                console.log(lists);
                res.render('edit', {
                    loggedIn: validateSession(req),
                    active5: 'active',
                    list: lists,
                })
                
            }
            else {
                //TODO add warning about permission
                res.redirect('/home');
            }
        }

    });
let user2;
app.route('/edit/:username')
    .get((req, res) => {
        const userId = req.session.userId;
        user2 = findIdbyUser(req.params.username);
        originalUser = findIdbyUser(userId);
        console.log(user2);
        console.log(userId)
        if (user2 !== -1 && originalUser !== -1) {
            if (userId === user2.username || originalUser.permissions.all || originalUser.permissions.edit) {
                if (update === true) {
                    update = false;
                    res.render('user', {
                        active5: 'active',
                        loggedIn: validateSession(req),
                        alert: {
                            level: 'success',
                            title: 'Updated Infomation',
                            message: 'Your profile information has been updated '
                        },
                        username: user2.username,
                        
                            all: user2.permissions.all,
                            new: user2.permissions.new,
                            edit: user2.permissions.edit,
                            files: user2.permissions.files
                        
                    });
                }
                else {
                    res.render('user', {
                        active5: 'active',
                        loggedIn: validateSession(req),
                        username: user2.username,
                        
                            all: user2.permissions.all,
                            new: user2.permissions.new,
                            edit: user2.permissions.edit,
                            files: user2.permissions.files
                        
                    });
                }
            }
            else if (userId === undefined) {
                res.status(301).redirect('/login');
            }
            else {
                //Edit this: Admin should be able to access profiles not his own and edit them as he see fit with permissions. 
                //Part of a larger project to better implement permissions to access certain pages.
                //Todo: Plan out different permission levels
                res.status(301).send('Access denied you may not view that page');
            }
        }
        else {
            res.status(404).send('Error 404: Unknown Page/Resource not found');
        }

    })

    .post((req, res) => {   // some debug info   
        user2 = findIdbyUser(req.params.username);
        console.log(user2.username);
        user3 = req.session.userId;
        // const user2 = data.get(req.body.username);
        if (user3.password !== req.body.pass3) {
            //REJECT invalid current password
            res.render('user', {
                active6: 'active',
                loggedIn: validateSession(req),
                alert: {
                    level: 'danger',
                    title: 'Password error',
                    message: 'Your current password is incorrect'
                },
                username: user2.username,
               
                    all: user2.permissions.all,
                    new: user2.permissions.new,
                    edit: user2.permissions.edit,
                    files: user2.permissions.files
                
            });
        }
        else if (req.body.pass1 !== req.body.pass2) {
            handleRender(res, req, 400, 'new', true, 'danger', 'Password Error', 'Passwords do not match', 'active5');
            res.render('user', {
                active6: 'active',
                loggedIn: validateSession(req),
                alert: {
                    level: 'danger',
                    title: 'Password error',
                    message: 'Passwords do not match'
                },
                username: user2.username,
               
                    all: user2.permissions.all,
                    new: user2.permissions.new,
                    edit: user2.permissions.edit,
                    files: user2.permissions.files
                
            });
        }
        else {
            data.set(user2, {
                UUID: user2.UUID,
                username: user2.username,
                password: req.body.pass1,
                permissions: {
                    all: req.body.all,
                    new: req.body.new,
                    edit: req.body.edit,
                    files: req.body.files
                }
            })
        }

        update = true;
        res.redirect('/edit/');

    });
    app.route('/files')

    .get((req, res) => {
        if (!validateSession(req)) {
            loginError = true;
            res.redirect('/login');
        }
        else {
            var files = getSharedFiles();
            res.render('files', {
                loggedIn: validateSession(req),
                active4: 'active',
                file: files
            })
        }

    });
    let download;
app.route('/shared/:file')
    .get((req,res) =>{
        console.log(req.params)
        download = req.params.file;
        res.download('../website/shared/' + download, download);
    });

app.get('*', function (req, res) {
    four = true;
    res.status(404).send('Error 404: Unknown Page/Resource not found');
    //res.status(404).redirect('/home');

});
function getSharedFiles() {
    var filelist = rfs.readdirSync('../website/shared/');
    var files = '';
    for(i = 0; i <= filelist.length-1; i++) {
       //files += "<a href=\"/shared/" + filelist[i] + "\" download>" + filelist[i] + "</a>";
        files += "<a href=\"/shared/" + filelist[i] + "\" class=\"list-group-item list-group-item-action\" download>" + filelist[i] + "</a>";
    }
   return files;
}
//getSharedFiles();
function handleRender(res, req, statusNum, page, alert, level, title, msg, activeNum) {
    if (alert) {
        res.status(statusNum).render(page, {
            loggedIn: validateSession(req),
            alert: {
                level: level,
                title: title,
                message: msg
            },
            [activeNum]: 'active'
        })
    }
    else {
        res.status(statusNum).render(page, {
            loggedIn: validateSession(req),
            [activeNum]: 'active'
        })
    }
}
function validateSession(req) {
    var sess = req.session;
    if (sess.userId !== undefined) {
        return true;
    }
    else {
        return false;
    }
}
function findIdbyUser(user) {
    for (let i = 0; i <= data.size; i++) {
        let convert = i.toString();
        const username = data.get(convert);
        if (username === undefined) {

        }
        else if (user === username.username) {
            return username;
        }
    }
    return -1;
}

function firstRun() {
    data.clear();
    data.set('0', {
        UUID: uuid.v1(),
        username: 'admin',
        password: 'password',
        permissions: {
            all: true,
            new: true,
            edit: true,
            files: true
        }
    })
}
 //firstRun();
app.listen(3000, function () { console.log("Listening on port 3000") });
