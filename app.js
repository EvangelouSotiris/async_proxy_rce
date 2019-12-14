const express = require('express');
const path = require("path");
const exphbs  = require('express-handlebars');	
const body_parser = require('body-parser');
const mysql = require('mysql');
var mongoose = require('mongoose');

const port = process.env.PORT || '3000';  //webapp on localhost:3000
const app = express();


app.engine('handlebars', exphbs({defaultLayout:'main'}));
app.set('view engine', 'handlebars');

app.use(body_parser.json());
app.use(body_parser.urlencoded({extended:false}));

app.listen(port, function() {
	console.log('App started on port '+port);
});

var con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "swt",
	database: "masters"
});

con.connect( function(err) {
	if (err) throw err;
	console.log("Connected to mysql login db");
});

mongoose.connect('mongodb://localhost/masters', {useNewUrlParser: true, useUnifiedTopology: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	console.log("Connection to Mongo DB.");
});


const master_info_schema = mongoose.Schema({
	name : String,
	commands : [{
		timestamp : String,
		command : String,
		slave : String,
		results : [{slavename : String, output: String}]
	}],
	pinged_slaves : [String]
});

var master_info = mongoose.model('master_info', master_info_schema);

// GET AND POST METHODS

app.get('/' , function(req,res) {

	/* Create an instance of model SomeModel
	var test = new master_info({
		name:'gians', 
		commands : [{timestamp:'1,1', command:'ls',slave:'all', results:[{}]}],
		pinged_slaves : ['yolo']
	});

	// Save the new model instance, passing a callback
	test.save(function (err) {
	  if (err) return handleError(err);
	  console.log("test saved");
	});

	master_info.find({}, function(err, docs) {
	    if (!err){ 
	        console.log(docs);
	    } else {throw err;}

	});
	*/
	res.render('login', {page_name:'login'});
});

function return_formatted_date() { 
	let date_ob = new Date();
	let date = ("0" + date_ob.getDate()).slice(-2);
	let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
	let year = date_ob.getFullYear();
	let hours = date_ob.getHours();
	let minutes = date_ob.getMinutes();
	let seconds = date_ob.getSeconds();

	return(year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);
}

app.post('/masterlog' , function(req, res) {
	let master = req.body.master;
	let pass = req.body.master_pass;
	//Login checking logic
	con.connect(function(err) {
		con.query("select count(username) from master_info where username = '" + master + "' and password = '" + pass +"'", function (err, result, fields) {
			if (err) { throw err; }

			if (result[0]['count(username)'] == 0) {
				//create the acc and log in after asking if its okay
				res.render('login', {page_name:'login', error:'The master you entered doesn\'t exist. Click accept to create this master account.' , master:master, pass:pass});
			}
			else {
				con.query("update master_info set ts_login ='" + return_formatted_date() + "', logged = 1 where username = '" + master + "'", function (err, result, fields) {
					res.render('master_console', {page_name: master + '\'s console', master: master});
				});
			}
		});
	});	
});

//TODO
//1) ALLAGH TOU QUERY ME COUNT GIATI TWRA KAI O XRISTIS NA YPARXEI PALI THA VGALEI ERROR OTI DEN YPARXEI

app.post('/create_and_log', function(req,res) {
	let master = req.body.master;
	let pass = req.body.master_pass;
	con.connect(function(err) {
		con.query("insert into master_info (username, password, ts_login, logged) VALUES ('" + master + "', '" + pass + "', '" + return_formatted_date() + "', '1')", function (err, result, fields) {
    			if (err) { throw err; }
		});
	});
	res.render('master_console', {page_name: master + '\'s console', master: master});
});

app.post('/command_handler' , function(req, res) {
	let new_command = req.body.new_command;
});


app.post('/logout', function(req,res) {
	let master = req.body.master;

	con.connect(function(err) {
		con.query("update master_info set logged = 0 where username = '" + master + "'", function (err, result, fields) {
    			if (err) { throw err;}
			res.redirect('/');
		});
	});
});
