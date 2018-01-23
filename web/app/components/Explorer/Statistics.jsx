import React from "react";
import Translate from "react-translate-component";
import LogoCard from "../Dashboard/LogoCard";
import DataTransactionCard from "../Dashboard/DataTransactionCard";
import DataProductList from "../Dashboard/DataProductList";
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
            },
            products_data: [],
            currentIndex: 0,
        };
    }
    componentDidMount() {
        let self = this;
        if (document.getElementById("bodyBox")) {
            document.getElementById("bodyBox").parentNode.onscroll = function () {
                let current_y = document.getElementById("bodyBox").parentNode.scrollTop;
                let pg0_h = document.getElementById("page0").offsetHeight;

                if (current_y < pg0_h) {
                    self.setState({currentIndex: 0});
                }
                if (current_y >= pg0_h) {
                    self.setState({currentIndex: 1});
                }
            };
        }

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
                        transaction_pay_fees: data.fee,
                        merchants_total_count: data.merchantCertNum
                    };
                    let products_data = data.statisticsProductLog;
                    this.setState({
                        loading: false,
                        transaction_data : transaction_data,
                        products_data: products_data
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
    handleClick = (e) => {
        let currentIndex = e.target.getAttribute("data-index");
        let pg0_h = document.getElementById("page0").offsetHeight;
        this.setState({currentIndex: currentIndex});
        switch (currentIndex) {
            case "0":
                this.scroll_To(0);
                break;
            case "1":
                this.scroll_To(pg0_h);
                break;
        }
    }
    scroll_To = (tar_y) => { //tar_y 即滑动条顶端 距离页面最上面的距离
        let self = this;
        let timer = setTimeout(function () {
            let current_y = document.getElementById("bodyBox").parentNode.scrollTop;
            const step = 25; //步长系数 即剩余的距离除以40 每1ms 移动一段距离
            if (tar_y >= current_y) { //tar_y > current_y 即向下滚动
                let next_y = current_y + step;
                if (next_y <= tar_y) {  //向上滚动和向下滚动判定的区别 是这里！！
                    document.getElementById("bodyBox").parentNode.scrollTop = next_y;
                    self.scroll_To(tar_y);
                }
                else {
                    document.getElementById("bodyBox").parentNode.scrollTop = tar_y;
                    clearTimeout(timer);
                }
            }
            else { //tar_y < current_y 即向上滚动
                let next_y = current_y - step;
                if (next_y >= tar_y) {
                    document.getElementById("bodyBox").parentNode.scrollTop = next_y;
                    self.scroll_To(tar_y);
                }
                else {
                    document.getElementById("bodyBox").parentNode.scrollTop = tar_y;
                    clearInterval(timer);
                }
            }
        }, 1);
    }
    render() {
        require("assets/stylesheets/components/_statistics.scss");
        require("assets/iconfont.less"); // iconfont本地化
        let index = this.state.currentIndex;
        return (
            <div className="home-wrapper" id="bodyBox">
                <div className="nav-wrapper">
                    <div className={index == 0 ? "active" : ""} data-index="0" onClick={this.handleClick}></div>
                    <div className={index == 1 ? "active" : ""} data-index="1" onClick={this.handleClick}></div>
                </div>
                <div className="banner-wrapper" id="page0">
                    <div className="banner">
                        <LogoCard/>
                        <div className="banner-text">
                            <h1><Translate component="span" content="explorer.statistics.transaction_basic"/></h1>
                            <p><Translate component="span"
                                          content="explorer.statistics.transaction_basic_subtitle"/></p>
                            <DataTransactionCard {...this.state}/>
                        </div>
                        <div className="banner-down-wrapper">
                            <div className="banner-mouse">
                                <div className="mouse-bar"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="home-content page1 vh" id="page1">
                    <div className="page-text">
                        <h1><Translate component="span" content="explorer.statistics.transaction_product"/></h1>
                        <p><Translate component="span" content="explorer.statistics.transaction_product_subtitle"/>
                        </p>
                        <DataProductList {...this.state}/>
                    </div>
                </div>
            </div>
        );
    }
}

export default Statistics;
