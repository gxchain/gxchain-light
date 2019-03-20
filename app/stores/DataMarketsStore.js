import alt from "alt-instance";
import DataMarketsActions from "actions/DataMarketsActions";
import ls from "common/localStorage";
import {ChainStore} from "gxbjs/es";

let marketStorage = new ls("__gxb__");

class DataMarketsStore {
    constructor() {

        this.marketReady = false;

        this.bindListeners({
            onSwitchMarket: DataMarketsActions.switchMarket
        });
    }

    onSwitchMarket() {
        this.marketReady = false;
    }

}

export default alt.createStore(DataMarketsStore, "DataMarketsStore");
