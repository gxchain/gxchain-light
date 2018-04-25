import React from 'react'
import DataProductCard from './DataProductCard'
import {Apis} from 'gxbjs-ws'
import LoadingIndicator from '../LoadingIndicator'
import notify from "actions/NotificationActions";

class HotProducts extends React.Component {

    constructor() {
        super();
        this.state = {
            loading: true,
            products: []
        }
    }

    componentDidMount() {
        this.loadProducts();
    }

    loadProducts() {
        let self = this;
        Apis.instance().db_api().exec('list_home_free_data_products', [6]).then(function (res) {
            self.setState({
                loading: false,
                // products: res.concat(res).concat(res).concat(res).concat(res).concat(res).concat(res).concat(res).concat(res)
                products: res
            })
        }).catch(function (err) {
            console.error('error on fetching data products', err);
            notify.addNotification({
                message: `加载热门数据产品失败`,
                level: "error",
                autoDismiss: 5
            });
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

        let hotProducts_EL = products.map((prod, i)=> {
            return <DataProductCard router={this.props.router} id={prod.id}  desc={prod.brief_desc} key={`hot_product_${i}`} image={prod.icon} name={prod.product_name}
                                    price={prod.price} volume={prod.total}></DataProductCard>
        })

        return <div className="grid-block small-up-1 medium-up-3 no-overflow">
            {hotProducts_EL}
        </div>
    }
}

export default HotProducts