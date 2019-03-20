import React from 'react'
import {PropTypes} from "react";
import {province, city, area} from './china_regions'

class CityPicker extends React.Component {

    static propTypes = {
        className: PropTypes.string,
        province: PropTypes.string,
        city: PropTypes.string,
        area: PropTypes.string,
        onChange: PropTypes.func
    }

    static defaultProps = {
        className: '',
        province: '',
        city: '',
        area: ''
    }

    constructor(props) {
        super(props);
        this.state = {
            className: '',
            province: '',
            city: '',
            area: ''
        }
    }

    componentWillMount() {
        this.setState({className: this.props.className || ''});
        this.setState({province: this.props.province || ''});
        this.setState({city: this.props.city || ''});
        this.setState({area: this.props.area || ''});
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextState.className !== this.state.className ||
            nextState.province !== this.state.province ||
            nextState.city !== this.state.city ||
            nextState.area !== this.state.area
        );
    }

    render() {
        let provinces = province.filter(function (pro) {
            return pro.id!='710000'&&pro.id!='810000'&&pro.id!='820000'
        }).map(function (pro) {
            return <option key={pro.id} value={pro.id}>{pro.name}</option>
        })

        let cities = [];
        if (this.state.province) {
            cities = city[this.state.province].map(function (c) {
                return <option key={c.id} value={c.id}>{c.name}</option>
            });
        }
        let areas = [];
        if (this.state.city) {
            areas = area[this.state.city].map(function (a) {
                return <option key={a.id} value={a.id}>{a.name}</option>
            });
        }

        return (
            <div className={`city-picker ${this.state.className}`}>
                <select value={this.state.province} onChange={this.onProvinceChange.bind(this)}>
                    <option value="">省</option>
                    {provinces}
                </select>
                <select value={this.state.city} onChange={this.onCityChange.bind(this)}>
                    <option value="">市</option>
                    {cities}
                </select>
                <select value={this.state.area} onChange={this.onAreaChange.bind(this)}>
                    <option value="">区</option>
                    {areas}
                </select>
            </div>)
    }

    value() {
        return {province: this.state.province, city: this.state.city, area: this.state.area};
    }

    onProvinceChange(event) {
        this.setState({
            province: event.target.value,
            city: '',
            area:''
        })
        var value = this.value();
        value.province = event.target.value;
        this.props.onChange(value);
    }

    onCityChange(event) {
        this.setState({
            city: event.target.value,
            area:''
        })
        var value = this.value();
        value.city = event.target.value;
        this.props.onChange(value);
    }

    onAreaChange(event) {
        this.setState({
            area: event.target.value
        })
        var value = this.value();
        value.area = event.target.value;
        this.props.onChange(value);
    }
}

export default CityPicker;