const http = require('http');
const path = require('path');
const exp = require('express');
const session = require('express-session');

const bodyParser = require('body-parser');

const xml2js = require('xml2js');
var builder = new xml2js.Builder();
var parser = new xml2js.Parser();

var mysql      = require('mysql');

var Busboy = require("busboy");

var name = "";
var passw = "";
var id;
var count;
var rows;
const fs = require('fs')
const app = exp() 
const hostname = '127.0.0.1'
const port = 2402
const pageCount = 20 //number of dives per page 

//Setup static express
const dir = path.join(__dirname, 'public')
app.use(exp.static(dir));
app.use(bodyParser());
app.use(session({secret: "b4Z1|\|94"}));



if (!fs.existsSync(__dirname + "/users")) {fs.mkdir(__dirname + "/users")}


var con = mysql.createConnection({
  host     : 'den1.mysql1.gear.host',
  user     : 'scubalogin',
  password : 'Xx4e5S5I!qY~',
  database : 'scubalogin'
});



con.connect(function(err) {
	if (err) 
	{
		console.log(err)
	}
});

//Logs in user given a HTTP POST request containing a 'username' and 'psw' value
function loginUser(request, response)
{
	con.query("SELECT name, password FROM users WHERE name = " + con.escape(request.body.username), // escaping used to prevent SQL injection
	function (err, fields){
		if (fields[0].password == request.body.psw)
		{
			console.log("Login success")
			request.session.userName = fields[0].name;
			response.sendFile(dir + '/selector.html');
			
		}
		else 
		{
			response.sendFile(dir + '/login.html');
		}
	});
}



//user registration:
//Issue: Handle invalid characters (escape characters) on clientside
//Returns boolean, but should change to error codes in the future
function userReg(request)
{ 
	var user = con.escape(request.body.username)
	var pass = con.escape(request.body.password)
	var email = con.escape(request.body.email)
	console.log("Testing")
	console.log(user)
	console.log(pass)
	console.log(email)
	con.query("SELECT * FROM users WHERE name = "+user, function(err, result, fields){
		if (result.length == 0)
		{
			var sql = "INSERT INTO users (name, password, email) VALUES(" + user + "," + pass + "," + email + ")"
			con.query(sql, function (err, result,fields){
				if (err) {
					console.log(err)
					
				}
				else 
				{
					console.log("Successful Login")
					request.session.userName = user
					if (!fs.existsSync(__dirname + "/users/" + user)) {fs.mkdirSync(__dirname + "/users/" + user)}
					return true 
				}
			})
		}
		else
		{
			console.log("Duplicate user detected.")
		}
		
	})
	return false
}

function isLoggedIn(request)
{
	if (typeof(request.session.userName) == 'undefined') 
	{
		console.log(request.session.userName)
		console.log("Not logged in")
		return false 
	}
	return true
}

function handleFailedLogin(response)
{
	console.log("Failed login")
	response.sendFile(dir + '/index.html');
	return
}

function getNumberOfDives(userName)
{
	files = fs.readdirSync(__dirname + "/users/" + userName)
	return files.length
}
function getSessionUserName(request)
{
	return request.session.userName
}

function sendPages(request, response)
{
	
	var pageNo = request.session.pageNo			
	var userName = request.session.userName

	fs.readdir(__dirname + "/users/" + userName, function(err, files) { 
		file ={"dives" : []}
		firstResult = files.length-1-(pageCount*(pageNo-1)) //value of last key in array

		lastResult = Math.max(files.length-(pageCount*(pageNo-1))-pageCount, 0)

		//read backwards through the users' dives, starting at the current page
		for (i=firstResult; i>=lastResult; i--) 
			{
				object = {"name":files[i]}
				file["dives"].push(object)
			}
			
		var xml = builder.buildObject(file); 

		//  removing the header (the XML header isn't compatible with the browser parser)
		xml = xml.split('\n')
		xml.splice(0,1)
		xml = xml.join('\n')		

		response.send(xml)
	})
}




app.get('/', (request, response) => {
	response.sendFile(dir + '/index.html');
});

app.get('/selector.html', (request, response) => {
	response.sendFile(dir +"/selector.html");		
});


app.get('/next', (request, response) => {
	if (!isLoggedIn(request)) {
		handleFailedLogin(response)
		return
	}
	
	if (request.session.pageNo < (getNumberOfDives(request.session.userName)/pageCount)) {
		request.session.pageNo = request.session.pageNo + 1
	}
	
	sendPages(request, response)
})



app.get('/prev', (request, response) => {
	if (!isLoggedIn(request)) {
		handleFailedLogin(response) 
		return
	}

	if (request.session.pageNo > 1) {request.session.pageNo =  request.session.pageNo - 1}
	sendPages(request, response)
})


app.post('/choose', (request, response) => {
	console.log("choosing "+request.body.dive)
	if (!isLoggedIn(request)) {
	handleFailedLogin(response) 
	return
	}
	console.log("Chosen file "+request.body.dive)
	request.session.dive = parseInt(request.body.dive) + ((request.session.pageNo-1) * pageCount)

	
	fs.readdir(__dirname + "/users/" + request.session.userName, function(err, files) { 

	console.log("Opening file "+ request.session.dive)
	value = files[files.length-1-request.session.dive]
	console.log("Opening file "+ value)
	
	response.sendFile(__dirname + "/users/" + request.session.userName + "/" + value)
	})
})






app.get('/logs', (request, response) => {
	if (!isLoggedIn(request)) {
		handleFailedLogin(response) 
		return
	}
	
	if (!request.session.pageNo) {request.session.pageNo = 1}
	

	if (!fs.existsSync(__dirname + "/users/" + request.session.userName)) {fs.mkdir(__dirname + "/users/" + request.session.userName)}
	sendPages(request, response)

	
});

app.post('/signup', (request, response) => {
	
	success = userReg(request)

	if (!success){
		console.log("fail")
		response.sendFile(dir + '/selector.html');
	}
	else 
	{
		response.sendFile(dir + '/signup.html');
	}
});

app.post('/login', (request, response) => {
	loginUser(request, response)
});
	
app.listen(port, (err) => {
	if (err) {
		return console.log('something bad happened', err)
	}
});




app.post('/upload', (request, response) => {
	
	if (!isLoggedIn(request)) {
	handleFailedLogin(response) 
	return
	}
	
    var busboy = new Busboy({ headers: request.headers })
	var loadedData = ""
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		file.on('data', function(data) {
			loadedData = loadedData + data
		})
		file.on('end', function() {
		})
    })
	busboy.on('finish', function() {
		sortMultiDive(loadedData, getSessionUserName(request))
		response.writeHead(303, { Connection: 'close', Location: '/' });
		response.end();
	})

    request.pipe(busboy);
})

function saveSingleDive(data, user)
{
	var xml = builder.buildObject(data);
	var date = data["date"][0].replace(/:/g,"-").replace(/ /g,"_")
	var year = date.substring()
	console.log("Creating data "+ date + " for " +user)
	fs.writeFileSync(__dirname + "\\users\\" + user + "\\" + date + ".xml", xml)
	
}

function sortMultiDive(data, user){
	if (!fs.existsSync(__dirname + "\\users\\" + user)) {fs.mkdir(__dirname + "\\users\\" + user)}
	console.log("Sorting data for "+user)
	parser.parseString(data, function (err, result) {
		if (result["dives"]["dive"].length > 0) {
			for (i=0; i<result["dives"]["dive"].length; i++)
			{
				saveSingleDive(result["dives"]["dive"][i], user)
			}
		}
	})	
}

