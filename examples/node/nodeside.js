
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
		res.end(compStr);
		return;
	}

	if(req.url === "/clientside.html") {
		fs.readFile('clientside.html', function(error, content) {
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

	res.writeHead(404);
	res.end();

}).listen(1337, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');

