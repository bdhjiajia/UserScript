// ==UserScript==
// @name         知乎增强
// @version      1.3.4
// @author       X.I.U
// @description  移除登录弹窗、一键收起回答、收起当前回答/评论（点击两侧空白处）、快捷回到顶部（右键两侧空白处）、置顶显示时间、显示问题时间、区分问题文章、默认高清原图、默认站外直链
// @match        *://www.zhihu.com/*
// @match        *://zhuanlan.zhihu.com/*
// @icon         https://static.zhihu.com/heifetz/favicon.ico
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_openInTab
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_notification
// @license      GPL-3.0 License
// @run-at       document-end
// @namespace    https://greasyfork.org/scripts/412205
// ==/UserScript==

var menu_ALL = [
    ['menu_collapsedAnswer', '一键收起回答', '一键收起回答', true],
    ['menu_collapsedNowAnswer', '收起当前回答/评论（点击两侧空白处）', '收起当前回答/评论', true],
    ['menu_backToTop', '快捷回到顶部（右键两侧空白处）', '快捷回到顶部', true],
    ['menu_publishTop', '置顶显示时间', '置顶显示时间', true],
    ['menu_allTime', '完整显示时间', '完整显示时间', true],
    ['menu_typeTips', '区分问题文章', '区分问题文章', true],
    ['menu_directLink', '默认站外直链', '默认站外直链', true]
], menu_ID = [];
for (let i=0;i<menu_ALL.length;i++){ // 如果读取到的值为 null 就写入默认值
    if (GM_getValue(menu_ALL[i][0]) == null){GM_setValue(menu_ALL[i][0], menu_ALL[i][3])};
}
registerMenuCommand();

// 注册脚本菜单
function registerMenuCommand() {
    if (menu_ID.length > menu_ALL.length){ // 如果菜单ID数组多于菜单数组，说明不是首次添加菜单，需要卸载所有脚本菜单
        for (let i=0;i<menu_ID.length;i++){
            GM_unregisterMenuCommand(menu_ID[i]);
        }
    }
    for (let i=0;i<menu_ALL.length;i++){ // 循环注册脚本菜单
        menu_ALL[i][3] = GM_getValue(menu_ALL[i][0]);
        menu_ID[i] = GM_registerMenuCommand(`[ ${menu_ALL[i][3]?'√':'×'} ] ${menu_ALL[i][1]}`, function(){menu_switch(`${menu_ALL[i][3]}`,`${menu_ALL[i][0]}`,`${menu_ALL[i][2]}`)});
    }
    menu_ID[menu_ID.length] = GM_registerMenuCommand('反馈 & 建议', function () {window.GM_openInTab('https://github.com/XIU2/UserScript#xiu2userscript', {active: true,insert: true,setParent: true});window.GM_openInTab('https://greasyfork.org/zh-CN/scripts/419081/feedback', {active: true,insert: true,setParent: true});});
}


// 菜单开关
function menu_switch(menu_status, Name, Tips) {
    if (menu_status == 'true'){
        GM_setValue(`${Name}`, false);
        GM_notification({text: `已关闭 [${Tips}] 功能\n（刷新网页后生效）`, timeout: 3500});
    }else{
        GM_setValue(`${Name}`, true);
        GM_notification({text: `已开启 [${Tips}] 功能\n（刷新网页后生效）`, timeout: 3500});
    }
    registerMenuCommand(); // 重新注册脚本菜单
};


// 返回菜单值
function menu_value(menuName) {
    for (let menu of menu_ALL) {
        if (menu[0] == menuName) {
            return menu[3]
        }
    }
}


