// @require ajaxHelper.js
var ajaxHelper = require("./ajaxHelper.js");

exports.login=function (userName,password,cb) {
    
    return ajaxHelper.post(
        '/user/loginRequest',
        {userName:userName,password:password}
    )
}
    
