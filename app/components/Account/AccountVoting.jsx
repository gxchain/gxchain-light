import React from "react";
import Immutable from "immutable";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import accountUtils from "common/account_utils";
import WalletApi from "api/WalletApi";
import {ChainStore} from "gxbjs/es";
import {Apis} from "gxbjs-ws";
import AccountsList from "./AccountsList";
import HelpContent from "../Utility/HelpContent";
import cnames from "classnames";
import ChainTypes from "../Utility/ChainTypes";
import WalletDb from "stores/WalletDb";
import {Tab, Tabs} from "../Utility/Tabs";
import BindToChainState from "components/Utility/BindToChainState";
import AccountVotingProxy from "./AccountVotingProxy";
import AccountStore from "stores/AccountStore";
import StakingCreateModal from "../Modal/StakingCreateModal";
import StakingTipModal from "../Modal/StakingTipModal";
import AccountStakingsList from "./AccountStakingsList";

let FetchChainObjects = ChainStore.FetchChainObjects;

let wallet_api = new WalletApi();

class AccountVoting extends React.Component {

    static propTypes = {
        // initialBudget: ChainTypes.ChainObject.isRequired,
        globalObject: ChainTypes.ChainObject.isRequired,
        dynamicGlobal: ChainTypes.ChainObject.isRequired
    };

    static defaultProps = {
        // initialBudget: "2.13.1",
        globalObject: "2.0.0",
        dynamicGlobal: "2.1.0"
    };

    constructor(props) {

        super(props);
        this.state = {
            proxy_account_id: "",//"1.2.16",
            witnesses: null,
            committee: null,
            trust_nodes: null,
            vote_ids: Immutable.Set(),
            lastBudgetObject: null,
            showExpired: false,
            canUpdated: true,
            fee: 0,
            canStaking: false
        };
        this.onProxyAccountChange = this.onProxyAccountChange.bind(this);
        this.fetchAllTrustedNodes = this.fetchAllTrustedNodes.bind(this);
        this.fetchStakingStatus = this.fetchStakingStatus.bind(this);
        this.onPublish = this.onPublish.bind(this);
        this._onUpdate = this._onUpdate.bind(this);
    }

    componentWillUnmount() {
        ChainStore.unsubscribe(this._onUpdate);
    }

    _onUpdate() {
        this.fetchStakingStatus();
        this.forceUpdate();
    }

    updateAccountData(account) {
        let options = account.get("options");
        let proxy_account_id = options.get("voting_account");
        if (proxy_account_id === "1.2.5") {
            proxy_account_id = "";
        }

        let votes = options.get("votes");
        let vote_ids = votes.toArray();
        // remove workers
        vote_ids = vote_ids.filter(id => {
            return id.split(":")[0] != "2";
        });
        let vids = Immutable.Set(vote_ids);
        ChainStore.getObjectsByVoteIds(vote_ids);
        FetchChainObjects(ChainStore.getObjectByVoteID, vote_ids, 5000).then(vote_objs => {
            //console.log( "Vote Objs: ", vote_objs );
            let witnesses = new Immutable.List();
            let committee = new Immutable.List();
            let workers = new Immutable.Set();
            vote_objs.forEach(obj => {
                let account_id = obj.get("committee_member_account");
                if (account_id) {
                    committee = committee.push(account_id);
                } else if (account_id = obj.get("worker_account")) {
                    // console.log( "worker: ", obj );
                    //     workers = workers.add(obj.get("id"));
                } else if (account_id = obj.get("witness_account")) {
                    witnesses = witnesses.push(account_id);
                }
            });
            witnesses = witnesses.filter(w => {
                return committee.includes(w);
            });
            let state = {
                proxy_account_id: proxy_account_id,
                witnesses: witnesses,
                committee: committee,
                workers: workers,
                vote_ids: vids,
                prev_proxy_account_id: proxy_account_id,
                prev_witnesses: witnesses,
                prev_committee: committee,
                prev_workers: workers,
                prev_vote_ids: vids
            };
            this.setState(state);
        });
    }

    isChanged() {
        let s = this.state;
        return s.proxy_account_id !== s.prev_proxy_account_id ||
            s.witnesses !== s.prev_witnesses ||
            s.committee !== s.prev_committee || !Immutable.is(s.vote_ids, s.prev_vote_ids);
    }

    componentWillMount() {
        this.updateAccountData(this.props.account);
        this.fetchAllTrustedNodes();
        this.fetchStakingFee();
        this.fetchStakingStatus();
        accountUtils.getFinalFeeAsset(this.props.account, "account_update");
        // this.getBudgetObject();
        ChainStore.subscribe(this._onUpdate);
    }

