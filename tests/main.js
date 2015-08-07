
var list = fileList;

var timings = [];
var tc = [];

var index = 0, limit = list.length;

function runNextTest() {
	var file = list[index];
	makeRawRequest(file);
}

function makeRawRequest(f) {
	var file = f + '.raw';

	var oReq = new XMLHttpRequest();
	oReq.open('GET', file, true);
	oReq.responseType = 'arraybuffer';
	oReq.onload = function() {
		if(!oReq.response) {
			console.error('Failed to load: '+file);
			return;
		} else {
    		window.raw = new Uint8Array(oReq.response);
    		doCompression(window.raw);
    		makeRequest(f);
		}
	};
	oReq.send(null);
}

function makeRequest(f) {
	var file = f + '.lzo';

	var oReq = new XMLHttpRequest();
	var res;

	oReq.open('GET', file, true);
	oReq.responseType = 'arraybuffer';
	oReq.onload = function() {
		if(!oReq.response) {
			console.error('Failed to load: '+file);
			return;
		} else {
			window.rawLZO = new Uint8Array(oReq.response);
			res = checkComp(new Uint8Array(oReq.response), window.compNEW);
			if(res.status !== 0 ) {
				console.error('compression', ret.msg, list[index]);
			}
			processResponse(oReq.response);
		}
	};
	oReq.send(null);
}

function processResponse(arrayBuffer) {
	var byteArray = new Uint8Array(arrayBuffer);
    doDecompression(byteArray);
}

function testDecompression(state) {

	var t1 = performance.now();
	window.lzo1x.decompress(state);
	timings[timings.length - 1].time = performance.now() - t1;
	var ret = checkResult(state.outputBuffer);

	if(ret.status !== 0) {
		console.error('decompression', ret.msg, list[index]);
		// return false;
	}

	return true;
}

function checkResult(res) {
	if(res.length !== window.raw.length) {
		return {
			status: 1,
			msg: 'Length difference'
		};
	}
	for(var i=0,leni=res.length;i<leni;i++) {
		if(res[i] !== window.raw[i]) {
			return  {
				status: 2,
				msg: 'Differ at byte ' + i
			};
		}
	}
	return {
		status: 0
	};
}

function checkComp(res, comp) {
	if(res.length !== comp.length) {
		return {
			status: 1,
			msg: 'Length difference'
		};
	}
	for(var i=0,leni=res.length;i<leni;i++) {
		if(res[i] !== comp[i]) {
			return  {
				status: 2,
				msg: 'Differ at byte ' + i
			};
		}
	}
	return {
		status: 0
	};
}

function doCompression(byteArray) {
	var state = {
		inputBuffer: byteArray,
		outputBuffer: new Uint8Array(4)
	};

	tc.push({
		file: list[index],
		comp_size: state.outputBuffer.length,
		decomp_size: state.inputBuffer.length,
		time: 0.0
	});

	var t1 = performance.now();
	lzo1x.compress(state);
	tc[tc.length - 1].time = performance.now() - t1;
	tc[tc.length - 1].comp_size = state.outputBuffer.length;

	window.compNEW = state.outputBuffer;
}

function doDecompression(byteArray) {
	var state = {
		inputBuffer: byteArray,
		outputBuffer: new Uint8Array(4)
	};

	timings.push({
		file: list[index],
		comp_size: state.inputBuffer.length,
		decomp_size: window.raw.length,
		time: 0.0
	});

	if(testDecompression(state) && index<Math.min(list.length-1, 100000)) {
		index++;
		setTimeout(runNextTest, 1);
	} else {
		console.log('DONE');
	}

}