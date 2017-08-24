/**
 * ajax的封装
 */
(function (win, document) {
    // 构造函数
    function HttpRequest() {

    }
    /**
     * 添加extends方法:
     * 1、如果只传入一个参数，谁调用就给谁混入内容
     * 2、如果传入多个参数，把后面参数对象的内容全部混入到第一个参数对象中
     */
    HttpRequest.extends = HttpRequest.prototype.extends = function () {
        // 被混入的目标，默认为第一个参数
        var target = arguments[0];
        if (arguments.length === 1) {
            target = this;
            for (var key in arguments[0]) {
                target[key] = arguments[0][key];
            }
        }
        else if (arguments.length >= 2) {
            // 遍历得到后面所有的对象
            for (var i = 1, len = arguments.length; i < len; i++) {
                for (var key in arguments[i]) {
                    // 把后面的对象内容混入到第一个参数对象中
                    target[key] = arguments[i][key]
                }
            }
        }
        // 给谁混入返回谁
        return target;
    }

    // 添加静态方法
    HttpRequest.extends({
        // 默认的配置
        ajaxSettings: {
            url: location.href,    // 默认的url为本地地址
            type: "GET",           // 默认请求的方法为GET
            async: true,           // 默认为异步请求
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",   // POST发送数据时设置头信息时候要使用
            timeout: null,         // 默认不看延迟事件
            dataType: 'JSON',      // 默认认为请求的数据是JSON
            jsonpCallback: 'callback',//默认为回调名callback
            success: function () { },//成功的回调函数
            error: function () { } //失败的回调函数
        },
        // 把传入的data数据进行处理
        urlString: function (data) {
            var result = '', key;
            // 传入的如果不是对象，则直接返回空字符串
            if (!HttpRequest.isObject(data)) {
                return result;
            }
            for (key in data) {
                // 为了防止IE发送的汉字出现乱码，需要统一编码一下
                result += window.encodeURIComponent(key) + '=' + window.encodeURIComponent(data[key]) + '&';
            }
            return result.slice(0, -1);
        },
        // 进一步处理配置信息
        processOptions: function (options) {
            // 合并用户传来的 与 默认配置项，得到一份新的配置
            var optionsNew = {};
            HttpRequest.extends(optionsNew, HttpRequest.ajaxSettings, options);
            // 对data进行处理
            optionsNew.data = HttpRequest.urlString(optionsNew.data);
            // 把请求方式type统一转为大写
            optionsNew.type = optionsNew.type.toUpperCase();
            // 将dataType统一转为小写
            optionsNew.dataType = optionsNew.dataType.toLowerCase();
            // 如果是GET请求，把数据添加到url中
            if (optionsNew.type === 'GET') {
                // 判断url中是否存在?号
                if (optionsNew.url.indexOf('?') === -1) {
                    optionsNew.url += '?';
                }
                optionsNew.url += optionsNew.data;
                optionsNew.data = null;
            }
            // 返回加工处理后的配置
            return optionsNew;
        },
        // ajax封装
        ajax: function (options) {
            var optionsNew, xhr, result, funcName;
            // 调用处理配置信息方法，得到加工处理后的配置
            optionsNew = HttpRequest.processOptions(options);

            // 判断是不是要跨域请求数据jsonp
            if (optionsNew.dataType === 'jsonp') {
                //随机定义一个函数名
                funcName = 'my_json_cd' + Math.random().toString().replace('.', '');
                //把回调参数拼接到url中
                optionsNew.url += '&' + optionsNew.jsonpCallback + '=' + funcName;
                //创建一个script标签
                var scriptElement = document.createElement('script');
                scriptElement.src = optionsNew.url;
                //挂载回调函数
                window[funcName] = function (data) {
                    optionsNew.success(data);
                    //remove自身没有意义的js脚本
                    document.body.removeChild(scriptElement);
                };
                //将script标签放到页面中
                document.body.appendChild(scriptElement);
                return;
            }

            // 创建XMLHttpRequest对象，发送请求
            xhr = new XMLHttpRequest();
            xhr.open(optionsNew.type, optionsNew.url, optionsNew.async);
            // 如果请求方式为POST，则添加一个请求头部
            if (optionsNew.type === 'POST') {
                xhr.setRequestHeader('Content-Type', optionsNew.contentType);
            }
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    // 判断请求是否成功，成功过就执行successs方法，失败执行error方法
                    if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                        // 根据传来dataType的参数来对数据进行处理
                        switch (optionsNew.dataType) {
                            case 'json':
                                result = JSON.parse(xhr.responseText);
                                break;
                            case 'script':
                                eval(xhr.responseText);
                                result = xhr.responseText;
                                break;
                            case 'style':
                                var head, style;
                                head = document.getElementsByTagName('head')[0];
                                style = document.getElementsByTagName('style')[0];
                                // 如果页面中不存在style，就创建
                                if (style === undefined) {
                                    style = document.createElement('style');
                                }
                                style.innerHTML = xhr.responseText;
                                head.appendChild(style);
                                result = xhr.responseText;
                                break;
                            default:
                                result = xhr.responseText;
                                break;
                        }
                        optionsNew.success(result);
                    } else {
                        optionsNew.error(xhr.status);
                    }
                }
            };
            xhr.send(optionsNew.data);
        },
        // get请求
        get: function (url, data, fn) {
            // 如果只传入两个参数，则默认第二个参数为回调函数
            fn = fn || data || function () { };
            HttpRequest.ajax({
                url: url,
                data: data,
                success: fn
            });
        },
        // post请求
        post: function (url, data, fn) {
            // 如果只传入两个参数，则默认第二个参数为回调函数
            fn = fn || data || function () { };
            HttpRequest.ajax({
                type: 'POST',
                url: url,
                data: data,
                success: fn
            });
        },
        // 跨域获取数据
        jsonp: function (url, data, fn) {
            // 如果只传入两个参数，则默认第二个参数为回调函数
            fn = fn || data || function () { };
            HttpRequest.ajax({
                dataType: 'jsonp',
                url: url,
                data: data,
                success: fn
            });
        },
        // 加载json数据
        getJSON: function (url, data, fn) {
            // 如果只传入两个参数，则默认第二个参数为回调函数
            fn = fn || data || function () { };
            HttpRequest.ajax({
                dataType: 'json',
                url: url,
                data: data,
                success: fn
            });
        },
        // 加载js脚本
        getScript: function (url, data, fn) {
            // 如果只传入两个参数，则默认第二个参数为回调函数
            fn = fn || data || function () { };
            HttpRequest.ajax({
                dataType: 'script',
                url: url,
                data: data,
                success: fn
            });
        },
        // 加载css样式
        getStyle: function (url, data, fn) {
            // 如果只传入两个参数，则默认第二个参数为回调函数
            fn = fn || data || function () { };
            HttpRequest.ajax({
                dataType: 'style',
                url: url,
                data: data,
                success: fn
            });
        },
        // 判断是不是对象
        isObject: function (obj) {
            // 防止typeof对null的误判
            if (obj === null) {
                return false;
            }
            // 如果是object或function，那就是对象
            if (typeof obj === 'object' || typeof obj === 'function') {
                return true;
            }
            return false;
        }
    });

    // 把HttpRequest暴露到全局$Http
    win.$Http = HttpRequest;
})(window, document);
