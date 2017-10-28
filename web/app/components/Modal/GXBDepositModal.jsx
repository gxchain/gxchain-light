import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import {Tabs, Tab} from '../Utility/Tabs'
import {ChainStore} from "gxbjs/es";
import BindToChainState from "../Utility/BindToChainState";
import Translate from "react-translate-component";
import counterpart from "counterpart";

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
        let assetName = asset.get('symbol');
        let deposit_title = counterpart.translate('modal.deposit.title',{
            assetName
        });
        return (
            <Modal id={modalId} overlay={true} ref={modalId}>
                <Trigger close={modalId}>
                    <a href="#" className="close-button">&times;</a>
                </Trigger>
                <div className="grid-block vertical container-deposit-withdraw">
                    <Tabs>
                        {asset.get('id') == '1.3.0' ? <Tab title="modal.deposit.by_rmb">
                            <table className="table">
                                <tbody>
                                <tr>
                                    <td width="180px"><Translate content="modal.deposit.address"/>:</td>
                                    <td>
                                        {this.props.account.get('name')}
                                        <Translate component="div" content="modal.deposit.tip"/><a href="https://gxb.io">https://gxb.io</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td><Translate content="modal.deposit.asset"/>:</td>
                                    <td>
                                        <label>RMB</label>
                                    </td>
                                </tr>
                                <tr>
                                    <td><Translate content="modal.deposit.receive"/>:</td>
                                    <td>
                                        <label>{asset.get('symbol')}&nbsp;({assetName})</label>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                            {isCore ? <p className="note"><Translate content="modal.deposit.remark"/></p> : null}
                        </Tab> : null}
                        <Tab title={`${deposit_title}`}>
                            <table className="table">
                                <tbody>
                                <tr>
                                    <td width="180px"><Translate content="modal.deposit.address"/>:</td>
                                    <td>
                                        <label>
                                            {this.props.account.get('name')}
                                            {/*&nbsp;<span className="tip">(为了从其他人或者承兑商获得<strong>{asset.get('symbol')}</strong>，你只需要提供你的账户名)*/}
                                            {/*</span>*/}
                                        </label>
                                    </td>
                                </tr>
                                <tr>
                                    <td><Translate content="modal.deposit.asset"/>:</td>
                                    <td>
                                        <label>{asset.get('symbol')}&nbsp;({assetName})</label>
                                    </td>
                                </tr>
                                <tr>
                                    <td><Translate content="modal.deposit.receive"/>:</td>
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