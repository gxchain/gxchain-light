import React, {PropTypes} from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import {Link as RealLink} from "react-router/es";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import classNames from "classnames";
import {FormattedDate} from "react-intl";
import Inspector from "react-json-inspector";
import utils from "common/utils";
import LinkToAccountById from "../Blockchain/LinkToAccountById";
import LinkToAssetById from "../Blockchain/LinkToAssetById";
import LinkToProductById from "../Blockchain/LinkToProductById";
import FormattedPrice from "../Utility/FormattedPrice";
import account_constants from "chain/account_constants";
import Icon from "../Icon/Icon";
import PrivateKeyStore from "stores/PrivateKeyStore";
import WalletUnlockActions from "actions/WalletUnlockActions";
import ProposedOperation from "./ProposedOperation";
import {ChainTypes, hash, ops} from "gxbjs/es";
import ReactTooltip from "react-tooltip";

let {operations} = ChainTypes;

require("./operations.scss");
require("./json-inspector.scss");

let opras = Object.keys(operations);
let listings = Object.keys(account_constants.account_listing);

class OpType extends React.Component {
    shouldComponentUpdate(nextProps) {
        return (
            nextProps.type !== this.props.type
        );
    }

    render() {
        let trxType = "transaction.trxTypes." + opras[this.props.type];
        let labelClass = classNames("txtlabel", this.props.color || "info");

        return (
            <tr>
                <td>
                    <span className={labelClass}>
                        <Translate component="span" content={trxType}/>
                    </span>
                </td>
                <td>
                </td>
            </tr>
        );
    }
}

class NoLinkDecorator extends React.Component {
    render() {
        return <span>{this.props.children}</span>;
    }
}

class OperationTable extends React.Component {

    render() {

        let fee_row = this.props.fee.amount > 0 ? (
            <tr>
                <td><Translate component="span" content="transfer.fee"/></td>
                <td><FormattedAsset color="fee" amount={this.props.fee.amount} asset={this.props.fee.asset_id}/></td>
            </tr>) : null;

        return (
            <div>
                {/*  <h6><Translate component="span" content="explorer.block.op" /> #{this.props.index + 1}/{this.props.opCount}</h6> */}
                <table className="table op-table">
                    <caption></caption>
                    <tbody>
                    <OpType type={this.props.type} color={this.props.color}/>
                    {this.props.children}
                    {fee_row}
                    </tbody>
                </table>
            </div>
        );
    }
}

class Transaction extends React.Component {

    componentDidMount() {
        ReactTooltip.rebuild();
    }

    linkToAccount(name_or_id) {
        if (!name_or_id) return <span>-</span>;
        let Link = this.props.no_links ? NoLinkDecorator : RealLink;
        return utils.is_object_id(name_or_id) ?
            <LinkToAccountById account={name_or_id}/> :
            <Link to={`/account/${name_or_id}/overview`}>{name_or_id}</Link>;
    }

    linkToAsset(symbol_or_id) {
        if (!symbol_or_id) return <span>-</span>;
        let Link = this.props.no_links ? NoLinkDecorator : RealLink;
        return utils.is_object_id(symbol_or_id) ?
            <LinkToAssetById asset={symbol_or_id}/> :
            <Link to={`/asset/${symbol_or_id}`}>{symbol_or_id}</Link>;
    }

    linkToProductById(product_id) {
        if (!product_id) return <span>-</span>;
        let Link = this.props.no_links ? NoLinkDecorator : RealLink;
        return utils.is_object_id(product_id) ?
            <LinkToProductById product={product_id}/> :
            {/*<Link to={`/asset/${symbol_or_id}`}>{symbol_or_id}</Link>;*/};
    }


    _toggleLock(e) {
        e.preventDefault();
        WalletUnlockActions.unlock().then(() => {
            this.forceUpdate();
        });
    }

