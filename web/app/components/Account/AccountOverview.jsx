import React from "react";
import Immutable from "immutable";
import Translate from "react-translate-component";
import BalanceComponent from "../Utility/BalanceComponent";
import {BalanceValueComponent} from "../Utility/EquivalentValueComponent";
import AssetName from "../Utility/AssetName";
import {RecentTransactions} from "./RecentTransactions";
import Proposals from "components/Account/Proposals";
import {ChainStore} from "gxbjs/es";
import SettingsActions from "actions/SettingsActions";
import assetUtils from "common/asset_utils";
import counterpart from "counterpart";
import Icon from "../Icon/Icon";
import {Link} from "react-router";
import ChainTypes from "../Utility/ChainTypes";
import FormattedAsset from "../Utility/FormattedAsset";
import BindToChainState from "../Utility/BindToChainState";
import utils from "common/utils";
import ReactTooltip from "react-tooltip";
import {Apis} from "gxbjs-ws";
import GXBDepositModal from '../Modal/GXBDepositModal'
import GXBLoyaltyPlanModal from '../Modal/GXBLoyaltyPlanModal'
import AccountImage from "./AccountImage";

let logos = {
    GXC: require('assets/logo-gxc.png'),
    GXS: require('assets/logo-gxs.png')
}

class AccountOverview extends React.Component {

    static propTypes = {
        balanceAssets: ChainTypes.ChainAssetsList,
        globalObject: ChainTypes.ChainObject.isRequired,
    };

    static defaultProps = {
        globalObject: "2.0.0"
    }

    constructor() {
        super();
        this.state = {
            showHidden: false,
            depositAsset: null,
            withdrawAsset: null
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !utils.are_equal_shallow(nextProps.balanceAssets, this.props.balanceAssets) || !utils.are_equal_shallow(nextProps.balances, this.props.balances) ||
            nextProps.account !== this.props.account ||
            nextProps.settings !== this.props.settings ||
            nextProps.hiddenAssets !== this.props.hiddenAssets || !utils.are_equal_shallow(nextState, this.state)
        );
    }

    _hideAsset(asset, status) {
        SettingsActions.hideAsset(asset, status);
    }

    showGXBDeposit(asset) {
        this.refs['gxb-deposit-modal'].refs['bound_component'].show(asset);
    }

    showLoyaltyPlanModal(balanceObject) {
        this.refs['gxb-loyalty-program-modal'].refs['bound_component'].show(balanceObject);
    }

    // _showDepositWithdraw(action, asset, fiatModal, e) {
    //     e.preventDefault();
    //     this.setState({
    //         [action === "deposit_modal" ? "depositAsset" : "withdrawAsset"]: asset,
    //         fiatModal
    //     }, () => {
    //         this.refs[action].show();
    //     });
    // }

    _getSeparator(render) {
        return render ? <span> | </span> : null;
    }

    _onNavigate(route, e) {
        e.preventDefault();
        this.props.router.push(route);
    }

