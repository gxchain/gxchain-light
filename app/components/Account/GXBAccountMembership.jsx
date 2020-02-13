import React from "react";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import AccountActions from "actions/AccountActions";
import Translate from "react-translate-component";
import {ChainStore} from "gxbjs/es";
import utils from "common/utils";
import cname from "classnames";

class GXBAccountMembership extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        gprops: ChainTypes.ChainObject.isRequired,
        core_asset: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        gprops: "2.0.0",
        core_asset: "1.3.1"
    };

    constructor(props) {
        super(props);
        this.state = {
            isCommittee: -1,
            isWitness: -1,
            witness_id: "",
            url: "",
            signing_key: "",
            commission_rate: 0,
            commission_update_time: "",
            is_banned: false
        };
    }

    handelChange(e){
        this.setState({
            url: e.target.value
        });
    }
    handelChangeSigningkey(e){
        this.setState({
            signing_key: e.target.value
        });
    }

    handelChangeCommissionRate(e){
        let value = e.target.value;
        value = value.match(/^\d*(\.?\d{0,1})/g)[0] || "";
        e.target.value = value;
        this.setState({
            commission_rate: value
        });
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!utils.are_equal_shallow(this.props.account, nextProps.account)) {
            this.loadTrustNodeStatus(nextProps);
        }
        return !(utils.are_equal_shallow(this.state, nextState) && utils.are_equal_shallow(this.props, nextProps));
    }

    componentDidMount() {
        this.loadTrustNodeStatus();
    }

    loadTrustNodeStatus(props) {
        console.log("load status");
        this.setState({
            isWitness: -1,
            isCommittee: -1
        });
        props = props || this.props;
        if (props.isMyAccount) {
            let account = props.account.toJS();
            Promise.all([ChainStore.fetchWitnessByAccount(account.id), ChainStore.fetchCommitteeMemberByAccount(account.id)]).then(results => {
                console.log(results[0]);
                this.setState({
                    witness_id: results[0] && results[0].get("id"),
                    isWitness: !!results[0],
                    isCommittee: !!results[1],
                    url: results[0] && results[0].get("url"),
                    signing_key: results[0] && results[0].get("signing_key"),
                    commission_rate: results[0] && results[0].get("commission_rate") / 10,
                    commission_update_time: results[0] && results[0].get("commission_update_time"),
                    is_banned: results[0] && results[0].get("is_banned"),
                });
            });
        }
    }

    getAccountMemberStatus(account) {
        if (account === undefined) return undefined;
        if (account === null) return "unknown";

        if (account.get("membership_expiration_date") !== "1970-01-01T00:00:00") {
            return "lifetime";
        } else {
            return "basic";
        }
    }

    render() {
        console.log("render");
        let {isMyAccount, gprops, core_asset} = this.props;
        let account = this.props.account.toJS();

        let set_commission_interval = gprops.getIn([
            "parameters",
            "extensions",
            2,
            1,
            "set_commission_interval"
        ]);
        let commission_update_time = new Date(this.state.commission_update_time).getTime();
        let isCooldown = (new Date().getTime() - commission_update_time) < set_commission_interval * 1000;
        let account_name = account.name;

        let member_status = this.getAccountMemberStatus(this.props.account);
        let membership = "account.member." + member_status;
        let network_fee = account.network_fee_percentage / 100;
        let lifetime_cost = gprops.getIn(["parameters", "current_fees", "parameters", 8, 1, "membership_lifetime_fee"]) * gprops.getIn(["parameters", "current_fees", "scale"]) / 10000;
        return (
            <div className="grid-content" style={{overflowX: "hidden"}}>
                <div className="content-block">
                    {!isMyAccount || member_status === "lifetime" ? (
                        <div>
                            <Translate content={membership}/>
                        </div>
                    ) : (
                        <div>
                            <div className="large-6 medium-8">
                                {/*<HelpContent path="components/AccountMembership" section="lifetime"*/}
                                {/*feesCashback={100 - network_fee}*/}
                                {/*price={{amount: lifetime_cost, asset: core_asset}}/>*/}
                                <div className="button no-margin"
                                     onClick={this.upgradeAccount.bind(this, account.id, true)}>
                                    <Translate content="account.member.upgrade_lifetime"/>
                                </div>
                            </div>
                        </div>
                    )}
                    <br/>
                    
                    {this.state.isWitness == 1 && this.state.isCommittee == 1 ?
                        <div>
                            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                                <div><Translate content="account.member.trust_node_candidate"/>&nbsp;{this.state.witness_id}</div>
                                {
                                    this.state.is_banned ?
                                    <div>
                                        <button className="button" onClick={this.unbannedWitness.bind(this, this.state.witness_id, account)}>
                                            <Translate content="wallet.unbanned" />
                                        </button>
                                    </div> : null
                                }
                            </div>
                            <hr/>
                            <div>
                                <label>url</label> 
                                
                                <input type="text" onChange={this.handelChange.bind(this)} defaultValue={this.state.url}  />

                                <label>signing_key</label> 

                                <input type="text" onChange={this.handelChangeSigningkey.bind(this)} defaultValue={this.state.signing_key}/>
                                <div>
                                    <button className="button" onClick={this.updateWitness.bind(this, this.state.witness_id, account, this.state.url, this.state.signing_key)}>
                                        <Translate content="wallet.submit" />
                                    </button>
                                </div>
                            </div>

                            <hr/>

                            <div>
                                <label>Commission Rate</label>
                                <div style={{display: "flex",alignItems: "center"}}>
                                    <input type="number" min="0" max="100" onChange={this.handelChangeCommissionRate.bind(this)} defaultValue={this.state.commission_rate} /><span>%</span>
                                </div>
                                <div>
                                    <button className={cname("button", {
                                        disabled: isCooldown
                                    })} onClick={this.updateCommissionRate.bind(this, this.state.witness_id, account, this.state.commission_rate)}>
                                        <Translate content="wallet.submit" />
                                    </button>
                                </div>
                            </div>
                                
                        </div> 

                        :
                        !(isMyAccount && member_status === "lifetime" && this.state.isWitness > -1 && this.state.isWitness > -1) ? null :
                            <div>
                                <div className="large-6 medium-8">
                                    <div className="button no-margin"
                                         onClick={this.upgradeTrustNode.bind(this, account, "")}>
                                        <Translate content="account.member.upgrade_trust_node"/>
                                    </div>
                                </div>
                            </div>
                    }
                </div>
            </div>
        );
    }

    upgradeAccount(id, lifetime, e) {
        e.preventDefault();
        AccountActions.upgradeAccount(id, lifetime);
    }

    upgradeTrustNode(account, url, e) {
        e.preventDefault();
        AccountActions.upgradeTrustNode(account.id, account.active.key_auths[0][0], url, !this.state.isCommittee, !this.state.isWitness);
    }

    updateWitness(witness_id, account, url, signing_key, e) {
        e.preventDefault();
        AccountActions.updateWitness(witness_id, account.id, signing_key, url);
    }
    updateCommissionRate(witness_id, account, rate, e) {
        e.preventDefault();
        AccountActions.updateCommissionRate(witness_id, account.id, rate * 10);
    }
    unbannedWitness(witness_id, account, e) {
        e.preventDefault();
        AccountActions.unbannedWitness(witness_id, account.id);
    }


}

GXBAccountMembership = BindToChainState(GXBAccountMembership);

export default GXBAccountMembership;
