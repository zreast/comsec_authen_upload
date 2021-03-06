/* ==========================================================
ROUTES - dealing with the user authentication
Route Definitions

============================================================ */

/* ==========================================================
Modules/Packages Required
============================================================ */
//To sign i.e. create the JWT
var jwt = require('jsonwebtoken');  		//https://npmjs.org/package/node-jsonwebtoken
var db = require('../models/userModel');	//Mongoose Model

/* ==========================================================
JSON Web Token Secret String
============================================================ */
var secret = require('../config/jwtSecret');
var fs = require('fs');

var multer = require('multer');
var username = ''
/* ==========================================================
Node Module
============================================================ */
module.exports = {

	/* ==========================================================
	When you try to access a JWT secured route Express.js sends response
	"UnauthorizedError: No Authorization header was found"
	without having to add any more code.
	============================================================ */
	/* NOT REQUIRED
	app.use(function(err, req, res, next) {
  		if (err.constructor.name === 'UnauthorizedError') {
    		res.send(401, 'Unauthorized');
  		}
	});
	*/


	/*================================================================
	$HTTP post /register
	=================================================================*/
	register : function (req, res) {

		var username = req.body.username || '';
		var password = req.body.password || '';
		var email = req.body.email || '';
		var passwordConfirmation = req.body.passwordConfirmation || '';

		//Angular form validation also ensures required fields are filled
		//Check to ensure passwordConfirmation matches password
		if (username == '' || password == '' || password != passwordConfirmation) {
			return res.status(400).send("Bad Request:Registration error");
		}

		else {

			//check if username exists already
			UserModel.findOne({username: req.body.username}, function (err, user) {

				if (err) {
					console.log(err);
					res.status(401).send("Unauthorised-error finding username in DB");
				}

				//user exists already
				else if(user) {
					res.status(409).send("Conflict: username already exists");
					//res.send(409, {status:409, message: 'Conflict - username already exists', type:'user-issue'});
				}

				//user does not exist already
				else if (user == undefined) {

					var newUser = new UserModel( {
						username : req.body.username,
						password : req.body.password,
						is_admin : true,
						email : req.body.email
					})

					newUser.save(function(err) {
						if (err) {
							console.log(err);
							res.status(500).send("Internal Server Error: problem saving user to DB");
						}
						else {
							return res.status(200).send("New user saved to DB ok");
						}
					});
				}

			})
		};
	},



	/*================================================================
	$HTTP post /login
	=================================================================*/
	login : function (req, res) {
		//validate req.body.username and req.body.password
	  	//if is invalid, return 401
	  	var username = req.body.username || '';
		var password = req.body.password || '';

		//Angular Form validation also checks to ensure username and password fields are filled
		if (username == '' || password == '') { 
			return res.status(401).send("username or password fields are empty");
		}
		else {

			db.UserModel.findOne({username: req.body.username}, function (err, user) {

				if (err) {
					console.log(err);
					return res.status(401).end();
				}

				if (user == undefined) {
					return res.status(401).send("User undefined");
				}

				user.comparePassword(req.body.password, function(err, isMatch) {
					if (!isMatch) {
						console.log("Attempt failed to login with " + user.username);
						return res.status(401).send("Password does not match");
		            }

		           	var userProfile = {
						username: user.username,
						admin: user.is_admin,
						created: user.created,
						email: user.email
					};

					/*
					*Build the JWT - using jsonwebtoken.js method sign(payload, secretOrPrivateKey, options)
					*return type is a string
					*put users profile inside the JWT (payload)
					*Set token to expire in 60 min (option)
					*/
					var token = jwt.sign(userProfile, secret.JWTsecret, { expiresInMinutes: 60*1 });

					/*
					*Send the token as JSON to user
					*/
					console.log(token)
					res.json({ token: token });
				});
			});
		};

	},

	/*================================================================
	$HTTP post /logout
	=================================================================*/
	logout : function(req, res) {
		res.status(200).end();
	},


	/*================================================================
	$http GET /admin - secured by JWT
	JWT is TX by client in HTTP packet header, JWT is checked
	Express will return 401 and stop the route if token is not valid
	=================================================================*/
	getAdmin : function (req, res) {
	  console.log('user ' + req.user.username + ' is calling /admin');
	  console.info("req token=" +JSON.stringify(req.headers));
	  console.log(req)
	  res.send(req.username);
	},

	/** API path that will upload the files */
	upload : function (req, res){
		console.log(req.user.username)
		/** Create Directory */
		var dir = './uploads/' + req.user.username;
		if (!fs.existsSync(dir)){
			fs.mkdirSync(dir);
		}
		/** Setting */
		var storage = multer.diskStorage({ //multers disk storage settings
			destination: function (req, file, cb) {
				cb(null, dir);
			},
			filename: function (req, file, cb) {
				var datetimestamp = Date.now();
				cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1]);
			}
		});
		var upload = multer({ //multer settings
			storage: storage
		}).single('file');

		upload(req,res,function(err){
			if(err){
				res.json({error_code:1,err_desc:err});
				return;
	    	}
			res.json({error_code:0,err_desc:null});
		});
	},

	/** Get download page */
	download : function(req, res){
		var dir = './uploads/' + req.user.username;
		var list = {file:[]};
		username = req.user.username;
		fs.readdirSync(dir).forEach(file => {
			list.file.push({file:file})
		})

		res.json(list);
	},

	download_file : function(req, res){
		var path = require('path')
		console.log(req.body.data.filename);
		console.log("eiei");
		res.download(path.join(__dirname,'..','..', 'uploads', username, req.body.data.filename),'file.png')
	}

}; /* @END/ module */
