const { json } = require('express'),
    express = require('express'),
    nodemailer = require('nodemailer'),
    cookie = require('cookie'),
    cookieParser = require('cookie-parser'),
    admin = require('./admin'),
    mysql = require('mysql'),
    Mail = require('nodemailer/lib/mailer');

const app = express();
app.use(express.static('../client/dist'));
app.set('view engine', 'pug');
app.use(express.json());
app.use(express.urlencoded({extended: true})); // {extended: true}
app.use(cookieParser());

const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'market'
});

app.listen(3000, () => {
    console.log('node express work on 3000');
});

app.use((req, res, next) => {
    // лучше сделать проверку по массиву и в массив добавлять все адреса
    // для которых должен запуститься middleware
    if (req.originalUrl == '/admin' || req.originalUrl == '/admin-order') {
        admin(req, res, conn, next);
    } else {
        next();
    }
})

/* GET method */
app.get('/', (req, res) => {
    let cat = new Promise((res, rej) => {
        conn.query(
            `select id, slug, name, cost, image, category from (select id, slug, name, cost, image, category, if(if(@curr_category != category, @curr_category := category, '') != '', @k := 0, @k := @k + 1) as ind from goods, (select @curr_category := '') v) goods where ind < 4`,
            (err, data, fields) => {
                if (err) return rej(err);
                res(data);
            }
        );
    });
    let catDescription = new Promise((res, rej) => {
        conn.query(
            `select * from category`,
            (err, data, fields) => {
                if (err) return rej(err);
                res(data);
            }
        );
    });
    Promise.all([cat, catDescription]).then(value => {
        res.render('index', {
            goods: JSON.parse(JSON.stringify(value[0])),
            cat: JSON.parse(JSON.stringify(value[1]))
        })
    });
});

app.get('/cat', (req, res) => {
    let catId = req.query.id;

    let cat = new Promise((res, rej) => {
        conn.query(
            `select * from category where id = ${catId};`,
            (err, data) => {
                if (err) rej(err);
                res(data);
            }
        );
    });
    let goods = new Promise((res, rej) => {
        conn.query(
            `select * from goods where category = ${catId};`,
            (err, data) => {
                if (err) rej(err);
                res(data);
            }
        );
    });
    Promise.all([cat, goods]).then(value => {
        res.render('cat', {
            cat: JSON.parse(JSON.stringify(value[0])),
            goods: JSON.parse(JSON.stringify(value[1])),
        });
    });
});

app.get('/goods/*', (req, res) => {
    conn.query(`select * from goods where slug="${req.params['0']}"`, (err, result, fields) => {
        if (err) throw err;
        result = JSON.parse(JSON.stringify(result));
        // TODO: проверка на пустой массив -> если основная картинка одна и других нет
        conn.query(`select * from images where goods_id=${result[0]['id']}`, (err, goodsImages, fields) => {
            if (err) throw err;
            goodsImages = JSON.parse(JSON.stringify(goodsImages));
            res.render('goods', { goods: result, goods_images: goodsImages});
        });
    });
});

app.get('/order', (req, res) => {
    res.render('order');
});

/* POST method */
app.post('/get-category-list', (req, res) => {
    conn.query('select id, category from category', (err, result, fields) => {
        if (err) throw err;
        res.json(result)
    });
});

app.post('/get-goods-info', (req, res) => {
    if (req.body.key.length != 0) {
        conn.query(`select id, slug, name, cost from goods where id in (${req.body.key.join(',')})`, (err, result, fields) => {
            if (err) throw err;
            let goods = {};
            for (let i=0; i<result.length; i++) {
                goods[result[i]['id']] = result[i];
            }
            res.json(goods)
        });
    } else {
        res.send('0')
    }
});

app.post('/finish-order', (req, res) => {
    if (req.body.key.length != 0) {
        let key = Object.keys(req.body.key);
        conn.query(
            `select id, name, cost from goods where id in (${key.join(',')})`, 
            (err, result, fields) => {
                if (err) throw err;
                sendMail(req.body, result).catch(console.error);
                saveOrder(req.body, result);
                res.send('1');
            }
        );
    } else {
        res.send('0')
    }
});

