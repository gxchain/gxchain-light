export const settingsAPIs = (()=> {
    if(__DEV__||__TEST__){
        return {
            DEFAULT_WS_NODE: "ws://192.168.1.118:28090",
            WS_NODE_LIST: [
                {url: "ws://192.168.1.118:28090", location: '测试环境'}
            ],
            DEFAULT_FAUCET: "http://192.168.1.118:1337"
        }
    }
    if(__PRE__){
        return {
            DEFAULT_WS_NODE: "ws://192.168.2.244:28090",
            WS_NODE_LIST: [
                {url: "ws://192.168.2.244:28090", location: '244节点'},
                {url: "ws://192.168.2.245:28090", location: '245节点'},
                {url: "ws://192.168.2.246:28090", location: '246节点'},
                {url: "ws://192.168.2.247:28090", location: '247节点'}
            ],
            DEFAULT_FAUCET: "http://192.168.2.244:1337"
        }
    }
    return {
        DEFAULT_WS_NODE: "wss://node1.gxb.io",
        WS_NODE_LIST: [
            {url: "wss://node1.gxb.io", location: '华东节点'},
            {url: "wss://node5.gxb.io", location: '华南节点'},
            {url: "wss://node8.gxb.io", location: '华北节点'},
            {url: "wss://node11.gxb.io", location: '香港节点'}
        ],
        // DEFAULT_FAUCET: "http://localhost:1341",
        // DEFAULT_FAUCET: "http://192.168.1.118:1337",
        DEFAULT_FAUCET: "https://opengateway.gxb.io"
    }
})();
