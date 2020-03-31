import React from "react";
import AccountSelector from "./AccountSelector";
import Translate from "react-translate-component";
import AccountImage from "./AccountImage";
import {ChainStore} from "gxbjs/es";
import ChainTypes from "../Utility/ChainTypes";
import FormattedAsset from "../Utility/FormattedAsset";
import BindToChainState from "../Utility/BindToChainState";
import LinkToAccountById from "../Blockchain/LinkToAccountById";
import counterpart from "counterpart";
import { Link } from "react-router/es";

function getWitnessOrCommittee(type, acct) {
    let url = "", votes = 0, account, commission_rate = 0, new_votes = 0;
    if (type === "witness") {
        account = ChainStore.getWitnessById(acct.get("id"));
    } else if (type === "committee") {
        account = ChainStore.getCommitteeMemberById(acct.get("id"));
    }
    url = account ? account.get("url") : url;
    votes = account ? account.get("total_votes") : votes;
    new_votes = account ? account.get("total_vote_weights") : new_votes;
    commission_rate = account ? account.get("commission_rate") / 10 : commission_rate;
    return {
        url,
        votes,
        commission_rate,
        new_votes
    };
}

class AccountItemRow extends React.Component {
    static propTypes = {
        account: React.PropTypes.object.isRequired,
        onAction: React.PropTypes.func.isRequired,
        showNewVotes: React.PropTypes.bool.isRequired
    };

    shouldComponentUpdate(nextProps) {
        return nextProps.account !== this.props.account || nextProps.showNewVotes !== this.props.showNewVotes;
    }

    onAction(item_id) {
        this.props.onAction(item_id);
    }

    render() {
        let {account, type} = this.props;
        let name = account.get("name");
        let item_id = account.get("id");

        let { url, votes, commission_rate, new_votes} = getWitnessOrCommittee(type, account);
        let link = url && url.length > 0 && url.indexOf("http") === -1 ? "http://" + url : url;

        return (
            <tr>
                <td>
                    <AccountImage size={{height: 30, width: 30}} account={name}/>
                </td>
                <td><LinkToAccountById account={account.get("id")}/></td>
                <td><a href={link} target="_blank">{url.length < 45 ? url : url.substr(0, 45) + "..."}</a></td>
                <td>{commission_rate}%</td>
                <td>
                    <div>
                        <FormattedAsset amount={this.props.showNewVotes ? new_votes : votes} asset="1.3.1" decimalOffset={5} hide_asset={true} />
                    </div>
                </td>
                <td>
                    <button className="button outline" onClick={this.onAction.bind(this, item_id)}>
                        <Translate content={`account.votes.${this.props.action}_witness`}/></button>
                </td>
            </tr>
        );
    }
}

class AccountsList extends React.Component {

    static propTypes = {
        items: ChainTypes.ChainObjectsList,
        onStakingCreate: React.PropTypes.func.isRequired,
        validateAccount: React.PropTypes.func,
        label: React.PropTypes.string.isRequired, // a translation key for the label,
        placeholder: React.PropTypes.string, // the placeholder text to be displayed when there is no user_input
        tabIndex: React.PropTypes.number, // tabindex property to be passed to input tag
        action: React.PropTypes.string,
        withSelector: React.PropTypes.bool,
    };

    static defaultProps = {
        action: "remove",
        withSelector: true
    };

    constructor(props) {
        super(props);
        this.state = {
            selected_item: null,
            item_name_input: "",
            error: null,
            showNewVotes: true
        };
        this.onItemChange = this.onItemChange.bind(this);
        this.onItemAccountChange = this.onItemAccountChange.bind(this);
    }

    onItemChange(item_name_input) {
        this.setState({item_name_input});
    }

    onItemAccountChange(selected_item) {
        this.setState({selected_item, error: null});
        if (selected_item && this.props.validateAccount) {
            let res = this.props.validateAccount(selected_item);
            if (res === null) return;
            if (typeof(res) === "string") this.setState({error: res});
            else res.then(error => this.setState({error: error}));
        }
    }

