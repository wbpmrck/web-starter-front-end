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

> 后续会计划开发一个CLI插件来方便使用

