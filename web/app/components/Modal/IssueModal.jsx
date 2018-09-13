import React from "react";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import utils from "common/utils";
import counterpart from "counterpart";
import AssetActions from "actions/AssetActions";
import AccountSelector from "../Account/AccountSelector";
import AmountSelector from "../Utility/AmountSelector";
import {ChainStore} from "gxbjs";

class IssueModal extends React.Component {

    static propTypes = {
        globalObject: ChainTypes.ChainObject.isRequired,
        core: ChainTypes.ChainAsset.isRequired,
        asset_to_issue: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        globalObject: "2.0.0",
        core: "1.3.1"
    };

    constructor (props) {
        super (props);
        this.state = {
            fee_asset_id: '1.3.1',
            feeAsset: null,
            amount: props.amount,
            to: props.to,
            to_id: null,
            memo: ''
        };
    }

    _getAvailableAssets () {
        const {account} = this.props;
        let asset_types = [], fee_asset_types = [];
        if (!(account && account.get ("balances"))) {
            return {asset_types, fee_asset_types};
        }
        let account_balances = account.get ("balances").toJS ();
        asset_types = Object.keys (account_balances).sort (utils.sortID);
        fee_asset_types = Object.keys (account_balances).sort (utils.sortID);
        for (let key in account_balances) {
            let asset = ChainStore.getObject (key);
            if (key !== '1.3.1') {
                fee_asset_types.splice(fee_asset_types.indexOf(key), 1);
                continue;
            }
            if (asset) {
                let balanceObject = ChainStore.getObject (account_balances[key]);
                if (balanceObject && balanceObject.get ("balance") === 0) {
                    asset_types.splice (asset_types.indexOf (key), 1);
                    if (fee_asset_types.indexOf (key) !== -1) {
                        fee_asset_types.splice (fee_asset_types.indexOf (key), 1);
                    }
                }
                if (asset.get ("id") !== "1.3.1" && !utils.isValidPrice (asset.getIn (["options", "core_exchange_rate"]))) {
                    fee_asset_types.splice (fee_asset_types.indexOf (key), 1);
                }
            }
        }

        return {asset_types, fee_asset_types};
    }

    onAmountChanged ({amount, asset}) {
        this.setState ({amount: amount});
    }

    onToAccountChanged (to) {
        let state = to ? {to: to.get ('name'), to_id: to.get ('id')} : {to_id: null};
        this.setState (state);
    }

    onFeeChanged ({asset}) {
        this.setState ({feeAsset: asset});
    }

    onToChanged (to) {
        this.setState ({to: to, to_id: null});
    }

    onSubmit () {
        let {asset_to_issue} = this.props;
        let precision = utils.get_asset_precision (asset_to_issue.get ("precision"));
        let amount = this.state.amount.replace (/,/g, "");
        amount *= precision;

        AssetActions.issueAsset (
            this.state.to_id,
            asset_to_issue.get ("issuer"),
            asset_to_issue.get ("id"),
            amount,
            this.state.memo ? new Buffer (this.state.memo, "utf-8") : this.state.memo,
            this.state.feeAsset ? this.state.feeAsset.get ('id') : '1.3.1'
        );

        this.setState ({
            to:null,
            amount: null,
            to_id: null,
            memo: ''
        });
    }

    onMemoChanged (e) {
        this.setState ({memo: e.target.value});
    }

    render () {
        let {feeAsset, fee_asset_id} = this.state;
        let {core, globalObject} = this.props;
        let asset_to_issue = this.props.asset_to_issue.get ('id');
        let tabIndex = 1;

        let {asset_types, fee_asset_types} = this._getAvailableAssets ();

        let fee = 'N/A';

        fee = utils.estimateFee ('asset_issue', null, globalObject);

        // Finish fee estimation
        if (feeAsset && feeAsset.get ("id") !== "1.3.1" && core) {
            let price = utils.convertPrice (core, feeAsset.getIn (["options", "core_exchange_rate"]).toJS (), null, feeAsset.get ("id"));
            fee = utils.convertValue (price, fee, core, feeAsset);

            if (parseInt (fee, 10) !== fee) {
                fee += 1; // Add 1 to round up;
            }
        }
        if (core && fee !== 'N/A') {
            fee = utils.limitByPrecision (utils.get_asset_amount (fee, feeAsset || core), feeAsset ? feeAsset.get ("precision") : core.get ("precision"));
        }

        fee = <AmountSelector
            label="account.user_issued_assets.issue_fee"
            disabled={true}
            amount={fee}
            onChange={this.onFeeChanged.bind (this)}
            asset={fee_asset_types.length && feeAsset ? feeAsset.get ("id") : (fee_asset_types.length === 1 ? fee_asset_types[0] : fee_asset_id ? fee_asset_id : fee_asset_types[0])}
            assets={fee_asset_types}
            tabIndex={2}
        />;

        return (<form className="grid-block vertical full-width-content">
            <div className="grid-container " style={{paddingTop: "2rem"}}>
                {/* T O */}
                <div className="content-block">
                    <AccountSelector
                        label={"modal.issue.to"}
                        accountName={this.state.to}
                        onAccountChanged={this.onToAccountChanged.bind (this)}
                        onChange={this.onToChanged.bind (this)}
                        account={this.state.to}
                        tabIndex={tabIndex++}
                    />
                </div>

                {/* A M O U N T */}
                <div className="content-block">
                    <AmountSelector
                        label="modal.issue.amount"
                        amount={this.state.amount}
                        onChange={this.onAmountChanged.bind (this)}
                        asset={asset_to_issue}
                        assets={[asset_to_issue]}
                        tabIndex={tabIndex++}
                    />
                </div>

                {/*  M E M O  */}
                <div className="content-block">
                    <label><Translate component="span" content="transfer.memo"/> (<Translate
                        content="transfer.optional"/>)</label>
                    <textarea rows="1" value={this.state.memo} tabIndex={tabIndex++}
                              onChange={this.onMemoChanged.bind (this)}/>

                </div>

                {/*  F E E  */}
                <div className="content-block">
                    {fee}
                </div>


                <div className="content-block button-group">
                    <input
                        type="submit"
                        className="button success"
                        onClick={this.onSubmit.bind (this, this.state.to, this.state.amount)}
                        value={counterpart.translate ("modal.issue.submit")}
                        tabIndex={tabIndex++}
                    />

                    <div
                        className="button"
                        onClick={this.props.onClose}
                        tabIndex={tabIndex++}
                    >
                        {counterpart.translate ("cancel")}
                    </div>


                </div>
            </div>
        </form>);
    }
}

export default BindToChainState (IssueModal);