    componentDidMount() {
        // this.getBudgetObject();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.account !== this.props.account) {
            this.updateAccountData(nextProps.account);
        }
        this.getBudgetObject();
    }

    onPublish() {
        let updated_account = this.props.account.toJS();
        let updateObject = {account: updated_account.id};
        let new_options = {memo_key: updated_account.options.memo_key};

        // updated_account.new_options = updated_account.options;
        let new_proxy_id = this.state.proxy_account_id;
        new_options.voting_account = new_proxy_id ? new_proxy_id : "1.2.5";
        new_options.num_witness = Math.min(this.state.witnesses.size, this.props.globalObject.getIn(["parameters", "maximum_witness_count"]));
        // new_options.num_committee = this.state.committee.size;
        new_options.num_committee = Math.min(this.state.witnesses.size, this.props.globalObject.getIn(["parameters", "maximum_committee_count"]));

        updateObject.new_options = new_options;
        // Set fee asset
        updateObject.fee = {
            amount: 0,
            asset_id: accountUtils.getFinalFeeAsset(updated_account.id, "account_update")
        };

        // Remove votes for expired workers
        let {vote_ids} = this.state;
        let workers = this._getWorkerArray();
        let now = new Date();

        function removeVote(list, vote) {
            if (list.includes(vote)) {
                list = list.delete(vote);
            }
            return list;
        }

        workers.forEach(worker => {
            if (worker) {
                if (new Date(worker.get("work_end_date")) <= now) {
                    vote_ids = removeVote(vote_ids, worker.get("vote_for"));
                }

                // TEMP Remove vote_against since they're no longer used
                vote_ids = removeVote(vote_ids, worker.get("vote_against"));
            }
        });


        // Submit votes
        FetchChainObjects(ChainStore.getWitnessById, this.state.witnesses.toArray(), 4000).then(res => {
            let witnesses_vote_ids = res.map(o => o.get("vote_id"));
            return Promise.all([Promise.resolve(witnesses_vote_ids), FetchChainObjects(ChainStore.getCommitteeMemberById, this.state.witnesses.toArray(), 4000)]);
        }).then(res => {
            if (res[0] && res[0].length === 1) {
                this.setState({
                    canUpdated: false
                });
                return;
            } else {
                this.setState({
                    canUpdated: true
                });
            }
            updateObject.new_options.votes = res[0]
                .concat(res[1].filter(o => o).map(o => o.get("vote_id")))
                // .concat(vote_ids.filter(id => {
                //     return id.split(":")[0] === "2";
                // }).toArray())
                .sort((a, b) => {
                    let a_split = a.split(":");
                    let b_split = b.split(":");

                    return parseInt(a_split[1], 10) - parseInt(b_split[1], 10);
                });
            var tr = wallet_api.new_transaction();
            tr.add_type_operation("account_update", updateObject);
            // console.log(updateObject);
            WalletDb.process_transaction(tr, null, true);
        });
    }

    fetchStakingFee() {
        Apis.instance()
          .db_api()
          .exec("get_required_fees", [[[80,{}]], "1.3.1"]).then(resp => {
              this.setState({
                  fee: resp[0].amount / 100000
              });
          });
    }
    onStakingCreate(collection, item_id) {
        if (this.state.canStaking) {
            let account_balances = this.props.account
                .get("balances")
                .toJS();
            let balanceId = account_balances["1.3.1"];
            let balanceObject = null;
            if (balanceId != "2.5.-1") {
                balanceObject = ChainStore.getObject(balanceId);
            } else {
                balanceObject = Immutable.fromJS({
                    id: balanceId,
                    owner: this.props.account.get("id"),
                    asset_type: "1.3.1",
                    balance: "0"
                });
            }
            this.refs["staking-modal"].refs["bound_component"].show(
                balanceObject,
                item_id,
                this.props.account.toJS().id,
                this.state.fee
            );
        } else {
            this.refs["staking-tip-modal"].show();
        }
    }

    onChangeVotes(addVotes, removeVotes) {
        let state = {};
        state.vote_ids = this.state.vote_ids;
        if (addVotes.length) {
            addVotes.forEach(vote => {
                state.vote_ids = state.vote_ids.add(vote);
            });

        }
        if (removeVotes) {
            removeVotes.forEach(vote => {
                state.vote_ids = state.vote_ids.delete(vote);
            });
        }

        this.setState(state);
    }

    onProxyAccountChange(proxy_account) {
        this.setState({
            proxy_account_id: proxy_account ? proxy_account.get("id") : ""
        });
    }

    validateAccount(collection, account) {
        if (!account) return null;
        if (collection === "witnesses") {
            return FetchChainObjects(ChainStore.getWitnessById, [account.get("id")], 3000).then(res => {
                return res[0] ? null : "Not a witness";
            });
        }
        if (collection === "committee") {
            return FetchChainObjects(ChainStore.getCommitteeMemberById, [account.get("id")], 3000).then(res => {
                return res[0] ? null : "Not a committee member";
            });
        }
        return null;
    }

    onClearProxy() {
        this.setState({
            proxy_account_id: ""
        });
    }

    _getTotalVotes(worker) {
        return parseInt(worker.get("total_votes_for"), 10) - parseInt(worker.get("total_votes_against"), 10);
    }

    getBudgetObject() {
        let {lastBudgetObject} = this.state;
        let budgetObject;

        budgetObject = ChainStore.getObject(lastBudgetObject ? lastBudgetObject : "2.13.1");
        if (budgetObject) {
            let timestamp = budgetObject.get("time");
            let now = new Date();

            let idIndex = parseInt(budgetObject.get("id").split(".")[2], 10);
            let currentID = idIndex + Math.floor((now - new Date(timestamp + "+00:00").getTime()) / 1000 / 60 / 60) - 1;
            let newID = "2.13." + Math.max(idIndex, currentID);

            ChainStore.getObject(newID);

            this.setState({lastBudgetObject: newID});
            if (newID !== currentID) {
                this.forceUpdate();
            }
        } else {
            if (lastBudgetObject && lastBudgetObject !== "2.13.1") {
                let newBudgetObjectId = parseInt(lastBudgetObject.split(".")[2], 10) - 1;
                this.setState({
                    lastBudgetObject: "2.13." + (newBudgetObjectId - 1)
                });
            }
        }
    }

    fetchAllTrustedNodes() {
        Apis.instance().db_api().exec("get_trust_nodes", []).then(nodes => {
            this.setState({
                trust_nodes: Immutable.fromJS(nodes)
            });
        }).catch(ex => {
            console.error("Error fetching trusted nodes: ", ex);
        });
    }

    _getWorkerArray() {
        let workerArray = [];

        for (let i = 0; i < 100; i++) {
            let id = "1.14." + i;
            let worker = ChainStore.getObject(id);
            if (worker === null) {
                break;
            }
            workerArray.push(worker);
        }
        ;

        return workerArray;
    }

    fetchStakingStatus() {
        Apis.instance()
            .db_api()
            .exec("get_staking_object", [this.props.account.get("id")])
            .then((resp) => {
                let max_staking_count = this.props.globalObject.getIn([
                    "parameters",
                    "extensions",
                    2,
                    1,
                    "max_staking_count"
                ]);
                this.setState({
                    canStaking: resp.length < Number(max_staking_count)
                });
            })
            .catch((ex) => {
                console.error("get_staking_objetcs failed", ex);
            });
    }

    render() {
        if (!this.state.trust_nodes) {
            return null;
        }

        let unVotedActiveWitnesses = this.state.trust_nodes.map(a => {
            let account = ChainStore.getWitnessById(a);
            if (!account || !this.state.witnesses) {
                return null;
            }
            if (!this.state.witnesses.includes(a)) {
                return a;
            } else {
                return null;
            }
        }).filter(a => {
            return a !== null;
        });

        return (
          <div className="grid-container">
            <div className="grid-content">
              <HelpContent
                style={{ maxWidth: "800px" }}
                path="components/AccountVoting"
              />
              <Tabs
                setting="votingTab"
                tabsClass="no-padding bordered-header"
                contentClass="grid-content no-padding">
                <Tab title="explorer.witnesses.title">
                  <div className={cnames("content-block")}>
                    <HelpContent
                      style={{ maxWidth: "800px" }}
                      path="components/AccountVotingWitnesses"
                    />
                    <AccountsList
                      type="witness"
                      label="account.votes.add_witness_label"
                      items={this.state.witnesses}
                      validateAccount={this.validateAccount.bind(
                        this,
                        "witnesses"
                      )}
                      onStakingCreate={this.onStakingCreate.bind(
                        this,
                        "witnesses"
                      )}
                      withSelector={false}
                      title={counterpart.translate(
                        "account.votes.w_approved_by",
                        { account: this.props.account.get("name") }
                      )}
                    />

                    {unVotedActiveWitnesses.size ? (
                      <AccountsList
                        type="witness"
                        label="account.votes.add_witness_label"
                        items={Immutable.List(unVotedActiveWitnesses)}
                        validateAccount={this.validateAccount.bind(
                          this,
                          "witnesses"
                        )}
                        onStakingCreate={this.onStakingCreate.bind(
                          this,
                          "witnesses"
                        )}
                        withSelector={false}
                        action="staking_create"
                        title={counterpart.translate(
                          "account.votes.w_not_approved_by",
                          { account: this.props.account.get("name") }
                        )}
                      />
                    ) : null}
                  </div>
                </Tab>
                <Tab title="account.votes.staking_records">
                  <div className="content-block">
                    <AccountStakingsList
                      label="account.votes.add_witness_label"
                      trustNodes={Immutable.List(unVotedActiveWitnesses)}
                      validateAccount={this.validateAccount.bind(
                        this,
                        "witnesses"
                      )}
                    />
                  </div>
                </Tab>
              </Tabs>
            </div>
            <StakingCreateModal
              ref="staking-modal"
            />
            <StakingTipModal ref="staking-tip-modal" />
          </div>
        );
    }
}

// export default AccountVoting;
export default BindToChainState(AccountVoting);
