import React from "react"
import {Apis} from 'gxbjs-ws'
import {Link} from "react-router/es";
import {FormattedDate} from "react-intl";
import Operation from "../Blockchain/Operation";
import LinkToWitnessById from "../Blockchain/LinkToWitnessById";
import Translate from "react-translate-component"
import LoadingIndicator from '../LoadingIndicator'
import DataProductList from '../Dashboard/DataProductList'
import notify from "actions/NotificationActions"
import ChainTypes from "../Utility/ChainTypes";
import FormattedAsset from "../Utility/FormattedAsset"
import BindToChainState from "../Utility/BindToChainState"
import Immutable from "immutable";
import utils from "common/utils";
import BlockchainActions from "actions/BlockchainActions";

let pageSize = 10;
let curDate = new Date().toISOString().substr(0,19);
let preDate = new Date(new Date().getTime() - 24*60*60*1000).toISOString().substr(0,19); //前一天
let weekDate = new Date(new Date().getTime() - 7*24*60*60*1000).toISOString().substr(0,19); //前七天

class Statistics extends React.Component {
    static propTypes = {
        dynGlobalObject: ChainTypes.ChainObject.isRequired,
        coreAsset: ChainTypes.ChainAsset.isRequired
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
        this.statsInterval = setInterval(function () {
            self.loadTransactionCosts();
        },15 * 1000);
    }

    componentWillUnmount() {
        clearInterval(this.statsInterval);
    }

    componentWillReceiveProps(nextProps) {

        if (nextProps.latestBlocks.size === 0) {
            return this._getInitialBlocks();
        } else if (!this.state.animateEnter) {
            this.setState({
                animateEnter: true
            });
        }

        let maxBlock = nextProps.dynGlobalObject.get("head_block_number");
        if (nextProps.latestBlocks.size >= 20 && nextProps.dynGlobalObject.get("head_block_number") !== nextProps.latestBlocks.get(0).id) {
            return this._getBlock(maxBlock, maxBlock);
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !Immutable.is(nextProps.latestBlocks, this.props.latestBlocks) ||
            !utils.are_equal_shallow(nextState, this.state)
        );
    }

    _getInitialBlocks() {
        let maxBlock = parseInt(this.props.dynGlobalObject.get("head_block_number"), 10);
        if (maxBlock) {
            for (let i = 19; i >= 0; i--) {
                let exists = false;
                if (this.props.latestBlocks.size > 0) {
                    for (let j = 0; j < this.props.latestBlocks.size; j++) {
                        if (this.props.latestBlocks.get(j).id === maxBlock - i) {
                            exists = true;
                            break;
                        }
                    }
                }
                if (!exists) {
                    this._getBlock(maxBlock - i, maxBlock);
                }
            }
        }
    }

