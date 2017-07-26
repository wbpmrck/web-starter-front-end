/**@alia OneLib.ScriptLoader
 * @require OneLib.EventEmitter.js
 * @Created by kaicui(https://github.com/wbpmrck).
 * @Date:2013-08-17 21:19
 * @Desc: 用于异步加载js文件
 * 依赖：OneLib.EventEmitter
 * @Change History:
 * --------------------
 *
 *
 * kaicui 2015-09-15 10:05  增加功能

 *  重构：
 *      a)重构事件触发器部分，使用最新的eventEmitter(支持once等API)
 *      b)把loadTask,Queue的事件触发机制进行修改
 *
 *
 *
 * kaicui 2015-09-14 15:41  增加功能
 *
 *  本地增加模块状态管理：未下载，下载中，已下载
    任何队列添加下载任务时，都从全局状态中获取，如果脚本已经下载完毕，则初始化一条已下载完的任务
    如果该任务正在下载中，则这个队列要订阅该任务的下载状况回调信息
    同样的任务，在整个模块下载器中，不会同时有2个任务在下载

 *
 --------------------------------------------
 @created：|kaicui| 2013-08-17 21:19.
 --------------------------------------------
 */

var global = global||window;
var OneLib = (function (my) {return my;} (global['OneLib'] ||(global['OneLib']={})));

