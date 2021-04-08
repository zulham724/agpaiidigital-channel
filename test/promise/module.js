const { default: axios } = require("axios")

module.exports = (a)=>{
    return new Promise((resolve, reject)=>{
       axios.get("http://192.168.1.5:8001").then(res=>{
           resolve(res.data);
       }).catch(err=>{
           reject(er);
       })
    })
}