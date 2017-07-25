import React from "react";
import {Link} from "react-router/es";
import Translate from "react-translate-component";
import notify from "actions/NotificationActions";
import {ChainStore} from "gxbjs/es";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import GXBFaucetActions from "actions/GXBFaucetActions";
import LeagueCard from '../Dashboard/LeagueCard'
import {Tabs,Tab} from "../Utility/Tabs";
import Icon from '../Icon/Icon'

import Statistics from "./Statistics";
import AccountActions from "actions/AccountActions";
import TimeAgo from "../Utility/TimeAgo";
import HelpContent from "../Utility/HelpContent";
import accountUtils from "common/account_utils";

class GXBAccountMembership extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired
    };
    static defaultProps = {
        gprops: "2.0.0",
        core_asset: "1.3.0"
    };

    constructor(props){
        super(props);
        this.state={
            leagues:[],
            leagues_loaded:false,
            merchant_name:'',
            merchant_alias:'',
            applying:-1
        }
    }

    componentWillMount() {
        if(this.props.isMyAccount) {
            this.getIsApplying();
        }
    }
    
    getIsApplying(){
        let self = this;
        GXBFaucetActions.isApplying(this.props.account.get('id')).then(res=>{
            if(res.applying){
                self.setState({
                    applying:1
                })
            }
            else{
                self.setState({
                    applying:0
                })
            }
        },function (err) {
            console.log("ERROR when fetching account apply info", err);
            let error_msg = err.message||(err.base && err.base.length && err.base.length > 0 ? err.base[0] : "未知错误");
            notify.addNotification({
                message: `加载申请资料失败: ${error_msg}`,
                level: "error",
                autoDismiss: 10
            });
        })
    }

    getAccountMemberStatus(account) {
        if (account === undefined) return undefined;
        if (account === null) return "unknown";

        if(account.get('membership_expiration_date')=='1969-12-31T23:59:59'){
            return 'lifetime';
        }

        if(account.get('datasource_expiration_date')=='1969-12-31T23:59:59'){
            return 'datasource';
        }

        if(account.get('merchant_expiration_date')=='1969-12-31T23:59:59'){
            return 'merchant';
        }

        if (account.get("lifetime_referrer") == account.get("id")) return "lifetime";
        var exp = new Date(account.get("membership_expiration_date")).getTime();
        var now = new Date().getTime();
        if (exp < now) return "basic";
        return "annual";
    }

    loadLeagueList(){
        let self = this;
        GXBFaucetActions.getAccountLeagueList({
            account_id:this.props.account.get('id')
        },this.props.account).then(res=>{
            self.setState({
                leagues_loaded:true,
                leagues:res
            })
        },err=>{
            console.log("ERROR when load league list", err);
            let error_msg = err.message||(err.base && err.base.length && err.base.length > 0 ? err.base[0] : "未知错误");
            notify.addNotification({
                message: `获取所在联盟列表失败: ${error_msg}`,
                level: "error",
                autoDismiss: 10
            });
        })
    }

    loadMerchantInfo(){
        let self = this;
        GXBFaucetActions.getMerchantInfo({
            account_id:this.props.account.get('id')
        },this.props.account).then(res=>{
            self.setState({
                merchant_name:res.name,
                merchant_alias:res.alias
            })
        },err=>{
            console.log("ERROR when load merchant info", err);
            let error_msg = err.message||(err.base && err.base.length && err.base.length > 0 ? err.base[0] : "未知错误");
            notify.addNotification({
                message: `获取商户信息失败: ${error_msg}`,
                level: "error",
                autoDismiss: 10
            });
        })
    }

    render() {
        let isMyAccount = this.props.isMyAccount;
        let account = this.props.account.toJS();

        let account_name = account.name;

        let member_status = this.getAccountMemberStatus(this.props.account);
        let membership = "account.member." + member_status;

        //商户认证按钮
        let btnMerchantVerify = <Link to={`/account/${account_name}/merchant-verify`}
                                      className="button">认证为商户</Link>
        if(member_status=='merchant'||member_status=='datasource'){
            btnMerchantVerify='已认证';
        }

        //数据源认证按钮
        let btnDataSourceVerify = <Link to={`/account/${account_name}/data-source-verify`}
                                        className="button">认证为数据源</Link>
        if(member_status=='datasource'){
            btnDataSourceVerify='已认证';
        }
        if(member_status!='merchant'&&member_status!='datasource'){
            btnDataSourceVerify=<a className="button disabled button-primary">请先完成商户认证</a>;
        }

        if(this.state.applying==1){
            btnMerchantVerify=<a className="button disabled button-primary">认证申请中</a>
            btnDataSourceVerify=<a className="button disabled button-primary">认证申请中</a>
        }
        else if(this.state.applying==-1){
            btnMerchantVerify=null;
            btnDataSourceVerify=null;
        }

         var leagues=this.state.leagues.map((league,i)=>{
             return <LeagueCard key={`item_${i}_${league.league_name}`} id={league.id} router={this.props.router}
                                image={league.icon} name={league.league_name} desc={league.brief_desc} data_products={league.data_products}>
             </LeagueCard>
         });
        if(leagues.length==0){
            leagues=<p className="tip">未加入任何联盟</p>
        }

        return (
            <div className="grid-content" style={{overflowX: "hidden"}}>
                <div className="content-block">
                    <Tabs>
                        <Tab title={`账户资料`}>
                            <table className="table table-member-stats">
                                <tbody>
                                <tr>
                                    <td width="100rem"><span className="secondary">账户类型</span></td>
                                    <td>
                                        <Translate content={membership}></Translate>
                                    </td>
                                </tr>
                                <tr>
                                    <td>转账权限</td>
                                    <td>有</td>
                                </tr>
                                <tr>
                                    <td>充值权限</td>
                                    <td>有</td>
                                </tr>
                                <tr>
                                    <td>提现权限</td>
                                    <td>有</td>
                                </tr>
                                <tr>
                                    <td>购买数据</td>
                                    <td>{member_status=='merchant'||member_status=='datasource' ? '有' : '无'}</td>
                                </tr>
                                <tr>
                                    <td>出售数据</td>
                                    <td>{member_status=='datasource' ? '有' : '无'}</td>
                                </tr>
                                </tbody>
                            </table>
                        </Tab>
                        <Tab title="商户信息">
                            {isMyAccount ? <div className="content-block">
                                <h4>商户认证</h4>
                                <table className="table">
                                    <tbody>
                                    {member_status=='merchant'||member_status=='datasource' ? <tr>
                                        <td>商户名称</td>
                                        <td>{this.state.merchant_name?<span>{`${this.state.merchant_name}(${this.state.merchant_alias})`}</span>:<a onClick={this.loadMerchantInfo.bind(this)}>显示</a>}</td>
                                    </tr> : null}
                                    <tr>
                                        <td>如果你希望在公信宝进行数据交易，请完成商户实名认证</td>
                                        <td>
                                            {btnMerchantVerify}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>如果你希望在公信宝里成为数据源并出售数据，请完成数据源认证</td>
                                        <td>
                                            {btnDataSourceVerify}
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div> : null}
                            {isMyAccount&&member_status=='datasource' ? <div className="content-block">
                                <h4>所在联盟</h4>
                                {this.state.leagues_loaded?<div className="small-up-1 medium-up-3 large-up-3 no-overflow">{leagues}</div>:<a onClick={this.loadLeagueList.bind(this)}>显示联盟</a>}
                            </div> : null}
                        </Tab>
                    </Tabs>
                </div>

            </div>
        );
    }
}

GXBAccountMembership = BindToChainState(GXBAccountMembership);

export default GXBAccountMembership;
