var express = require('express'),
	app = express();


app.get("/", function(req, res){
	var body = "Hello, world!";
	res.setHeader('Content-Type', 'text-plain');
	res.setHeader('Content-Length', Buffer.byteLength(body));
	res.end(body);
})