OneLib.ScriptLoader = (function (my) {
    var _allQueue={},
        _taskPool={};//缓存曾经下载过的脚本

    function LoadTask(url,charset){
        var self = this;//save the this ref

        //self.callbacks={
        //    onload:[],
        //    onerror:[]
        //}

        self.charset = charset||"utf-8";
        self.status = 0; //0 未开始  1下载中 2 下载成功  3 下载失败
        self.url = url;
        self.head = undefined;
        self.script = undefined;
        self.beginAt = self.endAt = undefined;
        //self.notifyDownTimes = 0;//调试用，保存被成功反复下载过的次数
    }

    /**
     * 清理任务需要的中间DOM元素(但不改变下载状态)
     */
    LoadTask.prototype.clear = function(){
        var self = this;//save the this ref
        self.script && (self.script.onload=self.script.onreadystatechange=self.script.onerror=null);
        self.head && self.head.removeChild(self.script);
        self.script=self.head=null;
    }
    /**
     * 开始下载脚本
     */
    LoadTask.prototype.start = function(){

        console.log("LoadTask :"+this.url +" start");
        var self = this;//save the this ref
        //如果正在下载，退出
        if(self.status ===1){
            console.log("LoadTask :"+this.url +" downloading,return for avoid dump download");
            return;
        }
        //如果已经下载完成，则直接触发onload/onerror,否则不做任何事情
        if(self.status>=2){
            console.log("LoadTask :"+this.url +" 已经下载完成，则直接触发onload/onerror");
            self.status===2?self.notifyLoaded():self.notifyError();
            return;
        }

        self.status = 1; //标记为进行中

        self.head = document.getElementsByTagName('head')[0];
        self.script = document.createElement('script');
        self.script.type ='text/javascript';
        if (self.script.readyState) {//IE
            self.script.onreadystatechange =function(){
                if (self.script.readyState=='loaded'||self.script.readyState=='complete') {
//                    self.script.onreadystatechange == null;
                    self.clear();
                    self.notifyLoaded();
                };
            }
        }
        else{
            self.script.onload = function(){
                self.clear();
                self.notifyLoaded();
            };
        }
        //append a script tag into the html document's body tag.and download the script
        self.script.src=self.url;

        self.beginAt = new Date();
        self.head.appendChild(self.script);

    }
    ///**
    // * 外部订阅加载成功事件
    // * @param callback
    // * @returns {LoadTask}
    // */
    //LoadTask.prototype.onload = function(callback){
    //    callback&&this.callbacks.onload.push(callback);
    //    return this;
    //};
    /**
     * 触发向外通知加载成功(并修改状态)
     * 外部通知完一次之后，事件监听就被移除了
     * @returns {LoadTask}
     */
    LoadTask.prototype.notifyLoaded = function(){
        console.log("LoadTask :"+this.url +" notifyLoaded begin:");
        var self = this;//save the this ref

        self.status =2;
        self.endAt = new Date();

        self.emit("load",self.url, self.beginAt,self.endAt);

        //for(var i=self.callbacks.onload.length-1;i>=0;i--){
        //    console.log("LoadTask :"+this.url +" notifyLoaded :"+i);
        //    var cb = self.callbacks.onload.splice(i,1)[0];
        //    cb&& cb(self.url, self.beginAt,self.endAt)
        //}
        return this;
    };
    /**
     * 触发向外通知加载失败(并修改状态)
     * @returns {LoadTask}
     */
    LoadTask.prototype.notifyError = function(err){
        console.log("LoadTask :"+this.url +" notifyError begin:");
        var self = this;//save the this ref
        self.status =3;
        self.endAt = new Date();

        self.emit("error",self.url, self.beginAt,self.endAt);
        //for(var i=self.callbacks.onerror.length-1;i>=0;i--){
        //    console.log("LoadTask :"+this.url +" notifyError :"+i);
        //    var cb = self.callbacks.onerror.splice(i,1)[0];
        //    cb&& cb(self.url, self.beginAt,self.endAt)
        //}
        return this;
    };
    ///**
    // * 外部订阅加载失败事件
    // * @param callback
    // * @returns {LoadTask}
    // */
    //LoadTask.prototype.onerror = function(callback){
    //    callback&&this.callbacks.onerror.push(callback);
    //    return this;
    //};

    OneLib.EventEmitter.mixin(LoadTask);

    //准备好一个下载任务（利用全局缓存池）
    var _prepareTask = function(url,charset){
        var self = this;//save the this ref
        var task = _taskPool[url];
        //首先看缓存里是否有
        if(!task){
            console.log("_prepareTask :"+url +" not exist,create new");
            task=_taskPool[url] = new LoadTask(url,charset);
        }else{
            console.log("_prepareTask :"+url +" exist,return  cache");
        }
        return task;
    }

    /**
     * 不分先后顺序的下载并执行外部js
     *
     * @param url
     * @param callback:参数里会有当时下载的url带出（url,beginAt,endAt）
     */
    my.loadScript = function(url,callback,charset){
        var task =_prepareTask(url,charset);
        task.once("load",callback)
        task.once("error",callback)
        task.start();//调task的下载
        return task;
    };



    /**
     * 类：脚本队列。（一个队列内部的脚本按照声明的顺序挨个下载，完成一个下载另外一个。可以动态在后面追加）
     * @param fileUrls:可以直接传入一个队列文件列表
     * @constructor
     */
    function ScriptQueue(name,fileUrls){
        var self = this;//save the this ref

        self.name = name;
        self.downTasks = []; //所有待下载的文件列表 每个项目:{url:'http://xxx/js',state:0/1,desc:'下载出错',beginAt:Date,endAt:Date}
        var urlArray = fileUrls||[];
        self.load(urlArray);

        self.running = false;//当前是否在正在运行下载任务(异步模式下，只要所有文件都开始下载了，running就恢复false.而不是全部下载成功才为false)

        self.runAt = -1;//当前下载到的节点下标
        //self.loaded =0; //已经成下载的文件个数

        //self.callbacks={
        //    onOne:[],
        //    onFinish:[]
        //};
    };

    /**
     * 队列任务是否下载结束
     * @returns {boolean}
     */
    ScriptQueue.prototype.isAllLoaded = function(){
        var self = this;//save the this ref

        for(var i=0,j=self.downTasks.length;i<j;i++){
            var task = self.downTasks[i];
            if(task.status<2){//只要有任务<2,表示没有全部下载完
                return false;
            }
        }
        return true;
    }
    /**
     * 添加一个项目到当前待下载队列尾部
     * @param url:可以是一个string,或者是一个array
     */
    ScriptQueue.prototype.load = function(url){
        var self = this;//save the this ref

        if(url.constructor === Array){
            for(var i=0,j=url.length;i<j;i++){
                var _item = url[i];
                self.downTasks.push(_prepareTask(_item));
            }
        }
        else{
            self.downTasks.push(_prepareTask(url));
        }
        return self;
    };
    ///**
    // * 注册加载完成事件，队列里每一个脚本加载完，都会回调
    // * 回调参数:cb(url,beginAt,endAt)
    // * 注意：要保证回调函数不出异常，否则其他的下载动作将不会执行。因为现在回调是同步调用的
    // * @param callback
    // */
    //ScriptQueue.prototype.onLoadedOne = function(callback){
    //    callback&&this.callbacks.onOne.push(callback);
    //    return this;
    //};

    ///**
    // * 注册全部完成事件，该队列已经加载到队尾的时候触发。
    // * 如果多次追加项目到队列，并调用队列的start,会在每次全部完成后触发该事件。
    // * 回调参数:cb(beginAt,endAt)
    // * @param callback
    // */
    //ScriptQueue.prototype.onFinish = function(callback){
    //    callback&&this.callbacks.onFinish.push(callback);
    //    return this;
    //};

    //ScriptQueue.prototype.clearCallbacks = function(){
    //    var self = this;//save the this ref
    //    self.callbacks.onOne=[];
    //    self.callbacks.onFinish=[];
    //    return self;
    //};

    /**
     * 开始队列的异步下载行为(如果已经在下载，则不处理)
     */
    ScriptQueue.prototype.asyncStart = function(){
        var self = this;//save the this ref

        //如果正在下载，则什么都不做
        if(self.running){
            return;
        }
//        var _oldStart =-1;
        //如果有需要下载的文件，才触发下载循环
        if(self.runAt<self.downTasks.length-1){
//            _oldStart = self.runAt;
            _asyncDownloadOne();
        }else{
            self.emit("finish");
        }

        function _asyncDownloadOne(){
            //看是否有要下载的文件
            if(self.runAt<self.downTasks.length-1){
                //开始下载下一个文件
                self.running = true;
                self.runAt+=1;

                var _nowFile = self.downTasks[self.runAt];
                _nowFile.once("load",function(url,begin,end){
                    //self.loaded++;

                    //每个下载完成之后，触发对应的事件
                    self.emit("load",url,begin,end);

                    //for(var m=0,n=self.callbacks.onOne.length;m<n;m++){
                    //    var _item = self.callbacks.onOne[m];
                    //    _item(url,begin,end);
                    //}

                    //如果已经下载成功的个数等于所有文件个数
                    //if(self.loaded===self.downTasks.length){
                    if(self.isAllLoaded()){
                        //console.log("finish "+self.name);
                        //发射 finish 事件
                        self.emit("finish");

                        //for(var m2=0,n2=self.callbacks.onFinish.length;m2<n2;m2++){
                        //    var _item2 = self.callbacks.onFinish[m2];
                        //    _item2(self.downTasks[self.runAt].beginAt,self.downTasks[self.runAt].endAt);
                        //}
                    }
                });
                _nowFile.start();
                _asyncDownloadOne(); //继续触发下一次调用
            }
            //队列全部下载完，触发finish
            else{
                self.running = false;//异步模式下，只要所有文件都开始下载了，running就恢复false.而不是全部下载成功才为false
            }
        }

    };

    /**
     * 开始队列的同步下载行为(如果已经在下载，则不处理)
     */
    ScriptQueue.prototype.start = function(){
        var self = this;//save the this ref

        //如果正在下载，则什么都不做
        if(self.running){
            return;
        }
//        var _oldStart =-1;
        //如果有需要下载的文件，才触发下载循环
        if(self.runAt<self.downTasks.length-1){
//            _oldStart = self.runAt;
            _downloadOne();
        }else{
            self.emit("finish");
        }

        function _downloadOne(){
            //看是否有要下载的文件
            if(self.runAt<self.downTasks.length-1){
                //开始下载下一个文件
                self.running = true;
                self.runAt+=1;

                var _nowFile = self.downTasks[self.runAt];
                _nowFile.once("load",function(url,begin,end){
                    //_nowFile.beginAt = begin;
                    //_nowFile.endAt = end;

                    //self.loaded++;

                    //每个下载完成之后，触发对应的事件
                    self.emit("load",url,begin,end);

                    //for(var m=0,n=self.callbacks.onOne.length;m<n;m++){
                    //    var _item = self.callbacks.onOne[m];
                    //    _item(url,begin,end);
                    //}
                    _downloadOne();
                });
                _nowFile.start();

            }
            //队列全部下载完，触发finish
            else{
                self.running = false;

                //console.log("finish "+self.name);
                //发射 finish 事件
                self.emit("finish");

//                for(var m=0,n=self.callbacks.onFinish.length;m<n;m++){
//                    var _item = self.callbacks.onFinish[m];
////                    _item(self.downTasks[_oldStart+1].beginAt,self.downTasks[_oldStart+1].endAt);
//                    _item(self.downTasks[self.runAt].beginAt,self.downTasks[self.runAt].endAt);
//                }

            }
        }

    };


    OneLib.EventEmitter.mixin(ScriptQueue);
    /**
     * create a queue
     * @param queueName：指定队列名，如果不指定，则该队列不会缓存，以后无法通过loader再获取到这个队列
     * @param initFiles:初始化要下载的脚本
     */
    my.beginQueue = function(queueName,initFiles){
        if(_allQueue.hasOwnProperty(queueName)){
            throw new Error("queue name:"+ queueName +" is exist!");
        }
        var q = new ScriptQueue(queueName,initFiles);
        if(queueName != undefined){
            _allQueue[queueName] = q;
        }
        return q;
    };
    /**
     * find a exist queue
     * @param queueName
     */
    my.theQueue = function(queueName){
        return _allQueue[queueName];
    };

    my.getAllQueue = function(){
        return _allQueue;
    };

    /**
     * 调试用方法，获取任务池
     * @returns {{}}
     * @private
     */
    my._getTaskPool = function(){
        return _taskPool;
    }

    return my;
} (OneLib.ScriptLoader || {}));
