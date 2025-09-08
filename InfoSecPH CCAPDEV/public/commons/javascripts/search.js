$(document).ready(function() {
    $('#searchit').click(function(e) {
        e.preventDefault();
        const query = $('#searching').val();
        const url = '/search?query=' + encodeURIComponent(query);
        window.location.href = url;

    });
});