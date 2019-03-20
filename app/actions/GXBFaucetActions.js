import WalletDb from 'stores/WalletDb'
import WalletUnlockActions from "actions/WalletUnlockActions";
import SettingsStore from "stores/SettingsStore";
import {Signature} from "gxbjs/es";

const sortJSON = function (json) {
    var keys = Object.keys(json);
    keys.sort();
    var result = {};
    keys.forEach(function (k) {
        result[k] = json[k];
    });
    return result;
}

const getSign = function (body = '', account) {
    let self = this;
    return new Promise(function (resolve, reject) {
        WalletUnlockActions.unlock().then(function () {

            var my_active_pubkeys = account.getIn(['active', 'key_auths']).toJS();
            try {
                var pubkey = my_active_pubkeys[0];
                my_active_pubkeys.forEach(function (pub) {
                    if (pub[1] > pubkey[1]) {
                        pubkey = pub;
                    }
                })
                let private_key = WalletDb.getPrivateKey(pubkey[0]);
                if (!private_key) {
                    reject(new Error('未找到活跃账户私钥'));
                }
                else {
                    var signature = Signature.sign(body, private_key).toHex();
                    resolve(signature);
                }
            }
            catch (ex) {
                reject(ex);
            }
        }, function (err) {
            reject(err);
        })
    })
}

const getMerchantInfo = function (body, account) {
    body = sortJSON(body);
    let faucetAddress = SettingsStore.getSetting("faucet_address");
    if (window && window.location && window.location.protocol === "https:") {
        faucetAddress = faucetAddress.replace(/http:\/\//, "https://");
    }

    return new Promise(function (resolve, reject) {
        getSign(JSON.stringify(body), account).then(function (signature) {
            body.signature = signature;
            var params = Object.keys(body)
                .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(body[key]))
                .join("&")
                .replace(/%20/g, "+");
            fetch(faucetAddress + "/merchant/info?" + params, {
                method: "get",
                headers: {
                    "Accept": "application/json",
                    "Content-type": "application/json"
                }
            }).then(res=> {
                if (res.status < 200 || res.status >= 400) {
                    res.json().then(reject)
                }
                else {
                    res.json().then(resolve);
                }
            }).catch(err=> {
                reject(err)
            });
        })
    });
}


const getAccountLeagueList = function (body, account) {
    body = sortJSON(body);
    let faucetAddress = SettingsStore.getSetting("faucet_address");
    if (window && window.location && window.location.protocol === "https:") {
        faucetAddress = faucetAddress.replace(/http:\/\//, "https://");
    }

    return new Promise(function (resolve, reject) {
        getSign(JSON.stringify(body), account).then(function (signature) {
            body.signature = signature;
            var params = Object.keys(body)
                .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(body[key]))
                .join("&")
                .replace(/%20/g, "+");
            fetch(faucetAddress + "/datasource/league_list?" + params, {
                method: "get",
                headers: {
                    "Accept": "application/json",
                    "Content-type": "application/json"
                }
            }).then(res=> {
                if (res.status < 200 || res.status >= 400) {
                    res.json().then(reject)
                }
                else {
                    res.json().then(resolve);
                }
            }).catch(err=> {
                reject(err)
            });
        })
    });
}

