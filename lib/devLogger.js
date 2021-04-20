fs = require('fs');

function devLogger(...args) {
    if (process.env.APP_DEV == 'true') {
        console.log(...args);
        fs.appendFile('log.txt',  JSON.stringify(args)+"\r\n", function (err, data) {
            // if (err) {
            //     return console.log(err);
            // }
            // console.log(data);
        });
    }
}
module.exports = devLogger