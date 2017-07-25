import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import {Tabs, Tab} from '../Utility/Tabs'
import {ChainStore} from "gxbjs/es";
import BindToChainState from "../Utility/BindToChainState";
class GXBDepositModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            asset: null
        }
    }

    show(asset) {
        this.setState({
            asset: asset
        })
        let modalId = 'modal-gxb-deposite'
        ZfApi.publish(modalId, "open");
    }

    render() {
        let modalId = 'modal-gxb-deposite'
        let asset = this.state.asset || ChainStore.getAsset('1.3.0');
        if (!asset) {
            return null;
        }
        let isCore = asset.get('symbol') == ChainStore.getAsset('1.3.0').get('symbol');
        let assetName = {
                GXC: '公信币',
                GXS: '公信股'
            }[asset.get('symbol')] || asset.get('symbol');
        return (
            <Modal id={modalId} overlay={true} ref={modalId}>
                <Trigger close={modalId}>
                    <a href="#" className="close-button">&times;</a>
                </Trigger>
                <div className="grid-block vertical container-deposit-withdraw">
                    <Tabs>
                        {asset.get('id')=='1.3.0'?<Tab title="人民币充值">
                            <table className="table">
                                <tbody>
                                <tr>
                                    <td width="120px">充值地址:</td>
                                    <td>
                                        请和您的公信宝专属商户经理联系，如果您还没有专属商户经理，请访问公信宝官方网站联系我们 <a href="https://gxb.io">https://gxb.io</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td>充值资产:</td>
                                    <td>
                                        <label>RMB&nbsp;(人民币)</label>
                                    </td>
                                </tr>
                                <tr>
                                    <td>您将收到:</td>
                                    <td>
                                        <label>{asset.get('symbol')}&nbsp;({assetName})</label>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                            {isCore ? <p className="note">备注：公信宝运营公司作为网关提供{assetName}和人民币1:1的承兑服务</p> : null}
                        </Tab>:null}
                        <Tab title={`${assetName}充值`}>
                            <table className="table">
                                <tbody>
                                <tr>
                                    <td width="120px">充值地址:</td>
                                    <td>
                                        <label>
                                            {this.props.account_name}&nbsp;
                                            <span className="tip">(为了从其他人或者承兑商获得<strong>{asset.get('symbol')}</strong>，你只需要提供你的账户名)
                                            </span>
                                        </label>
                                    </td>
                                </tr>
                                <tr>
                                    <td>充值资产:</td>
                                    <td>
                                        <label>{asset.get('symbol')}&nbsp;({assetName})</label>
                                    </td>
                                </tr>
                                <tr>
                                    <td>您将收到:</td>
                                    <td>
                                        <label>{asset.get('symbol')}&nbsp;({assetName})</label>
                                    </td>
                                </tr>
                                </tbody>
                            </table>

                        </Tab>
                    </Tabs>
                </div>
            </Modal>
        );
    }
}

export default BindToChainState(GXBDepositModal);