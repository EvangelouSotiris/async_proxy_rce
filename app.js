const express = require('express');
const path = require("path");
const exphbs  = require('express-handlebars');	
const body_parser = require('body-parser');

const port = process.env.PORT || '3000';  //webapp on localhost:3000

const app = express();

app.engine('handlebars', exphbs({defaultLayout:'main'}));
app.set('view engine', 'handlebars');

app.use(body_parser.json());
app.use(body_parser.urlencoded({extended:false}));

app.listen(port, function(){
	console.log('App started on port '+port);
});

app.get('/' , function(req,res,next){
	res.render('login', {page_name:'login'});
});