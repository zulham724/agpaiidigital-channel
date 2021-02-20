module.exports = ({postData,jwt}) => {
    const { default: axios } = require('axios');
    const baseUrl = process.env.APP_DEV=='true'? process.env.URL_API_LUMEN_DEV : process.env.URL_API_LUMEN;
    const postUrl = baseUrl+'/chat?token=' + jwt;
    // console.log('postUrl',postUrl);
    // const postUrl = "http://localhost:8001/chat?token=" + jwt;
    axios
        .post(postUrl, postData)
        .then((res) => {
            console.log("insert ke db:", res.data);
        })
        .catch((err) => {
            console.log("error send to db:", err);
        });
};