// 一键收起回答
function collapsedAnswer() {
    if (!menu_value('menu_collapsedAnswer')) return
    let button_Add = `<button id="collapsed-button" data-tooltip="收起回答" data-tooltip-position="left" data-tooltip-will-hide-on-click="false" aria-label="收起回答" type="button" class="Button CornerButton Button--plain"><svg class="ContentItem-arrowIcon is-active" aria-label="收起回答" fill="currentColor" viewBox="0 0 24 24" width="24" height="24"><path d="M16.036 19.59a1 1 0 0 1-.997.995H9.032a.996.996 0 0 1-.997-.996v-7.005H5.03c-1.1 0-1.36-.633-.578-1.416L11.33 4.29a1.003 1.003 0 0 1 1.412 0l6.878 6.88c.782.78.523 1.415-.58 1.415h-3.004v7.005z"></path></svg></button>`
    let style_Add = document.createElement('style');
    style_Add.innerHTML = '.CornerButton{margin-bottom:8px !important;}.CornerButtons{bottom:45px !important;}';
    document.head.appendChild(style_Add);
    document.querySelector('.CornerAnimayedFlex').insertAdjacentHTML('afterBegin', button_Add);
    document.getElementById('collapsed-button').onclick = function () {
        document.querySelectorAll('.ContentItem-rightButton').forEach(function (el) {
            if (el.hasAttribute('data-zop-retract-question')) {
                el.click()
            }
        });
    }
}


