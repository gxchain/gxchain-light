import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import BalanceComponent from "../Utility/BalanceComponent";
import FormattedAsset from "../Utility/FormattedAsset";
import {ChainStore} from "gxbjs/es";
import BindToChainState from "../Utility/BindToChainState";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import {Tabs, Tab} from "../Utility/Tabs";
import ChainTypes from "../Utility/ChainTypes";
import utils from "common/utils";
import ConfirmModal from "./ConfirmModal";
import SettingsActions from "actions/SettingsActions";
import AccountActions from "actions/AccountActions";
import notify from "actions/NotificationActions";

class StakingCreateModal extends React.Component {
    static propTypes = {
        globalObject: ChainTypes.ChainObject.isRequired
    };

    static defaultProps = {
        globalObject: "2.0.0"
    };

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            error: "",
            amount: "",
            balance: null,
            termIndex: 0,
            balanceObject: null,
            trustNode: null,
            ownerId: "",
            fee: 0
        };
    }

    componentDidMount() {
        let modalId = "modal-staking";
        ZfApi.subscribe(modalId, (msg, data) => {
            if (data == "close") {
                ZfApi.publish("modal-confirm-staking", "close");
            }
        });
    }

    show(balanceObject, trustNode, ownerId, fee) {
        let modalId = "modal-staking";
        this.setState({
            error: "",
            amount: "",
            balance: null,
            termIndex: 0,
            balanceObject: balanceObject,
            trustNode: trustNode,
            ownerId: ownerId,
            asset: ChainStore.getAsset("1.3.1"),
            fee: fee
        });
        ZfApi.publish(modalId, "open");
    }

    _handleChange(e) {
        let amount = e.target.value;
        this.setState({
            amount: amount.trim().replace(/,/g, "")
        });
    }

    formatAmount(v) {
    // TODO: use asset's precision to format the number
        if (!v) v = "";
        if (typeof v === "number") v = v.toString();
        let value = v.trim().replace(/,/g, "");
    // value = utils.limitByPrecision(value, this.props.asset.get("precision"));
        while (value.substring(0, 2) == "00") value = value.substring(1);
        if (value[0] === ".") value = "0" + value;
        else if (value.length) {
            let n = Number(value);
            if (isNaN(n)) {
                value = parseFloat(value);
                if (isNaN(value)) return "";
            }
            let parts = (value + "").split(".");
            value = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            if (parts.length > 1) value += "." + parts[1];
        }
        return value;
    }

    validate() {
        let amount = Number(this.state.amount);
        if (isNaN(amount) || this.state.amount <= 0) {
            this.setState({
                error: counterpart.translate("transfer.errors.pos")
            });
            return false;
        }
        if (amount > this.state.balanceObject.get("balance") / 100000) {
            this.setState({
                error: counterpart.translate("transfer.errors.insufficient")
            });
            return false;
        }

        this.setState({
            error: ""
        });

        return true;
    }

    submit() {
        if (!this.validate()) {
            return;
        }
        let self = this;
        let programs = this.props.globalObject
      .getIn(["parameters", "extensions"])
      .find(function(arr) {
          return arr.toJS()[0] == 11;
      });
        programs = programs
      .getIn([1, "params"])
      .toJS()
      .filter((program) => {
          return program[1].is_valid;
      })
      .sort((a1, b1) => {
          if (a1[1].staking_days > b1[1].staking_days) {
              return 1;
          } else if (a1[1].staking_days < b1[1].staking_days) {
              return -1;
          } else {
              return 0;
          }
      });
        let currentProgramID = programs[this.state.termIndex][0];
        let currentProgram = programs[this.state.termIndex][1];
        let precision = utils.get_asset_precision(
          this.state.asset.get("precision")
        );
        let amount = this.state.amount.replace(/,/g, "");
        self.setState({
            loading: true
        });
    // createStaking(program_id, owner_id, trust_node_id, amount, weight, staking_days)
        AccountActions.createStaking(
          currentProgramID,
          this.state.ownerId,
          ChainStore.getWitnessById(this.state.trustNodeId).get("id"),
          amount * precision,
          currentProgram.weight,
          currentProgram.staking_days
      )
      .then(function(resp) {
          let msg = counterpart.translate("staking_program.success");
          self.setState({
              loading: false
          });
          notify.addNotification({
              message: msg,
              level: "success",
              autoDismiss: 10
          });
          ZfApi.publish("modal-staking", "close");
      })
      .catch((ex) => {
          self.setState({
              loading: false
          });
          let error_msg = ex;
          if (typeof ex == "object") {
              error_msg =
            ex.message &&
            ex.message.indexOf(
              "create_date_time.sec_since_epoch() - _db.head_block_time().sec_since_epoch()"
            ) > -1
              ? `${counterpart.translate("staking_program.time_error")}\n${
                  ex.message
                }`
              : ex.message;
          }
          notify.addNotification({
              message: `${error_msg}`,
              level: "error",
              autoDismiss: 10
          });
      });
    }

    lockTermChange(value) {
        this.setState({
            termIndex: value
        });
    }

    render() {
        let modalId = "modal-staking";
        if (this.state.balanceObject == null) {
            return null;
        }

        let programs = this.props.globalObject
      .getIn(["parameters", "extensions"])
      .find(function(arr) {
          return arr.toJS()[0] == 11;
      });

        if (!programs) {
            return null;
        }

        let tabs = programs
      .getIn([1, "params"])
      .toJS()
      .filter((program) => {
          return program[1].is_valid;
      })
      .sort((a1, b1) => {
          if (a1[1].staking_days > b1[1].staking_days) {
              return 1;
          } else if (a1[1].staking_days < b1[1].staking_days) {
              return -1;
          } else {
              return 0;
          }
      })
      .map((program, i) => {
          let title = "";
          title = counterpart.translate("staking_program.day", {
              day: program[1].staking_days
          });
          return (
          <Tab
            key={`tab_loyalty_${title}`}
            title={title}
            isActive={i == this.state.termIndex}></Tab>
        );
      });

        let balanceObject = this.state.balanceObject;
        let amount = this.formatAmount(this.state.amount);

        let trustNode = this.state.trustNode;
        let trustNodeName=trustNode?trustNode.get("name"):"";

        let button_text = counterpart.translate("staking_program.button_title");

        return (
      <Modal id={modalId} overlay={true} ref={modalId}>
        <Trigger close={modalId}>
          <a href="javascript:;" className="close-button">
            &times;
          </a>
        </Trigger>
        <div className="grid-block vertical container-loyalty-program">
          <Translate component="h3" content="staking_program.title" />

          {tabs && tabs.length > 0 ? (
            <div>
              <table className="table key-value-table">
                <tbody>
                  <tr>
                    <td>
                      <Translate content="staking_program.account" />
                    </td>
                    <td>
                      <span className="color-red">{trustNodeName}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <Translate content="staking_program.staking_amount" />
                    </td>
                    <td>
                      <div className="row-balance">
                        <small>
                          <Translate content="transfer.available" />
                          :&nbsp;
                          {balanceObject.get("id") == "2.5.-1" ? (
                            <BalanceComponent
                              amount={0}
                              asset_type={balanceObject.get(
                                "asset_type"
                              )}></BalanceComponent>
                          ) : (
                            <BalanceComponent
                              balance={balanceObject.get("id")}
                              asset_type={balanceObject.get(
                                "asset_type"
                              )}></BalanceComponent>
                          )}
                        </small>
                      </div>
                      <input
                        className="input-amount"
                        type="text"
                        value={amount}
                        onChange={this._handleChange.bind(this)}
                      />
                      GXC
                      {this.state.error ? (
                        <div className="text-right has-error">
                          {this.state.error}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <Translate content="staking_program.term" />
                    </td>
                    <td>
                      <Tabs
                        ref="tabs"
                        setting="loyalty_term"
                        onChange={this.lockTermChange.bind(this)}
                        tabsClass="button-group">
                        {tabs}
                      </Tabs>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <Translate content="staking_program.fee" />
                    </td>
                    <td>
                      {this.state.fee}GXC
                    </td>
                  </tr>
                </tbody>
              </table>
              <br />
              <div className="text-center">
                <button
                  style={{ margin: ".2rem" }}
                  onClick={this.submit.bind(this)}
                  className={`button ${this.state.loading ? "disabled" : ""}`}
                  dangerouslySetInnerHTML={{ __html: button_text }}></button>
              </div>
            </div>
          ) : (
            <Translate
              component="p"
              className="has-error"
              content="loyalty_program.no_program"
            />
          )}
        </div>
      </Modal>
    );
    }
}

export default BindToChainState(StakingCreateModal, { keep_updating: true });