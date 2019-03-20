import React from "react";
import {FormattedNumber} from "react-intl";
import {Spin} from "antd";
import Translate from "react-translate-component";

class DataProductCard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: props.loading,
            transaction_data: props.transaction_data
        };
    }
    componentWillReceiveProps(nextProps) {
        this.setState({
            loading: nextProps.loading,
            transaction_data: nextProps.transaction_data
        });
    }
    render() {
        return (
            <div className="grid-block vertical page-layout min-h">
                <div className={`${!this.state.loading ? "hidden" : ""} data-loading`}><Spin/></div>
                {/* First row of stats */}
                <div
                    className={`align-center grid-block shrink small-horizontal blocks-row ${this.state.loading ? "hidden" : ""}`}>
                    <div className="grid-block small-6 medium-3">
                        <div className="grid-content no-overflow">
                            <span className="txtlabel subheader"><Translate component="span"
                                                                            content="explorer.statistics.transaction_total_costs"/></span>
                            <h3 className="txtlabel success">
                                <FormattedNumber
                                    value={this.state.transaction_data.transaction_total_costs}
                                    minimumFractionDigits={0}
                                    maximumFractionDigits={5}
                                /> GCNY
                            </h3>
                        </div>
                    </div>
                    <div className="grid-block small-6 medium-3">
                        <div className="grid-content no-overflow">
                            <span className="txtlabel subheader"><Translate component="span"
                                                                            content="explorer.statistics.transaction_week_costs"/></span>
                            <h3 className="txtlabel">
                                <FormattedNumber
                                    value={this.state.transaction_data.transaction_week_costs}
                                    minimumFractionDigits={0}
                                    maximumFractionDigits={5}
                                /> GCNY
                            </h3>
                        </div>
                    </div>
                    <div className="grid-block small-6 medium-3">
                        <div className="grid-content no-overflow">
                            <span className="txtlabel subheader"><Translate component="span"
                                                                            content="explorer.statistics.transaction_today_costs"/></span>
                            <h3 className="txtlabel">
                                <FormattedNumber
                                    value={this.state.transaction_data.transaction_today_costs}
                                    minimumFractionDigits={0}
                                    maximumFractionDigits={5}
                                /> GCNY
                            </h3>
                        </div>
                    </div>
                    <div className="grid-block small-6 medium-3">
                        <div className="grid-content no-overflow">
                            <span className="txtlabel subheader"><Translate component="span"
                                                                            content="explorer.statistics.transaction_pay_fees"/></span>
                            <h3 className="txtlabel">
                                <FormattedNumber
                                    value={this.state.transaction_data.transaction_pay_fees}
                                    minimumFractionDigits={0}
                                    maximumFractionDigits={5}
                                /> GCNY
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Second row of stats */}
                <div
                    className={`align-center grid-block shrink small-horizontal blocks-row ${this.state.loading ? "hidden" : ""}`}>
                    <div className="grid-block small-6 medium-3">
                        <div className="grid-content no-overflow">
                            <span className="txtlabel subheader"><Translate component="span"
                                                                            content="explorer.statistics.transaction_total_count"/></span>
                            <h3 className="txtlabel success"><FormattedNumber
                                value={this.state.transaction_data.transaction_total_count}
                                minimumFractionDigits={0}
                                maximumFractionDigits={5}
                            /></h3>
                        </div>
                    </div>
                    <div className="grid-block small-6 medium-3">
                        <div className="grid-content no-overflow">
                            <span className="txtlabel subheader"><Translate component="span"
                                                                            content="explorer.statistics.transaction_week_count"/></span>
                            <h3 className="txtlabel"><FormattedNumber
                                value={this.state.transaction_data.transaction_week_count}
                                minimumFractionDigits={0}
                                maximumFractionDigits={5}
                            /></h3>
                        </div>
                    </div>
                    <div className="grid-block small-6 medium-3">
                        <div className="grid-content no-overflow">
                            <span className="txtlabel subheader"><Translate component="span"
                                                                            content="explorer.statistics.transaction_today_count"/></span>
                            <h3 className="txtlabel"><FormattedNumber
                                value={this.state.transaction_data.transaction_today_count}
                                minimumFractionDigits={0}
                                maximumFractionDigits={5}
                            /></h3>
                        </div>
                    </div>
                    <div className="grid-block small-6 medium-3">
                        <div className="grid-content no-overflow">
                            <span className="txtlabel subheader"><Translate component="span"
                                                                            content="explorer.statistics.merchants_total_count"/></span>
                            <h3 className="txtlabel"><FormattedNumber
                                value={this.state.transaction_data.merchants_total_count}
                                minimumFractionDigits={0}
                                maximumFractionDigits={5}
                            /></h3>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default DataProductCard;
