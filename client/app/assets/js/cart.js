let cart = {};
document.querySelectorAll('.add-to-cart').forEach((el) => {
    el.onclick = addToCart;
});

if (localStorage.getItem('cart')) {
    cart = JSON.parse(localStorage.getItem('cart'));
    ajaxGetGoodsInfo();
}

function addToCart() {
    let goodsId = this.dataset.goods_id;
    if (cart[goodsId]) {
        cart[goodsId]++;
    } else {
        cart[goodsId] = 1;
    }
    ajaxGetGoodsInfo();
}

function ajaxGetGoodsInfo() {
    updateLocalStorageCart();
    fetch('/get-goods-info', {
        method: 'POST',
        body: JSON.stringify({
            key: Object.keys(cart)
        }),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).then(res => {
        return res.text();
    }).then(body => {
        showCart(JSON.parse(body));
    });
}

function showCart(data) {
    let out = '<table class="table" table-striped table-cart"><tbody>';
    let total = 0;
    for (let key in cart) {
        out += `<tr><td colspan=4><a href="/goods/${data[key]['slug']}">${data[key]['name']}</a></td></tr>`;
        out += `<tr><td class='vertical-text-align-td'><div class="cart-minus" data-goods_id = ${key}></button></td>`;
        out += `<td>${cart[key]}</td>`;
        out += `<td class='vertical-text-align-td'><div class="cart-plus" data-goods_id = ${key}></button></td>`;
        out += `<td>${formatPrice(data[key]['cost']*cart[key])} uah </td>`;
        out += `</tr>`;
        total += cart[key]*data[key]['cost'];
    }
    out += `<tr><td colspan=3>Total: </td><td>${formatPrice(total)} uah</td></tr>`
    out += '</tbody></table>';
    try {
        document.querySelector('#cart-nav').innerHTML = out;
    
        document.querySelectorAll('.cart-minus').forEach(el => {
            el.onclick = cartMinus;
        })
        document.querySelectorAll('.cart-plus').forEach(el => {
            el.onclick = cartPlus;
        })

    } catch(e) {
        console.log(e.message);
    }
    
    try {
        // update buttonOrder state
        updateButtonOrderState();
    } catch(e) {
        console.log(e.message);
    }
    
}

function cartPlus() {
    let goodsId = this.dataset.goods_id;
    cart[goodsId]++;
    ajaxGetGoodsInfo();
}

function cartMinus() {
    let goodsId = this.dataset.goods_id;
    if (cart[goodsId] - 1 > 0) {
        cart[goodsId]--;
    } else {
        delete(cart[goodsId]);
    }
    ajaxGetGoodsInfo();
}

function updateLocalStorageCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function formatPrice(price) {
    return price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&   ');
}

function updateButtonOrderState() {
    let buttonOrder = document.querySelector('.button-order');
    if (Object.keys(cart).length == 0) {
        if (!buttonOrder.hasAttribute('disabled')) { 
            buttonOrder.setAttribute("disabled", "")
            buttonOrder.classList.add('disabled')
        }
    } else {
        if (buttonOrder.hasAttribute('disabled')) { 
            buttonOrder.removeAttribute("disabled")
            buttonOrder.classList.remove('disabled') 
        }
    }
}