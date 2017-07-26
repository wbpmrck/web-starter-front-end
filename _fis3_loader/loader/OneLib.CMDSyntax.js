/*
 @require OneLib.Log.js
 @require OneLib.ScriptLoader.js

 作者： kaicui

 依赖： OneLib.Log,OneLib.ScriptLoader
 使用说明：
 1、与seajs的CMD规范完全兼容(注意：带 id 和 deps 参数的 define 用法不属于 CMD 规范，而属于 Modules/Transport 规范。)
 2、其他所有的模块依赖本模块，使用CMD的格式来书写
 3、对global暴露的接口，只有define关键字，还有OneLib入口命名空间

 todo:
 1、移除对alias别名功能的支持。
    关于alias功能，我觉得既然有了构建工具，其实没必要把别名功能强加载前端模块加载器里，理由如下：
        别名主要是为了方便书写、节省带宽。这些在开发和发布阶段完全可以通过构建工具来满足
        没有理由在线上环境中，让前端loader意识到，可以用2种方式来引用同一个module,这没有任何意义。

 -----------
 版本历史：
 *
 *
 by kaicui 2015-09-14
 1、添加对require.async的支持。该功能需要依赖scriptLoader

 场景：在下载脚本依赖的时候，a依赖b,c,d,对于b,c,d，创建3个队列，每个队列内部是串行下载的，但是，a需要知道a,b,c全部下载完，
 在这个时候，才可以执行a的初始化

 by kaicui 2015-09-14
 1、添加srcMap，可以提前初始化资源id,、uri,和依赖等信息
 注意：通过构建工具，把当前页面可能要用到的所有脚本信息，都初始化在srcMap里，可以有助于ModuleLoader去加载脚本
 格式：key:moduleId,value:{uri:组件加载地址,deps:组件同步"直接"依赖的其他组件(非递归)}

 注意：在构建工具进行分析的时候，会将所有“同步”或“异步”用到的组件，放在srcMap里，但是对于“依赖”的定义，是“同步”的。
 异步的require，本质上和一些语言的loadlibrary类似，属于动态加载，【对于这种情况，loader只需要知道东西在哪就行】

 srcMap:{
         "libs/jquery-1.8.1/jquery.min.js":{
             uri:"http://static.local.com/static/libs/jquery-1.8.1/jquery.min.js",
             deps:[] //无依赖的情况
         },
         "testWeb/debug-1.0/bar/bar.js":{
             uri:"http://static.local.com/static/c/testWeb/debug-1.0/bar/bar.js",
             deps:[
                 "libs/jquery-1.8.1/jquery.min.js",
                 "testWeb/debug-1.0/foo/foo.js" //多个依赖的情况
             ]
         },
         "testWeb/debug-1.0/foo/foo.js":{
             uri:"http://static.local.com/static/c/testWeb/debug-1.0/foo/foo.js",
             deps:[
                 "libs/jquery-1.8.1/jquery.min.js"
             ]
         }
 },

 2、优化define函数，支持不传入deps,这种情况下 loader通过srcMap查找依赖项


by kaicui 2013-8-17 13:48:31       版本创建
 //////////////////////////////////////////////////////////////////*/

var global = global||window;
var OneLib = (function (my) {return my;} (global['OneLib'] ||(global['OneLib']={})));

