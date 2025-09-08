const bookmarkBtn = document.getElementById('bookmark');
const upBtn = document.getElementById('upvote');
const downBtn = document.getElementById('downvote');
const searchBtn = document.getElementById('searchit');

bookmarkBtn.addEventListener('click', () => {
    const form = document.getElementById('bookmarkForm');
    form.method = 'POST';
    form.submit();
});

upBtn.addEventListener('click', () => {
    const form = document.getElementById('upForm');
    form.method = 'POST';
    form.submit();
});

downBtn.addEventListener('click', () => {
    const form = document.getElementById('downForm');
    form.method = 'POST';
    form.submit();
});

searchBtn.addEventListener('click', () => {
    const form = document.getElementById('downForm');
   
});

