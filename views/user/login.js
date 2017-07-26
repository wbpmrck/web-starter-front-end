//
// (function (global) {
//
//     var loginEntry = global.loginEntry={};
//
//     var headerEntry = global.headerEntry;//使用子模块的方法
//     var userService = global.userService;//使用userService的方法
//     var formatDate = global.formatDate;//使用 formatDate 的方法
//
//
//     /**
//      * 私有方法，绑定事件
//      * @private
//      */
//     function _bindEvent() {
//         $("#submit").click(function () {
//            var name = $("#user-name").val();
//            var pswd = $("#password").val();
//
//             userService.login(name,pswd,function (resp, err) {
//                 if(resp){
//                     alert("登录成功");
//                 }else{
//                     alert(`出现错误:${err.stack||err}`);
//                 }
//             })
//
//         });
//     }
//
//     loginEntry.init=function (data) {
//
//         data.forEach((d)=>{
//             d.birth = formatDate(d.birth,"yyyy-MM-dd");
//         })
//
//         console.log("下面是login模块接收到的服务端传入的数据");
//         console.log(JSON.stringify(data));
//
//         console.log("准备初始化header");
//         headerEntry.init("演示头部内容");
//
//         _bindEvent();
//     }
//
// })(window);

var loginEntry = global.loginEntry={};

var headerEntry = require("../../components/header/header.js");//使用子模块的方法
var userService = require("../../modules/services/userService.js");//使用userService的方法
// var formatDate = require("../../libs/dateFormat.js").formatDate;//使用 formatDate 的方法


var $ = require("../../libs/zepto/zepto.min.js");
/**
 * 私有方法，绑定事件
 * @private
 */
function _bindEvent() {
    $("#submit").click(function () {
        var name = $("#user-name").val();
        var pswd = $("#password").val();
        
        userService.login(name,pswd,function (resp, err) {
            if(resp){
                alert("登录成功");
            }else{
                alert(`出现错误:${err.stack||err}`);
                require.async("../../libs/someBigModule.js",function (module) {
                    module.work();
                });
            }
        })
        
    });
}

exports.init=function (data) {
    
    // data.forEach((d)=>{
    //     d.birth = formatDate(d.birth,"yyyy-MM-dd");
    // })
    
    console.log("下面是login模块接收到的服务端传入的数据");
    console.log(JSON.stringify(data));
    
    console.log("准备初始化header");
    headerEntry.init("这是登录页面");
    
    _bindEvent();
}