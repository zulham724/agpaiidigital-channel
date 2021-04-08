module.exports = ({ postData, jwt }) => {
    // const postUrl = "http://localhost:8001/chat?token=" + jwt;
    return new Promise((resolve, reject) => {
        const { default: axios } = require('axios');
        const baseUrl = process.env.APP_DEV == 'true' ? process.env.URL_API_LUMEN_DEV : process.env.URL_API_LUMEN;
        const postUrl = baseUrl + '/chat?token=' + jwt;
        // console.log('postUrl',postUrl);
        axios
            .post(postUrl, postData)
            .then((res) => {
                console.log("[saveMessage] chat_id:", res.data);
                resolve(res.data);
            })
            .catch((err) => {
                console.log("error send to db:", err);
                reject(err);
            });
    });

};
