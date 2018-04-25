import alt from "alt-instance";
import WalletApi from "api/WalletApi";
import WalletDb from "stores/WalletDb";
import {ChainStore} from "gxbjs/es";
import {Apis} from "gxbjs-ws";

class DataMarketsActions {

    switchMarket() {
        return true;
    }
}

export default alt.createActions(DataMarketsActions);
