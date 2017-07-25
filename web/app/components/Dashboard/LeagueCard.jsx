import React from 'react'
import cnames from 'classnames'
import Translate from "react-translate-component"
import notify from "actions/NotificationActions"
import GXBFaucetActions from "actions/GXBFaucetActions";
import utils from 'common/utils'

class LeagueCard extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            members: 0
        };
    }

    componentWillMount() {
        // this.loadMembers();
    }

    loadMembers() {
        let self = this;
        GXBFaucetActions.getLeagueMemberCount(this.props.id).then(function (resp) {
            self.setState({
                members: resp && resp.count || 0
            })
        }).catch(function (err) {
            console.error('error on fetching league members', err);
            notify.addNotification({
                message: `加载联盟成员信息失败`,
                level: "error",
                autoDismiss: 5
            });
            self.setState({
                league_loading: false
            })
        })
    }

    render() {
        return <div className='grid-content account-card league-prod-card' onClick={this.goToLeague.bind(this)}>
            <div className="card">
                <div className="image">
                    <img src={this.props.image}/>
                </div>
                <div className="info">
                    <h4 className="title">{this.props.id}:{this.props.name}</h4>
                    <p className="desc">{this.props.desc}</p>
                    <p className="price">
                        <Translate content="league.data_products"/>:&nbsp;&nbsp;
                        <span className="lg">{this.props.data_products.length}</span>&nbsp;个
                    </p>
                </div>
            </div>
            {/*<div className="card">
             <h4 className="title text-center">{this.props.id}:{this.props.name}</h4>
             <div className="card-content">
             <div className="text-center">
             <img className="align-center" style={{width: 70}} src={this.props.image}/>
             <p className="sub-title">{this.props.desc}</p>
             </div>

             <table className="table key-value-table">
             <tbody>
             <tr>
             <td><Translate content="league.members"/></td>
             <td>{this.state.members}&nbsp;家</td>
             </tr>
             <tr>
             <td><Translate content="league.data_products"/></td>
             <td>{this.props.data_products.length}&nbsp;个</td>
             </tr>
             </tbody>
             </table>
             </div>
             </div>*/}
        </div>
    }

    goToLeague() {
        this.props.router.push(`/data-market/League/${this.props.id}`);
    }
}

export default LeagueCard