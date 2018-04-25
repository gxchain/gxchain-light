import React from "react";
import DataMarketList from './DataMarketList'
import LeagueList from './LeagueList'
import {Apis} from "gxbjs-ws";

import DataMarketsStore from "stores/DataMarketsStore";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import {connect} from "alt-react";
import {Tabs, Tab} from "../Utility/Tabs";

const MARKET_MAP = {
    FREE: 'FREE',
    LEAGUE: 'LEAGUE'
}

class DataMarket extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {

        if (this.props.children) {
            return this.props.children;
        }

        return (
            <div className="grid-block vertical">
                <Tabs setting="marketTabs" tabsClass="expand market-tab"
                      contentClass="grid-block page-layout" className="grid-block vertical data-markets">
                    <Tab title="data_market.free_market">
                        <DataMarketList key="market-free" router={this.props.router}></DataMarketList>
                    </Tab>
                    <Tab title="data_market.league_market">
                        <LeagueList key="market-league" router={this.props.router}></LeagueList>
                    </Tab>
                </Tabs>

            </div>
        )
    }

}

export default connect(DataMarket, {
    listenTo() {
        return [AccountStore, DataMarketsStore, SettingsStore];
    },
    getProps() {
        return {
            marketReady: () => {
                return DataMarketsStore.getState().marketReady;
            }
        };
    }
});