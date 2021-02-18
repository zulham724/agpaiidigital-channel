module.exports = ({conversation,jwt}) => {
    const { default: axios } = require('axios');
    const updateUrl = "http://localhost:8000/api/v1/conversation/" + conversation.id;
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
