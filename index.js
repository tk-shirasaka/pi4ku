var settings = {redis: {host: 'redis', port: 6379}};
var app = require('express')();
var redis = require('socket.io-redis');
var push = require('socket.io-emitter')(settings.redis);
var io = require('socket.io').listen(app.listen(80)).adapter(redis(settings.redis));
var cv = require('opencv');
var users = {};

app.set('view engine', 'pug');
app.set('views', `${__dirname}/views`);
app.get('/', (req, res) => {
	res.render('index', {
		title: 'Pi Moniter',
		user: req.query.user,
		exists: !!users[req.query.user]
	});
});

io.on('connection', (socket) => {

	socket.on('chat message', (request) => {
		io.emit('chat message', request);
	});

	socket.on('set user', (user) => {
		users[user] = socket.id
		io.emit('chat message', {user: user, message: 'Login'});
	});

	socket.on('disconnect', () => {
		for (var user in users) {
			if (users[user] !== socket.id) continue;
			delete users[user];
			io.emit('chat message', {user: user, message: 'Logout'});
			break;
		}
	})
});

try {
	var camera = new cv.VideoCapture(0);
	camera.setWidth(640);
	camera.setHeight(480);

	setInterval(() => {
		if (Object.keys(users).length) {
			camera.read((e, img) => {
				if (e) throw err;
				push.emit('capture', img.toBuffer());
			});
		}
	}, 1000);
} catch (e) {
	console.log('Error: ', e);
}