const merchantApply = function (body, account) {
    body = sortJSON(body);
    let faucetAddress = SettingsStore.getSetting("faucet_address");
    if (window && window.location && window.location.protocol === "https:") {
        faucetAddress = faucetAddress.replace(/http:\/\//, "https://");
    }
    return new Promise(function (resolve, reject) {
        getSign(JSON.stringify(body), account).then(function (signature) {
            body.signature = signature;
            fetch(faucetAddress + "/merchant/create", {
                method: "post",
                headers: {
                    "Accept": "application/json",
                    "Content-type": "application/json"
                },
                body: JSON.stringify(body)
            }).then(res=> {
                if (res.status < 200 || res.status >= 400) {
                    res.json().then(reject)
                }
                else {
                    res.json().then(resolve);
                }
            }).catch(err=>reject(err));
        })
    });
}

const dataSourceApply = function (body, account) {
    body = sortJSON(body);
    let faucetAddress = SettingsStore.getSetting("faucet_address");
    if (window && window.location && window.location.protocol === "https:") {
        faucetAddress = faucetAddress.replace(/http:\/\//, "https://");
    }
    return new Promise(function (resolve, reject) {
        getSign(JSON.stringify(body), account).then(function (signature) {
            body.signature = signature;
            fetch(faucetAddress + "/dataSource/create", {
                method: "post",
                headers: {
                    "Accept": "application/json",
                    "Content-type": "application/json"
                },
                body: JSON.stringify(body)
            }).then(res=> {
                if (res.status < 200 || res.status >= 400) {
                    res.json().then(reject)
                }
                else {
                    res.json().then(resolve);
                }
            }).catch(err=>reject(err));
        })
    });
}

const isApplying = function (account_id) {
    let faucetAddress = SettingsStore.getSetting("faucet_address");
    if (window && window.location && window.location.protocol === "https:") {
        faucetAddress = faucetAddress.replace(/http:\/\//, "https://");
    }
    return new Promise(function (resolve, reject) {
        fetch(faucetAddress + "/account/applying?account_id=" + account_id, {
            method: "get",
            headers: {
                "Accept": "application/json",
                "Content-type": "application/json"
            }
        }).then(res=> {
            if (res.status < 200 || res.status >= 400) {
                res.json().then(reject)
            }
            else {
                res.json().then(resolve);
            }
        }).catch(err=>reject(err));
    })
}

const getLeagueMemberCount = function (league_id) {
    let faucetAddress = SettingsStore.getSetting("faucet_address");
    if (window && window.location && window.location.protocol === "https:") {
        faucetAddress = faucetAddress.replace(/http:\/\//, "https://");
    }
    return new Promise(function (resolve, reject) {
        fetch(faucetAddress + "/leagueDataSource/memberCount?league_id=" + league_id, {
            method: "get",
            headers: {
                "Accept": "application/json",
                "Content-type": "application/json"
            }
        }).then(res=> {
            if (res.status < 200 || res.status >= 400) {
                res.json().then(reject)
            }
            else {
                res.json().then(resolve);
            }
        }).catch(err=>reject(err));
    })
}

const getLeagueMembers = function (league_id) {
    let faucetAddress = SettingsStore.getSetting("faucet_address");
    if (window && window.location && window.location.protocol === "https:") {
        faucetAddress = faucetAddress.replace(/http:\/\//, "https://");
    }
    return new Promise(function (resolve, reject) {
        fetch(faucetAddress + "/leagueDataSource/memberInfo?league_id=" + league_id, {
            method: "get",
            headers: {
                "Accept": "application/json",
                "Content-type": "application/json"
            }
        }).then(res=> {
            if (res.status < 200 || res.status >= 400) {
                res.json().then(reject)
            }
            else {
                res.json().then(resolve);
            }
        }).catch(err=>reject(err));
    })
}

const getLatestVersion = function () {
    let faucetAddress = SettingsStore.getSetting("faucet_address");
    if (window && window.location && window.location.protocol === "https:") {
        faucetAddress = faucetAddress.replace(/http:\/\//, "https://");
    }
    return new Promise(function (resolve, reject) {
        fetch(faucetAddress + "/chain/latest_version", {
            method: "get",
            headers: {
                "Accept": "application/json",
                "Content-type": "application/json"
            }
        }).then(res=> {
            if (res.status < 200 || res.status >= 400) {
                res.json().then(reject)
            }
            else {
                res.json().then(resolve);
            }
        }).catch(err=>reject(err));
    })
}

export default{
    getLatestVersion,
    getMerchantInfo,
    getAccountLeagueList,
    getLeagueMemberCount,
    getLeagueMembers,
    merchantApply,
    dataSourceApply,
    isApplying
}

