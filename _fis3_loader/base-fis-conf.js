exports.conf=function(fis){

//根据构建的media,来读取对应配置,添加到fis的配置里
//var now_media = fis.media()._media; //这个也可以
var now_media = fis.project.currentMedia();
var packOrderSeed=1;

console.log('[base] build media is :['+now_media+']');

/* ------------------------------------------------------------------
    排除非构建资源 【可以自定义】
------------------------------------------------------------------*/
// //有些资源不想被构建，通过以下方式排除
// fis.set('project.ignore', [
//     '**/*.md',//所有md后缀的文件，不发布
//     '$HOME/**',
//     'output/**',
//     '_fis3_loader/**',
//     'fis-conf*.js',
//     'node_modules/**',
//     '.git/**',
//     '.svn/**'
// ]);


/* ------------------------------------------------------------------
    给文件追加默认属性，【此处无需修改】
 ------------------------------------------------------------------*/

//----- 0. 所有文件不使用缓存(实际编写插件的时候，发现启用缓存之后，fis插件拿到的是缓存文件在目标目录的信息，导致逻辑错误)
fis.match('**',{
        useCache : false
    }
);

fis.match(/^(.*)\.js$/i,{
        needWrap:true, //文件属性：是否需要被 resource-prepare 插件处理，（包裹成CMD模块)
        needFix:true, //文件属性：是否需要被 resource-fix 插件处理
    }
);


/* ------------------------------------------------------------------
    给文件追加自定义属性，【此处根据需求自定义】
 ------------------------------------------------------------------*/

//----- 1. views里面开发的时候，要对html文件和静态文件的发布目录、域名做一些定制

// loader由于是框架的基础，所以无需wrap
fis.match(/^\/_fis3_loader\/loader\/(.*)\.js$/i,{
// fis.match(/^\/libs\/(.*)[\.js|\.html]$/i,{
        needWrap:false, //文件属性：是否需要被包裹成CMD模块
        needFix:false, //文件属性：是否需要被 resource-fix 插件处理
    }
);




//js打包功能
//loader pack
fis.match(/^\/_fis3_loader\/loader\/(.*)\.js$/i,{
    packOrder:packOrderSeed++,
    packTo: '/static/packages/${site.name}/_loader.js'
});


//----- 2. 替换所有静态文件的域名
fis.match("*.{js,css,png,gif,jpeg,bmp,jpg,mp3,swf,eot,svg,ttf,woff,woff2}",{
    domain:'${site.staticDomain}',
    useHash:false //开发期间，不使用md5功能(false)
});



fis.match("*.js", {
    isJsLike : true, //fis 内部也会设置这个值，为了保险，这里确认设置一下
    //对所有html开启component嵌入功能
    preprocessor: fis.plugin("resources-prepare", {
        
    })
});
fis.match("*.html", {
    isHtmlLike : true, //fis 内部也会设置这个值，为了保险，这里确认设置一下
    //对所有html开启component嵌入功能
    preprocessor: fis.plugin("resources-prepare", {
        commonLibs:[
            '/_fis3_loader/loader/OneLib.Log.js',
            '/_fis3_loader/loader/OneLib.EventEmitter.js',
            '/_fis3_loader/loader/OneLib.ScriptLoader.js',
            '/_fis3_loader/loader/OneLib.CMDSyntax.js'
        ]
    })
});

fis.match('::package', {
    //激活loader的打包功能
    postpackager: [
        fis.plugin('loader',{}),
        fis.plugin('info-output',{})
    ],
    prepackager: [
        fis.plugin('resources-fix',{
            
        }),
      
        //对所有的view进行normallize: 去重、js置底、css置顶
        fis.plugin("view-normalize", {
           
            //可以自定义id作为placeHolder,也可以使用默认的(js:在body结尾之前,css:在head结尾之前)
            //cssPlaceholderID:"_CSS_PLACEHOLDER_", //css填充区域占位符
            //jsPlaceholderID:"_JS_PLACEHOLDER_", //js填充区域占位符
        })
    ]
});


/*------------------------------------------------------------------
 test 环境下的特殊优化处理
  */
fis.media("test")
    .match("*.{js,css,png,jpg,gif,jpeg,bmp}",{
        useHash:true
    })
    // .match("*.html",{
    //     optimizer:fis.plugin("html-minifier",{
    //         removeComments:false,
    //         customAttrSurround:[[/@/,/(?:)/]]
    //     })
    // })
    // .match('*.js', {
    //     optimizer: fis.plugin('uglify-js', {
    //         mangle: {
    //             except: 'exports, module, require,require.async, define'
    //             //expect: ['require', 'define'] //不想被压缩的字符（这里是CMD和AMD规范的关键字）
    //         },
    //         compress:{
    //             drop_console:true//移除console.log
    //         }
    //     })
    // })
    .match('*.css', {
        optimizer: fis.plugin('clean-css', {
            'keepBreaks': true //保持一个规则一个换行
        })
    });

/*------------------------------------------------------------------
     prod 环境下的特殊优化处理
// */
fis.media("prod")
    .match("*.{js,css,png,jpg,gif,jpeg,bmp}",{
        useHash:true
    })
    // .match("*.html",{
    //     optimizer:fis.plugin("html-minifier",{
    //         removeComments:false,
    //         customAttrSurround:[[/@/,/(?:)/]]
    //     })
    // })
    .match('*.js', {
        optimizer: fis.plugin('uglify-js', {
            mangle: {
                except: 'exports, module, require,require.async, define'
                //expect: ['require', 'define'] //不想被压缩的字符（这里是CMD和AMD规范的关键字）
            },
            compress:{
                drop_console:true//移除console.log
            }
        })
    })
    .match('*.css', {
        optimizer: fis.plugin('clean-css', {
            'keepBreaks': true //保持一个规则一个换行
        })
    });

}