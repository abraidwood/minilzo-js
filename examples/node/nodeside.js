
/*
 * Node side part of minilzo-js example
 *
 * 1. cd to examples/node
 * 2. npm install mini-lzo-wrapper
 * 3. node nodeside.js
 * 4. Visit http://localhost:1337/clientside.html in a browser
 *
 * Note: This example requires mini-lzo-wrapper
 * https://github.com/lfdoherty/mini-lzo-wrapper
 */

var lzo = require('./node_modules/mini-lzo-wrapper/build/Release/lzo');
var fs = require('fs');
var http = require('http');

var util = require('util');

// Example text is from here http://json.org/example.html
// it has line endings and leading whitespace removed.

var uncompBuffer = new Buffer(
	'{"glossary": {"title": "example glossary","GlossDiv": {"title": "S","GlossList": {"GlossEntry": {"ID": "SGML","SortAs": "SGML","GlossTerm": "Standard Generalized Markup Language","Acronym": "SGML","Abbrev": "ISO 8879:1986","GlossDef": {"para": "A meta-markup language, used to create markup languages such as DocBook.","GlossSeeAlso": ["GML", "XML"]},"GlossSee": "markup"}}}}}',
	'utf8'
);
var in_len = uncompBuffer.length,
	compBuffer = new Buffer(in_len + in_len / 16 + 64 + 3), // as per minilzo -> testmini
	len = lzo.compress(uncompBuffer, compBuffer),
	compStr = compBuffer.slice(0,len);

util.debug('compress happened: ' + uncompBuffer.length + ' > ' + len);

http.createServer(function (req, res) {
	if(req.url === "/data") {
		res.writeHead(200);
		res.end(compStr);
		return;
	}

	// Here's some BOJ data - it's JSON with a chunk of binary in it
	// ["BOJ",<length of binary data>,<binary data>]
	// Uses preprocessor to turn it back into JSON.

	if(req.url === "/data.boj") {
		res.writeHead(200);
		res.write('[{"channel": "/some/name","clientId": "83js73jsh29sjd92","data": ["BOJ",'+len+',');
		res.write(compStr);
		res.write(']}]');
		res.end();
	    return;
	}

	if(req.url === "/data.bojt") {
		res.writeHead(200);
		var bojt = [],
			offset = 0;

		str = '[{"channel": "/some/name","clientId": "83js73jsh29sjd92","data":';
		res.write(str);
		offset += str.length;

		res.write(compStr);
		bojt.push([offset,compStr.length]);
		offset += compStr.length;

		str = '},{"channel": "/some/other","clientId": "83js73jsh29sjd92","data":';
		res.write(str);
		offset += str.length;

		res.write(compStr);
		bojt.push([offset,compStr.length]);
		offset += compStr.length;

		var bojtBuffer = new Buffer(JSON.stringify(bojt),'utf8'),
			bojtLen = bojtBuffer.length,
			cbojtBuf = new Buffer(bojtLen + bojtLen / 16 + 64 + 3);

		len = lzo.compress(bojtBuffer,cbojtBuf);

		res.write('}]["BOJT",'+len+',');
		res.write(cbojtBuf.slice(0,len));
		res.write(']');

		res.end();
	    return;
	}

	if(req.url === "/bojt.html") {
		fs.readFile('bojt.html', function(error, content) {
			if (error) {
				res.writeHead(500);
				res.end();
			}
			else {
				res.writeHead(200, { 'Content-Type': 'text/html' });
				res.end(content, 'utf-8');
			}
	    });
	    return;
	}

	if(req.url === "/lzo1x.html") {
		fs.readFile('lzo1x.html', function(error, content) {
			if (error) {
				res.writeHead(500);
				res.end();
			}
			else {
				res.writeHead(200, { 'Content-Type': 'text/html' });
				res.end(content, 'utf-8');
			}
	    });
	    return;
	}

	if(req.url === "/ex1.json") {
		fs.readFile('ex1.json', function(error, content) {
			if (error) {
				res.writeHead(500);
				res.end();
			}
			else {
				res.end(content, 'unicode');
			}
	    });
	    return;
	}

	if(req.url === "/bojt.js") {
		fs.readFile('./bojt.js', function(error, content) {
			if (error) {
				res.writeHead(500);
				res.end();
			}
			else {
				res.writeHead(200, { 'Content-Type': 'application/javascript' });
				res.end(content, 'utf-8');
			}
	    });
	    return;
	}

	if(req.url === "/lzo1x.js") {
		fs.readFile('../../lzo1x.js', function(error, content) {
			if (error) {
				res.writeHead(500);
				res.end();
			}
			else {
				res.writeHead(200, { 'Content-Type': 'application/javascript' });
				res.end(content, 'utf-8');
			}
	    });
	    return;
	}
	res.writeHead(404);
	res.end();

}).listen(1337, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');

