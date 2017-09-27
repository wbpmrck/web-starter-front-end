
var config = require("../../config/configs.js");
var axios = require("axios");
var qs = require("qs");

exports.get = function (url,data) {
    return new Promise(function (resolve, reject) {
        axios.get(config.dynamicDomain+url, {
            params: data
        }).then(function (response) {
            resolve(response.data);
        }).catch(function (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
            } else if (error.request) {
                // The request was made but no response was received
                // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                // http.ClientRequest in node.js
                console.log(error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.log('Error', error.message);
            }
            console.log(error.config);
            reject(error);
        });
    });
};
exports.post = function (url,data) {
  
    return new Promise(function (resolve, reject) {
        axios.post(config.dynamicDomain+url,  qs.stringify(data)).then(function (response) {
            resolve(response.data);
        }).catch(function (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
            } else if (error.request) {
                // The request was made but no response was received
                // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                // http.ClientRequest in node.js
                console.log(error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.log('Error', error.message);
            }
            console.log(error.config);
            reject(error);
        });
    });
    // return axios.post(config.staticDomain+url, qs.stringify(data));
}