    _renderBalances(balanceList) {
        let {settings, account} = this.props;
        let showAssetPercent = settings.get("showAssetPercent", false);
        let balances = [];
        let programs = this.props.globalObject.getIn(['parameters', 'extensions']).find(function (arr) {
            return arr.toJS()[0] == 6;
        });

        balanceList.forEach(balance => {

            let balanceObject = null;

            if (balance.balance_id != '2.5.-1') {
                balanceObject = ChainStore.getObject(balance.balance_id);
            }
            else {
                balanceObject = Immutable.fromJS({
                    id: balance.balance_id, owner: account.get('id'), asset_type: balance.asset_type, balance: "0"
                });
            }
            let asset_type = balanceObject.get("asset_type");
            let asset = ChainStore.getObject(asset_type);

            let assetInfoLinks;
            let transferLink;
            if (!asset) return null;

            /* Table content */
            const assetDetailURL = `/asset/${asset.get("symbol")}`;

            transferLink = <Link to={`/transfer?asset=${asset.get("id")}`}><Translate
                content="transaction.trxTypes.transfer"/></Link>;

            /* Popover content */
            assetInfoLinks = (
                <ul>
                    <li><a href={assetDetailURL} onClick={this._onNavigate.bind(this, assetDetailURL)}><Translate
                        content="account.asset_details"/></a></li>
                </ul>);

            const hasBalance = !!balanceObject.get("balance") && balance.balance_id != '2.5.-1';

            balances.push(
                <div key={asset.get('symbol')} className="grid-content assets-card">
                    <div className="card">
                        <h4 className="title text-center">{asset.get('symbol')}</h4>
                        <div className="card-content">
                            <div className="text-center">
                                {logos[asset.get('symbol')] ?
                                    <img className="align-center" style={{width: '3rem', height: '3rem'}}
                                         src={`${logos[asset.get('symbol')]}`}></img> :
                                    <AccountImage size={{width: 35, height: 35}} account={asset.get('symbol')}/>}
                            </div>
                            {programs && asset_type == '1.3.1' && this.props.isMyAccount ?
                                <a onClick={this.showLoyaltyPlanModal.bind(this, balanceObject)}
                                   className="btn-loyalty-program"><Translate content="loyalty_program.join"/></a> : null}
                            <table className="table key-value-table">
                                <tbody>
                                <tr>
                                    <td><Translate content="account.asset"/></td>
                                    <td>{hasBalance ? <BalanceComponent balance={balanceObject.get('id')}
                                                                        assetInfo={assetInfoLinks}/> :
                                        <BalanceComponent amount={0} asset_type={asset.get('symbol')}
                                                          assetInfo={assetInfoLinks}/>}</td>
                                </tr>
                                <tr>
                                    <td><Translate content="account.transfer_actions"/></td>
                                    <td>
                                        {hasBalance ? transferLink : null}
                                        {this.props.isMyAccount ? (
                                            <span>{this._getSeparator(hasBalance)}
                                                <a onClick={this.showGXBDeposit.bind(this, asset)}>
                                                     <Translate content="gateway.deposit"/>
                                                     </a>
                                                </span>
                                        ) : null}
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/*<tr key={asset.get("symbol")} style={{maxWidth: "100rem"}}>
                     <td style={{textAlign: "left"}}>
                     {hasBalance ? <BalanceComponent balance={balance.balance_id} assetInfo={assetInfoLinks}/> : null}
                     </td>
                     // <td style={{textAlign: "right"}} className="column-hide-small">
                     //     {hasBalance ? <BalanceValueComponent balance={balance.balance_id} toAsset={preferredUnit}/> : null}
                     // </td>
                     <td style={{textAlign: "center"}}>
                     {transferLink}
                     {this.props.isMyAccount ? (
                     <span>
                     {this._getSeparator(hasBalance)}
                     <a onClick={this.showGXBDeposit.bind(this,asset)}>
                     <Translate content="gateway.deposit"/>
                     </a>
                     </span>
                     ) : null}
                     // this.props.isMyAccount&&canWithdraw? (
                     //  <span>
                     //  {this._getSeparator(true)}
                     //  <a onClick={this._showDepositWithdraw.bind(this, "withdraw_modal", assetName, false)}>
                     //  <Translate content="modal.withdraw.submit" />
                     //  </a>
                     //  </span>
                     //  ) : null
                     </td>

                     <td style={{textAlign: "center"}} className="column-hide-small" data-place="bottom"
                     data-tip={counterpart.translate("tooltip." + (includeAsset ? "hide_asset" : "show_asset"))}>
                     <a style={{marginRight: 0}} className={includeAsset ? "order-cancel" : "action-plus"}
                     onClick={this._hideAsset.bind(this, asset_type, includeAsset)}>
                     <Icon name={includeAsset ? "cross-circle" : "plus-circle"} className="icon-14px"/>
                     </a>
                     </td>
                     </tr>*/}
                </div>
            );
        });

        function sortAlphabetic(a, b) {
            if (a.key > b.key) return 1;
            if (a.key < b.key) return -1;
            return 0;
        };

