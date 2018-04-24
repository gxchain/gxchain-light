import React from "react";
import {Link} from "react-router/es";
import Translate from "react-translate-component";
import notify from "actions/NotificationActions";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import GXBFaucetActions from "actions/GXBFaucetActions";
import LeagueCard from '../Dashboard/LeagueCard';
import {Tab, Tabs} from "../Utility/Tabs";

class GXBAccountMembership extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired
    };
    static defaultProps = {
        gprops: "2.0.0",
        core_asset: "1.3.0"
    };

    constructor (props) {
        super (props);
        this.state = {
            leagues: [],
            leagues_loaded: false,
            merchant_name: '',
            merchant_alias: '',
            applying: -1
        };
    }

    componentWillMount () {
        if (this.props.isMyAccount) {
            this.getIsApplying ();
        }
    }

    getIsApplying () {
        let self = this;
        GXBFaucetActions.isApplying (this.props.account.get ('id')).then (res => {
            if (res.applying) {
                self.setState ({
                    applying: 1
                });
            }
            else {
                self.setState ({
                    applying: 0
                });
            }
        }, function (err) {
            console.log ("ERROR when fetching account apply info", err);
            let error_msg = err.message || (err.base && err.base.length && err.base.length > 0 ? err.base[0] : "未知错误");
            notify.addNotification ({
                message: `加载申请资料失败: ${error_msg}`,
                level: "error",
                autoDismiss: 10
            });
        });
    }

    getAccountMemberStatus (account) {
        if (account === undefined) return undefined;
        if (account === null) return "unknown";

        if (account.get ('membership_expiration_date') !== '1970-01-01T00:00:00') {
            return 'lifetime';
        }

        if (account.get ('datasource_expiration_date') !== '1970-01-01T00:00:00') {
            return 'datasource';
        }

        if (account.get ('merchant_expiration_date') !== '1970-01-01T00:00:00') {
            return 'merchant';
        }

        if (account.get ("lifetime_referrer") == account.get ("id")) return "lifetime";
        var exp = new Date (account.get ("membership_expiration_date")).getTime ();
        var now = new Date ().getTime ();
        if (exp < now) return "basic";
        return "annual";
    }

    loadLeagueList () {
        let self = this;
        GXBFaucetActions.getAccountLeagueList ({
            account_id: this.props.account.get ('id')
        }, this.props.account).then (res => {
            self.setState ({
                leagues_loaded: true,
                leagues: res
            });
        }, err => {
            console.log ("ERROR when load league list", err);
            let error_msg = err.message || (err.base && err.base.length && err.base.length > 0 ? err.base[0] : "未知错误");
            notify.addNotification ({
                message: `获取所在联盟列表失败: ${error_msg}`,
                level: "error",
                autoDismiss: 10
            });
        });
    }

    loadMerchantInfo () {
        let self = this;
        GXBFaucetActions.getMerchantInfo ({
            account_id: this.props.account.get ('id')
        }, this.props.account).then (res => {
            self.setState ({
                merchant_name: res.name,
                merchant_alias: res.alias
            });
        }, err => {
            console.log ("ERROR when load merchant info", err);
            let error_msg = err.message || (err.base && err.base.length && err.base.length > 0 ? err.base[0] : "未知错误");
            notify.addNotification ({
                message: `获取商户信息失败: ${error_msg}`,
                level: "error",
                autoDismiss: 10
            });
        });
    }

    render () {
        let isMyAccount = this.props.isMyAccount;
        let account = this.props.account.toJS ();

        let account_name = account.name;

        let member_status = this.getAccountMemberStatus (this.props.account);
        let membership = "account.member." + member_status;

        //商户认证按钮
        let btnMerchantVerify = <Link to={`/account/${account_name}/merchant-verify`}
                                      className="button"><Translate content="account.member.merchant_apply"></Translate></Link>;
        if (member_status == 'merchant' || member_status == 'datasource') {
            btnMerchantVerify = <Translate content="account.member.verified"></Translate>;
        }

        //数据源认证按钮
        let btnDataSourceVerify = <Link to={`/account/${account_name}/data-source-verify`}
                                        className="button"><Translate
            content="account.member.datasource_apply"></Translate></Link>;
        if (member_status == 'datasource') {
            btnDataSourceVerify = <Translate content="account.member.verified"></Translate>;
        }
        if (member_status != 'merchant' && member_status != 'datasource') {
            btnDataSourceVerify = <a className="button disabled button-primary">请先完成商户认证</a>;
        }

        if (this.state.applying == 1) {
            btnMerchantVerify =
                <a className="button disabled button-primary"><Translate content="account.member.verifying"></Translate></a>;
            btnDataSourceVerify =
                <a className="button disabled button-primary"><Translate content="account.member.verifying"></Translate></a>;
        }
        else if (this.state.applying == -1) {
            btnMerchantVerify = null;
            btnDataSourceVerify = null;
        }

        var leagues = this.state.leagues.map ((league, i) => {
            return <LeagueCard key={`item_${i}_${league.league_name}`} id={league.id} router={this.props.router}
                               image={league.icon} name={league.league_name} desc={league.brief_desc}
                               data_products={league.data_products}>
            </LeagueCard>;
        });
        if (leagues.length == 0) {
            leagues = <p className="tip"><Translate content="account.member.no_alliance"></Translate></p>;
        }

        return (
            <div className="grid-content" style={{overflowX: "hidden"}}>
                <div className="content-block">
                    <table className="table table-member-stats">
                        <tbody>
                        <tr>
                            <td width="100rem"><Translate content="account.member.account_type"></Translate>
                            </td>
                            <td>
                                <Translate content={membership}></Translate>
                            </td>
                        </tr>
                        <tr>
                            <td><Translate content="account.member.transfer_permission"></Translate></td>
                            <td><Translate content="account.member.yes"></Translate></td>
                        </tr>
                        <tr>
                            <td><Translate content="account.member.deposit_permission"></Translate></td>
                            <td><Translate content="account.member.yes"></Translate></td>
                        </tr>
                        <tr>
                            <td><Translate content="account.member.withdraw_permission"></Translate></td>
                            <td><Translate content="account.member.yes"></Translate></td>
                        </tr>
                        <tr>
                            <td><Translate content="account.member.buy_data"></Translate></td>
                            <td>{member_status == 'merchant' || member_status == 'datasource' ?
                                <Translate content="account.member.yes"></Translate> :
                                <Translate content="account.member.no"></Translate>}</td>
                        </tr>
                        <tr>
                            <td><Translate content="account.member.sell_data"></Translate></td>
                            <td>{member_status == 'datasource' ?
                                <Translate content="account.member.yes"></Translate> :
                                <Translate content="account.member.no"></Translate>}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

GXBAccountMembership = BindToChainState (GXBAccountMembership);

export default GXBAccountMembership;
