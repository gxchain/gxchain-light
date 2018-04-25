import React from 'react';
import {connect} from "alt-react";
import {Tabs, Tab} from '../Utility/Tabs'
import {Apis} from 'gxbjs-ws'
import notify from "actions/NotificationActions";
import LoadingIndicator from '../LoadingIndicator'
import GXBFaucetActions from "actions/GXBFaucetActions";
import AccountImage from "../Account/AccountImage";
import FormattedAsset from "../Utility/FormattedAsset";
import CodeGenerator from "../Utility/CodeGenerator";
import ActionSheet from "react-foundation-apps/src/action-sheet";

let defaultState = {
    loading: true,
    id: null,
    league_name: "",
    brief_desc: "",
    datasources: [],
    status: -1,
    data_products: [],
    product: null,
    category_id: null,
    category_name: "",
    icon: ""
}

class LeagueDetail extends React.Component {
    constructor(props) {
        super(props);
        this.state = Object.assign({}, defaultState);
    }

    componentWillMount() {
        this.loadLeague();
    }

    shouldComponentUpdate(nextProps) {
        if (nextProps.router.params.id != this.state.id) {
            this.loadLeague();
        }
        return true;
    }

    loadDatasources() {
        let self = this;
        self.setState({
            loading: true,
            datasources: []
        })
        GXBFaucetActions.getLeagueMembers(this.props.router.params.id).then(function (resp) {
            var datasources = resp || [];
            self.setState({
                datasources: datasources
            })
        }).catch(function (err) {
            console.error('error on fetching league members', err);
            notify.addNotification({
                message: `加载联盟成员信息失败`,
                level: "error",
                autoDismiss: 5
            });
            self.setState({
                loading: false
            })
        })
    }

    loadDataProducts(data_product_ids) {
        let self = this;
        self.setState({
            loading: true
        });
        Apis.instance().db_api().exec('get_league_data_products', [data_product_ids]).then(function (resp) {
            var products = resp || [];
            var product = products.length > 0 ? products[0] : null;
            self.setState({
                data_products: products,
                loading: false
            })
            self.setProduct(product);
        }).catch(function (err) {
            console.error('error on fetching league data products', err);
            notify.addNotification({
                message: `加载数据产品信息失败`,
                level: "error",
                autoDismiss: 5
            });
            self.setState({
                loading: false
            })
        });
    }

    loadLeague() {
        let self = this;

        this.setState(Object.assign(this.state, defaultState, {id: this.props.router.params.id, loading: true}));
        Apis.instance().db_api().exec('get_leagues', [[this.props.router.params.id]]).then(function (res) {
            var result = res && res.length > 0 ? res[0] : {};
            Apis.instance().db_api().exec('get_data_market_categories', [[result.category_id]]).then(function (res) {
                var result = res && res.length > 0 ? res[0] : {};
                self.setState({
                    category_name: result.category_name
                });
            }).catch(err=> {
                console.error('error on fetching data market category', err);
                notify.addNotification({
                    message: `加载产品分类失败`,
                    level: "error",
                    autoDismiss: 5
                });
                self.setState({
                    loading: false
                })
            })
            self.setState({
                loading: false,
                league_name: result.league_name,
                brief_desc: result.brief_desc,
                status: result.status,
                category_id: result.category_id,
                icon: result.icon
            })
            self.loadDatasources();
            self.loadDataProducts(result.data_products);

        }).catch(err=> {
            console.error('error on fetching data product', err);
            notify.addNotification({
                message: `加载联盟信息失败`,
                level: "error",
                autoDismiss: 5
            });
            self.setState({
                loading: false
            })
        })
    }

    setProduct(prod) {
        if (prod == null) {
            return this.setState({
                product: null
            });
        }
        prod = Object.assign({}, prod);
        prod.schema_contexts = prod.schema_contexts.map(function (schema) {
            var schemaJSON = JSON.parse(schema.schema_context);
            return {
                version: schema.version,
                input: schemaJSON.input,
                output: schemaJSON.output,
                code: schemaJSON.code
            }
        }).reverse();
        let latestVersion = '';
        if (prod.schema_contexts.length > 0) {
            latestVersion = prod.schema_contexts[0].version;
        }
        prod.latestVersion = latestVersion;
        prod.version = latestVersion;
        this.setState({
            product: prod
        })
    }

