import React from 'react'
import {Apis} from 'gxbjs-ws'
import LoadingIndicator from '../LoadingIndicator'
import DataProductCard from '../Dashboard/DataProductCard'
import notify from "actions/NotificationActions";
import cnames from "classnames";
import Icon from "../Icon/Icon";
import Translate from "react-translate-component";
import {Link} from "react-router/es";
import Pager from '../Utility/Pager'

let pageSize = 9;

class DataMarketList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            prod_loading: false,
            searchTerm:'',
            categories: [],
            currentCategory: {},
            list: [],
            total: 0,
            currentPage: 0
        }
    }

    componentWillMount() {
        this.loadCategories();
    }

    render() {
        if (this.state.loading) {
            return <LoadingIndicator></LoadingIndicator>
        }

        let products_EL = <LoadingIndicator></LoadingIndicator>;


        if (!this.state.prod_loading) {
            products_EL = this.state.list.map((prod, i)=> {
                return <DataProductCard key={`item_${i}_${prod.category_name}`} id={prod.id} router={this.props.router}
                                        image={prod.icon} name={prod.product_name} desc={prod.brief_desc} price={prod.price}
                                        volume={prod.total}></DataProductCard>
            });
        }

        let categories_EL = this.state.categories.map((cate, i)=> {
            return <li onClick={this.onChangeCategory.bind(this,cate)} key={cate.id}
                       className={cnames({active:cate.id==this.state.currentCategory.id})}>
                <a>{cate.category_name}</a>
            </li>
        })

        var tip = ''; //无数据提示
        if (!this.state.list||this.state.list.length==0) {
            tip = <p className="text-center">未查询到结果</p>;
        }

        return (
            <div className="grid-block horizontal">
                <div className="grid-block left-column shrink market-category">
                    <ul className="block-list">
                        {categories_EL}
                    </ul>
                </div>
                <div className="grid-block market-list vertical">
                    <div className="align-right search-area">
                        <div className="input-group float-right">
                            <input placeholder="搜索" onChange={this.onSearch.bind(this)} style={{width:300}} type="text" className="form-control"/>
                            <Icon name="search"></Icon>
                        </div>
                    </div>
                    <div style={{padding: `25px 10px 0px`}}>
                        <div className="grid-block small-up-1 medium-up-3 large-up-3 no-overflow">
                            {products_EL}
                        </div>
                        {tip}
                        <Pager onChange={this.onPageChange.bind(this)} total={this.calcPageSize()}
                               current={this.state.currentPage}></Pager>
                    </div>
                </div>
            </div>
        )
    }

    onSearch(e) {
        let self = this;
        let searchTerm = e.target.value;
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        self.setState({
            searchTerm:searchTerm
        })
        this.timeout = setTimeout(function () {
            self.loadProducts(self.state.currentCategory.id, 0, searchTerm);
        },200);

    }

    onPageChange(page) {
        this.loadProducts(this.state.currentCategory.id, page);
    }

    calcPageSize(e) {
        if (this.state.total % pageSize == 0) {
            return parseInt(this.state.total / pageSize);
        }
        return parseInt(this.state.total / pageSize) + 1;
    }

    onChangeCategory(category) {
        this.setState({
            currentCategory: category,
            searchTerm:''
        })
        this.loadProducts(category.id, 0);
    }

    loadProducts(category_id, page, keywords) {
        let self = this;
        keywords=keywords||"";
        self.setState({
            prod_loading: true,
            list: [],
            currentPage: page
        });
        return Apis.instance().db_api().exec('list_free_data_products', [category_id, page * pageSize, pageSize, "", keywords,false]).then(function (res) {
            if(keywords==self.state.searchTerm) {
                self.setState({
                    prod_loading: false,
                    // list: res.data.concat(res.data).concat(res.data).concat(res.data).concat(res.data).concat(res.data).concat(res.data).concat(res.data).concat(res.data).concat(res.data).concat(res.data).concat(res.data),
                    list: res.data,
                    total: res.filtered_total
                })
            }
        }).catch(function (err) {
            console.error('error on fetching data products', err);
            notify.addNotification({
                message: `加载数据产品列表失败`,
                level: "error",
                autoDismiss: 5
            });
            self.setState({
                prod_loading: false
            })
        })
    }

    loadCategories() {
        let self = this;
        self.setState({
            loading: true,
            categories: [],
            list: [],
            currentCategory: {},
            currentPage: 0,
            total: 0
        });
        Apis.instance().db_api().exec('list_data_market_categories', [1]).then(function (res) {
            res=(res||[]).filter(function (cate) {
                return cate.status==1;
            });
            self.setState({
                loading: false,
                categories: res
            })
            let currentCategory = res && res.length > 0 ? res[0] : {};
            if (currentCategory.id) {
                self.onChangeCategory(currentCategory);
            }
        }).catch(function (err) {
            console.error('error on fetching data products', err);
            notify.addNotification({
                message: `加载行业目录失败`,
                level: "error",
                autoDismiss: 5
            });
            self.setState({
                loading: false
            })
        })
    }
}

export default DataMarketList;