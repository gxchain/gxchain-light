import React from "react"
import BannerAnim, { Element } from 'rc-banner-anim';
import QueueAnim from 'rc-queue-anim';
import { TweenOneGroup } from 'rc-tween-one';
import { Icon } from 'antd';
import PropTypes from 'prop-types';

import {Apis} from 'gxbjs-ws'
import notify from "actions/NotificationActions"
import ChainTypes from "../Utility/ChainTypes";
import Translate from "react-translate-component";
import {FormattedNumber} from "react-intl"
import FormattedAsset from "../Utility/FormattedAsset"
import BindToChainState from '../Utility/BindToChainState';

let pageSize = 10;
let colorArray = ['#353844'];
let backgroundArray = ['#F6B429','#FC1E4F','#64D487'];
let startStasticsDate = '2017-08-25T00:00:00';
let curDate = new Date().toISOString().substr(0,19);

class DataProductList extends React.Component {
    static propTypes = {
        coreAsset: ChainTypes.ChainAsset.isRequired,
        className: PropTypes.string,
    };

    static defaultProps = {
        className: 'details-switch-demo',
        coreAsset: "1.3.0",
    };

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            showInt: 0,
            delay: 0,
            imgAnim: [
                { translateX: [0, 300], opacity: [1, 0] },
                { translateX: [0, -300], opacity: [1, 0] },
            ],
            categories: [],
            list: [],
            currentCategory: {},
            currentPage: 0,
            total: 0
        };
        this.oneEnter = false;
        this.statsInterval = null;
    }

    onChange = () => {
        if (!this.oneEnter) {
            this.setState({ delay: 300 });
            this.oneEnter = true;
        }
    }

    onLeft = () => {
        let showInt = this.state.showInt;
        showInt -= 1;
        const imgAnim = [
            { translateX: [0, -300], opacity: [1, 0] },
            { translateX: [0, 300], opacity: [1, 0] },
        ];
        if (showInt <= 0) {
            showInt = 0;
        }
        this.setState({ showInt, imgAnim });
        this.bannerImg.prev();
        this.bannerText.prev();
    };

    onRight = () => {
        let showInt = this.state.showInt;
        const imgAnim = [
            { translateX: [0, 300], opacity: [1, 0] },
            { translateX: [0, -300], opacity: [1, 0] },
        ];
        showInt += 1;
        if (showInt > this.state.list.length - 1) {
            showInt = this.state.list.length - 1;
        }
        this.setState({ showInt, imgAnim });
        this.bannerImg.next();
        this.bannerText.next();
    };

    getDuration = (e) => {
        if (e.key === 'map') {
            return 800;
        }
        return 1000;
    };

    componentWillMount() {
        let self = this;
        self.loadCategories();
        this.statsInterval = setInterval(function () {
            self.loadCategories();
        },5 * 1000);
    }

    componentWillUnmount() {
        clearInterval(this.statsInterval);
        this.statsInterval = null;
    }

    loadCategories() {
        let self = this;
        self.setState({
            loading:true
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

    onChangeCategory(category) {
        this.setState({
            currentCategory: category,
        })
        this.loadProducts(category.id, 0);
    }

    loadProducts(category_id, page, keywords) {
        let self = this;
        keywords=keywords||"";
        self.setState({
            loading: true,
            currentPage: page,
        });
        Apis.instance().db_api().exec('list_free_data_products', [category_id, page * pageSize, pageSize, "", keywords,false]).then(function (res) {
            let products_list = res.data;

            for (let i=0; i<products_list.length; i++){
                products_list[i].color = colorArray[0];
                products_list[i].background = backgroundArray[i % 3];

                Apis.instance().db_api().exec('get_data_transaction_product_costs_by_product_id', [products_list[i].id,startStasticsDate,curDate]).then(function (res) {
                    products_list[i].transaction_costs = res;
                    self.setState({
                        list: products_list,
                    })
                })

                Apis.instance().db_api().exec('get_data_transaction_total_count_by_product_id', [products_list[i].id,startStasticsDate,curDate]).then(function (res) {
                    products_list[i].transaction_count = res;
                    self.setState({
                        list: products_list,
                    })
                })
            }

            self.setState({
                loading: false,
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

    render() {
        require("assets/stylesheets/components/_dataproductlist.scss");

        let {coreAsset} = this.props;

        const imgChildren = this.state.list.map((item, i) =>
            <Element key={i} style={{ background: item.color }} hideProps>
                <QueueAnim
                    animConfig={this.state.imgAnim}
                    duration={this.getDuration}
                    delay={[!i ? this.state.delay : 300, 0]}
                    ease={['easeOutCubic', 'easeInQuad']}
                    key="img-wrapper"
                >
                    <div className={`${this.props.className}-pic pic${i}`} key="icon">
                        <img src={item.icon} width="100%" />
                    </div>
                </QueueAnim>
            </Element>);

        const textChildren = this.state.list.map((item, i) => {
            const { product_name, brief_desc, background, price, transaction_count, transaction_costs } = item;
            return (<Element key={i}>
                <QueueAnim type="bottom" duration={1000} delay={[!i ? this.state.delay + 500 : 800, 0]}>
                    <h1 key="h1">{product_name}</h1>
                    <em key="em" style={{ background }} />
                    <p key="p">{brief_desc}</p>
                    <p key="price"><Translate component="span" content="explorer.statistics.transaction_prdouct_price" />：
                        <span className="num">
                            <FormattedAsset
                                amount={price}
                                asset={coreAsset.get("id")}
                                decimalOffset={5}
                            />
                        </span>
                    </p>
                    <p key="costs"><Translate component="span" content="explorer.statistics.transaction_prdouct_costs" />：
                        <span className="num">
                            <FormattedAsset
                                amount={transaction_costs}
                                asset={coreAsset.get("id")}
                                decimalOffset={5}
                            />
                        </span>
                    </p>
                    <p key="count"><Translate component="span" content="explorer.statistics.transaction_prdouct_count" />：
                        <span className="num">
                            <FormattedNumber
                                value={transaction_count ? transaction_count : 0}
                                minimumFractionDigits={0}
                                maximumFractionDigits={5}
                            />
                        </span>
                    </p>
                </QueueAnim>
            </Element>);
        });

        return (
            <div className={`${this.props.className}-wrapper`}>
                <div className={this.props.className}>
                    <BannerAnim
                        prefixCls={`${this.props.className}-img-wrapper`}
                        sync
                        type="across"
                        duration={1000}
                        ease="easeInOutExpo"
                        arrow={false}
                        thumb={false}
                        ref={(c) => { this.bannerImg = c; }}
                        onChange={this.onChange}
                        dragPlay={false}
                    >
                        {imgChildren}

                    </BannerAnim>
                    <BannerAnim
                        prefixCls={`${this.props.className}-text-wrapper`}
                        sync
                        type="across"
                        duration={1000}
                        arrow={false}
                        thumb={false}
                        ease="easeInOutExpo"
                        ref={(c) => { this.bannerText = c; }}
                        dragPlay={false}
                    >
                        {textChildren}
                    </BannerAnim>
                    <TweenOneGroup enter={{ opacity: 0, type: 'from' }} leave={{ opacity: 0 }}>
                        {this.state.showInt && <Icon type="left" key="left" onClick={this.onLeft} />}
                        {this.state.showInt < this.state.list.length - 1 && <Icon type="right" key="right" onClick={this.onRight} />}
                    </TweenOneGroup>
                </div>
            </div>
        );
    }
}


export default BindToChainState(DataProductList)