    render() {
        let self = this;
        if (this.state.loading) {
            return <LoadingIndicator></LoadingIndicator>
        }
        let status = <label>未知</label>;
        if (this.state.status == 0) {
            status = <label className="facolor-fee">未发布</label>;
        }
        if (this.state.status == 1) {
            status = <label className="facolor-success">正常</label>;
        }
        if (this.state.status == 2) {
            <label className="facolor-fee">已禁用</label>
        }
        let datasources = this.state.datasources.map((datasource, i)=> {
            return <div className="datasource-card" key={`datasource${i}`}>
                <AccountImage size={{height:120,width:120}} account={datasource.merchant_name}
                              custom_image={null}></AccountImage>
                <label className="text-center">{datasource.alias}</label>
            </div>
        })
        let products = this.state.data_products.map(function (prod) {
            return self.state.product && prod.id == self.state.product.id ?
                <li key={`prod-${prod.id}`} className="active"><a>{prod.product_name}</a></li>
                :
                <li key={`prod-${prod.id}`} onClick={self.setProduct.bind(self,prod)}><a>{prod.product_name}</a></li>
        })

        let prod_info = self.renderProduct();

        return (
            <div className="grid-block prod-info vertical medium-horizontal" style={{padding:'15px 20px'}}>
                <div className="grid-block vertical flex-start">
                    <Tabs className="grid-block vertical" contentClass="grid-block vertical">
                        <Tab title="联盟数据">
                            <div className="grid-block horizontal page-layout">
                                <div className="grid-block left-column shrink prod-list">
                                    <ul className="block-list">
                                        {products}
                                    </ul>
                                </div>
                                <div className="grid-block vertical">
                                    {prod_info}
                                </div>
                            </div>
                        </Tab>
                        <Tab title="联盟介绍">
                            <div className="heading">
                                <div className="grid-block vertical medium-horizontal flex-start">
                                    <div className="" style={{width:"10rem",marginRight:10,padding:0}}>
                                        <img style={{width:'100%'}} src={this.state.icon}/>
                                    </div>
                                    <div className="grid-block vertical">
                                        <h4 className="grid-block title horizontal align-items-center">
                                            {this.state.league_name}&nbsp;&nbsp;<span
                                            className="label success">普惠金融</span>
                                        </h4>
                                        <p>{this.state.brief_desc}</p>
                                        <div className="grid-block horizontal align-items-center">
                                            <div className="grid-block vertical">
                                                <p className="grid-block horizontal">ID:&nbsp;&nbsp;&nbsp;&nbsp;
                                                    <label>{this.state.id}</label></p>
                                                <p className="grid-block horizontal">状态:&nbsp;{status}</p>
                                            </div>
                                            <div className="grid-block vertical">
                                                <p className="grid-block horizontal">数据产品:&nbsp;
                                                    <label>{this.state.data_products.length}个</label>
                                                </p>
                                                <p className="grid-block horizontal">
                                                    数据源:<label>{this.state.datasources.length}个</label></p>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Tab>
                        <Tab title="联盟成员">
                            <div className="grid-block flex-wrap">
                                {datasources}
                            </div>
                        </Tab>
                    </Tabs>

                </div>
                {/*<div className="vertical medium-3 small-12 other">
                 <h4>其它数据</h4>
                 <RecommendProducts product_id={this.state.id} {...this.props}></RecommendProducts>
                 <h4>推荐联盟</h4>
                 <RecommendLeagues league_id={this.state.id} {...this.props}></RecommendLeagues>
                 </div>*/}
            </div>
        )
    }

    switchVersion(product, version) {
        product.version = version;
        this.setState({product: product});
        // var data_products = this.state.data_products.map(function (prod) {
        //     if (prod.id == product.id) {
        //         prod.version=version;
        //     }
        //     return prod;
        // })
        //
        // this.setState({
        //     product:product,
        //     data_products: data_products
        // })
    }

    getCurrentSchema() {
        let currentSchema = null;
        let self = this;
        this.state.product.schema_contexts.forEach(function (schema) {
            if (schema.version == self.state.product.version) {
                currentSchema = schema;
            }
        });
        return currentSchema;
    }

    getCurrentURL() {
        return `http://(box_ip):(box_port)/league/${this.state.id}/${this.state.product.id}/${this.state.product.version}`;
    }

