import {Manager} from "gxbjs-ws";
import {ChainStore} from "gxbjs/es";
// Stores
import iDB from "idb-instance";
import AccountRefsStore from "stores/AccountRefsStore";
import WalletManagerStore from "stores/WalletManagerStore";
import WalletDb from "stores/WalletDb";
import SettingsStore from "stores/SettingsStore";
import json from '../package.json';
import ls from "common/localStorage";
// Actions
import PrivateKeyActions from "actions/PrivateKeyActions";

const STORAGE_KEY = "__gxb__";
const ss = new ls(STORAGE_KEY);


ChainStore.setDispatchFrequency(20);

let connecting = false;
let connectionManager;
let connectPromise = null;

localStorage.getItem('lang') || localStorage.setItem('lang', 'zh-CN');
localStorage.setItem('version', json.version);

const init = (replaceState, nextState, callback) => {
    var db;
    try {
        db = iDB.init_instance(window.openDatabase ? (shimIndexedDB || indexedDB) : indexedDB).init_promise;
    } catch (err) {
        console.log("db init error:", err);
    }
    return Promise.all([db, SettingsStore.init(), ChainStore.init("willTransitionTo !init-error")]).then(() => {
        return Promise.all([
            PrivateKeyActions.loadDbData().then(() => AccountRefsStore.loadDbData()),
            WalletDb.loadDbData().then(() => {
                if (nextState.location.pathname.indexOf("/auth/") === 0) {
                    replaceState("/dashboard");
                }
            }).catch((error) => {
                console.error("----- WalletDb.willTransitionTo error ----->", error);
            }),
            WalletManagerStore.init()
        ]).then(() => {
            callback();
        });
    });
};


const willTransitionTo = (nextState, replaceState, callback) => {

    console.log(nextState.location.pathname);
    let urls = SettingsStore.getState().defaults.apiServer;
    let connectionString = SettingsStore.getSetting("apiServer");
    connectionString = connectionString || urls[0].url;

    if (!connectionManager) {
        connectionManager = new Manager({url: connectionString, urls: urls.map(o => o.url), autoFallback: true});
    }

    if (connectPromise) {
        connectPromise.then(function () {
            console.log(connectionManager.isConnected);
            if (connectionManager.isConnected) {
                init(replaceState, nextState, callback);
            }
        });
    } else {
        connectPromise = connectionManager.connectWithFallback(true).then(() => {
            init(replaceState, nextState, callback);
        }).catch(error => {
            console.error("----- App.willTransitionTo error ----->", error, (new Error).stack);
            if (error.name === "InvalidStateError") {
                if (__ELECTRON__) {
                    replaceState("/dashboard");
                } else {
                    alert("Can't access local storage.\nPlease make sure your browser is not in private/incognito mode.");
                }
            } else {
                replaceState("/init-error");
                callback();
            }
        });
    }
};

export default willTransitionTo;
