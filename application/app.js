const express = require('express');
const path = require("path");
const exphbs  = require('express-handlebars');	
const body_parser = require('body-parser');
const mysql = require('mysql');
var mongoose = require('mongoose');
var fs = require('fs');
const port = process.env.PORT || '3000';  //webapp on localhost:3000
const app = express();


app.engine('handlebars', exphbs({defaultLayout:'main'}));
app.set('view engine', 'handlebars');

app.use(body_parser.json());
app.use(body_parser.urlencoded({extended:false}));

app.listen(port, function() {
	console.log('App started on port '+port);
});

const dbuser = process.env.MYSQL_USER
const dbpass = process.env.MYSQL_PASSWORD
const dbname = process.env.MYSQL_DATABASE
const mysqlhost = process.env.MARIADB_HOST
const mongodbhost = process.env.MONGODB_HOST

var con = mysql.createConnection({
	host: mysqlhost || "localhost",
	user: dbuser,
	password: dbpass,
	database: dbname
});

con.connect( function(err) {
	if (err) throw err;
	console.log("Connected to mysql login db");
});

mongoose.connect('mongodb://'+mongodbhost+'/'+dbname, {useNewUrlParser: true, useUnifiedTopology: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	console.log("Connection to Mongo DB.");
});


const master_info_schema = mongoose.Schema({
	name : String,
	commands : [{
		timestamp : {
			type: Date,
			default: Date.now
		},
		command : String,
		slave : String,
		results : [{slavename : String, output: String}]
	}],
	pinged_slaves : [{
		slavename : String,
		semaphore : Number
	}]
});

var master_info = mongoose.model('master_info', master_info_schema);

// GET AND POST METHODS

app.get('/' , function(req,res) {
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
		con.query("select password from master_info where username = '" + master + "'", function (err, result, fields) {
			if (result.length == 0) { 
				res.render('login', {page_name:'login', error:'The master you entered doesn\'t exist. Click accept to create this master account.' , master:master, pass:pass});
			}
			else {
				if (result[0]['password'] == pass) {
					//create the acc and log in after asking if its okay
					con.query("update master_info set ts_login ='" + return_formatted_date() + "', logged = 1 where username = '" + master + "'", function (err, result, fields) {
						res.render('master_console', {page_name: master + '\'s console', master: master});
					});
				}
				else {
					res.render('login', {page_name:'login', error2:'The password you entered is incorrect.'});
				}
			}
		});
	});	
});

app.post('/create_and_log', function(req,res) {
	let master = req.body.master;
	let pass = req.body.master_pass;

	con.connect(function(err) {
		con.query("insert into master_info (username, password, ts_login, logged) VALUES ('" + master + "', '" + pass + "', '" + return_formatted_date() + "', '1')", function (err, result, fields) {
    			if (err) { throw err; }
		});
	});

	var new_master_doc = new master_info({ name: master });
	new_master_doc.save(function (err) {
	  if (err) return handleError(err);
	  console.log(master + " saved in mongo.");
	});
	res.render('master_console', {page_name: master + '\'s console', master: master});
});

app.post('/command_handler' , function(req, res) {
	let new_command = req.body.new_command;
	let slave_target = req.body.slave_target;
	let master = req.body.master;

	const condition = { name : master };
	const update = { $push : { commands : {command : new_command, slave : slave_target} }};
	master_info.findOneAndUpdate(condition, update, options={useFindAndModify :false, new : true}, function(err, doc){
		if (err) { throw err; }
	});
	res.render('master_console', {page_name: master + '\'s console', master: master});
});

