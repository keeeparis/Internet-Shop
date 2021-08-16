// const Swal = require('sweetalert2');
try {
    
    document.querySelector('#lite-shop-order').onsubmit = function(event) {
        event.preventDefault();
        // TODO: проверка на валидные данные
        let username = document.querySelector('#username').value.trim();
        let phone = document.querySelector('#phone').value.trim();
        let email = document.querySelector('#email').value.trim();
        let address = document.querySelector('#address').value.trim();

        if (!document.querySelector('#rule').checked) {
            // с правилами не согласен
            Swal.fire({
                title: 'Warninig',
                text: 'Read and accept the rules',
                icon: 'info',
                confirmButtonText: 'Ok'
            })
            return false;
        } 

        if (username=='' || phone=='' || email=='' || address=='') {
            // не заполнены поля
            Swal.fire({
                title: 'Warninig',
                text: 'Fill all fields',
                icon: 'info',
                confirmButtonText: 'Ok'
            })
            return false;
        }

        fetch('/finish-order', {
            method: 'POST',
            body: JSON.stringify({
                'username': username,
                'phone': phone,
                'email' : email,
                'address': address,
                'key': JSON.parse(localStorage.getItem('cart'))
            }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).then(res => {
            return res.text();
        }).then(body => {
            if (body == 1) {
                Swal.fire({
                    title: 'Success',
                    text: 'Success',
                    icon: 'info',
                    confirmButtonText: 'Ok'
                }).then( () => {
                    localStorage.setItem('cart', JSON.stringify({}));
                    window.location = '/'
                })
            } else {
                Swal.fire({
                    title: 'Problem with mail',
                    text: 'Error',
                    icon: 'error',
                    confirmButtonText: 'Ok'
                })
            }
        })
    };

} catch(e) {
    console.log(e.message)
}