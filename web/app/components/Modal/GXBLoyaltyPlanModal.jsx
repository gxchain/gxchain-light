import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import BalanceComponent from "../Utility/BalanceComponent";
import FormattedAsset from '../Utility/FormattedAsset'
import {ChainStore} from "gxbjs/es";
import BindToChainState from "../Utility/BindToChainState";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import {Tabs, Tab} from '../Utility/Tabs'
import ChainTypes from "../Utility/ChainTypes";
import utils from "common/utils";
import ConfirmModal from './ConfirmModal'
import SettingsActions from "actions/SettingsActions";
import AccountActions from "actions/AccountActions";
import notify from "actions/NotificationActions";

class GXBLoyaltyPlanModal extends React.Component {
    static propTypes = {
        globalObject: ChainTypes.ChainObject.isRequired,
    }

    static defaultProps = {
        globalObject: "2.0.0"
    }

    constructor(props) {
        super(props);
        this.state = {
            error: '',
            amount: '',
            balance: null,
            termIndex: 0,
            balanceObject: null
        }
    }

    componentDidMount() {
        let modalId = 'modal-gxb-loyalty-program';
        ZfApi.subscribe(modalId, (msg, data) => {
            if (data == 'close') {
                ZfApi.publish('modal-confirm-loyalty-program', "close");
            }
        });
    }

    show(balanceObject) {
        let modalId = 'modal-gxb-loyalty-program';
        this.setState({
            error: '',
            amount: '',
            balance: null,
            termIndex: 0,
            balanceObject: balanceObject,
            asset: ChainStore.getAsset('1.3.1')
        })
        SettingsActions.changeViewSetting({
            loyalty_term: 0
        });
        ZfApi.publish(modalId, "open");
    }

    _handleChange(e) {
        let amount = e.target.value;
        this.setState({
            amount: amount.trim().replace(/,/g, '')
        })
    }

    formatAmount(v) {
        // TODO: use asset's precision to format the number
        if (!v) v = "";
        if (typeof v === "number") v = v.toString();
        let value = v.trim().replace(/,/g, "");
        // value = utils.limitByPrecision(value, this.props.asset.get("precision"));
        while (value.substring(0, 2) == "00")
            value = value.substring(1);
        if (value[0] === ".") value = "0" + value;
        else if (value.length) {
            let n = Number(value)
            if (isNaN(n)) {
                value = parseFloat(value);
                if (isNaN(value)) return "";
            }
            let parts = (value + "").split('.');
            value = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            if (parts.length > 1) value += "." + parts[1];
        }
        return value;
    }

    validate() {
        let amount = Number(this.state.amount);
        if (isNaN(amount) || this.state.amount <= 0) {
            this.setState({
                error: counterpart.translate('transfer.errors.pos')
            });
            return false;
        }
        if (amount > this.state.balanceObject.get('balance') / 100000) {
            this.setState({
                error: counterpart.translate('transfer.errors.insufficient')
            });
            return false;
        }

        this.setState({
            error: ''
        });

        return true;
    }

    onSubmitClick() {
        if (!this.validate()) {
            return;
        }
        ZfApi.publish('modal-confirm-loyalty-program', "open");
    }

    submit() {
        ZfApi.publish('modal-confirm-loyalty-program', "close");
        let programs = this.props.globalObject.getIn(['parameters', 'extensions']).find(function (arr) {
            return arr.toJS()[0] == 6;
        });
        programs = programs.getIn([1, 'params']).toJS().filter((program) => {
            return program[1].is_valid;
        });
        let currentProgramID = programs[this.state.termIndex][0];
        let currentProgram = programs[this.state.termIndex][1];
        let precision = utils.get_asset_precision(this.state.asset.get("precision"));
        let amount = this.state.amount.replace(/,/g, "");

        AccountActions.joinLoyaltyProgram(currentProgramID, this.props.account.get('id'), parseInt(amount * precision, 10), currentProgram.interest_rate, currentProgram.lock_days).then(function (resp) {
            let msg = counterpart.translate('loyalty_program.success');
            notify.addNotification({
                message: msg,
                level: "success",
                autoDismiss: 10
            });
            ZfApi.publish('modal-gxb-loyalty-program', "close");
        }).catch(ex => {
            let error_msg = ex;
            if (typeof ex == 'object') {
                error_msg = ex.message && ex.message.indexOf('create_date_time.sec_since_epoch() - _db.head_block_time().sec_since_epoch()') > -1 ? `${counterpart.translate('loyalty_program.time_error')}\n${ex.message}` : ex.message;
            }
            notify.addNotification({
                message: `${error_msg}`,
                level: "error",
                autoDismiss: 10
            });
        })
    }

    lockTermChange(value) {
        this.setState({
            termIndex: value
        })
    }