        balances.sort(sortAlphabetic);
        return {balances};
    }

    _toggleHiddenAssets() {
        this.setState({
            showHidden: !this.state.showHidden
        });
    }

    render() {
        let {account, hiddenAssets} = this.props;

        if (!account) {
            return null;
        }

        let includedBalances, hiddenBalances;
        let account_balances = account.get("balances") || new Immutable.Map();
        if (!account_balances.has('1.3.0')) {
            account_balances = account_balances.merge({
                '1.3.0': '2.5.-1'
            })
        }
        if (!account_balances.has('1.3.1')) {
            account_balances = account_balances.merge({
                '1.3.1': '2.5.-1'
            })
        }

        let includedBalancesList = Immutable.List(), hiddenBalancesList = Immutable.List();
        if (account_balances) {
            // Filter out balance objects that have 0 balance or are not included in open orders
            // account_balances = account_balances.filter((a, index) => {
            // let balanceObject = ChainStore.getObject(a);
            // if (balanceObject && (!balanceObject.get("balance") && !orders[index])) {
            //     return false;
            // } else {
            //     return true;
            // }
            // return true;
            // });

            // Separate balances into hidden and included
            account_balances.forEach((a, asset_type) => {
                if (hiddenAssets.includes(asset_type)) {
                    hiddenBalancesList = hiddenBalancesList.push({asset_type: asset_type, balance_id: a});
                } else {
                    includedBalancesList = includedBalancesList.push({asset_type: asset_type, balance_id: a});
                }
            });

            let included = this._renderBalances(includedBalancesList, true);
            includedBalances = included.balances;
        }

        return (
            <div className="grid-container">
                <div className="grid-content" style={{overflowX: "hidden"}}>
                    <div className="content-block small-12">
                        <div className="generic-bordered-box">
                            <div className="block-content-header" style={{position: "relative"}}>
                                <Translate content="transfer.balances"/>
                            </div>
                            <div className="grid-block small-up-1 medium-up-2 large-up-2 no-overflow">
                                {includedBalances}
                            </div>
                            {/*<table className="table">
                             <thead>
                             <tr>
                             <th style={{textAlign: "left"}}><Translate component="span"
                             content="account.asset"/></th>
                             <th style={{textAlign: "center"}}>
                             <Translate content="account.transfer_actions"/>
                             </th>
                             <th></th>
                             </tr>
                             </thead>
                             <tbody>

                             </tbody>
                             </table>*/}
                        </div>
                    </div>

                    {account.get("proposals") && account.get("proposals").size ?
                        <div className="content-block">
                            <div className="block-content-header">
                                <Translate content="explorer.proposals.title"/>
                            </div>
                            <Proposals account={account.get("id")}/>
                        </div> : null}

                    <div className="content-block">
                        <RecentTransactions
                            accountsList={Immutable.fromJS([account.get("id")])}
                            compactView={false}
                            showMore={true}
                            fullHeight={true}
                            limit={10}
                            showFilters={true}
                        />
                    </div>

                    {/* Deposit Modal
                     <SimpleDepositWithdraw
                     ref="deposit_modal"
                     action="deposit"
                     fiatModal={this.state.fiatModal}
                     account={this.props.account.get("name")}
                     sender={this.props.account.get("id")}
                     asset={this.state.depositAsset}
                     modalId="simple_deposit_modal"
                     balances={this.props.balances}
                     {...currentDepositAsset}
                     />
                     */}
                    {/* Withdraw Modal
                     <SimpleDepositWithdraw
                     ref="withdraw_modal"
                     action="withdraw"
                     fiatModal={this.state.fiatModal}
                     account={this.props.account.get("name")}
                     sender={this.props.account.get("id")}
                     asset={this.state.withdrawAsset}
                     modalId="simple_withdraw_modal"
                     balances={this.props.balances}
                     {...currentWithdrawAsset}
                     />
                     */}
                </div>
                <GXBDepositModal account={account} ref="gxb-deposit-modal"></GXBDepositModal>
                <GXBLoyaltyPlanModal account={account} ref="gxb-loyalty-program-modal"/>
            </div>
        );
    }
}

AccountOverview = BindToChainState(AccountOverview);

class BalanceWrapper extends React.Component {

    static propTypes = {
        balances: ChainTypes.ChainObjectsList,
        orders: ChainTypes.ChainObjectsList
    };

    static defaultProps = {
        balances: Immutable.List(),
        orders: Immutable.List()
    };

    componentWillMount() {

    }

    render() {
        let balanceAssets = this.props.balances.map(b => {
            return b && b.get("asset_type");
        }).filter(b => !!b);
        if (balanceAssets.indexOf('1.3.0') == -1) {
            balanceAssets.push('1.3.0');
        }
        if (balanceAssets.indexOf('1.3.1') == -1) {
            balanceAssets.push('1.3.1');
        }

        let ordersByAsset = this.props.orders.reduce((orders, o) => {
            let asset_id = o.getIn(["sell_price", "base", "asset_id"]);
            if (!orders[asset_id]) orders[asset_id] = 0;
            orders[asset_id] += parseInt(o.get("for_sale"), 10);
            return orders;
        }, {});

        for (let id in ordersByAsset) {
            if (balanceAssets.indexOf(id) === -1) {
                balanceAssets.push(id);
            }
        }

        return (
            <AccountOverview {...this.state} {...this.props} orders={ordersByAsset}
                             balanceAssets={Immutable.List(balanceAssets)}/>
        );
    };
}

export default BindToChainState(BalanceWrapper);
