// TODO: .onclick -> addEventListener('click')
try {
    document.querySelector('.close-nav').onclick = closeNav;
    document.querySelector('.show-nav').onclick = showNav;


    function showNav() {
        document.querySelector('.site-nav').style.left = '0';
    }

    function closeNav() {
        document.querySelector('.site-nav').style.left = '-300px';
    }

    function getCategoryList() {
        fetch('/get-category-list', {
            method: 'POST'
        }).then((res) => {
            return res.text();
        }).then((body) => {
            showCategoryList(JSON.parse(body));
        })
    }

    function showCategoryList(data) {
        let out = '<ul class="category-list"><li><a class="underlined" href="/">Main</a></li>';
        for (let i = 0; i < data.length; i++) {
            out += `<li><a class='underlined' href="/cat?id=${data[i]['id']}">${data[i]['category']}</a></li>`
        }
        out += '</ul>';
        document.querySelector('#category-list').innerHTML = out;

    }

    getCategoryList();

} catch(e) {
    console.log(e.message);
}