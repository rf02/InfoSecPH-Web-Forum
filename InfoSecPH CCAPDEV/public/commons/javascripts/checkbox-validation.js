document.getElementById('postForm').addEventListener('submit', function(event) {
    const checkboxes = document.querySelectorAll('input[name="community"]');
    let isChecked = false;
    checkboxes.forEach(function(checkbox) {
        if (checkbox.checked) {
            isChecked = true;
        }
    });
    if (!isChecked) {
        document.getElementById('errorMessage').style.display = 'block';
        event.preventDefault();
    } else {
        document.getElementById('errorMessage').style.display = 'none';
    }
});