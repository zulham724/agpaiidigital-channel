const fs = require('fs');
var jwt = require("jsonwebtoken");

var data= {
  sub:1
}
var cert = fs.readFileSync('oauth-private.key');  // get public key
// console.log(cert);
var token = jwt.sign(data,cert, { algorithm: 'RS256' });
console.log(token)
