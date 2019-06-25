import React from "react";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import AccountActions from "actions/AccountActions";
import Translate from "react-translate-component";
import {ChainStore} from "gxbjs/es";
import utils from "common/utils";

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
            witness_id: '',
            url: '',
            signing_key: '',
        };
    }

    handelChange(e){
        this.setState({
            url: e.target.value
        })
    }
    handelChangeSigningkey(e){
        this.setState({
            signing_key: e.target.value
        })
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
        console.log('load status');
        this.setState({
            isWitness: -1,
            isCommittee: -1
        });
        props = props || this.props;
        if (props.isMyAccount) {
            let account = props.account.toJS();
            Promise.all([ChainStore.fetchWitnessByAccount(account.id), ChainStore.fetchCommitteeMemberByAccount(account.id)]).then(results => {
                this.setState({
                    witness_id: results[0] && results[0].get('id'),
                    isWitness: !!results[0],
                    isCommittee: !!results[1],
                    url: results[0] && results[0].get('url'),
                    signing_key: results[0] && results[0].get('signing_key'),
                });
            });
        }
    }

    getAccountMemberStatus(account) {
        if (account === undefined) return undefined;
        if (account === null) return "unknown";

        if (account.get('membership_expiration_date') !== '1970-01-01T00:00:00') {
            return 'lifetime';
        } else {
            return 'basic';
        }
    }

    render() {
        console.log('render');
        let {isMyAccount, gprops, core_asset} = this.props;
        let account = this.props.account.toJS();

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
                            <Translate content="account.member.trust_node_candidate"/>
                            &nbsp;{this.state.witness_id}
                            
                            <hr/>
                            <div>
                                <label>url</label> 
                                
                                <input type="text" onChange={this.handelChange.bind(this)} defaultValue={this.state.url}  />

                                <label>signing_key</label> 

                                <input type="text" onChange={this.handelChangeSigningkey.bind(this)} defaultValue={this.state.signing_key}/>

                                <button className="button" onClick={this.updateWitness.bind(this, this.state.witness_id, account, this.state.url, this.state.signing_key)}>
                                    <Translate content="wallet.submit" /> 
                                </button>
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


}

GXBAccountMembership = BindToChainState(GXBAccountMembership);

export default GXBAccountMembership;
