$(function(){
    $('#search').on('keyup', function(e) {
        if (e.keyCode === 13) {
            $('#results').html("");
            var parameters = { username: $(this).val() };
            $.get( '/userdata', parameters, function(data) {
                $('#results').html(data);
            });
        };
    });
});
