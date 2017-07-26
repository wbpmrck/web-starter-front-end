
// (function (global) {

    // var headerEntry = global.headerEntry={};
    //
    // headerEntry.init=function (data) {
    //     console.log("下面是 header 模块接收到的数据")
    //     console.log(data);
    //
    //     $("#header-tip").text(data);
    // }
    
// })(window);

var logo = require("../logo/logo.js")
module.exports={
    init:function (data) {
        console.log("下面是 header 模块接收到的数据")
        console.log(data);
        
        $("#header-tip").text(data);
        logo.change("logo changed by header")
    }
}
    