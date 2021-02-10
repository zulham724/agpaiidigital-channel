const fs = require('fs');

var jwt = require("jsonwebtoken");
var cert = fs.readFileSync('secret.key');  // get public key

var token = jwt.sign(
  { name: "test gan" },
  cert,
  { algorithm: 'RS256' }
);
console.log(token);
