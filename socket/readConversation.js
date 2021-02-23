module.exports = ({conversation_id,jwt}, success) => {
    const { default: axios } = require('axios');
    const baseUrl = process.env.APP_DEV=='true'? process.env.URL_API_LUMEN_DEV : process.env.URL_API_LUMEN;
    const updateUrl = baseUrl+'/readconversation/'+conversation_id;
    // const payload = {conversation_id:conversation_id};
    axios
        .put(updateUrl,null,{
            headers: {
                'Authorization': `Bearer ${jwt}` 
              }
        })
        .then((res) => {
            // console.log("update data conversaion_id:",conversation_id);
            success(res.data);
        })
        .catch((err) => {
            console.log("error update data:", err.response?err.response.data:error);
        });
};
