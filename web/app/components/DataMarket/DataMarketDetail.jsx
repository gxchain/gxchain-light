import React from 'react';
import {connect} from "alt-react";
import {Tabs, Tab} from '../Utility/Tabs'
import {Apis} from 'gxbjs-ws'
import {ChainStore} from "gxbjs/es";
import notify from "actions/NotificationActions";
import LoadingIndicator from '../LoadingIndicator'
import {Link} from "react-router/es";
import FormattedAsset from "../Utility/FormattedAsset";
import CodeGenerator from "../Utility/CodeGenerator";
import ActionSheet from "react-foundation-apps/src/action-sheet";
import Icon from "../Icon/Icon";
// import RecommendProducts from '../Dashboard/RecommendProducts'
// import RecommendLeagues from '../Dashboard/RecommendLeagues'

let defaultState = {
    loading: true,
    id: null,
    product_name: "",
    latestVersion: '',
    version: '',
    schema_contexts: [],
    brief_desc: "",
    merchant_name: "",
    status: -1,
    total: 0,
    category_id: null,
    category_name: "",
    price: 0,
    icon: ""
}

class DataMarketDetail extends React.Component {
    constructor(props) {
        super(props);
        this.state = Object.assign({}, defaultState);
    }

    componentDidMount() {
        this.loadDataProduct();
    }

    shouldComponentUpdate(nextProps) {
        if (nextProps.router.params.id != this.state.id) {
            this.loadDataProduct();
        }
        return true;
    }

    loadDataProduct() {
        let self = this;
        this.setState(Object.assign(this.state, defaultState, {id: this.props.router.params.id, loading: true}));
        Apis.instance().db_api().exec('get_free_data_products', [[this.props.router.params.id]]).then(function (res) {
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
            let schema_contexts = result.schema_contexts.map(function (schema) {
                var schemaJSON = JSON.parse(schema.schema_context);
                return {
                    version: schema.version,
                    input: schemaJSON.input,
                    output: schemaJSON.output,
                    code: schemaJSON.code
                }
            }).reverse();
            let latestVersion = '';
            if (schema_contexts.length > 0) {
                latestVersion = schema_contexts[0].version;
            }
            self.setState({
                loading: false,
                product_name: result.product_name,
                brief_desc: result.brief_desc,
                datasource: result.datasource,
                status: result.status,
                total: result.total,
                version: latestVersion,
                latestVersion: latestVersion,
                category_id: result.category_id,
                schema_contexts: schema_contexts,
                price: result.price,
                icon: result.icon
            })
        }).catch(err=> {
            console.error('error on fetching data product', err);
            notify.addNotification({
                message: `加载数据产品失败`,
                level: "error",
                autoDismiss: 5
            });
            self.setState({
                loading: false
            })
        })
    }

    switchVersion(version) {
        this.setState({
            version: version
        })
    }

    getCurrentSchema() {
        let currentSchema = null;
        let self = this;
        this.state.schema_contexts.forEach(function (schema) {
            if (schema.version == self.state.version) {
                currentSchema = schema;
            }
        });
        return currentSchema;
    }

    getCurrentURL(){
        return `http://(box_ip):(box_port)/rpc/${this.state.id}/${this.state.version}`;
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
            status = <label className="facolor-alert">已禁用</label>
        }

        let sampleInput = {};
        let sampleOutput = {code: 0, message: '', data: {}};
        let inputRows = [];
        let outputRows = [];
        let codeRows = [];
        let versions = [];
        this.state.schema_contexts.forEach(function (schema) {
            if (schema.version == self.state.version) {
                versions.push(<li key={schema.version} className="current">
                    <a>{`${schema.version}${schema.version == self.state.latestVersion ? '(最新)' : ''}`}</a>
                </li>)
            }
            else {
                versions.push(<li key={`schema-${schema.version}`}><a
                    onClick={self.switchVersion.bind(self,schema.version)}>{`${schema.version}${schema.version == self.state.latestVersion ? '(最新)' : ''}`}</a>
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
        let currentURL  = this.getCurrentURL();
        let cURLCode = CodeGenerator.genCURLCode(this.state.id,this.getCurrentSchema(),currentURL);
        let nodeCode = CodeGenerator.genNodeCode(this.state.id,this.getCurrentSchema(),currentURL);
        let javaCode = CodeGenerator.genJavaCode(this.state.id,this.getCurrentSchema(),currentURL);
        return (

            <div className="grid-block prod-info vertical medium-horizontal" style={{padding:'15px 20px'}}>
                <div className="medium-12 vertical flex-start">
                    <div className="grid-block vertical medium-horizontal overflow-visible flex-start heading">
                        <div className="" style={{width:"10rem",marginRight:10,padding:0}}>
                            <img style={{width:'100%'}} src={this.state.icon}/>
                        </div>
                        <div className="grid-block vertical overflow-visible">
                            <h4 className="grid-block title horizontal align-items-center">
                                {this.state.product_name}&nbsp;&nbsp;<span
                                className="label success">{this.state.category_name}</span>
                            </h4>
                            <p>{this.state.brief_desc}</p>
                            <div className="grid-block horizontal overflow-visible align-items-center">
                                <div className="grid-block vertical">
                                    <p className="grid-block horizontal">ID:&nbsp;&nbsp;&nbsp;&nbsp;
                                        <label>{this.props.router.params.id}</label></p>
                                    <p className="grid-block horizontal">状态:&nbsp;{status}</p>
                                </div>
                                <div className="grid-block vertical overflow-visible">
                                    {<div className="version overflow-visible">当前版本:&nbsp;
                                        <ActionSheet>
                                            <ActionSheet.Button
                                                title={`${this.state.version}${this.state.version == this.state.latestVersion ? '(最新)' : ""}`}>
                                            </ActionSheet.Button>

                                            <ActionSheet.Content>
                                                <ul className="versions">
                                                    {versions}
                                                </ul>
                                            </ActionSheet.Content>
                                        </ActionSheet>
                                    </div>}
                                    <p className="grid-block horizontal">数据源:&nbsp;<Link
                                        to={`/account/${this.state.datasource}/overview`}>{this.state.datasource}</Link>
                                    </p>
                                </div>
                                <div className="grid-block vertical">
                                    <label className="price">
                                        <FormattedAsset noPrefix
                                                        color={'warning'}
                                                        amount={this.state.price}
                                                        asset={'1.3.5'}>
                                        </FormattedAsset>/条</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Tabs className="tab-intro" tabsClass="expand">
                        <Tab title="对接说明">
                            <div className="dash-row">
                                <strong>接口地址:</strong>
                                <span>{currentURL}</span>
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
                            {/*
                             <table className="table table-bordered">
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

                {/*<div className="vertical medium-3 small-12 other">
                 <h4>其它数据</h4>
                 <RecommendProducts product_id={this.state.id}  {...this.props}></RecommendProducts>
                 <h4>推荐联盟</h4>
                 <RecommendLeagues league_id={this.state.id}  {...this.props}></RecommendLeagues>
                 </div>*/}
            </div>
        )
    }
}

export default DataMarketDetail
