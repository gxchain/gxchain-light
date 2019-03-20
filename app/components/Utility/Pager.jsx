import React from 'react';
import cnames from "classnames";

class Pager extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            current: 0,
            total: 0
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.current != this.state.current) {
            this.setState({
                current: nextProps.current
            })
        }
        if (nextProps.total != this.state.total) {
            this.setState({
                total: nextProps.total
            })
        }
    }

    render() {
        return (
            <div className="pager">
                <a onClick={this.goPrev.bind(this)} className={cnames({'button primary float-left':true,'disabled':this.state.current==0})}>上一页</a>
                <input type="text"
                       onChange={this.onEnterPage.bind(this)}
                       value={Number(this.state.current)+1}
                       className="page-input"/>/{this.state.total}
                <a onClick={this.goNext.bind(this)} className={cnames({"button float-right":true,'disabled':this.state.current==this.state.total-1})}>下一页</a>
            </div>
        )
    }

    goNext(){
        if(this.state.current<this.state.total-1){
            typeof this.props.onChange == "function" && this.props.onChange(Number(this.state.current)+1);
        }
    }

    goPrev(){
        if(this.state.current>0){
            typeof this.props.onChange == "function" && this.props.onChange(this.state.current-1);
        }
    }

    onEnterPage(e) {
        let value = Number(e.target.value);
        if (isNaN(value) || !value) {
            value = 1;
        }
        if(value>=this.state.total){
            value=this.state.total;
        }
        typeof this.props.onChange == "function" && this.props.onChange(value-1);
    }
}

export default Pager