app.get('/slave_api' , function(req, res){
	let slave_name = req.query.slave_name;
	let master_name = req.query.master_name;
	const condition = { name : master_name };
	const update = { $push : { pinged_slaves : {slavename : slave_name, semaphore : 0} }};
	master_info.findOne(condition, function(err, doc){
		if (err) { throw err; }
		if (doc == null){
			res.send(["Nope"]);
			return false;
		}
		let list_commands = doc['commands'];
		let found = true;
		for (var i = 0; i < list_commands.length; i++) {
			if (list_commands[i]['slave'] != slave_name && list_commands[i]['slave'] != "all"){
				continue;
			}
			found = false;
			let results = list_commands[i]['results'];
			for (var j=0; j < results.length; j++){
				if (results[j]['slavename'] == slave_name) {
					found = true;
					break;
				}
			}
			if (found) {
				continue;
			}
			break;
		}

		var position = i;

		let ping_exists = false;
		let list_pinged = doc['pinged_slaves'];
		for (var i = 0; i < list_pinged.length; i++) {
			if (list_pinged[i]['slavename'] == slave_name){
				ping_exists = true;
				break;
			}
		}

		if (!ping_exists){
			master_info.findOneAndUpdate(condition, update, options={useFindAndModify :false, new : true}, function(err, doc){
				if (!found){
					res.send([list_commands[position]['command'] , list_commands[position]['timestamp'] ]);
				}
				else {
					res.send(["Nope"]);
				}
			});
		}
		else {
			const update2 = { "pinged_slaves.$[elem].semaphore" : 0 };
			master_info.findOneAndUpdate(condition, update2, options={useFindAndModify :false, new : true, "arrayFilters": [{ "elem.slavename": slave_name }]}, function(err, doc){
				if (!found){
					res.send([list_commands[position]['command'] , list_commands[position]['timestamp'] ]);
				}
				else {
					res.send(["Nope"]);
				}
			});
		}

		
	});

});

app.post('/slave_api', function(req,res){
	let slave_name = req.query.slave_name;
	let master_name = req.query.master_name;
	let timestamp = new Date(req.query.timestamp);
	let out = req.query.out;

	let	condition = { name : master_name , "commands.timestamp" : timestamp };
	const update = { $push : { "commands.$[elem].results" : { slavename : slave_name, output : out } } };
	
	master_info.findOneAndUpdate(condition, update, options={useFindAndModify :false, new : true, "arrayFilters": [{ "elem.timestamp": timestamp }]}, function(err, doc){});
	res.sendStatus(200);
});

app.get('/ping', function(req,res){
	let master = req.query.master;
	const condition = { name : master };
	master_info.findOne(condition, function(err, doc){
		if (doc == null){
			res.send("");
			return false;
		}
		list_pinged = doc['pinged_slaves'];
		var arr = "";
		for(var i = 0; i < list_pinged.length; i++){
			if (list_pinged[i]["semaphore"] > 3){
				var slave_name = list_pinged[i]["slavename"];
				const update = { $pull : { pinged_slaves : { slavename : slave_name } } };
				master_info.findOneAndUpdate(condition, update, options={useFindAndModify :false, new : true}, function(err, doc){});
			}
			else {
				var slave_name = list_pinged[i]["slavename"];
				const condition2 = { name : master };
				const update = { $inc : { "pinged_slaves.$[elem].semaphore" : 1 } };
				master_info.findOneAndUpdate(condition, update, options={useFindAndModify :false, new : true, "arrayFilters": [{ "elem.slavename": slave_name }]}, function(err, doc){});
			}
			arr = arr + " " + list_pinged[i]["slavename"];
		}
		res.send(arr);
	});
});

app.get('/getres', function(req,res){
	let master = req.query.master;
	const condition = { name : master };
	master_info.findOne(condition, function(err, doc){
		if (doc == null){
			res.send("");
			return false;
		}
		list_commands = doc['commands'];
		var arr = ""
		for(var i = 0; i < list_commands.length; i++) {
			if (list_commands[i]["results"].length == 0){
				continue;
			}
			arr = arr + "<b style=\"color:#42AA68\">Command:</b> " + list_commands[i]["command"] + "<br>";
			arr = arr + "<b style=\"color:#42AA68\">timestamp:</b> " + list_commands[i]["timestamp"] + "<br>";
			for (var j=0; j < list_commands[i]["results"].length; j++) {
				arr = arr + "<b style=\"color:#8BE9FD\">"+list_commands[i]["results"][j]["slavename"] + " </b><b style=\"color:#42AA68\">output:</b><br>";
				arr = arr + list_commands[i]["results"][j]["output"] + "<br><br>";
			}
		}
		res.send(arr);
	});
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
