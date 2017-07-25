import React from "react";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import {Apis} from 'gxbjs-ws'
import BindToChainState from "../Utility/BindToChainState";

import AltContainer from "alt-container";
import Dashboard from "./Dashboard";

class DashboardContainer extends React.Component {
    render() {
        return (
            <AltContainer
                stores={[AccountStore, SettingsStore]}
                inject={{
                    linkedAccounts: () => {
                        return AccountStore.getState().linkedAccounts;
                    },
                    myIgnoredAccounts: () => {
                        return AccountStore.getState().myIgnoredAccounts;
                    },
                    accountsReady: () => {
                        return AccountStore.getState().accountsLoaded && AccountStore.getState().refsLoaded;
                    },
                    lastMarket: ()=>{
                        const chainID = Apis.instance().chain_id;
                        return SettingsStore.getState().viewSettings.get(`lastMarket${chainID ? ("_" + chainID.substr(0, 8)) : ""}`)
                    }
                }}>
                <Dashboard {...this.props} />
            </AltContainer>
        );
    }
}

export default BindToChainState(DashboardContainer,{show_loader:true});
