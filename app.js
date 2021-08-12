const uuid = require('uuid');
const express = require('express');
const path = require('path');
const conf = require('conf');
const handlebars = require('express-handlebars');
const session = require('express-session');
const rfs = require('fs');
const edit = require('./edit.js');
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
let perms = false;
let createdName;
app.use(express.json());
//REDIRECTS
app.use(express.urlencoded({ extended: false }));
app.get('/', (reg, res) => {
    res.redirect('/home');
});
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
            handleRender(res, req, 404, 'home', true, 'danger', 'Unknown Page', 'Navigating you back to home', 'active1','','','','','','');
        }
        else if (success) {
            success = false;
            handleRender(res, req, 200, 'home', true, 'info', 'Success', 'You have successfully logged in!', 'active1','','','','','','');
        }
        else if (perms) {
            perms = false;
            handleRender(res, req, 401, 'home', true, 'info', 'warning', 'You do not have permission to access that page, please contact the admin if you believe this to be an issue!', 'active1','','','','','','');
        }
        else {
            handleRender(res, req, 200, 'home', false, '', '', '', 'active1','','','','','','');
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
    app.route('/contact')
    .get((req, res) => {
        res.status(200);
        res.render('contact', {
            loggedIn: validateSession(req),
            active8: 'active',
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
                handleRender(res, req, 301, 'login', true, 'warning', 'Authentication Error', 'You must be logged in to access that page', 'active3','','','','','','');
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
        invalidAccess = false;
        const user = findIdbyUser(req.body.username);
        if (user === -1) {
            handleRender(res, req, 401, 'login', true, 'danger', 'Login Error', 'Incorrect Username or Password', 'active3','','','','','','');
        }
        else if (user.password !== req.body.password) {

            handleRender(res, req, 401, 'login', true, 'danger', 'Login Error', 'Incorrect Username or Password', 'active3','','','','','','');
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
            handleRender(res, req, 200, 'new', true, 'success', 'Account Created', 'You have successfully created: ' + createdName, 'active5','','','','','','');
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
                perms=true;
                res.redirect('/home');
            }
        }
    })
    .post((req, res) => {   // some debug info  
        created = false;
        const user = findIdbyUser(req.body.username);
        //const useremail = data.get(req.body.email);
        if (req.body.pass1 !== req.body.pass2) {
            handleRender(res, req, 400, 'new', true, 'danger', 'Password Error', 'Passwords do not match', 'active5','','','','','','');
        }
        else if (user !== -1) {
            handleRender(res, req, 404, 'new', true, 'warning', 'Username Error', 'Username already taken', 'active5','','','','','','');
        }
        else {
            let idnum = data.size + 1;
             saveUser(idnum.toString(),uuid.v1(),req.body.username,req.body.pass1,Boolean(req.body.all),Boolean(req.body.new),Boolean(req.body.edit),Boolean(req.body.files));
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
        if (user1 !== -1) {
            if (userId === user1.username) {
                if (update === true) {
                    update = false;
                    handleRender(res, req, 200, 'user', true, 'success', 'Updated Infomation', 'Your profile information has been updated', 'active6',user1.username,user1.permissions.all,user1.permissions.new,user1.permissions.edit,user1.permissions.files,'disabled');
                }
                else {
                    handleRender(res, req, 200, 'user', false, '', '', '', 'active6',user1.username,user1.permissions.all,user1.permissions.new,user1.permissions.edit,user1.permissions.files,'disabled');
                }
            }
            else if (userId === undefined) {
                res.status(301).redirect('/login');
            }
            else {
                //Edit this: Admin should be able to access profiles not his own and edit them as he see fit with permissions. 
                //Part of a larger project to better implement permissions to access certain pages.
                //Todo: Plan out different permission levels
                perms=true;
                res.redirect('/home');
            }
        }
        else {
            four=true;
            res.redirect('/home');
        }

    })

    .post((req, res) => {   // some debug info   
        user1 = findIdbyUser(req.params.username);
        if (user1.password !== req.body.pass3) {
            //REJECT invalid current password
            handleRender(res, req, 400, 'user', true, 'danger', 'Password Error', 'Current password incorrect', 'active5','','','','','','');
        }
        else if (req.body.pass1 !== req.body.pass2) {
            handleRender(res, req, 400, 'user', true, 'danger', 'Password Error', 'Passwords do not match', 'active5','','','','','','');
        }
        else {
        saveUser(user1,user1.UUID,user1.username,req.body.pass1,req.body.all,req.body.new,req.body.edit,req.body.files);
        update = true;
        res.redirect('/user/' + req.body.username);
        }
    });
app.route('/edit')
    .get((req, res) => {
        const userId = req.session.userId;
        const user = findIdbyUser(userId);
        if (!validateSession(req)) {
            loginError = true;
            res.redirect('/login');
        }
        else {
            if (user.permissions.all || user.permissions.edit) {
                var lists = '';
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
                perms=true;
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
        if (user2 !== -1 && originalUser !== -1) {
            if (userId === user2.username || originalUser.permissions.all || originalUser.permissions.edit) {
                if (update === true) {
                    update = false;
                    handleRender(res, req, 200, 'user', true, 'success', 'Updated Infomation', 'Your profile information has been updated', 'active5',user2.username,user2.permissions.all,user2.permissions.new,user2.permissions.edit,user2.permissions.files,'');
                }
                else {
                    handleRender(res, req, 200, 'user', false, '', '', '', 'active5',user2.username,user2.permissions.all,user2.permissions.new,user2.permissions.edit,user2.permissions.files,'');
                }
            }
            else if (userId === undefined) {
                res.status(301).redirect('/login');
            }
            else {
                //Edit this: Admin should be able to access profiles not his own and edit them as he see fit with permissions. 
                //Part of a larger project to better implement permissions to access certain pages.
                //Todo: Plan out different permission levels
                perms=true;
                res.redirect('/home');
            }
        }
        else {
            four=true;
            res.redirect('/home');
        }

    })

    .post((req, res) => {   // some debug info   
        user2 = findIdbyUser(req.params.username);
        user3 = req.session.userId;
        if (user3.password !== req.body.pass3) {
            handleRender(res, req, 200, 'user', true, 'danger', 'Password error', 'Your current password is incorrect', 'active6',user2.username,user2.permissions.all,user2.permissions.new,user2.permissions.edit,user2.permissions.files,'');
        }
        else if (req.body.pass1 !== req.body.pass2) {
            handleRender(res, req, 400, 'new', true, 'danger', 'Password Error', 'Passwords do not match', 'active6',user2.username,user2.permissions.all,user2.permissions.new,user2.permissions.edit,user2.permissions.files,'');
        }
        else {
            saveUser(user2,user2.UUID,user2.username,req.body.pass1,req.body.all,req.body.new,req.body.edit,req.body.files);
        }

        update = true;
        res.redirect('/edit/');

    });
    app.route('/files')

    .get((req, res) => {
        const userId = req.session.userId;
        originalUser = findIdbyUser(userId);
        if (!validateSession(req)) {
            loginError = true;
            res.redirect('/login');
        }
        else if(originalUser.permissions.all || originalUser.permissions.files) {
            var files = getSharedFiles();
            res.render('files', {
                loggedIn: validateSession(req),
                active4: 'active',
                file: files
            })
        }
        else {
            perms=true;
            res.redirect('/home');
        }

    });
    let download;
app.route('/shared/:file')
    .get((req,res) =>{
        download = req.params.file;
        res.download('../website/shared/' + download, download);
    });

app.get('*', function (req, res) {
    four = true;
    res.status(404).redirect('/home');

});
function getSharedFiles() {
    var filelist = rfs.readdirSync('../website/shared/');
    var files = '';
    for(i = 0; i <= filelist.length-1; i++) {
        files += "<a href=\"/shared/" + filelist[i] + "\" class=\"list-group-item list-group-item-action\" download>" + filelist[i] + "</a>";
    }
   return files;
}
function saveUser(userId, uuid, username, userPassword, UserAll, Usernew, Useredit, userfiles) {
    data.set(userId, {
                UUID: uuid,
                username: username,
                password: userPassword,
                permissions: {
                    all: UserAll,
                    new: Usernew,
                    edit: Useredit,
                    files: userfiles
                }
            })
}
function handleRender(res, req, statusNum, page, alert, level, title, msg, activeNum,userbody, userall,usernew,useredit,userfiles, disables) {
    if (alert) {
        res.status(statusNum).render(page, {
            loggedIn: validateSession(req),
            alert: {
                level: level,
                title: title,
                message: msg
            },
            [activeNum]: 'active',
            username: userbody,
            all: userall,
            new: usernew,
            edit: useredit,
            files: userfiles,
            disabled: disables
        })
    }
    else {
        res.status(statusNum).render(page, {
            loggedIn: validateSession(req),
            [activeNum]: 'active',
            username: userbody,
            all: userall,
            new: usernew,
            edit: useredit,
            files: userfiles,
            disabled: disables
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
    console.log('Ran')
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
 firstRun();
app.listen(3000, function () { console.log("Listening on port 3000") });
