module.exports = (req, res, conn, next) => {
  if (req.cookies.hash == undefined || req.cookies.id == undefined) {
      res.redirect('login');
      return false
  }
  conn.query(
      `select * from admin where id = ${req.cookies.id} and hash = "${req.cookies.hash}";`,
      (err, result) => {
          if (err) throw (err);
          // console.log(result)
          if (result.length == 0) {
              console.log('error. user not found');
              res.redirect('login');
          } else {
              next();
          }
      }
  );
}