/* ==========================================================
Route Declarations

============================================================ */

//Express middleware to validate a JSON Web token
var expressJwt = require('express-jwt'); 	//https://npmjs.org/package/express-jwt

/* ==========================================================
Internal App Modules/Packages Required
============================================================ */
var authRoutes = require('./routes/auth-routes.js');       	//Exchange routes

/* ==========================================================
JSON Web Token Secret String
============================================================ */
var secret = require('./config/jwtSecret');

/* ==========================================================
Node Module that will be available in server.js
============================================================ */
module.exports = function(app)
{

	/* ==========================================================
	User Routes
	============================================================ */
	app.post('/register', authRoutes.register);
	app.post('/login', authRoutes.login);
	app.post('/logout', authRoutes.logout);
	app.get('/admin', expressJwt({secret:secret.JWTsecret}), authRoutes.getAdmin);
	app.post('/upload', expressJwt({secret:secret.JWTsecret}), authRoutes.upload);
	app.get('/download', expressJwt({secret:secret.JWTsecret}), authRoutes.download);
	app.post('/download_file', authRoutes.download_file);

}; /* @END/ module */
