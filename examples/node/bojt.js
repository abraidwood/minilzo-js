/*
 * Integration of binary data into JSON by Alistair Braidwood
 *
 * BOJ:		Binary On JSON
 * Bodge:	To make something clumsily :)
 *
 * Spec:
 *
 * Single BOJ:
 *		["BOJ",<length of binary data>,<binary data>]
 *
 * BOJT: Table of contents (BOJ items)
 * 		{"BOJT":[[<offset>,<length>][,... etc]]}
 *
 * Notes:
 *
 * BOJT table may be compressed via BOJ & extracted prior to
 * other BOJ items
 *
 * unBOJ supports recursive unBOJing (recursive BOJing is crazy)
 *
 */

String.prototype.splice = function( idx, rem, s ) {
    return (this.slice(0,idx) + s + this.slice(idx + Math.abs(rem)));
};

var BOJ = {
	_noModify: function(s) {
		return s;
	},

	unBOJ: function(str,decoder) {	// @param String
									// @param function
									// @return String

		decoder = decoder || this._noModify;

		var i=0, j, k, n, binary, retval=[],end=str.length;

		while((i=str.indexOf('["BOJ",',i)) !== -1) {

			k=i+7;
			if(k>end) {
				throw "Unexpected end of data";
			}

			j=str.indexOf(',"',k);
			if(j === -1 || j>end) {
				throw "Unexpected end of data";
			}
			n = Number(str.substring(k,j));
			if(j+1 + n > end) {
				throw "Unexpected end of data";
			}
			retval.push(str.substring(0,i));
			binary = str.substr(j+1,n);

			retval.push(decoder(binary));
		}

		retval.push(str.substring(j+n+2,end));

		return retval.join("");
	},

	unBOJT: function(str,tableDecoder,entryDecoder) {
		tableDecoder = tableDecoder || this._noModify;
		entryDecoder = entryDecoder || this._noModify;

		var i=str.indexOf('["BOJT",'),leni,
			j=str.indexOf(',',i+8),
			n = Number(str.substring(i+8,j)),
			toc = JSON.parse(tableDecoder(str.substr(j+1,n))),
			offset,len,
			ret = [];

		str = str.slice(0,i);

		for(i=0,leni=toc.length,j=0;i<leni;i+=1)
		{
			offset = toc[i][0];
			len = toc[i][1];

			ret.push(str.substring(j,offset));
			ret.push(entryDecoder(str.substr(offset,len)));

			j=offset+len;
		}

		ret.push(str.slice(j));

		return ret.join("");
	}
};
