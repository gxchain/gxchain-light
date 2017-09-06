import React from 'react'
import FormattedAsset from "../Utility/FormattedAsset";
import BindToChainState from '../Utility/BindToChainState';

class DataProductList extends React.Component {

    render() {
        return (
            <tr>
                <td className="image">
                    <img src={this.props.image} style={{width:'40px',height:'40px'}}/>
                </td>
                <td className="title">{this.props.id}:{this.props.name}</td>
                <td className="costs"><FormattedAsset amount={this.props.costs} asset='1.3.0'/></td>
                <td className="count">{this.props.count}</td>
            </tr>
        );
    }
}


export default BindToChainState(DataProductList)