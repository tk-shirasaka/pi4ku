var settings = require('./settings');
var app = require('express')();
var redis = require('socket.io-redis')(settings.redis);
var push = require('socket.io-emitter')(settings.redis);
var io = require('socket.io').listen(app.listen(settings.listen)).adapter(redis);
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
	var findUserInfo = (id) => (users.find((val, index, users) => { if (id === val.id) return true}));
	var pushMessage = (message) => io.emit('chat', {user: socket.userInfo, message: message});
	socket.on('chat', (message) => { pushMessage(message); });

	socket.on('user', (user) => {
		users.push(socket.userInfo = {id: socket.id, name: user, admin: !users.length, expired: false});
		pushMessage('Login');
		if (socket.userInfo.admin) setAdmin(socket.id);
	});

	socket.on('admin', (socketid) => {
		var userInfo = findUserInfo(socketid);
		if (userInfo) {
			socket.userInfo.admin = false;
			userInfo.admin = true;
			setAdmin(socketid);
		} else {
			setAdmin(socket.id);
		}
	});

	socket.on('speed', (speed) => {
		if (socket.userInfo.admin) io.emit('speed', speed);
	})

	socket.on('degree', (degree) => {
		if (socket.userInfo.admin) io.emit('degree', degree);
	})

	socket.on('disconnect', () => {
		var userInfo = findUserInfo(socket.id),
		    index = -1;

		if (userInfo) {
			index = users.indexOf(userInfo);
			socket.userInfo.expired = true;
			pushMessage('Logout');
			users.splice(index, 1);
			if (userInfo.admin && users.length) setAdmin(users[0].id)
		}
	});
});

try {
	var camera = new cv.VideoCapture(settings.camera.device);
	camera.setWidth(settings.camera.width);
	camera.setHeight(settings.camera.height);

	setInterval(() => {
		if (users.length) {
			camera.read((e, img) => {
				if (e) throw err;
				push.emit('capture', img.toBuffer());
			});
		}
	}, 1000 / settings.camera.fps);
} catch (e) {
	console.log('Error: ', e);
}
