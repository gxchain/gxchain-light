import React from "react"
import {Apis} from 'gxbjs-ws'
import Translate from "react-translate-component"
import notify from "actions/NotificationActions"
import ChainTypes from "../Utility/ChainTypes";
import FormattedAsset from "../Utility/FormattedAsset"
import BindToChainState from "../Utility/BindToChainState"
import { Icon } from 'antd';
import LogoCard from "../Dashboard/LogoCard";
import DataProductList from '../Dashboard/DataProductList'

import Operation from "../Blockchain/Operation";
import LoadingIndicator from '../LoadingIndicator'

import Immutable from "immutable";
import utils from "common/utils";
import BlockchainActions from "actions/BlockchainActions";

require("assets/stylesheets/components/_statistics.scss");

let pageSize = 10;
let curDate = new Date().toISOString().substr(0,19);
let preDate = new Date(new Date().getTime() - 24*60*60*1000).toISOString().substr(0,19); //前一天
let weekDate = new Date(new Date().getTime() - 7*24*60*60*1000).toISOString().substr(0,19); //前七天

class Statistics extends React.Component {
    static propTypes = {
        dynGlobalObject: ChainTypes.ChainObject.isRequired,
        coreAsset: ChainTypes.ChainAsset.isRequired,
    };

    static defaultProps = {
        dynGlobalObject: "2.1.0",
        coreAsset: "1.3.0",
        latestBlocks: {},
    };

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            transaction_total_costs: 0,
            transaction_week_costs: 0,
            transaction_today_costs: 0,
            transaction_total_count: 0,
            transaction_week_count: 0,
            transaction_today_count: 0,
            transaction_pay_fees: 0,
            merchants_total_count: 0,
            categories: [],
            currentCategory: {},
            list: [],
            total: 0,
            currentPage: 0
        }
        this.statsInterval = null;
    }

    componentWillMount() {
        let self = this;
        self.loadTransactionCosts();
        self.loadTransactionCount();
        this.statsInterval = setInterval(function () {
            self.loadTransactionCosts();
            self.loadTransactionCount();
        },15 * 1000);
    }

    componentWillUnmount() {
        clearInterval(this.statsInterval);
        this.statsInterval = null;
    }

    loadTransactionCosts() {
        let self = this;
        self.setState({
            loading: true,
            transaction_total_costs: 0,
            transaction_week_costs: 0,
            transaction_today_costs: 0,
        });

        Apis.instance().db_api().exec('get_data_transaction_product_costs', ['2017-06-15T00:00:00',curDate]).then(function (res) {
            self.setState({
                transaction_total_costs: res,
            })
        }).catch(function (err) {
            console.error('error on fetching data products', err);
            notify.addNotification({
                message: `加载交易额数据失败`,
                level: "error",
                autoDismiss: 5
            });
            self.setState({
                loading: false
            })
        })

        Apis.instance().db_api().exec('get_data_transaction_product_costs', [weekDate,curDate]).then(function (res) {
            self.setState({
                transaction_week_costs: res
            })
        }).catch(function (err) {
            console.error('error on fetching data products', err);
            notify.addNotification({
                message: `加载交易额数据失败`,
                level: "error",
                autoDismiss: 5
            });
            self.setState({
                loading: false
            })
        })

        Apis.instance().db_api().exec('get_data_transaction_product_costs', [preDate,curDate]).then(function (res) {
            self.setState({
                transaction_today_costs: res
            })
        }).catch(function (err) {
            console.error('error on fetching data products', err);
            notify.addNotification({
                message: `加载交易额数据失败`,
                level: "error",
                autoDismiss: 5
            });
            self.setState({
                loading: false
            })
        })

        Apis.instance().db_api().exec('get_data_transaction_pay_fee', ['2017-06-15T00:00:00',curDate]).then(function (res) {
            self.setState({
                transaction_pay_fees: res
            })
            self.loadTransactionCount();
        }).catch(function (err) {
            console.error('error on fetching data products', err);
            notify.addNotification({
                message: `加载交易额数据失败`,
                level: "error",
                autoDismiss: 5
            });
            self.setState({
                loading: false
            })
        })
    }

    loadTransactionCount() {
        let self = this;
        self.setState({
            transaction_total_count: 0,
            transaction_week_count: 0,
            transaction_today_count: 0,
        });

        Apis.instance().db_api().exec('get_data_transaction_total_count', ['2017-06-15T00:00:00',curDate]).then(function (res) {
            self.setState({
                transaction_total_count: res
            })
        }).catch(function (err) {
            console.error('error on fetching data products', err);
            notify.addNotification({
                message: `加载交易次数数据失败`,
                level: "error",
                autoDismiss: 5
            });
            self.setState({
                loading: false
            })
        })

        Apis.instance().db_api().exec('get_data_transaction_total_count', [weekDate,curDate]).then(function (res) {
            self.setState({
                transaction_week_count: res
            })
        }).catch(function (err) {
            console.error('error on fetching data products', err);
            notify.addNotification({
                message: `加载交易次数数据失败`,
                level: "error",
                autoDismiss: 5
            });
            self.setState({
                loading: false
            })
        })

        Apis.instance().db_api().exec('get_data_transaction_total_count', [preDate,curDate]).then(function (res) {
            self.setState({
                transaction_today_count: res
            })
        }).catch(function (err) {
            console.error('error on fetching data products', err);
            notify.addNotification({
                message: `加载交易次数数据失败`,
                level: "error",
                autoDismiss: 5
            });
            self.setState({
                loading: false
            })
        })

        Apis.instance().db_api().exec('get_merchants_total_count', [preDate,curDate]).then(function (res) {
            self.setState({
                merchants_total_count: res
            })
        }).catch(function (err) {
            console.error('error on fetching data products', err);
            notify.addNotification({
                message: `加载交易次数数据失败`,
                level: "error",
                autoDismiss: 5
            });
            self.setState({
                loading: false
            })
        })
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
            list: [],
            currentPage: page
        });
        Apis.instance().db_api().exec('list_free_data_products', [category_id, page * pageSize, pageSize, "", keywords,false]).then(function (res) {
            let products_list = res.data;

            for (let i=0; i<products_list.length; i++){
                Apis.instance().db_api().exec('get_data_transaction_product_costs_by_product_id', [products_list[i].id,'2017-06-15T00:00:00',curDate]).then(function (res) {
                    products_list[i].transaction_costs = res;
                    Apis.instance().db_api().exec('get_data_transaction_total_count_by_product_id', [products_list[i].id,'2017-06-15T00:00:00',curDate]).then(function (res) {
                        products_list[i].transaction_count = res;
                        self.setState({
                            list: products_list,
                        })
                    })
                })
            }

            self.setState({
                loading: false,
                list: products_list,
                total: res.filtered_total
            })
        }).catch(function (err) {
            console.error('error on fetching data products', err);
            notify.addNotification({
                message: `加载数据产品列表失败`,
                level: "error",
                autoDismiss: 5
            });
            self.setState({
                loading: false
            })
        })
    }

    loadCategories() {
        let self = this;
        self.setState({
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

    render() {
        let {latestBlocks, latestTransactions, dynGlobalObject, coreAsset} = this.props;

        return (
            <div className="home-wrapper">
                <div className="nav-wrapper">
                    <div className="active"></div>
                    <div className=""></div>
                    <div className=""></div>
                    <div className=""></div>
                </div>
                <div className="banner-wrapper">
                    <svg className="banner-bg-center" width="100%" viewBox="0 0 1200 800">
                        <circle fill="rgba(161,174,245,.15)" r="130" cx="350" cy="350" ></circle>
                        <circle fill="rgba(120,172,254,.1)" r="80" cx="500" cy="420" ></circle>
                    </svg>
                    <div className="banner">
                        <LogoCard/>
                        <div className="banner-text">
                            <h1><Translate component="span" content="explorer.statistics.transaction_basic" /></h1>
                            <p><Translate component="span" content="explorer.statistics.transaction_basic_subtitle" /></p>
                            <div className="grid-block vertical page-layout">
                                {/* First row of stats */}
                                <div className="align-center grid-block shrink small-horizontal blocks-row">
                                    <div className="grid-block text-center small-6 medium-3">
                                        <div className="grid-content no-overflow">
                                            <span className="txtlabel subheader"><Translate component="span" content="explorer.statistics.transaction_total_costs" /></span>
                                            <h3 className="txtlabel success">
                                                <FormattedAsset
                                                    amount={this.state.transaction_total_costs}
                                                    asset={coreAsset.get("id")}
                                                    decimalOffset={5}
                                                />
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="grid-block text-center small-6 medium-3">
                                        <div className="grid-content no-overflow">
                                            <span className="txtlabel subheader"><Translate component="span" content="explorer.statistics.transaction_week_costs" /></span>
                                            <h3 className="txtlabel">
                                                <FormattedAsset
                                                    amount={this.state.transaction_week_costs}
                                                    asset={coreAsset.get("id")}
                                                    decimalOffset={5}
                                                />
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="grid-block text-center small-6 medium-3">
                                        <div className="grid-content no-overflow">
                                            <span className="txtlabel subheader"><Translate component="span" content="explorer.statistics.transaction_today_costs" /></span>
                                            <h3 className="txtlabel">
                                                <FormattedAsset
                                                    amount={this.state.transaction_today_costs}
                                                    asset={coreAsset.get("id")}
                                                    decimalOffset={5}
                                                />
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="grid-block text-center small-6 medium-3">
                                        <div className="grid-content no-overflow">
                                            <span className="txtlabel subheader"><Translate component="span" content="explorer.statistics.transaction_pay_fees" /></span>
                                            <h3 className="txtlabel">
                                                <FormattedAsset
                                                    amount={this.state.transaction_pay_fees}
                                                    asset={coreAsset.get("id")}
                                                    decimalOffset={5}
                                                />
                                            </h3>
                                        </div>
                                    </div>
                                </div>

                                {/* Second row of stats */}
                                <div className="align-center grid-block shrink small-horizontal blocks-row">
                                    <div className="grid-block text-center small-6 medium-3">
                                        <div className="grid-content no-overflow">
                                            <span className="txtlabel subheader"><Translate component="span" content="explorer.statistics.transaction_total_count" /></span>
                                            <h3 className="txtlabel success">{this.state.transaction_total_count}</h3>
                                        </div>
                                    </div>
                                    <div className="grid-block text-center small-6 medium-3">
                                        <div className="grid-content no-overflow">
                                            <span className="txtlabel subheader"><Translate component="span" content="explorer.statistics.transaction_week_count" /></span>
                                            <h3 className="txtlabel">{this.state.transaction_week_count}</h3>
                                        </div>
                                    </div>
                                    <div className="grid-block text-center small-6 medium-3">
                                        <div className="grid-content no-overflow">
                                            <span className="txtlabel subheader"><Translate component="span" content="explorer.statistics.transaction_today_count" /></span>
                                            <h3 className="txtlabel">{this.state.transaction_today_count}</h3>
                                        </div>
                                    </div>
                                    <div className="grid-block text-center small-6 medium-3">
                                        <div className="grid-content no-overflow">
                                            <span className="txtlabel subheader"><Translate component="span" content="explorer.statistics.merchants_total_count" /></span>
                                            <h3 className="txtlabel warning">{this.state.merchants_total_count}</h3>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="">
                                <a className="banner-text-button" >预计年总交易额: <FormattedAsset amount={this.state.transaction_today_costs * 365} asset={coreAsset.get("id")} decimalOffset={5}/></a>
                                <a className="banner-text-button template">预计年总交易数: {this.state.transaction_today_count * 365}<i></i></a>
                            </div>
                        </div>
                        <div className="banner-down-wrapper" >
                            <div className="banner-mouse">
                                <div className="mouse-bar"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="home-content page1">
                    <div className="page-text">
                        <h1><Translate component="span" content="explorer.statistics.transaction_product" /></h1>
                        <p><Translate component="span" content="explorer.statistics.transaction_product_subtitle" /></p>
                        <DataProductList/>
                    </div>
                </div>
                <div className="home-content page2"></div>
                <div className="home-content page3"></div>
            </div>
        );
    }

}

export default BindToChainState(Statistics);