/* admin panel */
app.get('/admin', (req, res) => {
    res.render('admin', {});
});

app.get('/admin-order', (req, res) => {
    conn.query(`SELECT 
	shop_order.id as id,
	shop_order.user_id as user_id,
    shop_order.goods_id as goods_id,
    shop_order.goods_cost as goods_cost,
    shop_order.goods_amount as goods_amount,
    shop_order.total as total,
    from_unixtime(date, "%Y-%m-%d %H:%i:%s") as human_date,
    user_info.user_name as user,
    user_info.user_phone as phone,
    user_info.address as address
        FROM 
	        shop_order
        LEFT JOIN 
	        user_info
        ON shop_order.user_id = user_info.id
            order by id desc`, 
        (err, result, fields) => {
            if (err) throw err;
            res.render('admin-order', { order: JSON.parse(JSON.stringify(result)) });
    });
    
});

/* login form */
app.get('/login', (req, res) => {
    res.render('login', {});
});

app.post('/login', (req, res) => {
    conn.query(
        `select * from admin where login = "${req.body.login}" and password = "${req.body.password}";`,
        (err, result) => {
            if (err) throw (err);
            if (result.length == 0) {
                console.log('error. user not found');
                res.redirect('login');
            } else {
                result = JSON.parse(JSON.stringify(result));
                let hash = makeHash(32);
                res.cookie('hash', hash);
                res.cookie('id', result[0]['id']);
                /* write hash to db */
                // console.log(result);
                sql = `update admin set hash="${hash}" where id = ${result[0]['id']}`;
                conn.query(sql, (err, resultQuery) => {
                    if (err) throw err;
                    res.redirect('admin');
                })
            }
        } 
    );
});

/* functions part */
async function sendMail(data, result) {
    let res = '<h2>Order in lite shop</h2>';
    let total = 0;
    for (i=0; i<result.length; i++) {
        res += `<p>${result[i]['name']} - ${data.key[result[i]['id']]} - ${result[i]['cost']*data.key[result[i]['id']]} uah</p>`
        total += result[i]['cost'] * data.key[result[i]['id']];
    }
    console.log(res);
    res += '<hr>';
    res += `Total ${total} uah`;
    res += `<hr>Phone: ${data.phone}`;
    res += `<hr>Username: ${data.username}`;
    res += `<hr>Address: ${data.address}`;
    res += `<hr>Email: ${data.email}`;  

    let account = await nodemailer.createTestAccount();

    let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: account.user, // generated ethereal user
          pass: account.pass, // generated ethereal password
        },
    });

    let mailOptions = {
        from: '<anallica1205@gmail.com>',
        to: 'anallica1205@gmail.com, '+data.email,
        subject: 'Lite shop order',
        text: 'Hello world',
        html: res
    };

    let info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    console.log("Preview sent: %s", nodemailer.getTestMessageUrl(info));
    return true;
}

function saveOrder(data, result) {
    // data - инфорамация о пользователе
    // result - сведения о товаре
    let sql = 'insert into user_info (user_name, user_phone, user_email, address) values ("'+data.username+'","'+data.phone+'","'+data.email+'","'+data.address+'")';
    conn.query(sql, (err, resultQuery) => {
        if (err) throw err;
        console.log('1 user info saved');
        let userId = resultQuery.insertId;
        let date = new Date()/1000;
        for (let i=0; i<result.length; i++) {
            sql = 'insert into shop_order (date, user_id, goods_Id, goods_cost, goods_amount, total) values ('+ 
            date +','+ 
            userId +','+
            result[i]["id"] +','+ 
            result[i]["cost"] +','+ 
            data.key[result[i]['id']] +','+ 
            result[i]["cost"] * data.key[result[i]['id']] +
            ')';

            conn.query(sql, (err, resultQuery) => {
                if (err) throw err;
                console.log('1 good saved');
            })
        };

    });
}

function makeHash(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}