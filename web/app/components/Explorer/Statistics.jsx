import React from "react"
import Translate from "react-translate-component";
import LogoCard from "../Dashboard/LogoCard";
import DataTransactionCard from '../Dashboard/DataTransactionCard'
import DataProductList from '../Dashboard/DataProductList'

require("assets/stylesheets/components/_statistics.scss");
require("assets/iconfont.less"); // iconfont本地化

class Statistics extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            currentIndex: 0
        };
    }

    componentDidMount() {
        let self = this;
        document.getElementById('bodyBox').parentNode.onscroll = function(){
            let current_y = document.getElementById('bodyBox').parentNode.scrollTop;
            let pg0_h = document.getElementById("page0").offsetHeight - 62;

            if (current_y < pg0_h){
                self.setState({currentIndex: 0});
            }
            if (current_y >= pg0_h){
                self.setState({currentIndex: 1});
            }
        }
    }

    handleClick = (e) => {
        let currentIndex = e.target.getAttribute('data-index');
        let pg0_h = document.getElementById("page0").offsetHeight - 62;
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

        let index = this.state.currentIndex;

        return (
            <div id="bodyBox" className="home-wrapper" onScroll={this.handleScroll}>
                <div className="nav-wrapper">
                    <div className={index == 0 ? 'active' : ''} data-index="0" onClick={this.handleClick}></div>
                    <div className={index == 1 ? 'active' : ''} data-index="1" onClick={this.handleClick}></div>
                </div>
                <div className="banner-wrapper" id="page0">
                    <div className="banner">
                        <LogoCard/>
                        <div className="banner-text">
                            <h1><Translate component="span" content="explorer.statistics.transaction_basic" /></h1>
                            <p><Translate component="span" content="explorer.statistics.transaction_basic_subtitle" /></p>
                            <DataTransactionCard/>
                        </div>
                        <div className="banner-down-wrapper" >
                            <div className="banner-mouse">
                                <div className="mouse-bar"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="home-content page1 vh" id="page1">
                    <div className="page-text">
                        <h1><Translate component="span" content="explorer.statistics.transaction_product" /></h1>
                        <p><Translate component="span" content="explorer.statistics.transaction_product_subtitle" /></p>
                        <DataProductList/>
                    </div>
                </div>
            </div>
        );
    }

}

export default Statistics;