    renderProduct() {
        let self = this;
        if (!this.state.product) {
            return null;
        }
        let status = <label>未知</label>;
        if (this.state.product.status == 0) {
            status = <label className="facolor-fee">未发布</label>;
        }
        if (this.state.product.status == 1) {
            status = <label className="facolor-success">正常</label>;
        }
        if (this.state.product.status == 2) {
            status = <label className="facolor-alert">已禁用</label>
        }

        let sampleInput = {};
        let sampleOutput = {code: 0, message: '', data: {}};
        let inputRows = [];
        let outputRows = [];
        let codeRows = [];
        let versions = [];
        this.state.product.schema_contexts.forEach(function (schema) {
            if (schema.version == self.state.product.version) {
                versions.push(<li key={schema.version} className="current">
                    <a>{`${schema.version}${schema.version == self.state.product.latestVersion ? '(最新)' : ''}`}</a>
                </li>)
            }
            else {
                versions.push(<li key={`schema-${schema.version}`}>
                    <a onClick={self.switchVersion.bind(self,self.state.product,schema.version)}>{`${schema.version}${schema.version == self.state.product.latestVersion ? '(最新)' : ''}`}</a>
                </li>)
            }

        });
        let currentSchema = this.getCurrentSchema();

        if (currentSchema) {
            for (var key in currentSchema.input) {
                sampleInput[key] = CodeGenerator.getSampleVal(currentSchema.input[key]);
                inputRows.push(<tr key={key}>
                    <td>{key}</td>
                    <td>{currentSchema.input[key].required ? '是' : '否'}</td>
                    <td>{currentSchema.input[key].type}</td>
                    <td>{currentSchema.input[key].desc || '暂无说明'}</td>
                </tr>)
            }

            for (var key in currentSchema.output) {
                sampleOutput.data[key] = CodeGenerator.getSampleVal(currentSchema.output[key]);
                outputRows.push(<tr key={key}>
                    <td>{key}</td>
                    <td>{currentSchema.output[key].type}</td>
                    <td>{currentSchema.output[key].desc || '暂无说明'}</td>
                </tr>)
            }

            for (var key in currentSchema.code) {
                codeRows.push(<tr key={key}>
                    <td>{key}</td>
                    <td>{currentSchema.code[key] || '暂无说明'}</td>
                </tr>)
            }
        }
        let curretURL = this.getCurrentURL();
        let cURLCode = CodeGenerator.genCURLCode(this.state.id, this.getCurrentSchema(),curretURL);
        let nodeCode = CodeGenerator.genNodeCode(this.state.id, this.getCurrentSchema(),curretURL);
        let javaCode = CodeGenerator.genJavaCode(this.state.id, this.getCurrentSchema(),curretURL);
        return <div>
            <div className="heading">
                <div className="grid-block vertical medium-horizontal overflow-visible flex-start">
                    <div className="" style={{width:"10rem",marginRight:10,padding:0}}>
                        <img style={{width:'100%'}} src={this.state.icon}/>
                    </div>
                    <div className="grid-block vertical overflow-visible">
                        <h4 className="grid-block title horizontal align-items-center">
                            {this.state.product.product_name}
                        </h4>
                        <p>{this.state.product.brief_desc}</p>
                        <div className="grid-block horizontal overflow-visible align-items-center">
                            <div className="grid-block vertical">
                                <p className="grid-block horizontal">ID:&nbsp;&nbsp;&nbsp;&nbsp;
                                    <label>{this.state.product.id}</label></p>
                                <p className="grid-block horizontal">状态:&nbsp;{status}</p>
                            </div>
                            <div className="grid-block vertical overflow-visible">
                                {<div className="version overflow-visible">当前版本:&nbsp;
                                    <ActionSheet>
                                        <ActionSheet.Button
                                            title={`${this.state.product.version}${this.state.product.version == this.state.product.latestVersion ? '(最新)' : ""}`}>
                                        </ActionSheet.Button>

                                        <ActionSheet.Content>
                                            <ul className="versions">
                                                {versions}
                                            </ul>
                                        </ActionSheet.Content>
                                    </ActionSheet>
                                </div>}
                            </div>
                            <div className="grid-block vertical">
                                <label className="price">
                                    <FormattedAsset noPrefix
                                                    color={'warning'}
                                                    amount={this.state.product.refer_price}
                                                    asset={'1.3.0'}>
                                    </FormattedAsset>/条</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Tabs className="tab-intro" tabsClass="expand">
                <Tab title="对接说明">
                    <div className="dash-row">
                        <strong>接口地址:</strong>
                        <span>{curretURL}</span>
                    </div>
                    <div className="dash-row">
                        <strong>请求格式:</strong>
                        <span>json</span>
                    </div>
                    <div className="dash-row">
                        <strong>请求方式:</strong>
                        <span>get 、post</span>
                    </div>

                    <h4 className="table-header">入参说明</h4>
                    <table className="table table-bordered">
                        <thead>
                        <tr>
                            <th>名称</th>
                            <th>必填</th>
                            <th>类型</th>
                            <th>说明</th>
                        </tr>
                        </thead>
                        <tbody>
                        {inputRows}
                        </tbody>
                    </table>
                    <h4 className="table-header">出参说明</h4>
                    <table className="table table-bordered">
                        <thead>
                        <tr>
                            <th>名称</th>
                            <th>类型</th>
                            <th>说明</th>
                        </tr>
                        </thead>
                        <tbody>
                        {outputRows}
                        </tbody>
                    </table>
                </Tab>
                <Tab title="状态码">
                    <h4 className="table-header">业务状态码</h4>
                    <table className="table table-bordered">
                        <thead>
                        <tr>
                            <td width="50%">状态码</td>
                            <td width="50%">描述</td>
                        </tr>
                        </thead>
                        <tbody>
                        {codeRows}
                        </tbody>
                    </table>
                    <h4 className="table-header">系统状态码</h4>
                    <table className="table table-bordered">
                        <thead>
                        <tr>
                            <td width="50%">状态码</td>
                            <td width="50%">描述</td>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>NOT_FOUND</td>
                            <td>数据项不存在</td>
                        </tr>
                        <tr>
                            <td>INVALID_PARAMS</td>
                            <td>参数错误</td>
                        </tr>
                        <tr>
                            <td>FORBIDDEN</td>
                            <td>已下架</td>
                        </tr>
                        <tr>
                            <td>BALANCE_NOT_ENOUGH</td>
                            <td>余额不足</td>
                        </tr>
                        <tr>
                            <td>DATASOURCE_OFFLINE</td>
                            <td>数据源离线</td>
                        </tr>
                        <tr>
                            <td>UNKNOWN_ERROR</td>
                            <td>未知错误</td>
                        </tr>
                        </tbody>
                    </table>
                </Tab>
                <Tab title="示例代码">
                    <h4 className="table-header">入参示例</h4>
                            <pre className="code">
                                {JSON.stringify(sampleInput, null, '  ')}
                            </pre>
                    <h4 className="table-header">返回示例</h4>
                            <pre className="code">
                                {JSON.stringify(sampleOutput, null, '  ')}
                            </pre>
                    <h4 className="table-header">代码示例</h4>
                    <Tabs>
                        <Tab title="cURL">
                                    <pre className="code">
                                        {cURLCode}
                                    </pre>
                        </Tab>
                        <Tab title="Java">
                                    <pre className="code">
                                        {javaCode}
                                    </pre>
                        </Tab>
                        <Tab title="Node">
                                    <pre className="code">
                                        {nodeCode}
                                    </pre>
                        </Tab>
                    </Tabs>
                </Tab>
                <Tab title="其他">
                    <p>如有不明白之处，请和您的公信宝专属商户经理联系。</p>
                    <p>如果您还没有专属商户经理，请访问公信宝官方网站联系我们 <a target="_blank" href="https://gxb.io">https://gxb.io</a></p>
                    {/*<table className="table table-bordered">
                     <thead>
                     <tr>
                     <td>语言</td>
                     <td>下载地址</td>
                     </tr>
                     </thead>
                     <tbody>
                     <tr>
                     <td>node</td>
                     <td><a target="_blank" href="https://github.com/gxchain">https://github.com/gxchain</a></td>
                     </tr>
                     <tr>
                     <td>java</td>
                     <td><a target="_blank" href="https://github.com/gxchain">https://github.com/gxchain</a></td>
                     </tr>
                     </tbody>
                     </table>*/}
                </Tab>
            </Tabs>
        </div>
    }
}

export default LeagueDetail