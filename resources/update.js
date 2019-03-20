(function () {
    var lang = localStorage.getItem('locale') || 'zh-CN';
    var ipcRenderer = require('electron').ipcRenderer;
    var messages = {
        'en-US': {
            title: 'Software Update',
            releaseTitle: 'New release has been published',
            desc: 'version is available',
            detailLabel: 'Release detail',
            later: 'Install Later',
            now: 'Install Now'
        },
        'zh-CN': {
            title: '软件更新',
            releaseTitle: '新版本已发布',
            desc: '版本已发布',
            detailLabel: '更新详情',
            later: '稍后安装',
            now: '立即安装'
        }
    };

    var locales = messages[lang];
    if (!locales) {
        locales = locales['zh-CN'];
    }

    var releaseNoteFilter = function (str, lang) {
        function filterStr(str) {
            if (/^<br\s*>|<br\s*\/>.*/.test(str)) {
                return str.replace(/<br\s*>|<br\s*\/>/, '');
            } else {
                return str;
            }
        }

        var cnReg = /[zZ][hH]-[cC][nN]:/;
        var enReg = /[eE][nN]-[uU][sS]:/;
        let cnIndex = cnReg.exec(str);
        cnIndex && (cnIndex = cnIndex.index);
        let enIndex = enReg.exec(str);
        enIndex && (enIndex = enIndex.index);

        let cnStr;
        let enStr;

        // if annotation not exist, return original value directly
        if (cnIndex === null || enIndex === null) {
            return str;
        }

        if (cnIndex < enIndex) {
            cnStr = str.substring(cnIndex + 6, enIndex);
            enStr = str.substring(enIndex + 6);
        } else {
            enStr = str.substring(enIndex + 6, cnIndex);
            cnStr = str.substring(cnIndex + 6);
        }

        return lang.toLowerCase() === 'zh-cn' ? filterStr(cnStr) : filterStr(enStr);
    };

    document.title = locales.title;
    document.getElementById('title').innerText = locales.releaseTitle;
    document.getElementById('desc').innerText = locales.desc;
    document.getElementById('detailLabel').innerText = locales.detailLabel;
    document.getElementById('btnLater').innerText = locales.later;
    document.getElementById('btnInstall').innerText = locales.now;

    ipcRenderer.on('releaseNoteGet', function(evt, message){
        var releaseNote = message.message;
        var version = message.version;
        document.getElementById('version').innerText = version;
        document.getElementById('releaseNotes').innerHTML = releaseNoteFilter(releaseNote, lang);
    });
})();
