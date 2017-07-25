import React from 'react'
import DataProductCard from './DataProductCard'
import {Apis} from 'gxbjs-ws'
import LoadingIndicator from '../LoadingIndicator'

class RecommedProducts extends React.Component {

    constructor() {
        super();
        this.state = {
            loading: true,
            products: []
        }
    }

    componentWillMount() {
        this.loadProducts();
    }

    loadProducts() {
        let self = this;
        Apis.instance().db_api().exec('list_recommend_data_products', [this.props.product_id]).then(function (res) {
            self.setState({
                loading: false,
                products: res
            })
        }).catch(function (err) {
            console.error('error on fetching data products', err);
            self.setState({
                loading: false
            })
        })
    }

    render() {

        if (this.state.loading) {
            return <LoadingIndicator type="three-bounce"></LoadingIndicator>
        }
        let {products}=this.state;

        let recommendProducts_EL = products.map((prod, i)=> {
            return <DataProductCard router={this.props.router} id={prod.id}  key={`recommend_product_${i}`} image={prod.icon} name={prod.product_name}
                                    price={prod.price} volume={prod.total}></DataProductCard>
        })
        if(recommendProducts_EL.length==0){
            return <div className="dark">暂无推荐</div>
        }

        return <div className="grid-block small-up-1 no-overflow fm-outer-container">
            {recommendProducts_EL}
        </div>
    }
}

export default RecommedProducts