    render() {
        let modalId = 'modal-gxb-loyalty-program'
        if (this.state.balanceObject == null) {
            return null;
        }
        debugger;

        let programs = this.props.globalObject.getIn(['parameters', 'extensions']).find(function (arr) {
            return arr.toJS()[0] == 6;
        });

        if (!programs) {
            return null;
        }

        let tabs = programs.getIn([1, 'params']).toJS().filter((program) => {
            return program[1].is_valid;
        }).map((program, i) => {
            let title = '';//Number(program[0]) > 1 ? counterpart.translate('loyalty_program.months', {month: program[0]}) : counterpart.translate('loyalty_program.month', {month: program[0]})
            if (Number(program[1].lock_days) > 30) {
                title = counterpart.translate('loyalty_program.months', {month: program[1].lock_days / 30})
            }
            else {
                title = Number(program[1].lock_days) > 1 ? counterpart.translate('loyalty_program.days', {day: program[1].lock_days}) : counterpart.translate('loyalty_program.day', {day: program[1].lock_days});
            }
            return <Tab key={`tab_loyalty_${title}`} title={title} isActive={i == this.state.termIndex}></Tab>
        })

        let balanceObject = this.state.balanceObject;
        let amount = this.formatAmount(this.state.amount);
        let currentProgram = programs.getIn([1, 'params', this.state.termIndex, '1']);

        let du_date = new Date();
        du_date.setDate(new Date().getDate() + parseInt(currentProgram.get('lock_days')));

        let percent = currentProgram.get('interest_rate') / 100;
        let precision = utils.get_asset_precision(this.state.asset.get("precision"));
        let bonus = Number(this.state.amount || 0) * (percent / 100) * (currentProgram.get('lock_days') / 360);

        console.log(bonus);

        let button_text = counterpart.translate('loyalty_program.button_title', {
            percent: `<strong class="large">${percent}</strong>%`
        });

        let confirmModalId = 'modal-confirm-loyalty-program';

        return (
            <Modal id={modalId} overlay={true} ref={modalId}>
                <Trigger close={modalId}>
                    <a href="javascript:;" className="close-button">&times;</a>
                </Trigger>
                <div className="grid-block vertical container-loyalty-program">
                    <Translate component="h3" content="loyalty_program.grow"/>
                    <Translate component="p" content="loyalty_program.tip1"/>
                    <Translate component="p" content="loyalty_program.tip2"/>

                    {tabs && tabs.length > 0 ?
                        <div>
                            <table className="table key-value-table">
                                <tbody>
                                <tr>
                                    <td><Translate content="loyalty_program.term"/></td>
                                    <td>
                                        <Tabs ref="tabs" setting="loyalty_term"
                                              onChange={this.lockTermChange.bind(this)}
                                              tabsClass="button-group">
                                            {tabs}
                                        </Tabs>
                                    </td>
                                </tr>
                                <tr>
                                    <td><Translate content="loyalty_program.yearly_bonus"/></td>
                                    <td><span className="color-red">{percent}</span>%</td>
                                </tr>
                                <tr>
                                    <td><Translate content="loyalty_program.due_date"/></td>
                                    <td>{du_date.toLocaleDateString()}</td>
                                </tr>
                                <tr>
                                    <td><Translate content="loyalty_program.lock_amount"/></td>
                                    <td>
                                        <div className="row-balance">
                                            <small>
                                                <Translate
                                                    content="transfer.available"/>:&nbsp;{balanceObject.get('id') == '2.5.-1' ?
                                                <BalanceComponent amount={0}
                                                                  asset_type={balanceObject.get('asset_type')}></BalanceComponent>
                                                :
                                                <BalanceComponent balance={balanceObject.get('id')}
                                                                  asset_type={balanceObject.get('asset_type')}></BalanceComponent>}
                                            </small>
                                        </div>
                                        <input className="input-amount" type="text" value={amount}
                                               onChange={this._handleChange.bind(this)}/>GXS
                                        {this.state.error ?
                                            <div className="text-right has-error">{this.state.error}</div> : null}
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                            <p className="text-right">
                                <Translate content="loyalty_program.bonus"/>&nbsp;
                                <FormattedAsset amount={parseInt(bonus * precision, 10)}
                                                asset={this.state.asset.get("id")} decimalOffset={0}/>
                            </p>
                            <div className="text-center">
                                <button style={{margin: '.2rem'}} onClick={this.onSubmitClick.bind(this)}
                                        className="button"
                                        dangerouslySetInnerHTML={{__html: button_text}}>
                                </button>
                            </div>
                        </div> : <Translate component="p" className="has-error" content="loyalty_program.no_program"/>}
                </div>
                <Modal id={confirmModalId} overlay={true}>
                    <Trigger close={confirmModalId}>
                        <a href="#" className="close-button">&times;</a>
                    </Trigger>
                    <div className="grid-block vertical">
                        <Translate component="p" content="loyalty_program.notice"/>
                        <div className="grid-content button-group no-overflow">
                            <a className="button" href
                               onClick={this.submit.bind(this)}>
                                <Translate content="modal.ok"/>
                            </a>
                            <Trigger close={confirmModalId}>
                                <div className="button"><Translate content="account.perm.cancel"/></div>
                            </Trigger>
                        </div>
                    </div>
                </Modal>
            </Modal>
        );
    }
}

export default BindToChainState(GXBLoyaltyPlanModal, {keep_updating: true});