# web-starter-front-end

这是一个前端脚手架，目的是快速的搭建一个具备完善的模块管理、依赖加载机制的前端工程

# 技术架构

## V1.0
使用FIS3+自定义插件+自定义Loader实现

## V2.0(todo)
计划使用Gulp+自定义插件+自定义Loader实现，提供更多特性：mock server,hot reload等


## 关于后端选型

本框架对于后端选型没有要求，主流的后端技术都是可以的。也可以选择我开发的另外一个 `[后端skeleton](https://github.com/wbpmrck/web-starter)`

## 使用方法

### 首先，电脑需要安装node.js,以及fis3。

这部分内容请自行完成，注意`fis3`需要使用全局安装:

```bash
$ npm install -g fis3
```

### 然后找一个开发目录，使用npm安装本项目结构：


```bash
$ cd yourProjectDir
$ npm install web-starter-front-end
```


### 在工程目录 npm install

```bash
$ cd web-starter-front-end
$ npm install 
```

### 注意
完成以上步骤之后，node_modules/web-starter-front-end 就是你的web工程了，你可以把这个文件夹拷贝到外面来使用。

### 构建

```bash
$ ./dev_build.sh  #这是开发环境构建
$ ./test_build.sh  #这是测试环境构建
$ ./prod_build.sh  #这是生产环境构建

```


### 输出文件

输出的文件在 `./dist` 目录里，其中：
 - `WEB-INF` 是动态页面文件，应该部署到你的后台服务器
 - `static` 是静态文件，应该部署到你的静态文件服务器

### 相关配置
- `config` 里配置了网站的 `动态域名` 和 `静态域名`，分别是你动态请求服务器，和静态文件服务器
- `fis-config.js` 配置了业务相关脚本的打包规则
- `/_fis3_loader/base-fis-conf.js` 配置了`业务无关`脚本的打包规则，比如`test`,`prod`环境下的特殊构建开关。尽量不要改动这里的配置，如果需要定制test,prod环境下的配置，可以视情况修改


### 查看构建结果

使用任意静态文件服务工具，在dist目录下开启静态文件服务，假设端口是 `1234`,访问地址： http://127.0.0.1:1234/WEB-INF/1.0/views/home/index.html 即可查看结果

> 后续会计划开发一个CLI插件来方便使用

