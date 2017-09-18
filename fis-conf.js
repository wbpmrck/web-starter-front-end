

//根据构建的media,来读取对应配置,添加到fis的配置里
//var now_media = fis.media()._media; //这个也可以
var now_media = fis.project.currentMedia();
var packOrderSeed=1;

console.log('prepare to build: media is :['+now_media+']');

//项目配置，将site.name、version、独立配置，统管全局
fis.set('site.name', "testWeb");
fis.set('nowMedia', now_media);
fis.set('version.web', "1.0");
fis.set('site.staticDomain', "http://127.0.0.1:1234");


/* ------------------------------------------------------------------
    加载基础构建配置 【不要自定义】
------------------------------------------------------------------*/
var baseConfig = require("./_fis3_loader/base-fis-conf");
baseConfig.conf(fis);
/* ------------------------------------------------------------------
    排除非构建资源 【可以自定义】
------------------------------------------------------------------*/

//有些资源不想被构建，通过以下方式排除
fis.set('project.ignore', [
    '_fis3_loader/**', //不要删除
    'fis-conf*.js',//不要删除
    'node_modules/**',//不要删除
    'dist/**',
    '.git/**',
    '.svn/**'
]);

/* ------------------------------------------------------------------
    给文件追加自定义属性，【此处根据需求自定义】
 ------------------------------------------------------------------*/

//css pack
fis.match(/^\/resources\/css\/(.*)(style\.css|reset\.css)$/i,{
    packOrder:packOrderSeed++,
    packTo: '/static/packages/${site.name}/css_pkg.css'
});

//js打包功能

//vue and lib pack
fis.match(/^\/libs\/(.*)[\.js]$/i,{
    packOrder:packOrderSeed++,
    packTo: '/static/packages/${site.name}/lib_pkg.js'
});

//项目内部复用模块

fis.match(/^\/config\/(.*)[\.js]$/i,{
    packOrder:packOrderSeed++,
    packTo: '/static/packages/${site.name}/modules_pkg.js'
});
fis.match(/^\/modules\/services\/(.*)[\.js]$/i,{
    packOrder:packOrderSeed++,
    packTo: '/static/packages/${site.name}/modules_pkg.js'
});




//components pack
fis.match(/^\/components\/header\/(.*)[\.js]$/i,{
    packOrder:packOrderSeed++,
    packTo: '/static/packages/${site.name}/components_pkg.js'
});



//正则匹配【/views/**】.html 文件，并将views后面的路径捕获为分组1
fis.match(/^\/views\/(.*)\.html$/i,{
        isViews : true,//给file对象增加一个自定义标记，表示这里面是view文件

        //views下的 html 文件是动态页面，发布到spring mvc的web-inf下
        //使用${xxx}引用fis.config的其他配置项
        release : '/WEB-INF/${version.web}/$0'
    }
);
//正则匹配【/views/**】.js,css,png等 文件，并将views后面的路径捕获为分组1
fis.match(/^\/views\/(.*)[\.css|\.js|\.png]$/i,{
        //静态文件发布到静态文件夹
        release : '/static/views/${site.name}/$0'
    }
);

//所有资源文件发布到static里
fis.match(/^\/resources\/(.*)$/i,{
        //资源文件发布到静态文件夹
        //release : '/static/resources/${site.name}/${version.web}/$0'
        release : '/static/resources/${site.name}/$0'
    }
);

fis.match(/^\/components\/(.*)$/i,{
        //追加id属性，id为【项目名/版本号/文件路径】
        id : '${version.web}/$1',
        //追加isComponents标记属性
        isComponents : true,
        //项目模块化目录没有版本号结构，用全局版本号控制发布结构
        release : '/static/c/${site.name}/$1'
    }
);

fis.match(/^\/modules\/(.*)$/i,{
        //追加id属性
        id : '$1',
        release : '/static/modules/${site.name}/$1'
    }
);


