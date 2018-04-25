import React from "react";
import utils from 'common/utils'
import SettingsStore from "stores/SettingsStore";
import notify from "actions/NotificationActions";
import PrivateKeyStore from 'stores/PrivateKeyStore'
import AccountStore from 'stores/AccountStore'
import WalletDb from 'stores/WalletDb'
import WalletUnlockActions from "actions/WalletUnlockActions";
import GXBFaucetActions from "actions/GXBFaucetActions";
import {TransactionBuilder, ChainStore, Signature, PublicKey, hash} from "gxbjs/es";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Modal from "react-foundation-apps/src/modal";
import LoadingIndicator from "../LoadingIndicator";


class GXBDataSourceVerify extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            merchant_name: '',
            data_desc: '',
            ability_desc: '',
            error: {
                data_desc: '',
                ability_desc: ''
            }
        }
    }

    render() {
        if (this.state.loading) {
            return <LoadingIndicator></LoadingIndicator>
        }
        return (
            <div className="grid-content">
                <div className="small-12 medium-8 medium-offset-2 vertical">
                    <h3 className="title text-center">数据源认证</h3>
                    <form className="form form-data-source-verify" noValidate="novlidate">
                        <section>
                            <h4 className="section-heading">商户信息</h4>
                            <div className="form-group">
                                <label className="form-label">商户名称</label>
                                <input readOnly="readonly" value={this.state.merchant_name} type="text"
                                       placeholder="加载中" className="form-control"/>
                            </div>
                        </section>
                        <section>
                            <h4 className="section-heading">数据源信息</h4>
                            <div className="form-group">
                                <label className="form-label">生产数据描述</label>
                                <div className="input-group flex-column">
                                    <textarea value={this.state.data_desc}
                                              onChange={this.handleDataDescChange.bind(this)}
                                              rows="5"
                                              placeholder="请对贵公司所生产的数据类型进行描述" type="text"
                                              className="form-control">
                                    </textarea>
                                    {this.state.error.data_desc ?
                                        <div className="error">{this.state.error.data_desc}</div> : null}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">数据生产能力说明</label>
                                <div className="input-group flex-column">
                                    <textarea rows="5"
                                              value={this.state.ability_desc}
                                              onChange={this.handleAbilityDescChange.bind(this)}
                                              placeholder="公信宝仅接入有数据原始生产能力的商户，请贵商户对准备接入公信宝数据源的数据生产过程加以简单说明"
                                              type="text"
                                              className="form-control">
                                    </textarea>
                                    {this.state.error.ability_desc ?
                                        <div className="error">{this.state.error.ability_desc}</div> : null}
                                </div>
                            </div>
                        </section>
                        <section className="text-center">
                            <hr/>
                            <button onClick={this.submit.bind(this)} className="button align-center" type="submit">
                                确认发送
                            </button>
                        </section>
                    </form>
                </div>
                <Modal id="modal-notice-data-srouce" overlay={true}>
                    <h3>提示</h3>
                    <div className="grid-block vertical">
                        <div>申请已提交,请耐心等待我们的审核</div>
                        <div className="button-group" style={{paddingTop: "2rem"}}>
                            <button onClick={this.onClose.bind(this)} className="button success">知道了</button>
                        </div>
                    </div>
                </Modal>
            </div>
        )
    }

    componentWillMount() {
        if (!this.props.isMyAccount) {
            var currentAccount = AccountStore.getState().currentAccount;
            if (currentAccount) {
                this.props.router.replace(`/account/${currentAccount}/datasource-verify`);
            }
            else {
                notify.addNotification({
                    message: `非本人用户无法代理申请`,
                    level: "error",
                    autoDismiss: 10
                });
            }
        }
        else {
            this.loadMerchantInfo();
        }
    }

    showNoticeModal() {
        let modalId = "modal-notice-data-srouce";
        ZfApi.publish(modalId, "open");
    }

    onClose(e) {
        let modalId = "modal-notice-data-srouce";
        e.preventDefault();
        ZfApi.publish(modalId, "close");
        var currentAccount = AccountStore.getState().currentAccount;
        if (currentAccount) {
            this.props.router.replace(`/account/${currentAccount}/member-stats`);
        }
    }

    loadMerchantInfo() {
        let self = this;
        var body = {
            account_id: this.props.account.get('id')
        };
        self.setState({
            loading: true
        })
        GXBFaucetActions.getMerchantInfo(body,this.props.account).then(function (res) {
            self.setState({
                merchant_name:res.name,
                loading: false
            });
        },function () {
            self.setState({
                loading: false
            });
        })
    }

    handleDataDescChange(e) {
        var error = this.state.error;
        error.data_desc = '';
        this.setState({
            error: error,
            data_desc: e.target.value
        })
    }

    handleAbilityDescChange(e) {
        var error = this.state.error;
        error.ability_desc = '';
        this.setState({
            error: error,
            ability_desc: e.target.value
        })
    }

    submit(e) {
        e.preventDefault();
        if (this.validate()) {
            var info = Object.assign({account_id:this.props.account.get('id')}, this.state);
            delete info.error;
            delete info.loading;
            this.apply(info)
        }
        return false;
    }

    validate() {
        var result = true;
        var error = {
            data_desc: '',
            ability_desc: ''
        };
        if (!this.state.data_desc) {
            error.data_desc = '请填写数据描述';
            result = false;
        }
        if (!this.state.ability_desc) {
            error.ability_desc = '请填写生产能力描述';
            result = false;
        }
        this.setState({
            error: error
        });
        return result;
    }

    apply(info) {
        let self = this;
        self.setState({
            loading:true
        })
        GXBFaucetActions.dataSourceApply(info,this.props.account).then(function (result) {
            self.setState({
                loading:false
            });
            self.showNoticeModal();
        },function (err) {
            self.setState({
                loading:false
            })
            console.log("ERROR when apply for datasource", err);
            let error_msg = err.message||(err.base && err.base.length && err.base.length > 0 ? err.base[0] : "未知错误");
            notify.addNotification({
                message: `申请失败: ${error_msg}`,
                level: "error",
                autoDismiss: 10
            });
        })
    }
}

export default GXBDataSourceVerify

