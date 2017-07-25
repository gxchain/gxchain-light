import React from 'react'
import cnames from 'classnames'
import Translate from "react-translate-component"
import FormattedAsset from "../Utility/FormattedAsset";
import BindToChainState from '../Utility/BindToChainState';

class DataProductCard extends React.Component {

    render() {
        return <div className='grid-content account-card free-prod-card' onClick={this.goToMarket.bind(this)}>
            <div className="card">
                <div className="image">
                    <img src={this.props.image}/>
                </div>
                <div className="info">
                    <h4 className="title">{this.props.id}:{this.props.name}</h4>
                    <p className="desc">{this.props.desc}</p>
                    <p className="price">
                        <Translate content="data_product.price"/>:&nbsp;&nbsp;
                        <FormattedAsset amount={this.props.price} asset='1.3.0'/>
                    </p>
                </div>
            </div>
        </div>
    }

    goToMarket() {
        this.props.router.push(`/data-market/Free/${this.props.id}`);
    }
}


export default BindToChainState(DataProductCard)