    render() {
        let {trx, trx_id} = this.props;
        let info = null;
        info = [];

        let opCount = trx.operations.length;
        let memo = null;

        trx.operations.forEach((op, opIndex) => {
            let rows = [];
            let key = 0;

            let color = "";
            switch (opras[op[0]]) { // For a list of trx types, see chain_types.coffee

                case "transfer":

                    color = "success";

                    if (op[1].memo) {
                        let {text, isMine} = PrivateKeyStore.decodeMemo(op[1].memo);

                        memo = text ? (
                            <td className="memo">{text}</td>
                        ) : !text && isMine ? (
                            <td>
                                <Translate content="transfer.memo_unlock"/>&nbsp;
                                <a href onClick={this._toggleLock.bind(this)}>
                                    <Icon name="locked"/>
                                </a>
                            </td>
                        ) : null;
                    }

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transfer.from"/></td>
                            <td>{this.linkToAccount(op[1].from)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transfer.to"/></td>
                            <td>{this.linkToAccount(op[1].to)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transfer.amount"/></td>
                            <td><FormattedAsset amount={op[1].amount.amount} asset={op[1].amount.asset_id}/></td>
                        </tr>
                    );

                {
                    memo ?
                        rows.push(
                            <tr key={key++}>
                                <td><Translate content="transfer.memo"/></td>
                                {memo}
                            </tr>
                        ) : null;
                }

                    break;

                case "limit_order_create":
                    color = "warning";
                    // missingAssets = this.getAssets([op[1].amount_to_sell.asset_id, op[1].min_to_receive.asset_id]);
                    // let price = (!missingAssets[0] && !missingAssets[1]) ? utils.format_price(op[1].amount_to_sell.amount, assets.get(op[1].amount_to_sell.asset_id), op[1].min_to_receive.amount, assets.get(op[1].min_to_receive.asset_id), false, inverted) : null;
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="exchange.price"/></td>
                            <td>
                                <FormattedPrice
                                    base_asset={op[1].amount_to_sell.asset_id}
                                    quote_asset={op[1].min_to_receive.asset_id}
                                    base_amount={op[1].amount_to_sell.amount}
                                    quote_amount={op[1].min_to_receive.amount}
                                    noPopOver
                                />
                            </td>
                        </tr>
                    );

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="exchange.sell"/></td>
                            <td><FormattedAsset amount={op[1].amount_to_sell.amount}
                                                asset={op[1].amount_to_sell.asset_id}/></td>
                        </tr>
                    );

                    rows.push(
                        <tr key={key++}>
                            <td data-place="left" data-class="tooltip-zindex" className="tooltip"
                                data-tip={counterpart.translate("tooltip.buy_min")}><Translate component="span"
                                                                                               content="exchange.buy_min"/>
                            </td>
                            <td><FormattedAsset amount={op[1].min_to_receive.amount}
                                                asset={op[1].min_to_receive.asset_id}/></td>
                        </tr>
                    );

                    // rows.push(
                    //     <tr key="2">
                    //         <td><Translate component="span" content="transaction.min_receive" /></td>
                    //         <td>{!missingAssets[1] ? <FormattedAsset amount={op[1].min_to_receive.amount} asset={op[1].min_to_receive.asset_id} /> : null}</td>
                    //     </tr>
                    // );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.seller"/></td>
                            <td>{this.linkToAccount(op[1].seller)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.expiration"/></td>
                            <td>
                                <FormattedDate
                                    value={op[1].expiration}
                                    format="full"
                                />
                            </td>
                        </tr>
                    );

                    break;

                case "limit_order_cancel":
                    color = "cancel";
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.order_id"/></td>
                            <td>{op[1].order}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.block.fee_payer"/></td>
                            <td>{this.linkToAccount(op[1].fee_paying_account)}</td>
                        </tr>
                    );

                    break;

                case "short_order_cancel":
                    color = "cancel";
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.order_id"/></td>
                            <td>{op[1].order}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.block.fee_payer"/></td>
                            <td>{this.linkToAccount(op[1].fee_paying_account)}</td>
                        </tr>
                    );

                    break;

                case "call_order_update":
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.funding_account"/></td>
                            <td>{this.linkToAccount(op[1].funding_account)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.delta_collateral"/></td>
                            <td><FormattedAsset amount={op[1].delta_collateral.amount}
                                                asset={op[1].delta_collateral.asset_id}/></td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.delta_debt"/></td>
                            <td><FormattedAsset amount={op[1].delta_debt.amount} asset={op[1].delta_debt.asset_id}/>
                            </td>
                        </tr>
                    );
                    break;

                case "key_create":
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.block.fee_payer"/></td>
                            <td>{this.linkToAccount(op[1].fee_paying_account)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.block.key"/></td>
                            <td>{op[1].key_data[1]}</td>
                        </tr>
                    );

                    break;

                case "account_create":
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="account.name"/></td>
                            <td>{this.linkToAccount(op[1].name)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="account.member.registrar"/></td>
                            <td>{this.linkToAccount(op[1].registrar)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="account.member.lifetime_referrer"/></td>
                            <td>{this.linkToAccount(op[1].referrer)}</td>
                        </tr>
                    );

                    break;

                case "account_update":
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="account.name"/></td>
                            <td>{this.linkToAccount(op[1].account)}</td>
                        </tr>
                    );
                    // let voting_account = ChainStore.getAccount(op[1].new_options.voting_account)
                    // let updating_account = ChainStore.getAccount(op[1].account)
                    if (op[1].new_options) {
                        if (op[1].new_options.voting_account) {
                            // let proxy_account_name = voting_account.get('name')
                            rows.push(
                                <tr key={key++}>
                                    <td><Translate component="span" content="account.votes.proxy"/></td>
                                    <td>{this.linkToAccount(op[1].new_options.voting_account)}</td>
                                </tr>
                            );
                        }
                        else {
                            console.log("num witnesses: ", op[1].new_options.num_witness);
                            console.log("===============> NEW: ", op[1].new_options);
                            rows.push(
                                <tr key={key++}>
                                    <td><Translate component="span" content="account.votes.proxy"/></td>
                                    <td><Translate component="span" content="account.votes.no_proxy"/></td>
                                </tr>
                            );
                            rows.push(
                                <tr key={key++}>
                                    <td><Translate component="span" content="account.options.num_committee"/></td>
                                    <td>{op[1].new_options.num_committee}</td>
                                </tr>
                            );
                            rows.push(
                                <tr key={key++}>
                                    <td><Translate component="span" content="account.options.num_witnesses"/></td>
                                    <td>{op[1].new_options.num_witness}</td>
                                </tr>
                            );
                            rows.push(
                                <tr key={key++}>
                                    <td><Translate component="span" content="account.options.votes"/></td>
                                    <td>{JSON.stringify(op[1].new_options.votes)}</td>
                                </tr>
                            );
                        }

                        rows.push(
                            <tr key={key++}>
                                <td><Translate component="span" content="account.options.memo_key"/></td>
                                {/* TODO replace with KEY render component that provides a popup */}
                                <td>{op[1].new_options.memo_key.substring(0, 10) + "..."}</td>
                            </tr>
                        );
                    }


                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.block.common_options"/></td>
                            <td><Inspector data={op[1]} search={false}/></td>
                        </tr>
                    );

