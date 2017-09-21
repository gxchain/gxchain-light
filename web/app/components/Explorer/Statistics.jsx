import React from "react"
import Translate from "react-translate-component";
import LogoCard from "../Dashboard/LogoCard";
import DataTransactionCard from '../Dashboard/DataTransactionCard'
import DataProductList from '../Dashboard/DataProductList'
import Iframe from 'react-iframe'

let pre_time = '2017-09-24 20:08:00';

class Statistics extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            currentIndex: 0,
        };
    }

    componentDidMount() {
        let self = this;
        if (document.getElementById('bodyBox')){
            document.getElementById('bodyBox').parentNode.onscroll = function(){
                let current_y = document.getElementById('bodyBox').parentNode.scrollTop;
                let pg0_h = document.getElementById("page0").offsetHeight;

                if (current_y < pg0_h){
                    self.setState({currentIndex: 0});
                }
                if (current_y >= pg0_h){
                    self.setState({currentIndex: 1});
                }
            }
        }

        let count_time = Math.round(new Date(pre_time.substr(0,10)+"T"+pre_time.substr(11,8)) - new Date());
        if (count_time>0){
            window.setTimeout(function() {
                location.reload();
            }, count_time);
        }
    }

    handleClick = (e) => {
        let currentIndex = e.target.getAttribute('data-index');
        let pg0_h = document.getElementById("page0").offsetHeight;
        this.setState({currentIndex:currentIndex});
        switch (currentIndex){
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
        let timer = setTimeout(function(){
            let current_y = document.getElementById('bodyBox').parentNode.scrollTop
            const step = 25 //步长系数 即剩余的距离除以40 每1ms 移动一段距离
            if (tar_y>=current_y){ //tar_y > current_y 即向下滚动
                let next_y = current_y + step
                if(next_y<=tar_y){  //向上滚动和向下滚动判定的区别 是这里！！
                    document.getElementById('bodyBox').parentNode.scrollTop = next_y;
                    self.scroll_To(tar_y)
                }
                else{
                    document.getElementById('bodyBox').parentNode.scrollTop = tar_y;
                    clearTimeout(timer)
                }
            }
            else{ //tar_y < current_y 即向上滚动
                let next_y = current_y - step
                if(next_y>=tar_y){
                    document.getElementById('bodyBox').parentNode.scrollTop = next_y;
                    self.scroll_To(tar_y)
                }
                else{
                    document.getElementById('bodyBox').parentNode.scrollTop = tar_y;
                    clearInterval(timer)
                }
            }
        },1)
    }

    render() {
        require("assets/stylesheets/components/_statistics.scss");
        require("assets/iconfont.less"); // iconfont本地化
        let index = this.state.currentIndex;
        if (new Date() < new Date(pre_time.substr(0,10)+"T"+pre_time.substr(11,8))){
            if (Translate.getLocale() == 'cn'){
                return (
                    <Iframe url="https://gxs.gxb.io/countdown/"
                            width="100%"
                            height="100vh"
                            display="initial"
                            position="relative"/>
                );
            }else{
                return (
                    <Iframe url="https://gxs.gxb.io/en/countdown/"
                            width="100%"
                            height="100vh"
                            display="initial"
                            position="relative"/>
                );
            }
        }else {
            return (
                <div className="home-wrapper" id="bodyBox">
                    <div className="nav-wrapper">
                        <div className={index == 0 ? 'active' : ''} data-index="0" onClick={this.handleClick}></div>
                        <div className={index == 1 ? 'active' : ''} data-index="1" onClick={this.handleClick}></div>
                    </div>
                    <div className="banner-wrapper" id="page0">
                        <div className="banner">
                            <LogoCard/>
                            <div className="banner-text">
                                <h1><Translate component="span" content="explorer.statistics.transaction_basic"/></h1>
                                <p><Translate component="span"
                                              content="explorer.statistics.transaction_basic_subtitle"/></p>
                                <DataTransactionCard/>
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
                            <DataProductList/>
                        </div>
                    </div>
                </div>
            );
        }
    }
}

export default Statistics;