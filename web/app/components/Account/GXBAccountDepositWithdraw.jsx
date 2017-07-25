import React from 'react'
import {Tabs,Tab} from '../Utility/Tabs'
import BindToChainState from "../Utility/BindToChainState";

class GXBAccountDepositWithdraw extends React.Component{
    _renderBalances(balanceList, optionalAssets, visible) {
        let {settings, hiddenAssets} = this.props;
        let preferredUnit = settings.get("unit") || "1.3.0";
        let showAssetPercent = settings.get("showAssetPercent", false);

        let balances = [];
        balanceList.forEach( balance => {
            let balanceObject = ChainStore.getObject(balance);
            let asset_type = balanceObject.get("asset_type");
            let asset = ChainStore.getObject(asset_type);

            let assetInfoLinks;
            let settleLink, transferLink;
            let symbol = "";
            if (!asset) return null;

            const assetName = asset.get("symbol");
            symbol = asset.get("symbol");
            /* Table content */
            const assetDetailURL = `/asset/${symbol}`;

            /* Popover content */
            settleLink = <a href onClick={this._onSettleAsset.bind(this, asset.get("id"))}>
                <Translate content="account.settle"/></a>;
            assetInfoLinks = (
                <ul>
                    <li><a href={assetDetailURL} onClick={this._onNavigate.bind(this, assetDetailURL)}><Translate content="account.asset_details"/></a></li>
                    {isBitAsset ? <li>{settleLink}</li> : null}
                </ul>);

            const includeAsset = !hiddenAssets.includes(asset_type);
            const hasBalance = !!balanceObject.get("balance");

            balances.push(
                <tr key={asset.get("symbol")} style={{maxWidth: "100rem"}}>
                    <td style={{textAlign: "right"}}>
                        {hasBalance || hasOnOrder ? <BalanceComponent balance={balance} assetInfo={assetInfoLinks}/> : null}
                    </td>
                    <td style={{textAlign: "right"}} className="column-hide-small">
                        {hasBalance || hasOnOrder ? <BalanceValueComponent balance={balance} toAsset={preferredUnit}/> : null}
                    </td>
                    
                    <td style={{textAlign: "center"}}>
                        {transferLink}
                        {canDepositWithdraw && this.props.isMyAccount? (
                            <span>
                                {this._getSeparator(hasBalance || hasOnOrder)}
                                <a onClick={this._showDepositWithdraw.bind(this, "deposit_modal", assetName, false)}>
                                    <Translate content="gateway.deposit" />
                                </a>
                            </span>
                        ) : null}
                        {canWithdraw && this.props.isMyAccount? (
                            <span>
                                {this._getSeparator(canDepositWithdraw || hasBalance)}
                                <a className={!canWithdraw ? "disabled" : ""} onClick={canWithdraw ? this._showDepositWithdraw.bind(this, "withdraw_modal", assetName, false) : () => {}}>
                                    <Translate content="modal.withdraw.submit" />
                                </a>
                            </span>
                        ) : null}
                    </td>

                    <td style={{textAlign: "center"}} className="column-hide-small" data-place="bottom" data-tip={counterpart.translate("tooltip." + (includeAsset ? "hide_asset" : "show_asset"))}>
                        <a style={{marginRight: 0}} className={includeAsset ? "order-cancel" : "action-plus"} onClick={this._hideAsset.bind(this, asset_type, includeAsset)}>
                            <Icon name={includeAsset ? "cross-circle" : "plus-circle"} className="icon-14px" />
                        </a>
                    </td>
                </tr>
            );
        });

        const currentIndex = balances.length;

        function sortAlphabetic(a, b) {
            if (a.key > b.key) return 1;
            if (a.key < b.key) return -1;
            return 0;
        };

        balances.sort(sortAlphabetic);
        openOrders.sort(sortAlphabetic);
        return {balances, openOrders};
    }
    render(){
        return (
            <div className="grid-container container-deposit-withdraw">
                <h4>区块链资产</h4>
                <table className="table">
                    <thead>
                    <tr>
                        <th>资产名称</th>
                        <th>账户余额</th>
                        <th>操作</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>公信币</td>
                        <td>19,223.0000&nbsp;GXC</td>
                        <td><a>充值</a></td>
                    </tr>
                    </tbody>
                </table>

                <h4 style={{marginTop:'2rem'}}>下一步</h4>
                <Tabs>
                    <Tab title="公信币充值">
                        <table className="table">
                            <tbody>
                            <tr>
                                <td>充值地址:</td>
                                <td>
                                    <label>caochong&nbsp;<span className="tip">(为了从其他人或者承兑商获得GXC，你只需要提供你的账户名)</span></label>
                                </td>
                            </tr>
                            <tr>
                                <td>充值资产:</td>
                                <td>
                                    <label>GXC&nbsp;(公信币)</label>
                                </td>
                            </tr>
                            <tr>
                                <td>您将收到:</td>
                                <td>
                                    <label>GXC&nbsp;(公信币)</label>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                        <p className="note">备注：公信宝运营公司作为网关提供公信币和人民币1:1的承兑服务</p>
                    </Tab>
                    <Tab title="人民币充值">
                        <table className="table">
                            <tbody>
                            <tr>
                                <td>充值地址:</td>
                                <td>
                                    请和您的公信宝专属商户经理联系，如果您还没有专属商户经理，请访问公信宝官方网站联系我们 <a href="https://gxb.io">https://gxb.io</a>
                                </td>
                            </tr>
                            <tr>
                                <td>充值资产:</td>
                                <td>
                                    <label>RMB&nbsp;(人民币)</label>
                                </td>
                            </tr>
                            <tr>
                                <td>您将收到:</td>
                                <td>
                                    <label>GXC&nbsp;(公信币)</label>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                        <p className="note">备注：公信宝运营公司作为网关提供公信币和人民币1:1的承兑服务</p>
                    </Tab>
                </Tabs>
            </div>
        )
    }
}

export  default BindToChainState(GXBAccountDepositWithdraw)