                    break;

                case "account_whitelist":
                    let listing;
                    for (var i = 0; i < listings.length; i++) {
                        if (account_constants.account_listing[listings[i]] === op[1].new_listing) {
                            console.log("listings:", listings[i]);
                            listing = listings[i];
                        }
                    }
                    ;

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.block.authorizing_account"/></td>
                            <td>{this.linkToAccount(op[1].authorizing_account)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.block.listed_account"/></td>
                            <td>{this.linkToAccount(op[1].account_to_list)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.block.new_listing"/></td>
                            <td><Translate content={`transaction.whitelist_states.${listing}`}/></td>
                        </tr>
                    );

                    break;

                case "account_upgrade":
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.block.account_upgrade"/></td>
                            <td>{this.linkToAccount(op[1].account_to_upgrade)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.block.lifetime"/></td>
                            <td>{op[1].upgrade_to_lifetime_member.toString()}</td>
                        </tr>
                    );
                    break;

                case "account_transfer":
                    /* This case is uncomplete, needs filling out with proper fields */
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transfer.from"/></td>
                            <td>{this.linkToAccount(op[1].account_id)}</td>
                        </tr>
                    );

                    break;

                case "asset_create":
                    color = "warning";

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.assets.issuer"/></td>
                            <td>{this.linkToAccount(op[1].issuer)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.assets.symbol"/></td>
                            <td>{this.linkToAsset(op[1].symbol)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.assets.precision"/></td>
                            <td>{op[1].precision}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="account.user_issued_assets.max_supply"/></td>
                            <td>{utils.format_asset(op[1].common_options.max_supply, op[1])}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="account.user_issued_assets.description"/></td>
                            <td>{op[1].common_options.description}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.market_fee"/></td>
                            <td>{op[1].common_options.market_fee_percent / 100}%</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.max_market_fee"/></td>
                            <td>{utils.format_asset(op[1].common_options.max_market_fee, op[1])}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.block.common_options"/></td>
                            <td><Inspector data={op[1]} search={false}/></td>
                        </tr>
                    );

                    break;

                case "asset_update":
                case "asset_update_bitasset":
                    console.log("op:", op);
                    color = "warning";

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.block.asset_update"/></td>
                            <td>{this.linkToAsset(op[1].asset_to_update)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.assets.issuer"/></td>
                            <td>{this.linkToAccount(op[1].issuer)}</td>
                        </tr>
                    );
                    if (op[1].new_issuer !== op[1].issuer) {
                        rows.push(
                            <tr key={key++}>
                                <td><Translate component="span" content="account.user_issued_assets.new_issuer"/></td>
                                <td>{this.linkToAccount(op[1].new_issuer)}</td>
                            </tr>
                        );
                    }
                    if (op[1].new_options.core_exchange_rate) {
                        rows.push(
                            <tr key={key++}>
                                <td><Translate component="span" content="markets.core_rate"/></td>
                                <td>
                                    <FormattedPrice
                                        base_asset={op[1].new_options.core_exchange_rate.base.asset_id}
                                        quote_asset={op[1].new_options.core_exchange_rate.quote.asset_id}
                                        base_amount={op[1].new_options.core_exchange_rate.base.amount}
                                        quote_amount={op[1].new_options.core_exchange_rate.quote.amount}
                                        noPopOver
                                    />
                                </td>
                            </tr>
                        );
                    }

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.block.new_options"/></td>
                            <td><Inspector data={op[1].new_options} search={false}/></td>
                        </tr>
                    );

