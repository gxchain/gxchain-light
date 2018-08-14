export const settingsAPIs = (() => {
    if (__DEV__ || __TEST__) {
        return {
            DEFAULT_WS_NODE: "ws://192.168.1.118:28090",
            WS_NODE_LIST: [
                {url: "ws://192.168.1.118:28090", location: "开发环境"}
            ],
            DEFAULT_FAUCET: "http://192.168.1.118:1337/gateway",
            DEFAULT_STATISTICS: "http://192.168.1.124:8218/getStatisticsInfo"
        };
    }
    if (__TESTNET__) {
        return {
            DEFAULT_WS_NODE: "wss://testnet.gxchain.org",
            WS_NODE_LIST: [
                {url: "wss://testnet.gxchain.org", location: "testnet"}
            ],
            DEFAULT_FAUCET: "https://testnet.faucet.gxchain.org",
            DEFAULT_STATISTICS: "https://wallet.gxb.io/statistics/getStatisticsInfo"
        };
    }
    return {
        DEFAULT_WS_NODE: "wss://node1.gxb.io",
        WS_NODE_LIST: [
            {url: "wss://node1.gxb.io", location: "华东节点"},
            {url: "wss://node5.gxb.io", location: "华南节点"},
            {url: "wss://node8.gxb.io", location: "华北节点"},
            {url: "wss://node11.gxb.io", location: "香港节点"},
            {url: "wss://node15.gxb.io", location: "美国节点"},
            {url: "wss://node16.gxb.io", location: "东京节点"},
            {url: "wss://node17.gxb.io", location: "新加坡节点"}
        ],
        DEFAULT_FAUCET: "https://opengateway.gxb.io",
        DEFAULT_STATISTICS: "https://wallet.gxb.io/statistics/getStatisticsInfo"
    };
})();
