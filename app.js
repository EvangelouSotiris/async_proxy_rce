const express = require('express');
const path = require("path");
const exphbs  = require('express-handlebars');	
const body_parser = require('body-parser');
const mysql = require('mysql');
const port = process.env.PORT || '3000';  //webapp on localhost:3000

const app = express();

app.engine('handlebars', exphbs({defaultLayout:'main'}));
app.set('view engine', 'handlebars');

app.use(body_parser.json());
app.use(body_parser.urlencoded({extended:false}));

app.listen(port, function(){
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

// GET AND POST METHODS

app.get('/' , function(req,res){
	res.render('login', {page_name:'login'});
});

app.post('/masterlog' , function(req, res){
	let master = req.body.master_name;
	let pass = req.body.master_pass;
	//Login checking logic
	con.connect(function(err) {
		con.query("select count(username) from master_info where username = '" + master + "' and password = '" + pass +"'", function (err, result, fields) {
    			if (err) { throw err;}
			console.log(result);
			if (result[0]['count(username)'] == 0){
				res.render('login', {page_name:'login', error:'The master you entered doesn\'t exist. Click accept to create this master account.' , master:master, pass:pass});
			}
			else {
				//create the acc and log in after asking if its okay
				res.render('master_console', {page_name: master + '\'s console', master_name: master});
			}
		});
	});	
});

//TODO
//1) ALLAGH TOU QUERY ME COUNT GIATI TWRA KAI O XRISTIS NA YPARXEI PALI THA VGALEI ERROR OTI DEN YPARXEI
//2) NA VALOUME TO TS_LOGIN PEDIO NA EXEI THN WRA KANONIKA ME KWDIKA
//3) OTAN KANEI LOGIN IN TO LOGGED NA GINETAI 1 KAI NA VALOUME LOGOUT POU KANEI TO LOGGED KSANA 0 (H AN EKLEISE TO SESSION)

app.post('/create_and_log', function(req,res){
	let master = req.body.master_name;
	let pass = req.body.master_pass;
	con.connect(function(err) {
		con.query("insert into master_info (username, password, ts_login, logged) VALUES ('" + master + "', '" + pass + "', '15:14:14', '1')", function (err, result, fields) {
    			if (err) { throw err;}
		});
	});
	res.render('master_console', {page_name: master + '\'s console', master_name: master});
});

app.post('/command_handler' , function(req, res){
	let new_command = req.body.new_command;
});
