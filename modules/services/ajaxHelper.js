
var config = require("../../config/configs.js");

exports.doAjax = function (method,url,data,cb,timeout, async) {
    if(async == undefined) async = true;
    var option = {
        dataType:'json',
        url: `${config.domain}/${url}`,
        data:data,
        contentType:"application/x-www-form-urlencoded; charset=UTF-8",
        type:method,
        timeout:timeout||15000,
        cache:false,
        async: async,
        success: function(resp, textStatus){
            cb&&cb(resp,null)
        },
        error:function (XMLHttpRequest, textStatus, errorThrown) {
            cb&&cb(null,textStatus||errorThrown)
        }
    };
    $.ajax(option);
}