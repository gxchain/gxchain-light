import React from "react"
import BannerAnim, { Element } from 'rc-banner-anim';
import QueueAnim from 'rc-queue-anim';
import { TweenOneGroup } from 'rc-tween-one';
import Icon from 'antd/lib/icon';
import PropTypes from 'prop-types';
import BindToChainState from "../Utility/BindToChainState"

require("assets/stylesheets/components/_dataproductlist.scss");

let dataArray = [
    {
        title: 'Motorcycle',
        content:'test',
        pic: 'https://zos.alipayobjects.com/rmsportal/ogXcvssYXpECqKG.png',
        map: 'https://zos.alipayobjects.com/rmsportal/HfBaRfhTkeXFwHJ.png',
        color: '#FFF43D',
        background: '#F6B429',
    },
    {
        title: 'Motorcycle',
        content:'test',
        pic: 'https://zos.alipayobjects.com/rmsportal/iCVhrDRFOAJnJgy.png',
        map: 'https://zos.alipayobjects.com/rmsportal/XRfQxYENhzbfZXt.png',
        color: '#FF4058',
        background: '#FC1E4F',
    },
    {
        title: 'Motorcycle',
        content:'test',
        pic: 'https://zos.alipayobjects.com/rmsportal/zMswSbPBiQKvARY.png',
        map: 'https://zos.alipayobjects.com/rmsportal/syuaaBOvttVcNks.png',
        color: '#9FDA7F',
        background: '#64D487',
    },
];

class DataProductList extends React.Component {
    static propTypes = {
        className: PropTypes.string,
    };

    static defaultProps = {
        className: 'details-switch-demo',
    };

    constructor(props) {
        super(props);
        this.state = {
            showInt: 0,
            delay: 0,
            imgAnim: [
                { translateX: [0, 300], opacity: [1, 0] },
                { translateX: [0, -300], opacity: [1, 0] },
            ],
        };
        this.oneEnter = false;
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
        if (showInt > dataArray.length - 1) {
            showInt = dataArray.length - 1;
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

    render() {
        const imgChildren = dataArray.map((item, i) =>
            <Element key={i} style={{ background: item.color }} hideProps>
                <QueueAnim
                    animConfig={this.state.imgAnim}
                    duration={this.getDuration}
                    delay={[!i ? this.state.delay : 300, 0]}
                    ease={['easeOutCubic', 'easeInQuad']}
                    key="img-wrapper"
                >
                    <div className={`${this.props.className}-map map${i}`} key="map">
                        <img src={item.map} width="100%" />
                    </div>
                    <div className={`${this.props.className}-pic pic${i}`} key="pic">
                        <img src={item.pic} width="100%" />
                    </div>
                </QueueAnim>
            </Element>);

        const textChildren = dataArray.map((item, i) => {
            const { title, content, background } = item;
            return (<Element key={i}>
                <QueueAnim type="bottom" duration={1000} delay={[!i ? this.state.delay + 500 : 800, 0]}>
                    <h1 key="h1">{title}</h1>
                    <em key="em" style={{ background }} />
                    <p key="p">{content}</p>
                </QueueAnim>
            </Element>);
        });

        return (<div
            className={`${this.props.className}-wrapper`}
            >
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
                    {this.state.showInt < dataArray.length - 1 && <Icon type="right" key="right" onClick={this.onRight} />}
                </TweenOneGroup>
            </div>
        </div>);
    }
}


export default BindToChainState(DataProductList)