                    break;

                case "asset_update_feed_producers":
                    color = "warning";
                    console.log("op:", op);
                    let producers = [];
                    op[1].new_feed_producers.forEach(producer => {
                        // let missingAsset = this.getAccounts([producer])[0];
                        producers.push(<div>{this.linkToAccount(producer)}<br/></div>);
                    });

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.block.asset_update"/></td>
                            <td>{this.linkToAsset(op[1].asset_to_update)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.block.new_producers"/></td>
                            <td>{producers}</td>
                        </tr>
                    );

                    break;

                case "asset_issue":
                    color = "warning";

                    if (op[1].memo) {
                        let {text, isMine} = PrivateKeyStore.decodeMemo(op[1].memo);

                        memo = text ? (
                            <td>{text}</td>
                        ) : !text && isMine ? (
                            <td>
                                <Translate content="transfer.memo_unlock"/>&nbsp;
                                <a href onClick={this._toggleLock.bind(this)}>
                                    <Icon name="locked"/>
                                </a>
                            </td>
                        ) : null;
                    }

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.assets.issuer"/></td>
                            <td>{this.linkToAccount(op[1].issuer)}</td>
                        </tr>
                    );

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.block.asset_issue"/></td>
                            <td><FormattedAsset style={{fontWeight: "bold"}} amount={op[1].asset_to_issue.amount}
                                                asset={op[1].asset_to_issue.asset_id}/></td>
                        </tr>
                    );

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transfer.to"/></td>
                            <td>{this.linkToAccount(op[1].issue_to_account)}</td>
                        </tr>
                    );

                {
                    memo ?
                        rows.push(
                            <tr key={key++}>
                                <td><Translate content="transfer.memo"/></td>
                                {memo}
                            </tr>
                        ) : null;
                }

                    break;

                case "asset_burn":
                    color = "cancel";

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.account.title"/></td>
                            <td>{this.linkToAccount(op[1].payer)}</td>
                        </tr>
                    );

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transfer.amount"/></td>
                            <td><FormattedAsset amount={op[1].amount_to_burn.amount}
                                                asset={op[1].amount_to_burn.asset_id}/></td>
                        </tr>
                    );

                    break;

                case "asset_fund_fee_pool":
                    color = "warning";
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.account.title"/></td>
                            <td>{this.linkToAccount(op[1].from_account)}</td>
                        </tr>
                    );

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.asset.title"/></td>
                            <td>{this.linkToAsset(op[1].asset_id)}</td>
                        </tr>
                    );

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transfer.amount"/></td>
                            <td><FormattedAsset amount={op[1].amount} asset={"1.3.1"}/></td>
                        </tr>
                    );

                    break;

                case "asset_settle":
                    color = "warning";

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.account.title"/></td>
                            <td>{this.linkToAccount(op[1].account)}</td>
                        </tr>
                    );

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.asset.title"/></td>
                            <td>{this.linkToAsset(op[1].amount.asset_id)}</td>
                        </tr>
                    );

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transfer.amount"/></td>
                            <td><FormattedAsset amount={op[1].amount.amount} asset={op[1].amount.asset_id}/></td>
                        </tr>
                    );

                    break;

                case "asset_publish_feed":
                    color = "warning";
                    let {feed} = op[1];

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.publisher"/></td>
                            <td>{this.linkToAccount(op[1].publisher)}</td>
                        </tr>
                    );

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.asset.title"/></td>
                            <td>{this.linkToAsset(op[1].asset_id)}</td>
                        </tr>
                    );

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span"
                                           content="explorer.asset.price_feed.maximum_short_squeeze_ratio"/></td>
                            <td>{(feed.maximum_short_squeeze_ratio / 1000).toFixed(2)}</td>
                        </tr>
                    );

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span"
                                           content="explorer.asset.price_feed.maintenance_collateral_ratio"/></td>
                            <td>{(feed.maintenance_collateral_ratio / 1000).toFixed(2)}</td>
                        </tr>
                    );

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="markets.core_rate"/></td>
                            <td>
                                <FormattedPrice
                                    base_asset={feed.core_exchange_rate.base.asset_id}
                                    quote_asset={feed.core_exchange_rate.quote.asset_id}
                                    base_amount={feed.core_exchange_rate.base.amount}
                                    quote_amount={feed.core_exchange_rate.quote.amount}
                                    noPopOver
                                />
                            </td>
                        </tr>
                    );

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.block.settlement_price"/></td>
                            <td>
                                <FormattedPrice
                                    base_asset={feed.settlement_price.base.asset_id}
                                    quote_asset={feed.settlement_price.quote.asset_id}
                                    base_amount={feed.settlement_price.base.amount}
                                    quote_amount={feed.settlement_price.quote.amount}
                                    noPopOver
                                />
                            </td>
                        </tr>
                    );

                    break;

                case "committee_member_create":

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.committee_member.title"/></td>
                            <td>{this.linkToAccount(op[1].committee_member_account)}</td>
                        </tr>
                    );

                    break;

                case "witness_create":

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.block.witness"/></td>
                            <td>{this.linkToAccount(op[1].witness_account)}</td>
                        </tr>
                    );

                    break;

                case "witness_update":

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.block.witness"/></td>
                            <td>{this.linkToAccount(op[1].witness_account)}</td>
                        </tr>
                    );

                    if (op[1].new_url) {
                        rows.push(
                            <tr key={key++}>
                                <td><Translate component="span" content="transaction.new_url"/></td>
                                <td><a href={op[1].new_url} target="_blank">{op[1].new_url}</a></td>
                            </tr>
                        );
                    }

                    break;

                case "balance_claim":
                    color = "success";

                    let bal_id = op[1].balance_to_claim.substring(5);
                    // console.log( "bal_id: ", bal_id, op[1].balance_to_claim );

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.claimed"/></td>
                            <td><FormattedAsset amount={op[1].total_claimed.amount}
                                                asset={op[1].total_claimed.asset_id}/></td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.deposit_to"/></td>
                            <td>{this.linkToAccount(op[1].deposit_to_account)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.balance_id"/></td>
                            <td>#{bal_id}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.balance_owner"/></td>
                            <td style={{fontSize: "80%"}}>{op[1].balance_owner_key.substring(0, 10)}...</td>
                        </tr>
                    );
                    break;

                case "vesting_balance_withdraw":
                    color = "success";

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transfer.to"/></td>
                            <td>{this.linkToAccount(op[1].owner)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transfer.amount"/></td>
                            <td><FormattedAsset amount={op[1].amount.amount} asset={op[1].amount.asset_id}/></td>
                        </tr>
                    );

                    break;

                case "transfer_to_blind":
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transfer.from"/></td>
                            <td>{this.linkToAccount(op[1].from)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transfer.amount"/></td>
                            <td><FormattedAsset amount={op[1].amount.amount} asset={op[1].amount.asset_id}/></td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.blinding_factor"/></td>
                            <td style={{fontSize: "80%"}}>{op[1].blinding_factor}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.outputs"/></td>
                            <td><Inspector data={op[1].outputs[0]} search={false}/></td>
                        </tr>
                    );
                    break;

                case "transfer_from_blind":
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transfer.to"/></td>
                            <td>{this.linkToAccount(op[1].to)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transfer.amount"/></td>
                            <td><FormattedAsset amount={op[1].amount.amount} asset={op[1].amount.asset_id}/></td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.blinding_factor"/></td>
                            <td style={{fontSize: "80%"}}>{op[1].blinding_factor}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.inputs"/></td>
                            <td><Inspector data={op[1].inputs[0]} search={false}/></td>
                        </tr>
                    );
                    break;

                case "blind_transfer":
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.inputs"/></td>
                            <td><Inspector data={op[1].inputs[0]} search={false}/></td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.outputs"/></td>
                            <td><Inspector data={op[1].outputs[0]} search={false}/></td>
                        </tr>
                    );
                    break;

                case "proposal_create":
                    var expiration_date = new Date(op[1].expiration_time + 'Z');
                    var has_review_period = op[1].review_period_seconds !== undefined;
                    var review_begin_time = !has_review_period ? null :
                        expiration_date.getTime() - op[1].review_period_seconds * 1000;
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="proposal_create.review_period"/></td>
                            <td>
                                {has_review_period ?
                                    <FormattedDate
                                        value={new Date(review_begin_time)}
                                        format="full"
                                    />
                                    : <span>&mdash;</span>}
                            </td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="proposal_create.expiration_time"/></td>
                            <td><FormattedDate
                                value={expiration_date}
                                format="full"
                            />
                            </td>
                        </tr>
                    );
                    var operations = [];
                    for (let pop of op[1].proposed_ops) operations.push(pop.op);

                    let proposalsText = op[1].proposed_ops.map((o, index) => {
                        return (
                            <ProposedOperation
                                key={index}
                                index={index}
                                op={o.op}
                                inverted={false}
                                hideFee={true}
                                hideOpLabel={true}
                                hideDate={true}
                                proposal={true}
                            />
                        );
                    });

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="proposal_create.proposed_operations"/></td>
                            <td>{proposalsText}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="proposal_create.fee_paying_account"/></td>
                            <td>{this.linkToAccount(op[1].fee_paying_account)}</td>
                        </tr>
                    );
                    break;

                case "proposal_update":
                    let fields = [
                        "active_approvals_to_add", "active_approvals_to_remove",
                        "owner_approvals_to_add", "owner_approvals_to_remove",
                        "key_approvals_to_add", "key_approvals_to_remove"
                    ];

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="proposal_create.fee_paying_account"/></td>
                            <td>{this.linkToAccount(op[1].fee_paying_account)}</td>
                        </tr>
                    );

                    fields.forEach((field) => {
                        if (op[1][field].length) {
                            rows.push(
                                <tr key={key++}>
                                    <td><Translate content={`proposal.update.${field}`}/></td>
                                    <td>{op[1][field].map(value => {
                                            return <div key={value}>{this.linkToAccount(value)}</div>;
                                        }
                                    )}
                                    </td>
                                </tr>
                            );
                        }
                    });

                    break;

                // proposal_delete

                case "asset_claim_fees":
                    color = "success";

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.claimed"/></td>
                            <td><FormattedAsset amount={op[1].amount_to_claim.amount}
                                                asset={op[1].amount_to_claim.asset_id}/></td>
                        </tr>
                    );

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.deposit_to"/></td>
                            <td>{this.linkToAccount(op[1].issuer)}</td>
                        </tr>
                    );

                    break;

                case "asset_reserve":

                    rows.push(
                        <tr key={key++}>
                            <td style={{textTranform: "capitalize"}}>
                                <Translate component="span" content="modal.reserve.from"/>
                            </td>
                            <td>{this.linkToAccount(op[1].payer)}</td>
                        </tr>
                    );

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.asset.title"/></td>
                            <td>{this.linkToAsset(op[1].amount_to_reserve.asset_id)}</td>
                        </tr>
                    );

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transfer.amount"/></td>
                            <td><FormattedAsset amount={op[1].amount_to_reserve.amount}
                                                asset={op[1].amount_to_reserve.asset_id}/></td>
                        </tr>
                    );
                    break;

                /* 数据交易相关 by xLogic */
                // 55:data_transaction_create
                case "data_transaction_create":
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span"
                                           content="transaction.trxOps.data_transaction_create.request_id"/></td>
                            <td style={{wordBreak: 'break-all'}}>{op[1].request_id}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span"
                                           content="transaction.trxOps.data_transaction_create.product_id"/></td>
                            <td>{this.linkToProductById(op[1].product_id)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span"
                                           content="transaction.trxOps.data_transaction_create.version"/></td>
                            <td>{op[1].version}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span"
                                           content="transaction.trxOps.data_transaction_create.requester"/></td>
                            <td>{this.linkToAccount(op[1].requester)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span"
                                           content="transaction.trxOps.data_transaction_create.create_date_time"/></td>
                            <td>{op[1].create_date_time ?
                                <FormattedDate value={op[1].create_date_time} format="full"/> : null}</td>
                        </tr>
                    );

                    break;
                // 57:data_transaction_pay
                case "data_transaction_pay":
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span"
                                           content="transaction.trxOps.data_transaction_pay.request_id"/></td>
                            <td style={{wordBreak: 'break-all'}}>{op[1].request_id}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.trxOps.data_transaction_pay.from"/>
                            </td>
                            <td>{this.linkToAccount(op[1].from)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.trxOps.data_transaction_pay.to"/></td>
                            <td>{this.linkToAccount(op[1].to)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="transaction.trxOps.data_transaction_pay.amount"/>
                            </td>
                            <td><FormattedAsset amount={op[1].amount.amount}
                                                asset={op[1].amount.asset_id}/></td>
                        </tr>
                    );

                    break;
                // 59:data_transaction_datasource_upload
                case "data_transaction_datasource_upload":
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span"
                                           content="transaction.trxOps.data_transaction_datasource_upload.request_id"/>
                            </td>
                            <td style={{wordBreak: 'break-all'}}>{op[1].request_id}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span"
                                           content="transaction.trxOps.data_transaction_datasource_upload.requester"/>
                            </td>
                            <td>{this.linkToAccount(op[1].requester)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span"
                                           content="transaction.trxOps.data_transaction_datasource_upload.datasource"/>
                            </td>
                            <td>{this.linkToAccount(op[1].datasource)}</td>
                        </tr>
                    );

                    break;
                case 'balance_lock':
                    let term = Number(op[1].program_id) > 1 ? counterpart.translate('loyalty_program.months', {month: op[1].program_id}) : counterpart.translate('loyalty_program.month', {month: op[1].program_id});
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="loyalty_program.lock_amount"/></td>
                            <td><FormattedAsset amount={op[1].amount.amount} asset={op[1].amount.asset_id}/></td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="loyalty_program.start_date"/></td>
                            <td><FormattedDate
                                value={op[1].create_date_time}
                                format="full"
                            /></td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="loyalty_program.term"/></td>
                            <td>{term}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="loyalty_program.yearly_bonus"/></td>
                            <td>{op[1].interest_rate / 100}%</td>
                        </tr>
                    );
                    break;
                case 'balance_unlock':
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="loyalty_program.id"/></td>
                            <td>{op[1].lock_id}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="loyalty_program.unlock_account"/></td>
                            <td>{this.linkToAccount(op[1].account)}</td>
                        </tr>
                    );
                    break;

                case "proxy_transfer":
                    color = "success";
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="proxy_transfer.from"/></td>
                            <td>{this.linkToAccount(op[1].request_params.from)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="proxy_transfer.to"/></td>
                            <td>{this.linkToAccount(op[1].request_params.to)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="proxy_transfer.amount"/></td>
                            <td><FormattedAsset amount={op[1].request_params.amount.amount}
                                                asset={op[1].request_params.amount.asset_id}/></td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="proxy_transfer.account"/></td>
                            <td>{this.linkToAccount(op[1].request_params.proxy_account)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="proxy_transfer.proxy_memo"/></td>
                            <td>{op[1].proxy_memo}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="proxy_transfer.memo"/></td>
                            <td>{op[1].request_params.memo}</td>
                        </tr>
                    );
                    break;

                case "create_contract":
                    color = "info";
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="create_contract.account"/></td>
                            <td>{this.linkToAccount(op[1].account)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="create_contract.contract_name"/></td>
                            <td>{this.linkToAccount(op[1].name)}</td>
                        </tr>
                    );
                    break;

                case "call_contract":
                    color = "success";
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="call_contract.account"/></td>
                            <td>{this.linkToAccount(op[1].account)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="call_contract.contract_name"/></td>
                            <td>{this.linkToAccount(op[1].contract_id)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="call_contract.method_name"/></td>
                            <td>{op[1].method_name}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++} style={{wordBreak: "break-all"}}>
                            <td><Translate component="span" content="call_contract.data"/></td>
                            <td>{op[1].data}</td>
                        </tr>
                    );

                    break;

                case "update_contract":
                    color = "warning";
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="update_contract.owner"/></td>
                            <td>{this.linkToAccount(op[1].owner)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="update_contract.new_owner"/></td>
                            <td>{this.linkToAccount(op[1].new_owner)}</td>
                        </tr>
                    );
                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="update_contract.contract_name"/></td>
                            <td>{this.linkToAccount(op[1].contract)}</td>
                        </tr>
                    );
                    break;

                default:
                    console.log("unimplemented op:", op);

                    rows.push(
                        <tr key={key++}>
                            <td><Translate component="span" content="explorer.block.op"/></td>
                            <td><Inspector data={op} search={false}/></td>
                        </tr>
                    );
                    break;
            }

            info.push(
                <OperationTable key={opIndex} opCount={opCount} index={opIndex} color={color} type={op[0]}
                                fee={op[1].fee}>
                    {rows}
                </OperationTable>
            );
        });

        let trx_id_row = trx_id ?
            (<div>
                <table style={{marginBottom: "1em"}} className="table op-table">
                    <tbody>
                    <tr>
                        <td><Translate component="span" content="transaction.tx_id"/></td>
                        <td><span className="txtlabel warning">{trx_id}</span></td>
                    </tr>
                    </tbody>
                </table>
            </div>) : null;

        return (
            <div>
                {/*     <h5><Translate component="span" content="explorer.block.trx" /> #{index + 1}</h5> */}
                {info}
                {trx_id_row}
            </div>
        );
    }
}

Transaction.defaultProps = {
    no_links: false
};

Transaction.propTypes = {
    trx: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    no_links: PropTypes.bool
};

export default Transaction;
