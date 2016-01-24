/**
 * Socket.io file submission
 */

(function() {
    'use strict';

    // socket.io setup
    var form = $('form');
    var result = $('#result');
    var socket = io.connect('/');

    socket.on('connected', function() {
        console.log('connected');
    });

    socket.on('imageSaved', function(data) {
        result.empty();
        result.append('<img src="'+data.url+'">');
    });

    socket.on('haiku', function(data) {
        printHaiku(data.message);
        console.log('woot');
    });

    function printHaiku(arr) {
        var newstr = "";
        for(var i = 0; i < arr.length; i++){
            newstr = newstr + arr[i] + '\n';
        }
        var string = document.getElementById('haiku');
        string.innerHTML = newstr;
    }

    // socket.on('testConnect', function(data) {
    //     console.log('test connect:', data);
    // });

    // submission

    form.submit(function(e) {
        e.preventDefault();

        var file = form.find('input[type="file"]')[0].files[0];
        var reader = new FileReader();


        reader.addEventListener('load', function(e) {
            socket.emit('imageUpload', {
                imageData: e.target.result
            });

        });

        reader.readAsDataURL(file);

    });
})();
