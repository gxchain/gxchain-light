import React from "react";
import Translate from "react-translate-component";
import LogoCard from "../Dashboard/LogoCard";
import DataTransactionCard from "../Dashboard/DataTransactionCard";
import notify from "actions/NotificationActions";
import SettingsStore from "stores/SettingsStore";

class Statistics extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            transaction_data: {
                transaction_total_costs: 0,
                transaction_week_costs: 0,
                transaction_today_costs: 0,
                transaction_total_count: 0,
                transaction_week_count: 0,
                transaction_today_count: 0,
                transaction_pay_fees: 0,
                merchants_total_count: 0
            }
        };
    }
    componentDidMount() {
        let self = this;
        const xhr = new XMLHttpRequest();
        xhr.open("GET", SettingsStore.getSetting("statistics_address"), true);
        // xhr.withCredentials = true
        xhr.send();
        xhr.onreadystatechange = () =>{
            if(xhr.readyState == XMLHttpRequest.DONE){
                if(xhr.status == 200){
                    //你当然可以用其他方法编码你的返回信息，但是对于js的世界来说，还有什么比json更方便呢？
                    let data = JSON.parse(xhr.responseText);
                    let transaction_data = {
                        transaction_total_costs: data.transactionTotalPrice,
                        transaction_week_costs: data.transactionWeekPrice,
                        transaction_today_costs: data.transactionDayPrice,
                        transaction_total_count: data.transactionTotalNum,
                        transaction_week_count: data.transactionWeekNum,
                        transaction_today_count: data.transactionDayNum,
                        transaction_pay_fees: data.transactionTotalPrice/10,
                        merchants_total_count: data.merchantCertNum
                    };
                    this.setState({
                        loading: false,
                        transaction_data : transaction_data
                    });
                }else{
                    notify.addNotification({
                        message: "加载数据统计信息失败",
                        level: "error",
                        autoDismiss: 5
                    });
                    self.setState({
                        loading: false
                    });
                }
            }
        };
    }
    render() {
        require("assets/stylesheets/components/_statistics.scss");
        return (
            <div className="home-wrapper" id="bodyBox">
                <div className="banner-wrapper" id="page0">
                    <div className="banner">
                        <LogoCard/>
                        <div className="banner-text">
                            <h1><Translate component="span" content="explorer.statistics.transaction_basic"/></h1>
                            <p><Translate component="span"
                                          content="explorer.statistics.transaction_basic_subtitle"/></p>
                            <DataTransactionCard {...this.state}/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Statistics;