// 收起当前回答、评论（监听点击事件，点击网页两侧空白处）
function collapsedNowAnswer(selectors) {
    backToTop(selectors) // 快捷回到顶部
    if (!menu_value('menu_collapsedNowAnswer')) return
    document.querySelector(selectors).onclick = function(event){
        if (event.target==this) {
            let rightButton = document.querySelector('.ContentItem-actions.Sticky.RichContent-actions.is-fixed.is-bottom')
            if (rightButton) { // 悬浮的 [收起回答]（此时正在浏览回答内容 [头部区域 + 中间区域]）
                // 固定的 [收起评论]（先看看是否展开评论）
                let commentCollapseButton = rightButton.querySelector('button.Button.ContentItem-action.Button--plain.Button--withIcon.Button--withLabel')
                if (commentCollapseButton && commentCollapseButton.innerText.indexOf("收起评论") > -1) {
                    commentCollapseButton.click();
                }
                // 再去收起回答
                rightButton = rightButton.querySelector('.ContentItem-rightButton')
                if (rightButton && rightButton.hasAttribute('data-zop-retract-question')) {
                    rightButton.click();
                }
            } else { // 固定的 [收起回答]（此时正在浏览回答内容 [尾部区域]）
                for (let el of document.querySelectorAll('.ContentItem-rightButton')) {
                    if (el.hasAttribute('data-zop-retract-question')) {
                        if (isElementInViewport(el)) {
                            // 固定的 [收起评论]（先看看是否展开评论）
                            let commentCollapseButton = el.parentNode.querySelector('button.Button.ContentItem-action.Button--plain.Button--withIcon.Button--withLabel')
                            if (commentCollapseButton && commentCollapseButton.innerText.indexOf("收起评论") > -1) {
                                commentCollapseButton.click();
                            }
                            el.click() // 再去收起回答
                            break
                        }
                    }
                }
            }

            var commentCollapseButton_ = false;
            // 悬浮的 [收起评论]（此时正在浏览评论内容 [中间区域]）
            let commentCollapseButton = document.querySelector('.CommentCollapseButton')
            if (commentCollapseButton) {
                commentCollapseButton.click();
            } else { // 固定的 [收起评论]（此时正在浏览评论内容 [头部区域]）
                let commentCollapseButton_1 = document.querySelectorAll('button.Button.ContentItem-action.Button--plain.Button--withIcon.Button--withLabel')
                if (commentCollapseButton_1.length > 0) {
                    for (let el of commentCollapseButton_1) {
                        if (el.innerText.indexOf("收起评论") > -1) {
                            if (isElementInViewport(el)) {
                                el.click()
                                commentCollapseButton_ = true // 如果找到并点击了，就没必要执行下面的代码了（可视区域中没有 [收起评论] 时）
                                break
                            }
                        }
                    }
                }
                if (commentCollapseButton_ == false) { // 可视区域中没有 [收起评论] 时（此时正在浏览评论内容 [头部区域] + [尾部区域](不上不下的，既看不到固定的 [收起评论] 又看不到悬浮的 [收起评论])），需要判断可视区域中是否存在评论元素
                    let commentCollapseButton_1 = document.querySelectorAll('.NestComment')
                    if (commentCollapseButton_1.length > 0) {
                        for (let el of commentCollapseButton_1) {
                            if (isElementInViewport(el)) {
                                let commentCollapseButton = el.parentNode.parentNode.parentNode.parentNode.parentNode.querySelector('button.Button.ContentItem-action.Button--plain.Button--withIcon.Button--withLabel')
                                if (commentCollapseButton.innerText.indexOf("收起评论") > -1) {
                                    commentCollapseButton.click()
                                    break
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}


// 回到顶部（监听点击事件，鼠标右键点击网页两侧空白处）
function backToTop(selectors) {
    if (!menu_value('menu_backToTop')) return
    document.querySelector(selectors).oncontextmenu = function(event){
        if (event.target==this) {
            event.preventDefault();
            window.scrollTo(0,0)
        }
    }
}


//获取元素是否在可视区域
function isElementInViewport(el) {
    let rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <=
        (window.innerWidth || document.documentElement.clientWidth)
    );
}


var postNum;
// 区分问题文章
function addTypeTips() {
    if (!menu_value('menu_typeTips')) return
    // URL 匹配正则表达式
    let patt_zhuanlan = /zhuanlan.zhihu.com/,
        patt_question = /question\/\d+/,
        patt_question_answer = /answer\/\d+/,
        patt_video = /\/zvideo\//,
        patt_tip = /zhihu_e_tips/
    let postList = document.querySelectorAll('h2.ContentItem-title a');
    postNum = document.querySelectorAll('small.zhihu_e_tips');
    //console.log(`${postList.length} ${postNum.length}`)
    if (postList.length > postNum.length) {
        for (let num = postNum.length;num<postList.length;num++) {
            if (!patt_tip.test(postList[num].innerHTML)) { //                判断是否已添加
                if (patt_zhuanlan.test(postList[num].href)) { //             如果是文章
                    postList[num].innerHTML = `<small class="zhihu_e_tips" style="color: #ffffff;font-weight: normal;font-size: 12px;padding: 0 3px;border-radius: 2px;background-color: #2196F3;display: inline-block;height: 18px;">文章</small> ` + postList[num].innerHTML
                } else if (patt_question.test(postList[num].href)) { //      如果是问题
                    if (patt_question_answer.test(postList[num].href)) { //  如果是指向回答的问题（而非指向纯问题的链接）
                        postList[num].innerHTML = `<small class="zhihu_e_tips" style="color: #ffffff;font-weight: normal;font-size: 12px;padding: 0 3px;border-radius: 2px;background-color: #f68b83;display: inline-block;height: 18px;">问题</small> ` + postList[num].innerHTML
                    } else {
                        postList[num].innerHTML = `<small class="zhihu_e_tips" style="color: #ffffff;font-weight: normal;font-size: 12px;padding: 0 3px;border-radius: 2px;background-color: #ff5a4e;display: inline-block;height: 18px;">问题</small> ` + postList[num].innerHTML
                    }
                } else if (patt_video.test(postList[num].href)) { //         如果是视频
                    postList[num].innerHTML = `<small class="zhihu_e_tips" style="color: #ffffff;font-weight: normal;font-size: 12px;padding: 0 3px;border-radius: 2px;background-color: #00BCD4;display: inline-block;height: 18px;">视频</small> ` + postList[num].innerHTML
                }
                //postNum += 1;
            }
        }
    }
}


// 监听 网页插入元素 事件
function addEventListener_DOMNodeInserted() {
    // 知乎免登录，来自：https://greasyfork.org/zh-CN/scripts/417126
    let removeLoginModal = e => {
        if (e.target.innerHTML && e.target.getElementsByClassName('Modal-wrapper').length > 0) {
            if (e.target.getElementsByClassName('Modal-wrapper')[0].querySelector('.signFlowModal')){
                e.target.getElementsByClassName('Modal-wrapper')[0].remove();
            }
            setTimeout(() => {document.documentElement.style.overflowY = 'scroll';}, 0);
        }
    }

    // 收起当前评论（监听点击事件，点击网页两侧空白处）
    let collapseNowComment = e => {
        if (e.target.innerHTML && e.target.getElementsByClassName('Modal-wrapper Modal-enter').length > 0) {
            document.getElementsByClassName('Modal-backdrop')[0].onclick = function(event){
                if (event.target==this) {
                    let closeButton = document.getElementsByClassName('Modal-closeButton')[0]
                    if(closeButton) {
                        closeButton.click();
                    }
                }
            }
        }
    }

    if (document.querySelector('button.AppHeader-login')){ // 未登录时才会监听并移除登录弹窗
        document.addEventListener('DOMNodeInserted', removeLoginModal);
        document.querySelector('button.AppHeader-login').onclick=function(){location.href='https://www.zhihu.com/signin';} // [登录]按钮跳转至登录页面
        document.querySelector('.AppHeader-profile button.Button--primary').onclick=function(){location.href='https://www.zhihu.com/signin';} // [加入知乎]按钮跳转至注册页面（实际上是同一个页面）
    } else if(window.location.href.indexOf("zhuanlan") > -1){
        document.addEventListener('DOMNodeInserted', removeLoginModal);
    }
    document.addEventListener('DOMNodeInserted', collapseNowComment); // 收起当前评论（监听点击事件，点击网页两侧空白处）
}


// 监听 XMLHttpRequest 事件
function EventXMLHttpRequest() {
    var _send = window.XMLHttpRequest.prototype.send
    function sendReplacement(data) {
        addTypeTips();
        return _send.apply(this, arguments);
    }
    window.XMLHttpRequest.prototype.send = sendReplacement;
}



// [完整显示时间 + 置顶显示时间] 功能修改自：https://greasyfork.org/scripts/402808（从 JQuery 改为原生 JavaScript，且优化了代码）
// 完整显示时间 + 置顶显示时间 - 首页
function topTime_index() {
    let topTime = document.querySelectorAll('.TopstoryItem');if (!topTime) return
    topTime.forEach(function(_this) {
        let ContentItemTime = _this.querySelector('.ContentItem-time');if (!ContentItemTime) return
        if (!(ContentItemTime.classList.contains('full')) && ContentItemTime.querySelector('span') && ContentItemTime.querySelector('span').innerText != null) {
            // 完整显示时间
            topTime_allTime(ContentItemTime)
            // 发布时间置顶
            topTime_publishTop(ContentItemTime, _this, 'ContentItem-meta')
        }
    });
}


// 完整显示时间 + 置顶显示时间 - 回答页
function topTime_question() {
    let topTime = document.querySelectorAll('.ContentItem.AnswerItem');if (!topTime) return
    topTime.forEach(function(_this) {
        let ContentItemTime = _this.querySelector('.ContentItem-time');if (!ContentItemTime) return
        if (!(ContentItemTime.classList.contains('full')) && ContentItemTime.querySelector('span') && ContentItemTime.querySelector('span').innerText != null) {
            // 完整显示时间
            topTime_allTime(ContentItemTime)
            // 发布时间置顶
            topTime_publishTop(ContentItemTime, _this, 'ContentItem-meta')
        }

    });

    // 问题创建时间
    if (!(document.querySelector('.QuestionPage .QuestionHeader-side p')) && window.location.href.indexOf("log") == -1) { // 没有执行过 且 非问题日志页
        let createtime = document.querySelector('.QuestionPage>[itemprop~=dateCreated]').getAttribute('content');
        let modifiedtime = document.querySelector('.QuestionPage>[itemprop~=dateModified]').getAttribute('content');
        createtime = getUTC8(new Date(createtime));
        modifiedtime = getUTC8(new Date(modifiedtime));
        // 添加到问题页右上角
        document.querySelector('.QuestionPage .QuestionHeader-side').insertAdjacentHTML('beforeEnd', '<div style=\"color:#8590a6; margin-top:15px\"><p>创建时间:&nbsp;&nbsp;' + createtime + '</p><p>最后编辑:&nbsp;&nbsp;' + modifiedtime + '</p></div>');
    }
}


// 完整显示时间 + 置顶显示时间 - 搜索结果页
function topTime_search() {
    let topTime = document.querySelectorAll('.ContentItem.AnswerItem, .ContentItem.ArticleItem');if (!topTime) return
    topTime.forEach(function(_this) {
        let ContentItemTime = _this.querySelector('.ContentItem-time');if (!ContentItemTime) return
        if (!(ContentItemTime.classList.contains('full')) && ContentItemTime.querySelector('span') && ContentItemTime.querySelector('span').innerText != null) {
            // 完整显示时间
            topTime_allTime(ContentItemTime)
            // 发布时间置顶
            topTime_publishTop(ContentItemTime, _this, 'SearchItem-meta')
        }

    });
}


// 完整显示时间 + 置顶显示时间 - 用户主页
function topTime_people() {
    let topTime = document.querySelectorAll('.ContentItem.AnswerItem, .ContentItem.ArticleItem');if (!topTime) return
    topTime.forEach(function(_this) {
        let ContentItemTime = _this.querySelector('.ContentItem-time');if (!ContentItemTime) return
        if (!(ContentItemTime.classList.contains('full')) && ContentItemTime.querySelector('span') && ContentItemTime.querySelector('span').innerText != null) {
            // 完整显示时间
            topTime_allTime(ContentItemTime)
            // 发布时间置顶
            topTime_publishTop(ContentItemTime, _this, 'ContentItem-meta')
        }

    });
}


// 完整显示时间 + 置顶显示时间 - 专栏/文章
function topTime_zhuanlan() {
    let ContentItemTime = document.querySelector('.ContentItem-time');if (!ContentItemTime) return
    // 完整显示时间
    if (menu_value('menu_allTime')) {
        if (ContentItemTime.innerText.indexOf('编辑于') > -1 && !(ContentItemTime.classList.contains('doneeeeee'))) {
            let bianjiyu = ContentItemTime.innerText;
            ContentItemTime.click();
            ContentItemTime.innerText = (ContentItemTime.innerText + "，" + bianjiyu)
            ContentItemTime.classList.add("doneeeeee");
        }
    }

    //发布时间置顶
    if (menu_value('menu_publishTop') && !(document.querySelector('.Post-Header > .ContentItem-time')) && !(document.querySelector('.ContentItem-meta > .ContentItem-time'))) {
        ContentItemTime.style.cssText = 'padding:0px 0px 0px 0px; margin-top: 14px'
        let temp_time = ContentItemTime.cloneNode(true);
        // ContentItemTime.style.display = 'none';
        if (window.location.href.indexOf("column") > -1){
            document.querySelector('.ContentItem-meta').insertAdjacentElement('beforeEnd', temp_time);
        } else {
            document.querySelector('.Post-Header').insertAdjacentElement('beforeEnd', temp_time);
        }
    }
}


// 完整显示时间
function topTime_allTime(ContentItemTime) {
    if (!menu_value('menu_allTime')) return
    if (ContentItemTime.innerText.indexOf("发布于") == -1 && ContentItemTime.innerText.indexOf("编辑于") > -1) { //只有 "编辑于" 时增加具体发布时间 data-tooltip
        let data_tooltip = ContentItemTime.querySelector('span').getAttribute('data-tooltip');
        let oldtext = ContentItemTime.querySelector('span').innerText;
        ContentItemTime.querySelector('span').innerText = data_tooltip + "，" + oldtext;
        ContentItemTime.classList.add('full');
    } else if (ContentItemTime.innerText.indexOf("发布于") > -1 && ContentItemTime.innerText.indexOf("编辑于") == -1) { //只有 "发布于" 时替换为具体发布时间 data-tooltip
        let data_tooltip = ContentItemTime.querySelector('span').getAttribute('data-tooltip');
        ContentItemTime.querySelector('span').innerText = data_tooltip;
        ContentItemTime.classList.add('full');
    }
}


// 发布时间置顶
function topTime_publishTop(ContentItemTime, _this, class_) {
    if (!menu_value('menu_publishTop')) return
    if (!ContentItemTime.parentNode.classList.contains(class_)) {
        let temp_time = ContentItemTime.cloneNode(true);
        //_this.querySelector('.RichContent .ContentItem-time').style.display = 'none';
        _this.querySelector('.' + class_).insertAdjacentElement('beforeEnd', temp_time);
    }
}


// UTC 标准时转 UTC+8 北京时间，来自：https://greasyfork.org/zh-CN/scripts/402808
function getUTC8(datetime) {
    let month = (datetime.getMonth() + 1) < 10 ? "0" + (datetime.getMonth() + 1) : (datetime.getMonth() + 1);
    let date = datetime.getDate() < 10 ? "0" + datetime.getDate() : datetime.getDate();
    let hours = datetime.getHours() < 10 ? "0" + datetime.getHours() : datetime.getHours();
    let minutes = datetime.getMinutes() < 10 ? "0" + datetime.getMinutes() : datetime.getMinutes();
    let seconds = datetime.getSeconds() < 10 ? "0" + datetime.getSeconds() : datetime.getSeconds();
    return (datetime.getFullYear() + "-" + month + "-" + date + "\xa0\xa0" + hours + ":" + minutes + ":" + seconds);
}


// 默认站外直链，修改自：https://greasyfork.org/scripts/402808（从 JQuery 改为原生 JavaScript）
function directLink () {
    let link, equal, colon, externalHref, protocol, path, newHref;
    // 文字链接
    link = document.querySelectorAll('a[class*="external"]')
    if (link) {
        link.forEach(function (_this) {
            if (_this.getElementsByTagName('span').length > 0) {
                newHref = _this.innerText;
                _this.setAttribute('href', newHref);
            } else if (_this.href.indexOf("link.zhihu.com/?target=") > -1) {
                externalHref = _this.href;
                newHref = externalHref.substring(externalHref = _this.href.indexOf("link.zhihu.com/?target=") + "link.zhihu.com/?target=".length);
                _this.setAttribute('href', decodeURIComponent(newHref));
            } else {
                externalHref = _this.href;
                if (externalHref.lastIndexOf("https%3A")) {
                    newHref = _this.href.substring(_this.href.lastIndexOf("https%3A"));
                } else if (externalHref.lastIndexOf("http%3A%2F%2F")) {
                    newHref = _this.href.substring(_this.href.lastIndexOf("http%3A"));
                }
                _this.setAttribute('href', decodeURIComponent(newHref));
            }
        });
    }

    // 卡片链接
    link = document.querySelectorAll('a[class*="LinkCard"]:not([class*="MCNLinkCard"]):not([class*="ZVideoLinkCard"])')
    if (link) {
        link.forEach(function (_this) {
            if (_this.getElementsByTagName('LinkCard-title').length > 0 && _this.getElementsByTagName('LinkCard-title')[0].indexOf("http") > -1) {
                newHref = _this.getElementsByTagName('LinkCard-title').innerText;
                _this.setAttribute('href', newHref);
            } else if (_this.href.indexOf("link.zhihu.com/?target=") > -1) {
                externalHref = _this.href;
                newHref = externalHref.substring(externalHref = _this.href.indexOf("link.zhihu.com/?target=") + "link.zhihu.com/?target=".length);
                _this.setAttribute('href', decodeURIComponent(newHref));
            } else {
                externalHref = _this.href;
                if (externalHref.lastIndexOf("https%3A")) {
                    newHref = _this.href.substring(_this.href.lastIndexOf("https%3A"));
                } else if (externalHref.lastIndexOf("http%3A%2F%2F")) {
                    newHref = _this.href.substring(_this.href.lastIndexOf("http%3A"));
                }
                _this.setAttribute('href', decodeURIComponent(newHref));
            }
        });
    }

    // 旧版视频卡片链接
    link = document.querySelectorAll('a.VideoCard-link')
    if (link) {
        link.forEach(function (_this) {
            if (_this.href.indexOf('link.zhihu.com/?target=') > -1) {
                externalHref = _this.href;
                equal = externalHref.lastIndexOf('http');
                colon = externalHref.lastIndexOf('%3A');
                protocol = externalHref.substring(equal, colon);
                path = externalHref.substring(colon + 5, externalHref.length);
                newHref = protocol + '://' + path;
                _this.setAttribute('href', decodeURIComponent(newHref));
            }
        });
    }
}


// 默认高清原图，修改自：https://greasyfork.org/scripts/402808（从 JQuery 改为原生 JavaScript）
function originalPic(){
    let pic = document.getElementsByTagName('img');if (!pic) return
    Array.from(pic).forEach(function(pic1){
        if (pic1.getAttribute('data-original') != undefined && pic1.className != 'comment_sticker') {
            if (pic1.getAttribute('src') != pic1.getAttribute('data-original')) {
                pic1.setAttribute('src', pic1.getAttribute('data-original'))
            }
        }
    });
}


// 默认折叠邀请，修改自：https://greasyfork.org/scripts/402808（从 JQuery 改为原生 JavaScript）
function questionInvitation(){
    let timer = setInterval(function(){
        let QuestionInvitation = document.querySelector('.QuestionInvitation-content');if (!QuestionInvitation) return
        clearInterval(timer);
        QuestionInvitation.style.display = "none";
        document.querySelector('.QuestionInvitation-title').innerHTML = document.querySelector('.QuestionInvitation-title').innerText + '<span style="color: #8590a6;font-size: 14px;"> 展开/折叠</span>'
        // 点击事件（展开/折叠）
        document.querySelector('.Topbar').onclick = function(){
            let QuestionInvitation = document.querySelector('.QuestionInvitation-content')
            if (QuestionInvitation.style.display == 'none') {
                QuestionInvitation.style.display = ''
            } else {
                QuestionInvitation.style.display = 'none'
            }
        }
    });
}


(function() {
    addEventListener_DOMNodeInserted(); //                              监听 网页插入元素 事件
    questionInvitation(); //                                            默认折叠邀请
    setInterval(originalPic,100); //                                    默认高清原图
    if (menu_value('menu_directLink')) setInterval(directLink, 100); // 默认站外直链

    if (window.location.href.indexOf("question") > -1) { //       回答页 //
        if (window.location.href.indexOf("waiting") == -1) {
            collapsedAnswer(); //                                       一键收起回答
            collapsedNowAnswer(".QuestionPage"); //                     收起当前回答 + 快捷返回顶部
            collapsedNowAnswer(".Question-main"); //                    收起当前回答 + 快捷返回顶部
        }
        setInterval(topTime_question, 300); //                          置顶显示时间
    } else if (window.location.href.indexOf("search") > -1) { // 搜索结果页 //
        collapsedAnswer(); //                                           一键收起回答
        collapsedNowAnswer("main div"); //                              收起当前回答 + 快捷返回顶部
        collapsedNowAnswer(".Search-container"); //                     收起当前回答 + 快捷返回顶部
        setInterval(topTime_search, 300); //                            置顶显示时间
        EventXMLHttpRequest(); //                                       区分问题文章
    } else if (window.location.href.indexOf("topic") > -1) { //   话题页 //
        if (window.location.href.indexOf("hot") > -1 || window.location.href.indexOf("top-answers") > -1) { // 仅限 [讨论] [精华]
            collapsedAnswer(); //                                       一键收起回答
            collapsedNowAnswer("main.App-main"); //                     收起当前回答 + 快捷返回顶部
            collapsedNowAnswer(".ContentLayout"); //                    收起当前回答 + 快捷返回顶部
            setInterval(topTime_people, 300); //                        置顶显示时间
            EventXMLHttpRequest(); //                                   区分问题文章
        }
    } else if (window.location.href.indexOf("zhuanlan") > -1){ //   文章 //
        backToTop("article.Post-Main.Post-NormalMain"); //              快捷返回顶部
        backToTop("div.Post-Sub.Post-NormalSub"); //                    快捷返回顶部
        setInterval(topTime_zhuanlan, 300); //                          置顶显示时间
    } else if (window.location.href.indexOf("column") > -1) { //    专栏 //
        collapsedAnswer(); //                                           一键收起回答
        collapsedNowAnswer("main div"); //                              收起当前回答 + 快捷返回顶部
        setInterval(topTime_zhuanlan, 300); //                          置顶显示时间
    } else if (window.location.href.indexOf("people") > -1 || window.location.href.indexOf("org") > -1) { // 用户主页 //
        collapsedAnswer(); //                                           一键收起回答
        collapsedNowAnswer("main div"); //                              收起当前回答 + 快捷返回顶部
        collapsedNowAnswer(".Profile-main"); //                         收起当前回答 + 快捷返回顶部
        setInterval(topTime_people, 300); //                            置顶显示时间
    } else { //                                                     首页 //
        collapsedAnswer(); //                                           一键收起回答
        collapsedNowAnswer("main div"); //                              收起当前回答 + 快捷返回顶部
        collapsedNowAnswer(".Topstory-container"); //                   收起当前回答 + 快捷返回顶部
        setInterval(topTime_index, 300); //                             置顶显示时间
        EventXMLHttpRequest(); //                                       区分问题文章
    }
})();