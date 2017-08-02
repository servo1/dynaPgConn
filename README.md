# dynaPgConn
Requires node package pg

implementation:  

```javascript

var pgconn = require('dynaPgConn')
pgconn.connect({
	user: 'postgres',
	host: 'localhost',
	database: 'mydb',
	password: 'mypass',
	port: 5432,
}, function (er, res) {
	console.log("connected");
});

```

