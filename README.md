## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report

# run unit tests
npm run unit

# run e2e tests
npm run e2e

# run all tests
npm test
```

For detailed explanation on how things work, checkout the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).


## webpack配置 
> /build、/config
#### 一、多页面入口配置
> Vue脚手架生成项目默认采用单页面架构, 根据项目需要拟采用多页面架构, 因此需要修改默认webpack构建方式, 使webpack将views下所有文件夹自动配置为页面入口
##### Step.1 utils.js增加getEntries方法,根据表达式获取项目中所有入口键值对,代码如下:

```js

var glob = require('glob');

// 获取指定路径下的入口文件
exports.getEntries = function (globPath) {
    var entries = {}, prefix = process.env.NODE_ENV === 'production' ? '' : config.basePath,
        basename, tmp, pathname;
    glob.sync(globPath).forEach(function (entry) {
        basename = path.basename(entry, path.extname(entry));

        tmp = entry.split('/');
        if (tmp[tmp.length-2] && basename == tmp[tmp.length-2]) {
          tmp.splice(tmp.indexOf(basename));
          tmp.splice(0, tmp.indexOf(config.moduleName) + 1); // 多级目录去掉模块名
          tmp = tmp.join('/');

          pathname = prefix + (tmp.length > 0 ? (tmp + '/') : '') + basename; // 正确输出js和html的路径
          entries[pathname] = entry;
        }
    });
    console.log(entries);
    return entries;
}
```
##### Step.2 修改webpack.base.conf.js入口配置及打包插件配置
```js
var HtmlWebpackPlugin = require('html-webpack-plugin')
var entries = utils.getEntries('./src/views/**/*.js');
var pages = utils.getEntries('./src/views/**/*.html');
module.exports = {
  entry: entries,
  ...,
  plugins:[]
}
Object.keys(pages).forEach(function(pathname) {
    // 每个页面生成一个html
    var plugin = new HtmlWebpackPlugin({
        // 生成出来的html文件名
        filename: pathname + '.html',
        // 每个html的模版，这里多个页面使用同一个模版
        template: pages[pathname],
        // 自动将引用插入html
        inject: true,
        // 每个html引用的js模块，也可以在这里加上vendor等公用模块
        chunks: [pathname, 'vendor', 'manifest']
    });
    module.exports.plugins.push(plugin);
})
```
##### Step.3 注释webpack.dev.conf.js及webpack.prod.conf.js打包插件配置
```js
    /*new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html',
      inject: true
    }),*/
```

##### 说明:
核心配置为第二步, 配置会寻找./src/views下所有文件夹,   
以文件夹为单位作为单个页面,例:  
若目录结构为:
```  
views  
├─home  
│  └─list  
│      list.html  
│      list.js  
├─index  
│      index.html  
│      index.js  
│      index.vue  
└─kjgg  
      kjgg.html  
      kjgg.js  
      kjgg.vue  
```
则项目包含入口:
```
localhost:8080/index.html
localhost:8080/list.html
localhost:8080/kjgg.html
```
并且可以支持多级目录
**文件入口必须与其目录名字相同**

#### 二、增加打包路径前缀
> 为支持APP需要修改打包路径前缀  
##### Step. 1 修改config/index.j增加常量BASE_PATH
```js
const BASE_PATH = 'android_assets/www/';// 开发/部署环境url前缀
module.exports = {
  basePath: BASE_PATH,
  build: {
    ...,
    index: path.resolve(__dirname, '../dist/' + BASE_PATH + 'index.html'),
    assetsRoot: path.resolve(__dirname, '../dist/' + BASE_PATH),
  },
  dev: {
    ...,
    assetsSubDirectory: BASE_PATH + 'static',
  }
```

##### Step. 2 utils.js中修改getEntries函数,修改开发环境构建路径
```js
// 获取指定路径下的入口文件
exports.getEntries = function (globPath) {
    var entries = {}, prefix = process.env.NODE_ENV === 'production' ? '' : config.basePath,
    ...
    pathname = prefix + (tmp.length > 0 ? (tmp + '/') : '') + basename; // 正确输出js和html的路径
  });
  ...
}
```

##### 说明:
第一步是为了修改生产环境打包路径,和开发环境静态资源打包路径,同时增加basePath字段供外部使用.
第二步则配置资源文件在生产环境中的打包路径.
BASE_PATH常量使生产与开发环境路径前缀始终保持一致

#### 三、静态资源的引用
> 根据项目需要,css及images由构建生成,开发人员无需关注外部样式,则需要将css及images放入static文件夹中,但src目录下的资源文件无法应用src目录外的文件,则需要在webpack中配置static路径别名,供src目录下资源文件使用
##### Step. 1 修改webpack.base.conf.js中resolve.alias,增加static目录别名配置
```js
  resolve: {
    alias: {
      ...,
      '~static': path.resolve(__dirname, '../static')
    }
  }
