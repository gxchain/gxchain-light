import React from "react";
import CityPicker from './CityPicker'
import utils from 'common/utils'
import SettingsStore from "stores/SettingsStore"
import notify from "actions/NotificationActions";
import PrivateKeyStore from 'stores/PrivateKeyStore'
import AccountStore from 'stores/AccountStore'
import WalletDb from 'stores/WalletDb'
import WalletUnlockActions from "actions/WalletUnlockActions"
import GXBFaucetActions from "actions/GXBFaucetActions"
import {TransactionBuilder, ChainStore, Signature, PublicKey, hash} from "gxbjs/es"
import ZfApi from "react-foundation-apps/src/utils/foundation-api"
import Modal from "react-foundation-apps/src/modal"
import LoadingIndicator from "../LoadingIndicator"

class MerchantVerify extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            type: 'enterprise',
            name: '',
            alias: '',
            province: '',
            city: '',
            area: '',
            address: '',
            cert_type: 'normal',
            cert_no: '',
            tax_no: '',
            org_no: '',
            cert_image: '',
            contact_name: '',
            contact_tel: '',
            contact_mail: '',
            error: {
                type: '',
                name: '',
                alias: '',
                area: '',
                address: '',
                cert_type: '',
                cert_no: '',
                tax_no: '',
                org_no: '',
                cert_image: '',
                contact_name: '',
                contact_tel: '',
                contact_mail: ''
            }
        }
    }

    componentWillMount() {
        if (!this.props.isMyAccount) {
            var currentAccount = AccountStore.getState().currentAccount;
            if (currentAccount) {
                this.props.router.replace(`/account/${currentAccount}/merchant-verify`);
            }
            else {
                notify.addNotification({
                    message: `非本人用户无法代理申请`,
                    level: "error",
                    autoDismiss: 10
                });
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
                    <h3 className="title text-center">商户认证</h3>
                    <form noValidate="novalidate" className="form form-merchant-verify">
                        <section>
                            <div className="form-group">
                                <label className="form-label">商户类型</label>
                                <div className="input-group">
                                    <input defaultChecked={this.state.type == 'enterprise'} value='enterprise'
                                           onChange={this.handleTypeChange.bind(this)} type="radio" name="type"
                                           className="form-control"/>
                                    &nbsp;企业
                                    {this.state.error.type ? <div className="error">this.state.error.type</div> : null}
                                </div>
                            </div>
                        </section>
                        <section>
                            <h4 className="section-heading">基本信息</h4>
                            <div className="form-group">
                                <label className="form-label">公司名称</label>
                                <div className="input-group flex-column">
                                    <input type="text" maxLength="70" value={this.state.name}
                                           onChange={this.handleNameChange.bind(this)}
                                           placeholder="公司名称用于发票抬头，请谨慎填写" className="form-control"/>
                                    {this.state.error.name ?
                                        <div className="error">{this.state.error.name}</div> : null}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">公司别称</label>
                                <div className="input-group flex-column">
                                    <input type="text" maxLength="70" value={this.state.alias}
                                           onChange={this.handleAliasChange.bind(this)}
                                           placeholder="公司的简称（将作为商户名），例如浙江电信" className="form-control"/>
                                    {this.state.error.alias ?
                                        <div className="error">{this.state.error.alias}</div> : null}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">所在地区</label>
                                <div className="input-group flex-column">
                                    <CityPicker province={this.state.province}
                                                onChange={this.handleAreaChange.bind(this)}
                                                city={this.state.city} area={this.state.area} ref="cityPicker"
                                                className={`input-group`}/>
                                    <p className="tip text-right">暂不支持港澳台地区</p>
                                    {this.state.error.area ?
                                        <div className="error">{this.state.error.area}</div> : null}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">详细地址</label>
                                <div className="input-group flex-column">
                                    <input value={this.state.address} type="text" maxLength="100"
                                           onChange={this.handleAddressChange.bind(this)}
                                           placeholder="补充详细的街道、小区、楼号、房号等地址"
                                           className="form-control"/>
                                    {this.state.error.address ?
                                        <div className="error">{this.state.error.address}</div> : null}
                                </div>
                            </div>
                        </section>
                        <section>
                            <h4 className="section-heading">企业信息</h4>
                            <div className="form-group">
                                <label className="form-label">证件类型</label>
                                <div className="input-group flex-column">
                                    <div className="input-group">
                                        <label className="radio">
                                            <input defaultChecked={this.state.cert_type == 'normal'}
                                                   onChange={this.handleCertTypeChange.bind(this)} defaultValue="normal"
                                                   className="form-control" name="cert_type" type="radio"/>&nbsp;
                                            普通营业执照&nbsp;
                                        </label>
                                        <label className="radio">
                                            <input defaultChecked={this.state.cert_type == '5in1'}
                                                   onChange={this.handleCertTypeChange.bind(this)} defaultValue="5in1"
                                                   className="form-control" name="cert_type" type="radio"/>&nbsp;
                                            五证合一营业执照&nbsp;
                                        </label>
                                    </div>
                                    {this.state.error.cert_type ?
                                        <div className="error">{this.state.error.cert_type}</div> : null}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">营业执照编号</label>
                                <div className="input-group flex-column">
                                    <input type="text" maxLength="18" value={this.state.cert_no}
                                           onChange={this.handleCertNoChange.bind(this)} className="form-control"/>
                                    {this.state.error.cert_no ?
                                        <div className="error">{this.state.error.cert_no}</div> : null}
                                </div>
                            </div>
                            {this.state.cert_type == 'normal' ? <div className="form-group">
                                <label className="form-label">税务登记证编号</label>
                                <div className="input-group flex-column">
                                    <input type="text" maxLength="15" value={this.state.tax_no}
                                           onChange={this.handleTaxNoChange.bind(this)} className="form-control"/>
                                    {this.state.error.tax_no ?
                                        <div className="error">{this.state.error.tax_no}</div> : null}
                                </div>
                            </div> : null}
                            {this.state.cert_type == 'normal' ? <div className="form-group">
                                <label className="form-label">组织机构编号</label>
                                <div className="input-group flex-column">
                                    <input type="text" maxLength="10" value={this.state.org_no}
                                           onChange={this.handleOrgNoChange.bind(this)} className="form-control"/>
                                    {this.state.error.org_no ?
                                        <div className="error">{this.state.error.org_no}</div> : null}
                                </div>
                            </div> : null}
                            <div className="form-group">
                                <label className="form-label">营业执照副本</label>
                                <div className="input-group flex-column">
                                    <input type="file" onChange={this.handleCertImageChange.bind(this)}
                                           className="form-control"/>
                                    <p className="tip">图片大小不要超过2M，支持PNG，JPG格式</p>
                                    {this.state.error.cert_image ?
                                        <div className="error">{this.state.error.cert_image}</div> : null}
                                </div>
                            </div>
                        </section>
                        <section>
                            <h4 className="section-heading">联系人信息</h4>
                            <div className="form-group">
                                <label className="form-label">联系人姓名</label>
                                <div className="input-group flex-column">
                                    <input type="text" maxLength="70" onChange={this.handleContactNameChange.bind(this)}
                                           value={this.state.contact_name} className="form-control"/>
                                    {this.state.error.contact_name ?
                                        <div className="error">{this.state.error.contact_name}</div> : null}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">联系人电话</label>
                                <div className="input-group flex-column">
                                    <input type="text" maxLength="11" onChange={this.handleContactTelChange.bind(this)}
                                           value={this.state.contact_tel} className="form-control"/>
                                    {this.state.error.contact_tel ?
                                        <div className="error">{this.state.error.contact_tel}</div> : null}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">联系人邮箱</label>
                                <div className="input-group flex-column">
                                    <input type="text" maxLength="70" onChange={this.handleContactMailChange.bind(this)}
                                           value={this.state.contact_mail} className="form-control"/>
                                    {this.state.error.contact_mail ?
                                        <div className="error">{this.state.error.contact_mail}</div> : null}
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
                <Modal id="modal-notice" overlay={true}>
                    <h3>提示</h3>
                    <div className="grid-block vertical">
                        <div>申请已提交,请耐心等待商户认证审核</div>
                        <div className="button-group" style={{paddingTop: "2rem"}}>
                            <button onClick={this.onClose.bind(this)} className="button success">知道了</button>
                        </div>
                    </div>
                </Modal>
            </div>
        )
    }

    showNoticeModal() {
        let modalId = "modal-notice";
        ZfApi.publish(modalId, "open");
    }

    onClose(e) {
        let modalId = "modal-notice";
        e.preventDefault();
        ZfApi.publish(modalId, "close");
        var currentAccount = AccountStore.getState().currentAccount;
        if (currentAccount) {
            this.props.router.replace(`/account/${currentAccount}/member-stats`);
        }
    }

    handleTypeChange(event) {
        var error = this.state.error;
        error.type = '';
        this.setState({
            error: error,
            type: event.target.value
        })
    }

    handleNameChange(event) {
        var error = this.state.error;
        error.name = '';
        this.setState({
            error: error,
            name: event.target.value
        })
    }

    handleAliasChange(event) {
        var error = this.state.error;
        error.alias = '';
        this.setState({
            error: error,
            alias: event.target.value
        })
    }

    handleAreaChange(area) {
        var error = this.state.error;
        error.area = '';
        this.setState({
            error: error,
            province: area.province,
            city: area.city,
            area: area.area
        })
    }

    handleAddressChange(event) {
        var error = this.state.error;
        error.address = '';
        this.setState({
            error: error,
            address: event.target.value
        })
    }

    handleCertTypeChange(event) {
        var error = this.state.error;
        error.cert_type = '';
        error.cert_no = '';
        this.setState({
            error: error,
            cert_type: event.target.value
        })
    }

    handleCertNoChange(event) {
        var error = this.state.error;
        error.cert_no = '';
        this.setState({
            error: error,
            cert_no: event.target.value
        })
    }

    handleTaxNoChange(event) {
        var error = this.state.error;
        error.tax_no = '';
        this.setState({
            error: error,
            tax_no: event.target.value
        })
    }

    handleOrgNoChange(event) {
        var error = this.state.error;
        error.org_no = '';
        this.setState({
            error: error,
            org_no: event.target.value
        })
    }

    handleCertImageChange(event) {
        let self = this;
        let error = this.state.error;
        error.cert_image = '';
        let file = event.target.files.item(0);
        let cert_image = "";
        if (!file) {
            this.setState({
                error: error,
                cert_image: cert_image
            })
            return;
        }
        if (!/\.(jpe?g|png)$/i.test(file.name)) {
            error.cert_image = '格式不正确,请重新选择';
        }
        else if (file.size > 2 * 1024 * 1024) {
            error.cert_image = '图片大小不可超过2M';
        }
        else {
            var reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function () {
                self.setState({
                    cert_image: this.result
                })
            }
        }
        this.setState({
            error: error,
            cert_image: cert_image
        })
    }

    handleContactNameChange(event) {
        var error = this.state.error;
        error.contact_name = '';
        this.setState({
            error: error,
            contact_name: event.target.value
        })
    }

    handleContactTelChange(event) {
        var error = this.state.error;
        error.contact_tel = '';
        this.setState({
            error: error,
            contact_tel: event.target.value
        })
    }

    handleContactMailChange(event) {
        var error = this.state.error;
        error.contact_mail = '';
        this.setState({
            error: error,
            contact_mail: event.target.value
        })
    }

    validate() {
        var result = true;
        var error = {
            type: '',
            name: '',
            alias: '',
            area: '',
            address: '',
            cert_type: '',
            cert_no: '',
            tax_no: '',
            org_no: '',
            cert_image: '',
            contact_name: '',
            contact_tel: '',
            contact_mail: ''
        };
        if (!this.state.type) {
            error.type = '请选择商户类型';
            result = false;
        }
        if (!this.state.name) {
            error.name = '请填写公司名称';
            result = false;
        }
        if (!this.state.alias) {
            error.alias = '请填写公司别称或简称';
            result = false;
        }
        if (!this.state.area || !this.state.city || !this.state.province) {
            error.area = '请选择公司所在地省市区';
            result = false;
        }
        if (!this.state.address) {
            error.address = '请补充详细地址';
            result = false;
        }
        if (!this.state.cert_type) {
            error.cert_type = '请选择证件类型';
            result = false;
        }
        if (!utils.isValidBusCode(this.state.cert_no)) {
            error.cert_no = '请填写合法的营业执照编号';
            result = false;
        }
        if (this.state.cert_type == 'normal' && !utils.isValidOrgCode(this.state.org_no)) {
            error.org_no = '请填写合法的组织机构编号';
            result = false;
        }
        if (this.state.cert_type == 'normal' && !utils.isValidTaxCode(this.state.tax_no)) {
            error.tax_no = '请填写合法的税务登记证编号';
            result = false;
        }
        if (this.state.cert_type == 'normal' && this.state.cert_no.length != 15) {
            error.cert_no = '普通营业执照长度为15位,请填写合法的营业执照编号';
            result = false;
        }
        else if (this.state.cert_type == '5in1' && this.state.cert_no.length != 18) {
            error.cert_no = '请填写合法的18位营业执照编号(社会信用统一编号)';
            result = false;
        }
        if (!this.state.cert_image) {
            error.cert_image = '请选择营业执照副本';
            result = false;
        }
        if (!this.state.contact_name) {
            error.contact_name = '请填写联系人姓名';
            result = false;
        }
        if (!this.state.contact_tel || !/^1\d{10}$/.test(this.state.contact_tel)) {
            error.contact_tel = '请填写正确联系人手机号';
            result = false;
        }
        if (!this.state.contact_mail || !/^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/.test(this.state.contact_mail)) {
            error.contact_mail = '请填写正确的联系人邮箱';
            result = false;
        }
        this.setState({error: error});
        return result;
    }

    submit(event) {
        event.preventDefault();
        if (this.validate()) {
            let info = Object.assign({
                account_id: this.props.account.get('id')
            }, this.state);
            delete info.error;
            delete info.loading;
            this.apply(info)
        }
        return false;
    }

    apply(applyInfo) {
        let self = this;
        self.setState({
            loading: true
        })
        GXBFaucetActions.merchantApply(applyInfo, this.props.account).then(function (result) {
            self.setState({
                loading: false
            });
            self.showNoticeModal();
        }, function (err) {
            self.setState({
                loading: false
            })
            console.log("ERROR when apply for merchant", err);
            let error_msg = err.message || (err.base && err.base.length && err.base.length > 0 ? err.base[0] : "未知错误");
            notify.addNotification({
                message: `申请失败: ${error_msg}`,
                level: "error",
                autoDismiss: 10
            });
        })
    }
}

export default MerchantVerify

