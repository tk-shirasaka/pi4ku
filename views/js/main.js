var user = $('#user').val(),
    admin = false,
    socket = io.connect('ws://{host}');

socket.emit('user', user);
socket.on('admin', () => {
	admin = true;
	$('#header nav').addClass('indigo');
	$('#speed').prop('disabled', false);
	$('#degree').prop('disabled', false);
	$('.change-admin').removeClass('hide');
	Materialize.toast('You are admin', 3000);
})
socket.on('chat', (request) => {
	var $messageBox = $('#messageBox').clone(true);
	$('#messages').prepend($messageBox);
	$messageBox.removeAttr('id');
	$messageBox.removeClass('hide');
	$messageBox.find('.change-admin').data('socketid', request.user.id);
	$messageBox.find('.title').text(request.user.name);
	$messageBox.find('.message').text(request.message);

	if (user === request.user.name) {
		$messageBox.addClass('owner');
		$messageBox.find('.icon').addClass('red');
		$messageBox.find('.change-admin').remove()
	} else {
		Materialize.toast(`${request.user.name} : ${request.message}`, 3000);
		if (!admin) $messageBox.find('.change-admin').addClass('hide');
	}
	if (request.user.expired) $('#messages .change-admin').remove();
	if (request.user.admin) $messageBox.find('.icon').addClass('blue');
});
socket.on('speed', (speed) => {
	$('#speed').val(speed);
})
socket.on('degree', (degree) => {
	$('#degree').val(degree);
})
socket.on('capture', (capture) => {
	var data = new Uint8Array(capture),
	    image = new Image();
	    canvas = $('#capture')[0];

	image.src = URL.createObjectURL(new Blob([data], {type: 'image/jpg'}));
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
$('.change-admin').on('click', function() {
	admin = false;
	$('#header nav').removeClass('indigo');
	$('#speed').prop('disabled', true);
	$('#degree').prop('disabled', true);
	$('.change-admin').addClass('hide');
	Materialize.toast('You are normal user', 3000);
	socket.emit('admin', $(this).data('socketid'));
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
