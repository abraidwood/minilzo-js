var lzo1x = (function () {
	var _lzo1x = {

		/*!{id:msgpack.js,ver:1.05,license:"MIT",author:"uupaa.js@gmail.com"}*/
		// === msgpack ===
		// MessagePack -> http://msgpack.sourceforge.net/
		// https://github.com/msgpack/msgpack-javascript
		_bin2num: {},
		_num2bin: {},
		_toString: String.fromCharCode,

		init: function () {
			var i = 0,
				v;

			for (i = 0; i < 0x100; ++i) {
				v = this._toString(i);
				this._bin2num[v] = i; // "\00" -> 0x00
				this._num2bin[i] = v; //	 0 -> "\00"
			}

			// http://twitter.com/edvakf/statuses/15576483807
			for (i = 0x80; i < 0x100; ++i) { // [Webkit][Gecko]
				this._bin2num[this._toString(0xf700 + i)] = i; // "\f780" -> 0x80
			}
		},

		byteStringToByteArray: function (data) { // @param BinaryString: "\00\01"
									   // @return ByteArray: [0x00, 0x01]
			var rv = [],
				bin2num = this._bin2num,
				remain,
				ary = data[0] === data.substring(0,1) ? data : data.split(""),
				i = -1,
				iz;

			iz = data.length;

			remain = iz % 8;
			while (remain--) {
				++i;
				rv[i] = bin2num[ary[i]];
			}

			remain = iz >>> 3;
			while (remain--) {
				rv.push(
					bin2num[ary[++i]],
					bin2num[ary[++i]],
					bin2num[ary[++i]],
					bin2num[ary[++i]],
					bin2num[ary[++i]],
					bin2num[ary[++i]],
					bin2num[ary[++i]],
					bin2num[ary[++i]]
				);
			}
			return rv;
		},

		byteArrayToByteString: function (byteArray) { // @param ByteArray
													  // @return String
			var rv = [],
				i=0,
				lim = 1024,
				iz = byteArray.length,
				_toString = this._toString,
				num2bin = this._num2bin;

			try {
				if(iz <= lim) {
					return _toString.apply(this, byteArray);
				}
				while (iz > 0) {
					rv.push(_toString.apply(this, byteArray.slice(i, i + Math.min(lim, iz))));
					iz -= lim;
					i += lim;
				}
				return rv.join("");
			} catch(e) {; // avoid "Maximum call stack size exceeded"
			}

			// http://d.hatena.ne.jp/uupaa/20101128
			try {
				return _toString.apply(this, byteArray); // toString
			} catch (err) {; // avoid "Maximum call stack size exceeded"
			}
			rv = [];
			iz = byteArray.length;

			for (i = 0; i < iz; ++i) {
				rv[i] = num2bin[byteArray[i]];
			}
			return rv.join("");
		},

		/*! end of msgpack.js section */

		unicodeToUTF8ByteArray: function(sInBuf) {// @param String
												  // @return ByteArray
			// It would be nice to use:
			//		unescape(encodeURIComponent(...)));
			// for string -> utf8, but it's slower

			var i, leni = sInBuf.length,
				j=0,
				charCode,
				pBuf=[];

			for (i = 0; i < leni; i++) {
				charCode = sInBuf.charCodeAt(i);
				// unicode => utf-8
				if (charCode < 0x80) {
					pBuf[j++] = charCode;
				} else if (charCode < 0x0800) {
					pBuf[j++] = 0xc0 | (charCode >>> 6);
					pBuf[j++] = 0x80 | (charCode & 0x3f);
				} else {
					pBuf[j++] = 0xe0 | (charCode >>> 12);
					pBuf[j++] = 0x80 | ((charCode >>> 6) & 0x3f);
					pBuf[j++] = 0x80 | (charCode & 0x3f);
				}
			}
			return pBuf;
		},

		utf8ByteArrayToUnicodeString: function(pInBuf) { // @param ByteArray
														 // @return String
			// It would be nice to use:
			//		decodeURIComponent(escape(...)));
			// for utf8 -> string, but it's slower
			var p = pInBuf.length,
				pOutBuf = [],
				kBuf,
				lim = 1024,
				i=0, j=0, k=0, lenj,
				c;

			while(p > 0)
			{
				kBuf = [];
				for(j=0, lenj=Math.min(p,lim);j<lenj && p > 0;j++)
				{
					c = pInBuf[i++];
					if (c < 128) {
						kBuf[j] = c;
						p--;
					} else if (c >= 0xe0) {
						kBuf[j] = ((c & 0x0f) << 12) + ((pInBuf[i++] & 0x3f) << 6) + (pInBuf[i++] & 0x3f);
						p-=3;
					} else {// if (c >= 0xc0) {
						kBuf[j] = ((c & 0x1f) << 6) + (pInBuf[i++] & 0x3f);
						p-=2;
					}/* no support for 0xf0, 0xf8 yet*/
				}
				pOutBuf[k++] = String.fromCharCode.apply(this, kBuf);
			}
			return pOutBuf.join("");
		},

		decompress: function(pInBuf) { // @param ByteArray
									   // @return ByteArray
			var t,
				out = [],
				ip = 0,
				op = 0,
				ip_end = pInBuf.length,
				m_pos = 0,
				outerLoopPos = 0,
				innerLoopPos = 0,
				doOuterLoop = true;

			if (pInBuf[ip] > 17) {
				t = pInBuf[ip++] - 17;
				if (t < 4) {
					outerLoopPos = 2;
					innerLoopPos = 3;
				} else {
					do {
						out[op++] = pInBuf[ip++];
					} while (--t > 0);
					outerLoopPos = 1;
				}
			}
			do {
				if(outerLoopPos === 0) {
					t = pInBuf[ip++];
					if (t >= 16) {
						outerLoopPos = 2;
						continue;
					}
					if (t === 0) {
						while (pInBuf[ip] === 0) {
							t += 255;
							ip++;
						}
						t += 15 + pInBuf[ip++];
					}

					t += 3;
					do {
						out[op++] = pInBuf[ip++];
					} while (--t > 0);

					outerLoopPos = 1;
				}

				if(outerLoopPos === 1) {
					t = pInBuf[ip++];
					if (t < 16) {
						m_pos = op - 0x0801;
						m_pos -= t >> 2;
						m_pos -= pInBuf[ip++] << 2;

						out[op++] = out[m_pos++];
						out[op++] = out[m_pos++];
						out[op++] = out[m_pos];

						innerLoopPos = 2;
					}
					outerLoopPos = 2;
				}

				if(outerLoopPos === 2) {
					outerLoopPos = 0;
					innerLoopPos = 0;

					do {
						if(innerLoopPos === 0) {
							if (t >= 64) {

								m_pos = op - 1;
								m_pos -= (t >> 2) & 7;
								m_pos -= pInBuf[ip++] << 3;
								t = (t >> 5) - 1;

								innerLoopPos = 1;
								continue;

							} else if (t >= 32) {
								t &= 31;
								if (t === 0) {
									while (pInBuf[ip] === 0) {
										t += 255;
										ip++;
									}
									t += 31 + pInBuf[ip++];
								}
								m_pos = op - 1;
								m_pos -= (pInBuf[ip] >> 2) + (pInBuf[ip + 1] << 6);
								ip += 2;
							} else if (t >= 16) {
								m_pos = op;
								m_pos -= (t & 8) << 11;
								t &= 7;
								if (t === 0) {
									while (pInBuf[ip] === 0) {
										t += 255;
										ip++;
									}
									t += 7 + pInBuf[ip++];
								}

								m_pos -= (pInBuf[ip] >> 2) + (pInBuf[ip + 1] << 6);
								ip += 2;
								if (m_pos === op) {
									doOuterLoop = false;
									break;
								}
								m_pos -= 0x4000;
							} else {
								m_pos = op - 1;
								m_pos -= t >> 2;
								m_pos -= pInBuf[ip++] << 2;
								out[op++] = out[m_pos++];
								out[op++] = out[m_pos];

								innerLoopPos = 2;
								continue;
							}
							innerLoopPos = 1;
						}

						if(innerLoopPos === 1) {
							t += 2;
							do {
								out[op++] = out[m_pos++];
							} while (--t > 0);
							innerLoopPos = 2;
						}

						if(innerLoopPos === 2) {
							t = pInBuf[ip - 2] & 3;
							if (t === 0) {
								break;
							}
							innerLoopPos = 3;
						}

						if(innerLoopPos === 3) {
							out[op++] = pInBuf[ip++];
							if (t > 1) {
								out[op++] = pInBuf[ip++];

								if (t > 2) {
									out[op++] = pInBuf[ip++];
								}
							}
							t = pInBuf[ip++];
							innerLoopPos = 0;
						}
					} while (true);
				}
			} while (doOuterLoop);

			return out;
		},

		dict: [],

		_compressCore: function (pInBuf, ip_s, in_len, op_s, state) {
			var dict = this.dict,
				ti = state.t,
				out = state.out,
				op = op_s,
				ip = ip_s,

				in_end = ip_s + in_len,
				ip_end = in_end - 20,
				ii = ip,

				loopPos = 0,
				doLoop = true,

				m_pos = 0,
				m_off = 0,
				m_len = 0,
				dv, dindex, t, tt;

			ip += ti < 4 ? 4 - ti : 0;

			do {
				if(loopPos === 0) {
					ip += 1 + ((ip - ii) >> 5);
					loopPos = 1;
				}

				if(loopPos === 1) {
					if (ip >= ip_end) {
						break;
					}
					dv = (((pInBuf[ip+3]) ) << 24) | (((pInBuf[ip+2]) ) << 16) | (((pInBuf[ip+1]) ) << 8) | ((pInBuf[ip]) );

					dindex = (0x1824429d * dv) >> 18;

					if (dindex < 0) {
						dindex += 16384;
					} else {
						dindex &= 16383;
					}
					m_pos = ip_s + dict[dindex];
					dict[dindex] = ip - ip_s;

					if (dv !== ((((pInBuf[m_pos+3]) ) << 24) | (((pInBuf[m_pos+2]) ) << 16) | (((pInBuf[m_pos+1]) ) << 8) | ((pInBuf[m_pos]) ))) {
						loopPos = 0;
						continue;
					}

					ii -= ti;
					ti = 0;
					t = ip - ii;

					if (t !== 0) {
						if (t <= 3) {
							out[op - 2] |= t & 0xff;
							do {
								out[op++] = pInBuf[ii++];
							} while (--t > 0);
						} else {
							if (t <= 18) {
								out[op++] = (t - 3) & 0xff;
							} else {
								tt = t - 18;
								out[op++] = 0;
								while (tt > 255) {
									tt -= 255;
									out[op++] = 0;
								}
								out[op++] = tt & 0xff;
							}
							do {
								out[op++] = pInBuf[ii++];
							} while (--t > 0);
						}
					}

					m_len = 4;

					if (pInBuf[ip + m_len] === pInBuf[m_pos + m_len]) {
						do {
							m_len += 1;
							if (ip + m_len >= ip_end) {
								break;
							}
						} while (pInBuf[ip + m_len] === pInBuf[m_pos + m_len]);
					}
					loopPos = 2;
				}
				if(loopPos === 2) {
					m_off = ip - m_pos;
					ip += m_len;
					ii = ip;
					if (m_len <= 8 && m_off <= 0x0800) {
						m_off -= 1;
						out[op++] = (((m_len - 1) << 5) | ((m_off & 7) << 2));
						out[op++] = (m_off >> 3) & 0xff;
					} else if (m_off <= 0x4000) {
						m_off -= 1;
						if (m_len <= 33) {
							out[op++] = (32 | (m_len - 2)) & 0xff;
						} else {
							m_len -= 33;
							out[op++] = 32;
							while (m_len > 255) {
								m_len -= 255;
								out[op++] = 0;
							}
							out[op++] = m_len & 0xff;
						}
						out[op++] = (m_off << 2) & 0xff;
						out[op++] = (m_off >> 6) & 0xff;
					} else {
						m_off -= 0x4000;
						if (m_len <= 9) {
							out[op++] = (16 | ((m_off >> 11) & 8) | (m_len - 2)) & 0xff;
						} else {
							m_len -= 9;
							out[op++] = (16 | ((m_off >> 11) & 8)) & 0xff;
							while (m_len > 255) {
								m_len -= 255;
								out[op++] = 0;
							}
							out[op++] = m_len & 0xff;
						}
						out[op++] = (m_off << 2) & 0xff;
						out[op++] = (m_off >> 6) & 0xff;
					}
					loopPos = 1;
				}
			} while (doLoop);

			return {
				t: in_end - (ii - ti),
				out_len: op - op_s,
				out: out
			};

		},

		compress: function (pInBuf) { // @param ByteArray
									  // @return ByteArray
			pInBuf.push(0);

			var in_s = 0,
				out_s = 0,
				ip = 0,
				op = 0,
				in_len = pInBuf.length,
				l = in_len,
				t = 0,
				ll, ll_end, dict = this.dict, dicti, state = {
					t: 0,
					out: [],
					out_len: 0
				},
				out, tt, ii;

			out = state.out;

			while (l > 20) {
				if(l>49152) {
					ll = 49152;
				} else {
					ll = l;
				}
				ll_end = ip + ll;
				if ((t + ll) >> 5 <= 0) {
					break;
				}

				dicti = 16384;
				while (dicti--) {
					dict[dicti] = 0;
				}

				state = this._compressCore(pInBuf, ip, ll, op, state);
				t = state.t;
				ip += ll;
				op += state.out_len;

				l -= ll;
			}
			t += l;
			if (t > 0) {
				ii = in_s + in_len - t;
				if (op === out_s && t <= 238) {
					out[op++] = (17 + t) & 0xff;
				} else if (t <= 3) {
					out[op - 2] |= t & 0xff;
				} else if (t <= 18) {
					out[op++] = (t - 3) & 0xff;
				} else {
					tt = t - 18;
					out[op++] = 0;
					while (tt > 255) {
						tt -= 255;
						out[op++] = 0;
					}
					out[op++] = tt & 0xff;
				}
				do {
					out[op++] = pInBuf[ii++];
				} while (--t > 0);
			}

			out[op++] = 17;
			out[op++] = 0;
			out[op++] = 0;

			return out;
		}
	};
	_lzo1x.init();

	return {
		compress: function (s,sInputEncoding,sOutputEncoding) {
			sInputEncoding || (sInputEncoding = "unicode");
			sOutputEncoding || (sOutputEncoding = "utf8");

			if(sInputEncoding === "unicode") {
				s = _lzo1x.unicodeToUTF8ByteArray(s);
			} else {
				s = _lzo1x.byteStringToByteArray(s);
			}

			s = _lzo1x.compress(s);

			if(sOutputEncoding === "unicode") {
				return _lzo1x.utf8ByteArrayToUnicodeString(s);
			} else {
				return _lzo1x.byteArrayToByteString(s);
			}
		},
		decompress: function (s,sInputEncoding,sOutputEncoding) {
			sInputEncoding || (sInputEncoding = "utf8");
			sOutputEncoding || (sOutputEncoding = "unicode");

			if(sInputEncoding === "unicode") {
				s = _lzo1x.unicodeToUTF8ByteArray(s);
			} else {
				var i,leni=s.length,
					p = [];

				for(i=0;i<leni;i++) {
					p[i] = s.charCodeAt(i) & 0xff;
				}
				s = p;
			}

			s = _lzo1x.decompress(s);

			if(sOutputEncoding === "unicode") {
				return _lzo1x.utf8ByteArrayToUnicodeString(s);
			} else {
				return _lzo1x.byteArrayToByteString(s);
			}
		},
		byteStringToByteArray: function (s) {
			return _lzo1x.byteStringToByteArray(s);
		},
		byteArrayToByteString: function (s) {
			return _lzo1x.byteArrayToByteString(s);
		},
		unicodeToUTF8ByteArray: function(s) {
			return _lzo1x.unicodeToUTF8ByteArray(s);
		},
		utf8ByteArrayToUnicodeString: function(s) {
			return _lzo1x.utf8ByteArrayToUnicodeString(s);
		}
	};
})();