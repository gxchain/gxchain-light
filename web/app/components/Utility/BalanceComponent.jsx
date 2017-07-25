import React from "react";
import FormattedAsset from "./FormattedAsset";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";

/**
 *  Given a balance_object, displays it in a pretty way
 *
 *  Expects one property, 'balance' which should be a balance_object id
 */

class BalanceComponent extends React.Component {

    static propTypes = {
        balance: ChainTypes.ChainObject,
        assetInfo: React.PropTypes.node
    }

    render() {
        let amount = typeof this.props.amount == 'undefined'?Number(this.props.balance.get("balance")):this.props.amount;
        let type = this.props.asset_type||this.props.balance.get("asset_type");
        return (<FormattedAsset amount={amount} asset={type} asPercentage={this.props.asPercentage} assetInfo={this.props.assetInfo} replace={this.props.replace} />);
    }
}

export default BindToChainState(BalanceComponent, {keep_updating: true});
