var settings = {redis: {host: 'redis', port: 6379}};
var app = require('express')();
var redis = require('socket.io-redis');
var push = require('socket.io-emitter')(settings.redis);
var io = require('socket.io').listen(app.listen(80)).adapter(redis(settings.redis));
var cv = require('opencv');
var users = {};
var counter = 0;

app.set('view engine', 'pug');
app.set('views', `${__dirname}/views`);
app.get('/', (req, res) => {
	res.render('index', {
		title: 'Test',
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
	var window = new cv.NamedWindow('Video', 1);

	setInterval(() => {
		camera.read((e, im) => {
			if (e) throw err;
			console.log(im);
		})
	}, 1000);
} catch (e) {
	console.log('Error: ', e);
}
setInterval(() => {
	if (Object.keys(users).length) {
		push.emit('counter', ++counter);
	} else {
		counter = 0;
	}
}, 1000);
