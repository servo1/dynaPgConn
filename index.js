var { Pool } = require('pg').native;

(function () {
	var pgConn = {};

	root = this;
	if (root != null) {
		previous_pgConn = root.pgConn;
	}

	pgConn.noConflict = function () {
		root.pgConn = previous_pgConn;
		return pgConn;
	};

	var pubReady = false;
	var conns = [];

	pgConn.subConn = {}; //for current subscriber connection
	pgConn.conn = {}; //for current connection in use
	pgConn.conns = []; //collection of connections
	pgConn.connecting = false;
	pgConn.connect = function (opts, cb) {
		var self = this;
		//minimum requirements, host and port or sock
		if (typeof opts == "function" || typeof opts == "undefined") {
			//first parameter is cb, check for existing connection and return
			if (pgConn.conn || pgConn.connecting) {
				if (typeof cb == "function") cb();
				return self;
			} else {
				return false;
			}
		} else if (opts && ((opts.host && opts.port) || opts.path)) {
			//check through existing connections to find matches otherwise, create new and set current
			pgConn.connecting = true;
			if (!opts.sub) opts.sub = false;
			if (!opts.db) opts.db = 0;

			var i = 0,
				len = pgConn.conns.length,
				isnew = true,
				iconn;
			for (; i < len; i++) {
				iconn = pgConn.conns[i];
				if (
					(
						(iconn['host'] && opts['host'] && opts['host'] == iconn['host'] &&
							iconn['port'] && opts['port'] && opts['port'] == iconn['port'] &&
							iconn['database'] && opts['database'] && opts['database'] == iconn['database'] &&
							iconn['password'] && opts['password'] && opts['password'] == iconn['password'] &&
							iconn['user'] && opts['user'] && opts['user'] == iconn['user']
						)
					) &&
					iconn['db'] && opts['db'] && opts['db'] == iconn['db']
				) isnew = i;
			}
			if (isnew === true) {
				//force defaults of these always
				pgConn.createConn(opts, cb);
			} else {
				pgConn.conn = pgConn.conns[isnew].conn;
			}
		}
		return self;
	}

	pgConn.createConn = function (opts, cb) {
		const pool = new Pool(opts);
		pool.on('error', (err, client) => {
		  console.error('Unexpected error on idle client', err)
		  process.exit(-1)
		})
		opts.conn = pgConn.conn;
		pgConn.conn = pool;
		pgConn.conns.push(opts);
		pgConn.connReady = true;
		pgConn.conn.query('select now()', cb);

	}

	var getPgVersion = `SELECT current_setting('server_version_num')::integer`;

	var schema = 'public';
	var anonRole = 'web_anon';


	//connection, pub, sub functions
	pgConn.query = function(query, data, cb){
		pgConn.conn.query(query, data, cb);
	}
	pgConn.get = function (key, callback) {
		return pgConn.conn;
	}


	// Node.js
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = pgConn;
	}
	// AMD / RequireJS
	else if (typeof define !== 'undefined' && define.amd) {
		define([], function () {
			return pgConn;
		});
	}
	// included directly via <script> tag
	else {
		global.pgConn = pgConn;
	}

}());
