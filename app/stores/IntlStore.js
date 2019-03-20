import alt from "alt-instance";
import IntlActions from "actions/IntlActions";
import SettingsActions from "actions/SettingsActions";
import counterpart from "counterpart";
var locale_cn = require("json-loader!assets/locales/locale-cn");
import ls from "common/localStorage";
let ss = new ls("__gxb__");

counterpart.registerTranslations("cn", locale_cn);
counterpart.setFallbackLocale("en");

import {addLocaleData} from "react-intl";

import en from "react-intl/locale-data/en";
// import es from "react-intl/locale-data/es";
// import fr from "react-intl/locale-data/fr";
// import ko from "react-intl/locale-data/ko";
import zh from "react-intl/locale-data/zh";
// import de from "react-intl/locale-data/de";
// import tr from "react-intl/locale-data/tr";
// import ru from "react-intl/locale-data/ru";

addLocaleData(en);
// addLocaleData(es);
// addLocaleData(fr);
// addLocaleData(ko);
addLocaleData(zh);
// addLocaleData(de);
// addLocaleData(tr);
// addLocaleData(ru);

class IntlStore {
    constructor() {
        this.currentLocale = ss.has("settings_v4") ? ss.get("settings_v4").locale : "cn";

        this.locales = ["cn"];
        this.localesObject = {cn: locale_cn};

        this.bindListeners({
            onSwitchLocale: IntlActions.switchLocale,
            onGetLocale: IntlActions.getLocale,
            onClearSettings: SettingsActions.clearSettings
        });
    }

    hasLocale(locale) {
        return this.locales.indexOf(locale) !== -1;
    }

    getCurrentLocale() {
        return this.currentLocale;
    }

    onSwitchLocale({locale, localeData}) {
        switch (locale) {
        case "cn":
            counterpart.registerTranslations("cn", this.localesObject.cn);
            break;

        default:
            counterpart.registerTranslations(locale, localeData);
            break;
        }

        counterpart.setLocale(locale);
        this.currentLocale = locale;
    }

    onGetLocale(locale) {
        if (this.locales.indexOf(locale) === -1) {
            this.locales.push(locale);
        }
    }

    onClearSettings() {
        this.onSwitchLocale({locale: "cn"});
    }
}

export default alt.createStore(IntlStore, "IntlStore");
