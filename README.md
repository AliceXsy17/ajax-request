#Ajax请求数据
> 主要封装了Ajax中的get,post请求 与 jsonp跨域请求数据等。
> 默认的请求方式为: get, 服务器返回的数据类型默认为:【dataType:'json'】

##封装的方法如下
``` bash
# ajax请求
$Http.ajax({
    url: '',
    type: 'post', //默认为get
    data: 'count=2&start=2', //支持两种格式:1、url参数格式的字符串, 2、json格式 {count:2, start:2}
    dataType: 'json', //默认为json,('json','jsonp', 'script', 'style')
    jsonpCallback: 'callback', //跨域请求使用,默认为callback
    success: function(){ },
    error: function(){ }
})

# get请求
$Http.get(url, data, function(data){ })

# post请求
$Http.post(url, data, function(data){ })

# jsonp跨域请求
$Http.jsonp(url, data, function(data){ })

# 加载js脚本
$Http.getScript(url, data, function(data){ })

# 加载CSS样式
$Http.getStyle(url, data, function(data){ })

```