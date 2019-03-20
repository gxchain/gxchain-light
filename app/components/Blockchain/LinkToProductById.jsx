import React from "react";
import {Link} from "react-router/es";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";

class LinkToProductById extends React.Component {
    static propTypes = {
        product: ChainTypes.ChainObject.isRequired
    }
    render() {
        let data_market_type;
        switch (this.props.product.get('category_id')){
            case '1.16.0':
                data_market_type = 'Free';
                break;
            case '1.16.1':
                data_market_type = 'League';
                break;
            default:
                data_market_type = 'Free';
                break;
        }

        return <Link to={`/data-market/${data_market_type}/${this.props.product.get('id')}`}>{this.props.product.get('product_name')}</Link>;
    }
}

export default BindToChainState(LinkToProductById);
