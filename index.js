var settings = {redis: {host: 'redis', port: 6379}};
var app = require('express')();
var redis = require('socket.io-redis');
var push = require('socket.io-emitter')(settings.redis);
var io = require('socket.io').listen(app.listen(80)).adapter(redis(settings.redis));
var cv = require('opencv');
var users = [];

app.set('view engine', 'pug');
app.set('views', `${__dirname}/views`);
app.get('/', (req, res) => {
	res.render('index', {
		title: 'Pi Moniter',
		user: req.query.user,
		exists: !!users.find((val) => { if (val.name === req.query.user) return true; })
	});
});

io.on('connection', (socket) => {

	var setAdmin = (id) => io.to(id).emit('admin');
	var pushMessage = (message) => io.emit('chat', {user: socket.userInfo, message: message});
	socket.on('chat', (message) => { pushMessage(message); });

	socket.on('user', (user) => {
		users.push(socket.userInfo = {id: socket.id, name: user, admin: !users.length});
		pushMessage('Login');
		if (socket.userInfo.admin) setAdmin(socket.id);
	});

	socket.on('speed', (speed) => {
		if (socket.userInfo.admin) io.emit('speed', speed);
	})

	socket.on('degree', (degree) => {
		if (socket.userInfo.admin) io.emit('degree', degree);
	})

	socket.on('disconnect', () => {
		users.find((val, index, users) => {
			if (val.id !== socket.id) return ;
			if (!index && users.length > 1) {
				setAdmin(users[1].id);
				users[1].admin = true;
			}
			pushMessage('Logout');
			users.splice(index, 1);
			return true;
		});
	});
});

try {
	var camera = new cv.VideoCapture(0);
	camera.setWidth(640);
	camera.setHeight(480);

	setInterval(() => {
		if (users.length) {
			camera.read((e, img) => {
				if (e) throw err;
				push.emit('capture', img.toBuffer());
			});
		}
	}, 1000);
} catch (e) {
	console.log('Error: ', e);
}
