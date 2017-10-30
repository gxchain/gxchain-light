import React from "react";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import FormattedAsset from "../Utility/FormattedAsset";
import {ChainStore} from "gxbjs/es";
import utils from "common/utils";
import WalletActions from "actions/WalletActions";
import AccountActions from "actions/AccountActions";
import BindToChainState from "../Utility/BindToChainState";
import {Apis} from "gxbjs-ws";
import {Tabs, Tab} from "../Utility/Tabs";
import notify from "actions/NotificationActions";


class VestingBalance extends React.Component {

    _onClaim(claimAll, e) {
        e.preventDefault();
        WalletActions.claimVestingBalance(this.props.account.id, this.props.vb, claimAll).then(() => {
            typeof this.props.handleChanged == 'function' && this.props.handleChanged();
        });
    }

    render() {
        let {account, vb} = this.props;
        if (!this.props.vb) {
            return null;
        }
        // let vb = ChainStore.getObject( this.props.vb );
        // if (!vb) {
        //     return null;
        // }

        let cvbAsset, vestingPeriod, remaining, earned, secondsPerDay = 60 * 60 * 24,
            availablePercent, balance;
        if (vb) {
            balance = vb.balance.amount;
            cvbAsset = ChainStore.getAsset(vb.balance.asset_id);
            earned = vb.policy[1].coin_seconds_earned;
            vestingPeriod = vb.policy[1].vesting_seconds;

            availablePercent = earned / (vestingPeriod * balance);
        }

        let account_name = account.name;

        if (!cvbAsset) {
            return null;
        }

        if (!balance) {
            return null;
        }

        return (
            <div style={{paddingBottom: "1rem"}}>
                <div className="">
                    <div className="grid-content no-padding">
                        <Translate component="h5" content="account.vesting.balance_number" id={vb.id}/>

                        <table className="table key-value-table">
                            <tbody>
                            <tr>
                                <td><Translate content="account.member.cashback"/></td>
                                <td><FormattedAsset amount={vb.balance.amount} asset={vb.balance.asset_id}/></td>
                            </tr>
                            <tr>
                                <td><Translate content="account.member.earned"/></td>
                                <td>{utils.format_number(utils.get_asset_amount(earned / secondsPerDay, cvbAsset), 0)}
                                    <Translate content="account.member.coindays"/></td>
                            </tr>
                            <tr>
                                <td><Translate content="account.member.required"/></td>
                                <td>{utils.format_number(utils.get_asset_amount(vb.balance.amount * vestingPeriod / secondsPerDay, cvbAsset), 0)}
                                    <Translate content="account.member.coindays"/></td>
                            </tr>
                            <tr>
                                <td><Translate content="account.member.remaining"/></td>
                                <td>{utils.format_number(vestingPeriod * (1 - availablePercent) / secondsPerDay, 2)}
                                    days
                                </td>
                            </tr>
                            <tr>
                                <td><Translate content="account.member.available"/></td>
                                <td>{utils.format_number(availablePercent * 100, 2)}% / <FormattedAsset
                                    amount={availablePercent * vb.balance.amount} asset={cvbAsset.get("id")}/></td>
                            </tr>
                            <tr>
                                <td colSpan="2" style={{textAlign: "right"}}>
                                    <button onClick={this._onClaim.bind(this, false)} className="button outline">
                                        <Translate content="account.member.claim"/></button>
                                    <button onClick={this._onClaim.bind(this, true)} className="button outline">
                                        <Translate content="account.member.claim_all"/></button>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        );
    }
}

class LockedBalance extends React.Component {
    toDate(dateStr) {
        if (!/Z$/.test(dateStr)) {
            return new Date(dateStr + 'Z');
        }
        else {
            return new Date(dateStr);
        }
    }

