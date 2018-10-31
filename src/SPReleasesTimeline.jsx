/*
 * Copyright (c) 2018, WSO2 Inc. (http://wso2.com) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, {Component} from "react";
import Widget from "@wso2-dashboards/widget";
import Timeline from 'vis/lib/timeline/Timeline';
import DataSet from 'vis/lib/DataSet';
import 'vis/dist/vis.min.css';
import {Scrollbars} from 'react-custom-scrollbars';
import splogo from './resources/img/sp.png';
import './SPReleasesTimeline.css';

const COOKIE = 'DASHBOARD_USER';

class SPReleasesTimeline extends Widget {

    constructor(props) {
        super(props);
        this.myRef = React.createRef();
        this.state = {
            data: [],
            metadata: null,
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,
            tag_name: null
        };
        this.chartUpdated = false;
        this._handleDataReceived = this._handleDataReceived.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.populateTimeline = this.populateTimeline.bind(this);
        this.props.glContainer.on('resize', this.handleResize);
        this.timeline = null;
        this.itemList = [];

    }

    handleResize() {
        this.setState({width: this.props.glContainer.width, height: this.props.glContainer.height});
    }

    componentDidMount() {
        super.getWidgetConfiguration(this.props.widgetID)
            .then((message) => {
                var urlParams = new URLSearchParams(decodeURI(window.location.search));
                message.data.configs.providerConfig.configs.config.queryData.query
                    = message.data.configs.providerConfig.configs.config.queryData.query
                    .replace("${tag_name}", urlParams.get('tag_name'));
                console.log(message.data.configs.providerConfig);
                super.getWidgetChannelManager().subscribeWidget(
                    this.props.widgetID, this._handleDataReceived, message.data.configs.providerConfig);
            })
            .catch((error) => {
                console.log("error", error);
            });
    }

    static getUserCookie() {
        const arr = document.cookie.split(';');
        for (let i = 0; i < arr.length; i++) {
            let c = arr[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(COOKIE) === 0) {
                return JSON.parse(c.substring(COOKIE.length + 1, c.length));
            }
        }
        return null;
    }

    _handleDataReceived(data) {
        console.log(data);
        this.setState({data: data.data});
    }

    populateTimeline(data) {

        var myDate = new Date();
        var newDate = new Date(myDate.getTime() - (60*60*24*10*1000));

        if (data.length === 0) {
            if (this.timeline) {

                this.timeline.setItems(new DataSet([]));

            }
        } else {

            if(data.length > this.itemList.length) {

                for (let i = 0; i < data.length; i++) {
                    let item = {

                        start: data[i][1],
                        content: data[i][0],
                        title: "Released On : " + data[i][1],
                        style: "color: black; background-color: #dff9fb; border-radius: 15px; border-color: black; border-width: medium",
                        gap_hours: data[i][2]

                    };
                    console.log(item);
                    this.itemList.push(item);

                }
            }

            let options = {

                height: '400px',
                margin: {
                    axis: 40,
                    item: 40
                },
                rollingMode: {
                    follow: true,
                    offset: '0.9'

                },

                template: function (item, element, data) {
                    if (item.gap_hours < 0) {
                        var img = splogo;
                        var html =  "<div><img src='" + img + "'width='250' height='30'/></div>" +
                                    '<div class="tag_name">' + item.content + '</div>' +
                                    '<div class="release_date">' + item.title + '</div>' +
                                    '<div class="delayed_release">' + "Delayed : " + item.gap_hours * -1 + " Hours" + '</div>'

                        return html;
                    }
                    else if (item.gap_hours > 0){
                        var img = splogo;
                        var html =  "<div><img src='" + img + "'width='250' height='30'/></div>" +
                                    '<div class="tag_name">' + item.content + '</div>' +
                                    '<div class="release_date">' + item.title + '</div>' +
                                    '<div class="early_release">' + "Before : " + item.gap_hours + " Hours" + '</div>'

                        return html;
                    }
                    else{
                        var img = splogo;
                        var html =  "<div><img src='" + img + "'width='250' height='30'/></div>" +
                                    '<div class="tag_name">' + item.content + '</div>' +
                                    '<div class="release_date">' + item.title + '</div>' +
                                    '<div class="ontime_release">' + "Ontime" + '</div>'

                        return html;
                    }

                },
                start: newDate,
                horizontalScrol: true
            };

            if (!this.timeline) {
                this.timeline = new Timeline(this.myRef.current);

            }

            this.timeline.setOptions(options);
            this.timeline.setItems(new DataSet(this.itemList));

        }


    }

    render() {

        this.populateTimeline(this.state.data);
        return (
            <Scrollbars style={{height: this.state.height}}>
                <div className="timeline-wrapper">
                    <div
                        ref={(ref) => {this.myRef.current = ref;}}
                        className="timeline-gadget-wrapper">

                        <img src={splogo} width="200" height="30"/>

                    </div>

                </div>
            </Scrollbars>
        );
    }

}

global.dashboard.registerWidget('SPReleasesTimeline', SPReleasesTimeline);