    render() {
        if (!this.props.items) return null;

        let item_rows = this.props.items.filter(i => {
            if (!i) return false;
            let nodes = [
                "aaron",
                "caitlin",
                "kairos",
                "sakura",
                "taffy",
                "miner1",
                "miner2",
                "miner3",
                "miner4",
                "miner5",
                "miner6",
                "miner7",
                "miner8",
                "miner9",
                "miner10",
                "miner11",
                "hrrs",
                "dennis1",
                "david12",
                "marks-lee",
                "robin-green"
            ];
            let tmp = false;
            for (let k = 0; k < nodes.length; k++) {
                if (i.get("name") === nodes[k]) {
                    tmp = true;
                    break;
                }
            }
            return !tmp;
        })
            .sort((a, b) => {
                // let {votes: a_votes} = getWitnessOrCommittee(this.props.type, a);
                // let {votes: b_votes} = getWitnessOrCommittee(this.props.type, b);

                // if (a_votes !== b_votes) {
                //     return b_votes - a_votes;
                // }
                // else if (a.get("name") > b.get("name")) {
                //     return 1;
                // }
                // else if (a.get("name") < b.get("name")) {
                //     return -1;
                // } else {
                //     return 0;
                // }
                let {
                  commission_rate: a_commission_rate,
                  new_votes: a_new_votes
                } = getWitnessOrCommittee(this.props.type, a);
                let {
                  commission_rate: b_commission_rate,
                  new_votes: b_new_votes
                } = getWitnessOrCommittee(this.props.type, b);
                
                if (a_commission_rate === b_commission_rate) {
                    return a_new_votes - b_new_votes;
                } else {
                    return b_commission_rate - a_commission_rate;
                }
            })
            .map(i => {
                return (
                    <AccountItemRow
                        key={i.get("name")}
                        account={i}
                        type={this.props.type}
                        onAction={this.props.onStakingCreate}
                        isSelected={this.props.items.indexOf(i) !== -1}
                        action={this.props.action}
                        showNewVotes={this.state.showNewVotes}
                    />
                );
            });

        let error = this.state.error;
        if (!error && this.state.selected_item && this.props.items.indexOf(this.state.selected_item) !== -1) {
            error = counterpart.translate("account.votes.already");
        }

        let cw = ["10%", "20%", "20%", "15%", "25%", "10%"];

        return (
            <div>
                {this.props.withSelector ?
                    <AccountSelector
                        style={{maxWidth: "600px"}}
                        label={this.props.label}
                        error={error}
                        placeholder={this.props.placeholder}
                        account={this.state.item_name_input}
                        accountName={this.state.item_name_input}
                        onChange={this.onItemChange}
                        onAccountChanged={this.onItemAccountChange}
                        onAction={this.onStakingCreate}
                        action_label="account.votes.add_witness"
                        tabIndex={this.props.tabIndex}
                    /> : null}
                {this.props.title && item_rows.length ? <h4>{this.props.title}</h4> : null}
                {item_rows.length ? (
                    <table className="table">
                        <thead>
                        <tr>
                            <th style={{width: cw[0]}}></th>
                            <th style={{width: cw[1]}}><Translate content="account.votes.name"/></th>
                            <th style={{width: cw[2]}}><Translate content="account.votes.url"/></th>
                            <th style={{width: cw[3]}}><Translate content="account.votes.commission_rate"/></th>
                            <th style={{ width: cw[4] }}>
                                <Translate content="account.votes.votes" />
                                <Link onClick={() => { this.setState({ showNewVotes: !this.state.showNewVotes }); }}>
                                        ({this.state.showNewVotes ? <Translate content="account.votes.see_old_votes" /> : <Translate content="account.votes.see_new_votes" />})
                                </Link>
                            </th>
                            <th style={{width: cw[5]}}><Translate content="account.perm.action"/></th>
                        </tr>
                        </thead>
                        <tbody>
                        {item_rows}
                        </tbody>
                    </table>) : null}
            </div>
        );
    }

}

export default BindToChainState(AccountsList, {keep_updating: true});