    _getBlock(height, maxBlock) {
        if (height) {
            height = parseInt(height, 10);
            BlockchainActions.getLatest(height, maxBlock);
        }
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
            Apis.instance().db_api().exec('get_data_transaction_product_costs', [weekDate,curDate]).then(function (res) {
                self.setState({
                    transaction_week_costs: res
                })
                Apis.instance().db_api().exec('get_data_transaction_product_costs', [preDate,curDate]).then(function (res) {
                    self.setState({
                        transaction_today_costs: res
                    })
                    Apis.instance().db_api().exec('get_data_transaction_pay_fee', ['2017-06-15T00:00:00',curDate]).then(function (res) {
                        self.setState({
                            transaction_pay_fees: res
                        })
                        self.loadTransactionCount();
                    })
                })
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
            Apis.instance().db_api().exec('get_data_transaction_total_count', [weekDate,curDate]).then(function (res) {
                self.setState({
                    transaction_week_count: res
                })
                Apis.instance().db_api().exec('get_data_transaction_total_count', [preDate,curDate]).then(function (res) {
                    self.setState({
                        transaction_today_count: res
                    })
                    Apis.instance().db_api().exec('get_merchants_total_count', [preDate,curDate]).then(function (res) {
                        self.setState({
                            merchants_total_count: res
                        })
                        self.loadCategories();
                    })
                })
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
        let transactions = null;
        let trxCount = 0, blockTimes = [];

        if (latestBlocks && latestBlocks.size >= 20) {

            let previousTime;

            let lastBlock, firstBlock;

            // Map out the block times for the latest blocks and count the number of transactions
            latestBlocks.filter((a, index) => {
                // Only use consecutive blocks counting back from head block
                return a.id === (dynGlobalObject.get("head_block_number") - index);
            }).sort((a, b) => {
                return a.id - b.id;
            }).forEach((block, index) => {
                trxCount += block.transactions.length;
                if (index > 0) {
                    blockTimes.push([block.id, (block.timestamp - previousTime) / 1000]);
                    lastBlock = block.timestamp;
                } else {
                    firstBlock = block.timestamp;
                }
                previousTime = block.timestamp;
            });

            let trxIndex = 0;

            transactions = latestTransactions.take(20)
                .map((trx) => {

                    let opIndex = 0;
                    return trx.operations.map(op => {
                        return (
                            <Operation
                                key={trxIndex++}
                                op={op}
                                result={trx.operation_results[opIndex++]}
                                block={trx.block_num}
                                hideFee={true}
                                hideOpLabel={false}
                                current={"1.2.0"}
                            />
                        );
                    });

                }).toArray();
        }

        if (this.state.loading) {
            return <LoadingIndicator></LoadingIndicator>
        }

        var tip = ''; //无数据提示
        if (!this.state.list||this.state.list.length==0) {
            tip = <p className="text-center">未查询到结果</p>;
        }

        return (
            <div className="grid-block vertical page-layout">
                {/* First row of stats */}
                <div className="align-center grid-block shrink small-horizontal blocks-row">
                    <div className="grid-block text-center small-12 medium-3">
                        <div className="grid-content no-overflow">
                            <span className="txtlabel subheader"><Translate component="span" content="explorer.statistics.transaction_year_costs" /></span>
                            <h3 className="txtlabel success">
                                <FormattedAsset
                                    amount={this.state.transaction_total_costs * 365}
                                    asset={coreAsset.get("id")}
                                    decimalOffset={5}
                                />
                            </h3>
                        </div>
                    </div>
                    <div className="grid-block text-center small-12 medium-3">
                        <div className="grid-content no-overflow">
                            <span className="txtlabel subheader"><Translate component="span" content="explorer.statistics.transaction_year_count" /></span>
                            <h3 className="txtlabel success">
                                {this.state.transaction_week_costs * 365}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Second row of stats */}
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

                {/* Third row of stats */}
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

                { /* Fourth row: transactions of products */ }
                <div className="align-center grid-block shrink small-horizontal blocks-row">
                    <div className="grid-block medium-6 show-for-medium vertical no-overflow" style={{paddingBottom: 0}}>
                        <div className="grid-block vertical no-overflow generic-bordered-box">

                            <div className="block-content-header">
                                <Translate component="span" content="explorer.statistics.transaction_product" />
                            </div>

                            <div className="grid-block vertical">
                                <table className="table">
                                    <thead>
                                    <tr>
                                        <th></th>
                                        <th><Translate component="span" content="explorer.statistics.transaction_prdouct_name" /></th>
                                        <th><Translate component="span" content="explorer.statistics.transaction_prdouct_costs" /></th>
                                        <th><Translate component="span" content="explorer.statistics.transaction_prdouct_count" /></th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {this.state.list.map((prod, i)=> {
                                        return <DataProductList key={`item_${i}_${prod.category_name}`} id={prod.id} router={this.props.router}
                                        image={prod.icon} name={prod.product_name} desc={prod.brief_desc} price={prod.price}
                                        volume={prod.total} costs={prod.transaction_costs} count={prod.transaction_count}></DataProductList>
                                    })}
                                    </tbody>
                                </table>
                                {tip}
                            </div>
                        </div>
                    </div>
                    <div className="grid-block medium-6 show-for-medium vertical no-overflow" style={{paddingBottom: 0}}>
                        <div className="grid-block vertical no-overflow generic-bordered-box">
                            <div ref="operationsText">
                                <div className="block-content-header">
                                    <Translate content="explorer.statistics.transaction_recent_product" />
                                </div>
                                <table className="table">
                                    <thead>
                                    <tr>
                                        <th><Translate content="account.votes.info" /></th>
                                    </tr>
                                    </thead>
                                </table>
                            </div>
                            <div className="grid-block">
                                <table className="table">
                                    <tbody>
                                    {transactions}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

}

export default BindToChainState(Statistics);