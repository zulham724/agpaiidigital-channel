module.exports = ({conversation,jwt}) => {
    const { default: axios } = require('axios');
    const baseUrl = process.env.APP_DEV=='true'? process.env.URL_API_LARAVEL_DEV : process.env.URL_API_LARAVEL;
    const updateUrl = baseUrl+'/api/v1/conversation/'+conversation.id;
    const payload = {conversation:conversation};
    axios
        .put(updateUrl,payload,{
            headers: {
                'Authorization': `Bearer ${jwt}` 
              }
        })
        .then((res) => {
            console.log("update data conversaion_id:",conversation.id);
        })
        .catch((err) => {
            console.log("error update data:", err);
        });
};
