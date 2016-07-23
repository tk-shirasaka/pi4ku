var user = $('#user').val();
    socket = io.connect('ws://{host}');

socket.emit('set user', user);
socket.on('chat message', (request) => {
	var $messageBox = $('#messageBox').clone();
	$messageBox.removeAttr('id');
	$messageBox.show();
	$messageBox.find('.title').text(request.user);
	$messageBox.find('.message').text(request.message);

	(user == request.user)
		? $messageBox.find('i').addClass('red')
		: Materialize.toast(`${request.user} : ${request.message}`, 3000);
	$('#messages').append($messageBox);
});
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
	socket.emit('chat message', {user: user, message: $('#message').val()});
	$('#message').val('');
});
$(document).ready(() => {
	$('.modal-trigger').leanModal();
})