    render() {
        let {balance, account} = this.props;
        if (!account || !balance) {
            return null;
        }
        let start_date = this.toDate(balance.create_date_time)
        let end_date = new Date(start_date.getTime());
        end_date = end_date.setDate(end_date.getDate() + Number(balance.lock_days) + 1);
        let canUnlock = new Date() - end_date >= 0;

        let lock_days = balance.lock_days > 1 ? counterpart.translate('loyalty_program.days', {day: balance.lock_days}) : counterpart.translate('loyalty_program.day', {day: balance.lock_days});

        return (
            <div style={{paddingBottom: '1rem'}}>
                <h5>
                    <Translate content={'loyalty_program.id'}/>:&nbsp;#{balance.id}
                </h5>
                <table className="table key-value-table">
                    <tbody>
                    <tr>
                        <td><Translate content="loyalty_program.start_date"/></td>
                        <td>{start_date.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td><Translate content="loyalty_program.term"/></td>
                        <td>{lock_days}</td>
                    </tr>
                    <tr>
                        <td><Translate content="loyalty_program.lock_amount"/></td>
                        <td>
                            <FormattedAsset amount={balance.amount.amount} asset={balance.amount.asset_id} decimalOffset={0}/>
                        </td>
                    </tr>
                    <tr>
                        <td><Translate content="loyalty_program.yearly_bonus"/></td>
                        <td>{balance.interest_rate / 100}%</td>
                    </tr>
                    <tr>
                        {canUnlock ? <td colSpan="2" style={{textAlign: "right"}}>
                            <button onClick={this._onUnlock.bind(this)} className="button outline">
                                <Translate content="loyalty_program.unlock"/></button>
                        </td> : null}
                    </tr>
                    </tbody>
                </table>
            </div>
        )
    }

    _onUnlock() {
        AccountActions.unlockLoyaltyProgram(this.props.account.id,this.props.balance.id).then(()=>{
            typeof this.props.handleChanged == 'function' && this.props.handleChanged();
        }).catch(ex=>{
            typeof this.props.handleChanged == 'function' && this.props.handleChanged();
        });
    }
}

class AccountVesting extends React.Component {
    constructor() {
        super();

        this.state = {
            vbs: null,
            lbs:null
        };
    }

    componentWillMount() {
        this.retrieveVestingBalances.call(this, this.props.account.get("id"));
        this.retrieveLockedBalances.call(this, this.props.account.get("id"));
    }

    reload() {
        this.retrieveVestingBalances.call(this, this.props.account.get("id"));
        this.retrieveLockedBalances.call(this, this.props.account.get("id"));
    }

    componentWillUpdate(nextProps) {
        let newId = nextProps.account.get("id");
        let oldId = this.props.account.get("id");

        if (newId !== oldId) {
            this.retrieveVestingBalances.call(this, newId);
            this.retrieveLockedBalances.call(this, newId);
        }
    }

    retrieveVestingBalances(accountId) {
        Apis.instance().db_api().exec("get_vesting_balances", [
            accountId
        ]).then(vbs => {
            this.setState({vbs});
        }).catch(err => {
            console.log("error:", err);
        });
    }

    retrieveLockedBalances(accountId){
        Apis.instance().db_api().exec("get_full_accounts", [
            [accountId],true
        ],true).then(results => {
            let full_account = results[0][1];
            let {locked_balances}=full_account;
            this.setState({
                lbs:locked_balances
            })
        }).catch(err => {
            console.log("error:", err);
        });
    }

    render() {
        let {vbs,lbs} = this.state;

        if (!this.props.account) {
            return null;
        }

        let account = this.props.account.toJS();

        let balances =vbs?vbs.map(vb => {
            if (vb.balance.amount) {
                return <VestingBalance key={vb.id} vb={vb} account={account} handleChanged={this.reload.bind(this)}/>;
            }
        }).filter(a => {
            return !!a;
        }):[];

        let locked_balances = lbs?lbs.map(balance => {
            return <LockedBalance key={`${balance.id}`} account={account} balance={balance} handleChanged={this.reload.bind(this)}/>
        }):[];

        return (
            <div className="grid-content" style={{overflowX: "hidden"}}>
                {/*<Translate content="account.vesting.explain" component="p"/>*/}
                <Tabs>
                    <Tab title="account.vesting.loyalty_program">
                        <Translate component="p" content="loyalty_program.desc"/>
                        {locked_balances.length == 0 ? (<h4 style={{paddingTop: "1rem"}}>
                            <Translate content={"loyalty_program.no_balances"}/>
                        </h4> ) : locked_balances}
                    </Tab>
                    <Tab title='account.vesting.witness_income'>
                        {!balances.length ?
                            <h4 style={{paddingTop: "1rem"}}>
                                <Translate content={"account.vesting.no_balances"}/>
                            </h4> : balances}
                    </Tab>
                </Tabs>

            </div>
        );
    }
}

AccountVesting.VestingBalance = VestingBalance;
AccountVesting.LockedBalance = LockedBalance;
export default BindToChainState(AccountVesting);
