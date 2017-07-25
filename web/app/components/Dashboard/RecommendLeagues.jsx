import React from 'react'
import LeagueCard from './LeagueCard'
import {Apis} from 'gxbjs-ws'
import LoadingIndicator from '../LoadingIndicator'
import notify from "actions/NotificationActions";

class RecommendLeagues extends React.Component{

    constructor() {
        super();
        this.state = {
            loading: true,
            leagues: []
        }
    }

    componentWillMount() {
        this.loadLeagues();
    }

    loadLeagues() {
        let self = this;
        Apis.instance().db_api().exec('list_recommend_leagues', [this.props.league_id]).then(function (res) {
            self.setState({
                loading: false,
                leagues: res
            })
        }).catch(function (err) {
            console.error('error on fetching active leagues', err);
            notify.addNotification({
                message: `加载推荐联盟失败`,
                level: "error",
                autoDismiss: 5
            });
            self.setState({
                loading: false
            })
        })
    }

    render(){

        if (this.state.loading) {
            return <LoadingIndicator type="three-bounce"></LoadingIndicator>
        }
        let {leagues}=this.state;

        let recommendLeagues_EL = leagues.map((league,i)=>{
            return <LeagueCard router={this.props.router} id={league.id} key={`recommend_leagues_${i}`} image={league.icon} name={league.league_name} members={league.merchant_total} invokes={league.total}></LeagueCard>
        })

        if(recommendLeagues_EL.length==0){
            return <div className="dark">暂无推荐</div>
        }

        return <div className="grid-block small-up-1 no-overflow fm-outer-container">
            {recommendLeagues_EL}
        </div>
    }
}

export default RecommendLeagues