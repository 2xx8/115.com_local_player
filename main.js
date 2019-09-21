// ==UserScript==
// @name        [115.com] Local Player
// @version     2.0.0
// @description Play Videos Via Local Player
// @match       https://115.com/*
// @author      sam
// @run-at      document-end
// @grant       none
// @updateURL   https://raw.githubusercontent.com/Lase75/115.com_local_player/master/main.js
// @downloadURL https://raw.githubusercontent.com/Lase75/115.com_local_player/master/main.js
// ==/UserScript==
$(document).ready(function(){

    //去除无用侧边栏
    if(window.location.href === "https://115.com/home/userhome")
        window.location = "https://115.com/?mode=wangpan";
    else
    {
        var item_list,item_obj,item_name;
        var ifr = $("iframe[style='position: absolute; top: 0px;']");
        $("div#js-main_mode").css("display","none");
        $("div.main-core").css("left","0");
        ifr.load(
            function(){
                setCss();
                addMarkButton();
                item_list = ifr.contents().find("body").find("div#js_data_list");
                item_list.mouseenter(
                    function(){
                        if($("div.exph-loader").css("display") === "none" && !(item_list.find("div#isload").length)){
                            item_list.append("<div id='isload'></div>");
                            itemEvent();
                        }
                    }
                );
            }
        );
    }

    //仅在wangpan框架内执行
    var page_url = window.location.href.substr(0,25);
    if (page_url =='https://115.com/?ct=file&'){
        console.log('onload')
        //1.本地播放器打开
        var requests = [],
            CloudVideo = window.CloudVideo = {
                showPanel: function (code) {
                    this.getFileUrl(code, function (url) {
                        //var xurl = 'ygl://' + encodeURIComponent(url);
                        var xurl = 'potplayer://' + url; //原生potplayer调用
                        console.log(xurl);
                        window.location.href = xurl;
                    });
                },
                getFileUrl: function (pickcode, callback) {
                    requests.push([pickcode, callback])
                }
            };

        $('<iframe>').attr('src', 'https://webapi.115.com/bridge_2.0.html?namespace=CloudVideo&api=jQuery').attr("id", 'ciid').css({
            width: 0,
            height: 0,
            border: 0,
            padding: 0,
            margin: 0,
            position: 'absolute',
            top: '-99999px'
        }).one('load', function () {
            var urlCache = {};
            CloudVideo.getFileUrl = function (pickcode, callback) {
                if (urlCache[pickcode]) {
                    setTimeout(callback, 0, urlCache[pickcode]);
                } else {
                    /*
                    window.frames["ciid"].contentWindow.jQuery.get('https://webapi.115.com/files/download?pickcode=' + pickcode, function (data) {
					callback(urlCache[pickcode] = data.file_url)
				    }, 'json');
                    */
                    //请求m3u8，调用potplayer打开
                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", 'https://115.com/api/video/m3u8/' + pickcode + '.m3u8', true); //未加时间戳
                    xhr.onreadystatechange = function() {
                        if (this.readyState == 4 && this.status == 200) {
                            var text = this.responseText,
                                text_array=text.split("\n");
                            text_array.shift();
                            text_array.pop();
                            //console.log(text_array);
                            var BANDWIDTH = [],FILE_URL = [];
                            for(let index in text_array) {
                                //console.log(index,text_array[index]);
                                if(index%2 == 0){
                                    var patt = /BANDWIDTH=(\d*)?/;
                                    var bw = text_array[index].match(patt)[1];
                                    BANDWIDTH.push(Number(bw));
                                } else{
                                    FILE_URL.push(text_array[index]);
                                };
                            };
                            var bw_max_index = BANDWIDTH.indexOf(Math.max(...BANDWIDTH));
                            console.log(FILE_URL);
                            callback(urlCache[pickcode] = FILE_URL[bw_max_index]);
                        }
                    };
                    xhr.send();
                };
            };
            requests.forEach(function (e) {
                CloudVideo.getFileUrl(e[0], e[1])
            });
            requests = null;
        }).appendTo('html');

        //添加播放按钮
        $(document).on('mouseenter', 'li[rel="item"][file_type="1"][file_mode="9"]:not([is_loaded_vbutton="1"])', function () {
            var par_element = $(this).attr('is_loaded_vbutton', '1'),
                pick_code = par_element.attr('pick_code');
            var menu = par_element.find('[class="file-opr"]');
            $('<a href="javascript:;" menu_btn="more"><i class="icon ifo-share"></i><span>via.PotPlayer</a>').on('click', function () {
                CloudVideo.showPanel(pick_code);
                console.log(pick_code);
            }).appendTo(menu);
        });

        //2.调整添加任务按钮
        document.querySelector("#js_top_panel_box > div:nth-child(5)").remove() //移除上传按钮
        document.querySelector("#js_top_panel_box > div.right-tvf > a:nth-child(1)").remove()  //移除我的分享
        //添加链接任务
        $('<a href="javascript:;" class="button btn-linear-blue illt-offline" menu="offline_task" is_bind="1"><span>链接任务</span></a>').prependTo(document.querySelector("#js_top_panel_box > div.right-tvf"));

    };
});
