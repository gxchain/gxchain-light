import React from "react";
import AccountSelector from "./AccountSelector";
import Translate from "react-translate-component";
import AccountImage from "./AccountImage";
import { ChainStore } from "gxbjs/es";
import ChainTypes from "../Utility/ChainTypes";
import FormattedAsset from "../Utility/FormattedAsset";
import BindToChainState from "../Utility/BindToChainState";
import LinkToAccountById from "../Blockchain/LinkToAccountById";
import LinkToWitnessById from "../Blockchain/LinkToWitnessById";
import counterpart from "counterpart";
import { Apis } from "gxbjs-ws";
import AccountStore from "stores/AccountStore";
import StakingModal from "../Modal/StakingCreateModal";
import AccountActions from "actions/AccountActions";
import notify from "actions/NotificationActions";
import cname from "classnames"; 
import StakingUpdateModal from "../Modal/StakingUpdateModal";
import StakingClaimModal from "../Modal/StakingClaimModal";
import ConfirmModal from "../Modal/ConfirmModal";

class StakingItemRow extends React.Component {
    static propTypes = {
        staking: React.PropTypes.object.isRequired,
        onStakingUpdateAction: React.PropTypes.func.isRequired,
        onStakingClaimAction: React.PropTypes.func.isRequired
    };

    shouldComponentUpdate(nextProps) {
        return nextProps.staking !== this.props.staking;
    }

    onStakingUpdateAction(staking) {
        this.props.onStakingUpdateAction(staking);
    }

    onStakingClaimAction(staking) {
        this.props.onStakingClaimAction(staking);
    }

    render() {
        let { staking } = this.props;
        return (
          <tr>
            <td>
              {/* <LinkToAccountById account={staking.account_id} /> */}
              <LinkToWitnessById witness={staking.trust_node} />
            </td>
            <td>{staking.amount.amount / 100000} GXC</td>
            <td>{staking.staking_days}</td>
            <td style={{ display: "flex" }}>
              <button
                className={cname("button outline", {
                    disabled: !staking.is_valid
                })}
                onClick={this.onStakingUpdateAction.bind(this, staking)}>
                <Translate content={'account.votes.staking_update_witness'} />
              </button>
              <button
                className={cname("button outline", {
                    disabled: staking.is_valid
                })}
                onClick={this.onStakingClaimAction.bind(this, staking)}>
                <Translate content={'account.votes.staking_claim_witness'} />
              </button>
            </td>
          </tr>
        );
    }
}

class StakingsList extends React.Component {
    static propTypes = {
        trustNodes: ChainTypes.ChainObjectsList,
        validateAccount: React.PropTypes.func,
        label: React.PropTypes.string.isRequired, // a translation key for the label,
        placeholder: React.PropTypes.string, // the placeholder text to be displayed when there is no user_input
        tabIndex: React.PropTypes.number, // tabindex property to be passed to input tag
        withSelector: React.PropTypes.bool
    };

    static defaultProps = {
        withSelector: true
    };

    constructor(props) {
        super(props);
        this.state = {
            stakings: null,
            updateFee: 0,
            claimFee: 0
        };
        this.loadStakings = this.loadStakings.bind(this);
    }

    componentWillMount() {
        this.loadStakings();
        this.fetchStakingFee();
    }

    loadStakings() {
        let currentAccount = AccountStore.getState().currentAccount;
        let currentAccountId = ChainStore.getAccount(currentAccount).get("id");
        Apis.instance()
      .db_api()
      .exec("get_staking_objects", [currentAccountId])
      .then((resp) => {
          this.setState({ stakings: resp });
      })
      .catch((ex) => {
          console.error("get_staking_objetcs failed", ex);
      });
    }

    onStakingUpdate(staking) {
        let currentAccount = AccountStore.getState().currentAccount;
        let currentAccountId = ChainStore.getAccount(currentAccount).get("id");
        this.refs["update-staking-modal"].refs["bound_component"].show(
          staking.id,
          currentAccountId,
          staking.staking_days,
          staking.amount.amount / 100000,
          this.props.trustNodes,
          this.state.updateFee
        );
    }

    onStakingClaim(staking) {
        let currentAccount = AccountStore.getState().currentAccount;
        let currentAccountId = ChainStore.getAccount(currentAccount).get("id");
        this.refs["claim-staking-modal"].refs["bound_component"].show(
          staking.id,
          currentAccountId,
          staking.staking_days,
          staking.amount.amount / 100000,
          staking.trust_node,          
          this.state.claimFee
        );
    }

    onFinishAction() {
        this.loadStakings();
    }

    fetchStakingFee() {
        Apis.instance()
          .db_api()
          .exec("get_required_fees", [[[81], [82]], "1.3.1"]).then(resp => {
              this.setState({
                  updateFee: resp[0].amount / 100000,
                  claimFee: resp[1].amount / 100000,
              });
          });
    }
    render() {
        if (!this.state.stakings) return null;
        let item_rows = this.state.stakings.map((i) => {
            return (
              <StakingItemRow
                key={i.id}
                staking={i}
                onStakingUpdateAction={this.onStakingUpdate.bind(this)}
                onStakingClaimAction={this.onStakingClaim.bind(this)}
              />
            );
        });

        let cw = ["20%", "20%", "30%", "20%", "10%"];

        return (
          <div>
            {this.props.title && item_rows.length ? (
              <h4>{this.props.title}</h4>
            ) : null}
            {item_rows.length ? (
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: cw[0] }}>
                      <Translate content="staking_program.account" />
                    </th>
                    <th style={{ width: cw[1] }}>
                      <Translate content="staking_program.staking_amount" />
                    </th>
                    <th style={{ width: cw[2] }}>
                      <Translate content="staking_program.term" />
                    </th>
                    <th style={{ width: cw[3] }}>
                      <Translate content="staking_program.action" />
                    </th>
                  </tr>
                </thead>
                <tbody>{item_rows}</tbody>
              </table>
            ) : (
              <div style={{ padding: "1rem 0" }}>
                <Translate content="staking_program.empty_staking_record" />
              </div>
            )}
            <StakingUpdateModal
              ref="update-staking-modal"
              onFinish={this.onFinishAction.bind(this)}
            />
            <StakingClaimModal
              ref="claim-staking-modal"
              onFinish={this.onFinishAction.bind(this)}
            />
            {/* <ConfirmModal ref="confirm-modal" /> */}
          </div>
        );
    }
}

export default BindToChainState(StakingsList, { keep_updating: true });
