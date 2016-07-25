var user = $('#user').val();
    socket = io.connect('ws://{host}');

socket.emit('user', user);
socket.on('admin', () => {
	$('#header').children().addClass('indigo');
	$('#speed').prop('disabled', false);
	$('#degree').prop('disabled', false);
	Materialize.toast('You are admin', 3000);
})
socket.on('chat', (request) => {
	var $messageBox = $('#messageBox').clone();
	$messageBox.removeAttr('id');
	$messageBox.show();
	$messageBox.find('.title').text(request.user.name);
	$messageBox.find('.message').text(request.message);

	(user == request.user.name)
		? $messageBox.find('i').addClass('red')
		: Materialize.toast(`${request.user.name} : ${request.message}`, 3000);
	if (request.user.admin) $messageBox.find('i').text('lock');
	$('#messages').append($messageBox);
});
socket.on('speed', (speed) => {
	$('#speed').val(speed);
})
socket.on('degree', (degree) => {
	$('#degree').val(degree);
})
socket.on('capture', (capture) => {
	var binary = '',
	    image = new Image();
	    canvas = $('#capture')[0];

	capture = new Uint8Array(capture);
	for (var i = 0; i < capture.byteLength; i++) {
		binary += String.fromCharCode(capture[i]);
	}
	image.src = 'data:image/jpeg;base64,' + window.btoa(binary);
	image.onload = () => {
		try {
			if (canvas.getContext) {
				canvas.getContext('2d').drawImage(image, 0, 0, 640, 480);
			}
		} catch(e) {
			console.log(e);
		}
	}
});

$('#logout').on('click', () => {
	socket.disconnect();
	location.href = '/';
});
$('#send').on('click', () => {
	socket.emit('chat', $('#message').val());
	$('#message').val('');
});
$('#speed').on('change', () => {
	socket.emit('speed', $('#speed').val());
})
$('#degree').on('change', () => {
	socket.emit('degree', $('#degree').val());
})
$(document).ready(() => {
	$('.modal-trigger').leanModal();
})
