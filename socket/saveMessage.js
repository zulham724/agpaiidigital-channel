module.exports = ({postData,jwt}) => {
    const { default: axios } = require('axios');
    const postUrl = "http://localhost:8001/chat?token=" + jwt;
    axios
        .post(postUrl, postData)
        .then((res) => {
            console.log("insert ke db:", res.data);
        })
        .catch((err) => {
            console.log("error send to db:", err);
        });
};