```
##### Step. 2 在HTML或组件中引用图片及样式
index.vue
```html
    <template>
    <div class="c_red">{{message}}</div>
    </template>
    <script type="text/javascript">
    export default {
        data(){
            return {
                message: 'hello'
            }
        }
    }
    </script>
    <style src="~static/css/main.css">
```

##### 说明:
目前项目使用静态样式表及图片,可以将css及images等静态资源放在static目录下,构建调整UI时直接替换static下静态资源文件即可
将来项目若使用UI库,则不使用static目录,将公用样式放在src/assets目录下

## 前后端数据交互
> src/api
> 前端数据请求使用axios框架, 生产与开发环境区别配置, 各模块api统一管理

#### 一、生产与开发环境区别配置
> 由于在APP中需要指定API的root地址,所以需要配置生产环境API地址,同时开发环境需要指定调用本地或者线上的API,所以同时需要配置开发环境的API地址,并且开发环境访问线上环境API时可能发生跨域问题,因此开发环境需要配置代理地址,由开发环境服务器代理实际请求

##### Step.1 config/dev.env.js中增加API_ROOT,作为开发环境API地址

```js
var merge = require('webpack-merge')
var prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  API_ROOT: '"/"' // 增加API_ROOT
})
```

##### Step.2 config/prod.env.js中增加API_ROOT,作为生产环境API地址

```js
module.exports = {
  NODE_ENV: '"production"',
  API_ROOT: '"https://cp.lemicp.com/"' // 增加API_ROOT
}
```

##### Step.3 config/index.js中配置proxyTable, 将开发环境API地址交给node服务器做代理转发

```js
module.exports = {
  build: {
    ...
  },
  dev: {
    proxyTable: {
      '/api': {
              target: 'http://192.168.2.67:8084', // 远程服务域名
              changeOrigin: true,// 支持跨域
              pathRewrite: {
                '^/api': '/api'
              }
      }
    },
    ...
  }
}
```

##### Step.4 在需要使用API地址的地方使用process.env.API_ROOT替换API地址

##### 说明:
proxyTable中配置的意思是: 开发环境请求以/api开头的路径时,会自动将请求转发至target, 并在target后面加上/api
因此开发服务器后端实际请求地址为http://192.168.2.67:8084/api/xxxxxx

#### 二、前端数据请求使用axios框架
> 与jquery的ajax类似,减少学习成本

##### Step.1 src/api目录下增加base.js文件,其中可以增加所有与ajax相关的模块,所有需要使用ajax的地方都需要引入该文件

##### Step.2 src/api/base.js中导入axios, 配置baseUrl及超时时间
base.js
```js
// 
import axios from 'axios'
// 配置API接口地址
const axio = new axios.create({
    baseURL: process.env.API_ROOT,
    timeout: 1000
});

export {axio as ajax}
```

##### Step.3 各模块建立各自的api管理中心,并引入axio
src/api/index.js
```javascript
import {ajax} from './base.js'
export default{
    index_oper_banner () {
        return ajax.get("/api/data",{
            params: {
                key: 503000,
                position: 300,
                t_from: 0,
                p_from: 0
            }
        });// 返回promise对象
    }
}
```

##### Step.4 在页面上调用API中的方法获取数据
```javascript
import Vue from 'vue'
import Index from './index.vue'
import api from '@/api/index.js'// 引入index模块的api

new Vue({
  render: h => h(Index)
  ,
  mounted: function(){
        api.index_oper_banner(this).then(function(data,err){// 调用index_oper_banner方法通过AJAX请求获取首页banner
            console.log(data.data);
        })
  }
}).$mount('#app')

```


## 目录结构
> 以彩票项目为例

#### 一、页面入口及模块划分

|模块     |路径              |规划  |
|:-------:|:-----------------|:----:|
|活动     |src/views/activity|多页面|
|代理     |src/views/proxy   |多页面|
|发现     |src/views/explore |多页面|
|首页     |src/views/index   |单页面|
|开奖公告 |src/views/kjgg    |单页面|
|即时比分 |src/views/score   |单页面|
|专家推荐 |src/views/recom   |单页面|
|我的彩票 |src/views/home    |单页面|

#### 二、公共组件/工具/插件
* src/components/common 项目公用组件(例: header.vue, footer.vue)
* src/components/module 模块公用组件(例: ./kjgg/szc-ball.vue, ./kjgg/sfc-ball.vue)
* src/assets/js/common 项目公用库(与业务相关,例: lottery.js, login.js)
* src/assets/js/plug 外部插件(例: swipe.min.js, tween.min.js)
* src/assets/js/utils 工具库(与业务无关,例: string.js, date.js)

## 编码规范

* 前端变量一律采用下划线式写法
* 文件名称单词间使用"-"(短横线)分割
* url引用使用//开头,不指定协议部分
* 其余规范以[Eslint-Airbnb](https://github.com/airbnb/javascript)为准, 构建时若书写错误会自动提示

#
#
#