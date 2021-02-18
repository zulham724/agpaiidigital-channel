const { default: axios } = require("axios");

axios.get('http://localhost:8001').then(res=>{
    console.log(res.data);
}).catch(err=>{
    console.log(err)
})