OneLib.CMDSyntax = (function (my,global) {
    if(!OneLib.hasOwnProperty('Log')){
        throw new Error('need OneLib.Log Module!');
    }
    if(!OneLib.hasOwnProperty('ScriptLoader')){
        throw new Error('need OneLib.ScriptLoader Module!');
    }
    /**
     * 去除数组里重复项的helper
     * @reverseOrder:遍历顺序，false为正序，true为逆序  默认正序：从0->length-1.
     * @param identifier(可选):filter函数，其用于决定item中的什么字段来决定item的唯一性
     * @private
     */
    function _removeArrayDump(arr,reverseOrder,/* optional */identifier){
        var _dic={},cut=false;
        if(!identifier){
            identifier = function(item){return item};
        }
        if(reverseOrder){
            for(var i=arr.length-1;i>=0;i--){
                var _item = arr[i],_key = identifier(_item);
                if(_dic[_key]){
                    cut = true;
                    arr.splice(i,1)
                }else{
                    cut=false;
                    _dic[_key] = true
                }
            }

        }else{
            for(var i= 0,j=arr.length;i<j;(cut&&j--) || i++){
                var _item = arr[i],_key = identifier(_item);
                if(_dic[_key]){
                    cut = true;
                    arr.splice(i,1)
                }else{
                    cut=false;
                    _dic[_key] = true
                }
            }
        }
    }
    var _toStr=Object.prototype.toString;
   //var _copy=function(obj){
   //     var _dump;
   //     //判断原对象是否是函数
   //     if(typeof(obj)==='function'){
   //         _dump = function(){
   //             return obj.apply(this,arguments);
   //         };
   //     }
   //     else if(_toStr.call(obj)==='[object Array]'){
   //         _dump = obj.slice();
   //     }
   //     else{
   //         _dump ={};
   //     }
   //     for(var i in obj){
   //         _dump[i] = obj[i];
   //     }
   //     return _dump;
   // };
    var _queryString = function(item){
        var svalue = location.search.match(new RegExp("[\?\&]" + item + "=([^\&]*)(\&?)","i"));
        return svalue ? svalue[1] : svalue;
    };

    /**
     * 代表一个模块
     * @param name：模块名，也是模块的唯一标识
     * @param dependency:声明的依赖(2015-09-14：增加逻辑，如不声明依赖，则从srcMap里获取，否则报错)
     * @param factory:模块构建函数，define的第3(2)个阐述
     * @param exports:初始化的exports
     * @private
     */
    function _Module(name,dependency,factory,/*optional*/exports){
        var self = this;//save the this ref

        //处理定义模块方式是不显示声明依赖的情况
        if(typeof dependency ==='function'){
            //从srcMap里获取

            //var _deps;
            //if(_configs.srcMap[name]){
            //    _deps = _configs.srcMap[name].deps;
            //
            //    //如果读取成功，则更新参数()
                factory = dependency;
            //    dependency = _deps;
            //}else{
            //    throw new Error("module:["+name+'] should set into srcMap!')
            //}
        }

        self.id=self.name = name;

        //self.dependencies =_transAlias(dependency);
        //self.dependenciesDic = {};
        //for(var i=0,j=self.dependencies.length;i<j;i++){
        //    self.dependenciesDic[self.dependencies[i]]=undefined;
        //}

        self.factory = factory;

        self.exports =exports||{};

        self.init();
    }

    /**
     * 返回exports的一个副本
     * @param name
     */
    _Module.prototype.getExportsCopy = function(){
        //if(this.exports!==global){
        //    return _copy(this.exports);
        //}
        //else{
            return this.exports;
        //}
    };
    _Module.prototype.init = function(){
        var self = this;//save the this ref
        //给factory准备模块
        var _innerModule =  {
            id:self.id,
            name:self.name,
            //dependencies:self.dependencies.slice(),
            exports:{}
        };

        var _require = function (dependentName) {
            dependentName = _transAlias(dependentName);
            //如果在自己声明的依赖项中，则去获取
            //if(self.dependenciesDic.hasOwnProperty(dependentName)){
            //    var _getted = self.dependenciesDic[dependentName];
                var _getted;
            //    if(!_getted){
                    var m = _getRealModule(dependentName);
                    if(m){
                        //_getted = self.dependenciesDic[dependentName] = m.getExportsCopy();
                        _getted = m.getExportsCopy();
                        _log('>>require:: [' + dependentName + '] required by ['+self.name+']...');
                    }
                    else{
                        _log('>>require:: [' + dependentName + '] required by ['+self.name+'](failed,not exist)...');
                    }
                //}
                //else{
                //    _log('>>require:: [' + dependentName + '] required by ['+self.name+'](from cache)...');
                //}
                return _getted;
            //}
            //else{
            //    throw new Error('Required Module:['+dependentName+'] must be declared in dependencies array!');
            //}
        };
        //by kaicui 2015-09-14:添加对异步获取模块的支持
        /**
         *
         * 异步依赖一个或多个模块
         * @param asyncDependentName：异步依赖的模块名，或依赖的数组
         * @param cb:下载成功的回调
         */
        _require.async = function (asyncDependentName,cb) {

            (_toStr.call(asyncDependentName)!=="[object Array]")&&(asyncDependentName=[asyncDependentName]);

            //计算要异步获取的模块数(注意这里指直接依赖的模块数，一个模块数是一个队列，用于控制何时回调)
            var _totalCount =asyncDependentName.length,_loaded=0;

            _log("_require.async,total count:%s",_totalCount);

            //获取某个模块整个依赖链条(去除本地已有的,再去重)
            function _getModuleDepends(moduleName){
                var depends=[];//输出的依赖项，按照最远到最近的方式输出
                if(_hasModule(moduleName)){
                    return [];//如果本地有这个模块，直接返回
                }else{
                    //否则，查询srcMap,计算他的子依赖，加上自己返回
                    var _src =_configs.srcMap[moduleName];
                    if(_src){
                        for(var i=0,j=_src.deps.length;i<j;i++){
                            var d = _src.deps[i];
                            depends = depends.concat(_getModuleDepends(d));
                        }
                        //自己加进去、去重
                        depends.push(_src.uri);
                        _removeArrayDump(depends,true);
                        return depends;
                    }else{
                        throw new Error('module:['+moduleName+'] must config in srcMap!')
                    }
                }
            }


            //对于没有的m个模块，为每个模块开启1个queue：
            //1):分析每个模块的依赖项，哪些是本地没有的，加入待下载数组
            //2):分析完之后，倒序遍历数组，把每一项加入queue

            for(var m=0,n=asyncDependentName.length;m<n;m++){
                var uri = asyncDependentName[m];

                var needs = _getModuleDepends(uri);
                var q =_scriptLoader.beginQueue();
                q.load(needs).on("finish", function () {
                        _loaded++;
                        if(_loaded === _totalCount){
                            var _modules = [];
                            for(var s1=0,s2=asyncDependentName.length;s1<s2;s1++){
                                var _name = asyncDependentName[s1];

                                //call require to get module exports
                                _modules.push(_require(_name));
                            }
                            cb && cb.apply(null,_modules)
                        }
                    });
                q.start(); //调用queue.start顺序下载依赖
            }





            ////如果是多个文件
            //if(Object.prototype.toString.apply(asyncDependentName) === '[object Array]'){
            //    for(var i=0,j=asyncDependentName.length;i<j;i++){
            //        var _dep = _configs.srcMap[asyncDependentName[i]];
            //
            //    }
            //}
            //
            //
            //var uri;
            //if(uri=_configs.srcMap[asyncDependentName]){
            //    //，开启一个队列加载，并在结束的时候销毁队列
            //    if(Object.prototype.toString.apply(obj) === '[object Array]'){
            //        OneLib.ScriptLoader.beginQueue(new Date().toString()+'|'+asyncDependentName)
            //            .asy
            //    }else{
            //        //如果是单个文件，直接load
            //    }
            //
            //}else{
            //    throw new Error(asyncDependentName,'not found, must defined in srcMap!')
            //}
        };

        //如果factory使用return返回了对象，则使用该返回值作为模块的返回
        var _ret = self.factory.call(_innerModule,_require,_innerModule.exports,_innerModule);
        if(_ret!==undefined){
            self.exports = _ret;
        }
        else{
            self.exports =_innerModule.exports;
        }

        //update alias
        _configs.alias[self.name] = self.name;
    };

    var _logger = new OneLib.Log.Logger(false),
        _scriptLoader = OneLib.ScriptLoader,
        _log=function(msg){
            _logger.writeLine(msg);
        },
        //保留名字
        _reserved={'global':1,'window':1},
        //已经加载的模块
        _modules={
        },
        //配置项
        _configs={
            // 基础路径（其他所有模块的路径都以它为基础）
            base: 'http://asada',

            //add on 2015-09-14:添加资源映射表，方便根据模块id查询模块详细信息和依赖的其他模块概要信息
            //srcMap里可以只包含需要异步加载的脚本信息即可，loader在加载模块的时候，会先从本地查找，没有的话才查询srcMap
            srcMap:{
                //"libs/jquery-1.8.1/jquery.min.js":{
                //    uri:"http://static.local.com/static/libs/jquery-1.8.1/jquery.min.js",
                //    deps:[] //无依赖的情况
                //},
                //"testWeb/debug-1.0/bar/bar.js":{
                //    uri:"http://static.local.com/static/c/testWeb/debug-1.0/bar/bar.js",
                //    deps:[
                //        "libs/jquery-1.8.1/jquery.min.js",
                //        "testWeb/debug-1.0/foo/foo.js" //多个依赖的情况
                //    ]
                //},
                //"testWeb/debug-1.0/foo/foo.js":{
                //    uri:"http://static.local.com/static/c/testWeb/debug-1.0/foo/foo.js",
                //    deps:[
                //        "libs/jquery-1.8.1/jquery.min.js"
                //    ]
                //}
            },

            // 变量配置
            vars: {
//                'home': '',
//                'pack': '/pack'
            },
            //配置模块的下载地址:可以使用{vars}来简化路径
            modulePath:{
//                'Module1':'{home}/{mode}/m1.js'
            },
            packs:{
//                '{pack}/{mode}/p1.js':['Module1','Module2']
            },
            //配置:处理冲突
            dealConflicts:{
                moduleNameConflict:'return' //当定义的模块名冲突的时候如何处理：'throw':抛出异常, 'return':忽略本次模块定义 , 'overwrite':使用本次定义的模块覆盖已有模块
            },
            //配置:别名
            alias:{
//                '_Log':'OneLib.Log',//OneLib 日志模块
//                '_log':'OneLib.Log',//OneLib 日志模块
//                '_scriptLoader':'OneLib.ScriptLoader',//脚本异步加载模块
//                '_loader':'OneLib.ScriptLoader',//脚本异步加载模块
//                'window':'global'//全局变量
            }
        },
        _transAlias = function(moduleNameOrArray){
            if(moduleNameOrArray.constructor===Array){
                for(var m=0,j=moduleNameOrArray.length;m<j;m++){
                    var _item = moduleNameOrArray[m];
                    if(_configs.alias[_item]){
                        moduleNameOrArray[m]=_configs.alias[_item];
                    }
                }
                return moduleNameOrArray;
            }
            else{
                return _configs.alias[moduleNameOrArray]||moduleNameOrArray;
            }
        },
    //检查模块名，可以使用则返回true,否则抛出异常
        _checkNameAndThrow = function(name){
            if(_reserved[name]||_modules.hasOwnProperty(name)){
                throw new Error('ModuleName:['+name+'] has been used!');
            }
            else if(name===null||name==undefined||name===''){
                throw new Error('ModuleName cannot be empty!');
            }
            else{
                return true;
            }
        },
        _checkNameInLegal = function(name){
            if(_reserved[name]||_modules.hasOwnProperty(name)){
                return 'existed';
            }
            else if(name===null||name==undefined||name===''){
                throw new Error('ModuleName cannot be empty!');
            }
            else{
                return undefined;
            }
        },

        //判断本地内存是否已经有该模块了
        _hasModule = function(moduleName){
            moduleName = _transAlias(moduleName);
            return _modules.hasOwnProperty(moduleName);
        },

        _getRealModule = function(moduleName){
            moduleName = _transAlias(moduleName);
            return _modules[moduleName];
        },
        _;

    /**
     * 加载入口模块
     * @param moduleName:入口模块的名称
     * @param callback:{Function(module)}获取到该入口模块后，执行的回调.
     */
    my.use =function(moduleName,callback){
        _log('>>use:: [' + moduleName + '] begin...');
        //检查缓存里有没有
        var _used = _getRealModule(moduleName);
        if(_used){
            callback&&callback(_used.getExportsCopy())
        }
    };

    /**
     * 设置基础路径
     * @param baseUrl
     */
    my.setBase = function(baseUrl){
        _configs.base = baseUrl;
        return my;
    };

    /**
     * 给加载器设置源码字典
     * @param srcMap
     */
    my.setSrcMap = function (srcMap) {
        _configs.srcMap = srcMap||{}; //确保srcMap至少是个空字典
    }

    /**
     * 设置变量
     * @param vars:{key,value}
     * @return {*}
     */
    my.setVars = function(vars){
        for(var i in vars){
            _configs[i]=vars[i];
        }
        return my;
    };

    /**
     * 配置冲突处理策略(moduleNameConflict:'throw'/'return'/'overwrite')
     * @param conflictConfig
     */
    my.configDealConflicts = function(conflictConfig){
        for(var i in conflictConfig){
            if(_configs.dealConflicts.hasOwnProperty(i)){
                _configs.dealConflicts[i] = conflictConfig[i];
            }
        }
        return my;
    }

    /**
     * 添加/重写别名，系统保护的别名不允许重写。
     * @param alias
     */
    my.addAlias = function (alias) {
        for (var i in alias){
            if(_checkNameAndThrow(i)){
                _configs.alias[i] = alias[i];
            }
        }
        return my;
    };
    global['define']=my.define = function(moduleName,dependency,factory){
        _log('>>define:: [' + moduleName + '] begin...');
        //如果模块名合法、没有冲突
        if(!_checkNameInLegal(moduleName)){
            _modules[moduleName] =  new _Module(moduleName,dependency,factory);
        }
        //模块名有冲突，则查看配置
        else{
            var _deal = _configs.dealConflicts.moduleNameConflict;
            if(_deal==='overwrite'){
                _log('>>define:: [' + moduleName + '] overwrite exist module...');
                _modules[moduleName] =  new _Module(moduleName,dependency,factory);
            }
            else if(_deal==='return'){
                _log('>>define:: [' + moduleName + '] name existed,return...');
            }
            else{
                throw new Error('ModuleName:['+moduleName+'] has been used!');
            }
        }
        _log('>>define:: [' + moduleName + '] end(success)...');
    };
    //2015-09-17 增加对AMD的支持标记
    global['define'].amd = true;
    /**
     * 通过此API可以直接从外部获取任意一个Module(通常是调试错误的时候使用)
     * @param moduleName
     * @return {*}
     */
    my.require = function (moduleName) {
        _log('>>!!>>require(global):: [' + moduleName + '] has been called!');
        return _getRealModule(moduleName);
    };

    /**
     * 可以把一个已经存在的对象封装成一个模块，该对象自身作为模块的exports
     * @param moduleName
     * @param exports
     */
    my.wrapToModule = function(moduleName,exports){
        _log('>>wrapToModule:: [' + moduleName + '] begin...');
        //如果模块名合法、没有冲突
        if(!_checkNameInLegal(moduleName)){
            _modules[moduleName] =  new _Module(moduleName,[],function(){
                return exports;
            },exports);
        }
        //模块名有冲突，则查看配置
        else{
            var _deal = _configs.dealConflicts.moduleNameConflict;
            if(_deal==='overwrite'){
                _log('>>wrapToModule:: [' + moduleName + '] overwrite exist module...');
                _modules[moduleName] =  new _Module(moduleName,[],function(){
                    return exports;
                },exports);
            }
            else if(_deal==='return'){
                _log('>>wrapToModule:: [' + moduleName + '] name existed,return...');
            }
            else{
                throw new Error('ModuleName:['+moduleName+'] has been used!');
            }
        }
        _log('>>wrapToModule:: [' + moduleName + '] end(success)...');
    };

    /**
     * 从内部移出一个模块(可以使用别名)
     * @param moduleName
     * @return {Boolean}
     */
    my.removeModule = function(moduleName){
        _log('>>!!>>removeModule:: [' + moduleName + '] begin...');

        moduleName = _transAlias(moduleName);
        if(_modules.hasOwnProperty(moduleName)){
            delete _modules[moduleName];
            _log('>>!!>>removeModule:: [' + moduleName + '] end(success)...');
            return true;
        }
        else{
            _log('>>!!>>removeModule:: [' + moduleName + '] end(no such module)...');
            return false;
        }
    };
    my.logOn = function(){
        _logger.enable = true;
    };
    my.logOff = function(){
        _logger.enable = false;
    };
    /**
     * 移除所有已经注册的module
     */
    my.removeAll=function(){
        _log('>>!!>>removeAll begin...');
        for(var i in _modules){
            my.removeModule(i);
        }
        _log('>>!!>>removeAll end(success)...');
    };
    /**
     * 移除所有的Module(慎用，多用于测试时)
     */
    my.removeAllModulesExcept = function(except){
        except = _transAlias(except);
        var  _exceptDic= {};
        if(except.constructor === Array){
            for(var i=0,j=except.length;i<j;i++){
                _exceptDic[except[i]]=1;
            }
        }
        else{
            _exceptDic[except]=1;
        }

        _log('>>!!>>removeAllModules except:: [' + except + '] begin...');
        for(var i in _modules){
            if(!_exceptDic[i]){
                my.removeModule(i);
            }
        }
        _log('>>!!>>removeAllModules except:: [' + except + '] end(success)...');
    };

    //使用console输出信息
    _logger.setMode(0);

    //把window封装进去
    _modules['global'] =  new _Module('global',[],function(){
        return window;
    },window);

    //把核心前置模块也包裹进去，可以使用require调用了
    my.wrapToModule('OneLib.Log',OneLib.Log);
    my.wrapToModule('OneLib.ScriptLoader',OneLib.ScriptLoader);
    my.wrapToModule('OneLib.EventEmitter',OneLib.EventEmitter);
    //根据浏览器queryString是否含有 CMDSyntaxDebug 选项，来决定是否开启日志
    if(_queryString('CMDSyntaxDebug')){
        my.logOn();
    }

    return my;
} (OneLib.CMDSyntax || {},window));
