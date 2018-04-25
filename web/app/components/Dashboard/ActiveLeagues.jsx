import React from 'react'
import LeagueCard from './LeagueCard'
import {Apis} from 'gxbjs-ws'
import LoadingIndicator from '../LoadingIndicator'

class ActiveLeagues extends React.Component{

    constructor() {
        super();
        this.state = {
            loading: true,
            leagues: []
        }
    }

    componentDidMount() {
        this.loadLeagues();
    }

    loadLeagues() {
        let self = this;
        Apis.instance().db_api().exec('list_home_leagues', [3]).then(function (res) {
            self.setState({
                loading: false,
                // leagues: res.concat(res).concat(res)
                leagues: res
            })
        }).catch(function (err) {
            console.error('error on fetching active leagues', err);
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

        let activeLeagues_EL = leagues.map((league,i)=>{
            return <LeagueCard router={this.props.router} id={league.id} data_products={league.data_products} desc={league.brief_desc} key={`active_leagues_${i}`} image={league.icon} name={league.league_name} members={league.merchant_total}></LeagueCard>
        })

        return <div className="grid-block small-up-1 medium-up-3 no-overflow">
            {activeLeagues_EL}
        </div>
    }
}

export default ActiveLeagues