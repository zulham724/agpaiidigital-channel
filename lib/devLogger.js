function devLogger(...args){
    if(process.env.APP_DEV=='true'){
        console.log(...args)
    }
}
module.exports = devLogger