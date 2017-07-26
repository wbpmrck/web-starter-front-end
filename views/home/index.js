
var headerEntry = require("../../components/header/header.js");//使用子模块的方法
// var Vue = require("../../libs/vue/vue.js");
var Vue = require("vue");
exports.init=function (data) {
    
    var app = new Vue({
            el: '#home',
            data: {
                users:data
            }
        });
    // data.forEach((d)=>{
    //     d.birth = formatDate(d.birth,"yyyy-MM-dd");
    // })
    
    console.log("下面是 home 模块接收到的服务端传入的数据");
    console.log(JSON.stringify(data));
    headerEntry.init("这是首页");
    
}