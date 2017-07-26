// @require ajaxHelper.js
var ajaxHelper = require("./ajaxHelper.js");

exports.login=function (userName,password,cb) {
    
    ajaxHelper.doAjax(
        'POST',
        `user/loginRequest`,
        {userName,password},
        cb
    )
}
    
