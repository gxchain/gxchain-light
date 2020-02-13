import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";

export default class StakingTipModal extends React.Component {
    show() {
        ZfApi.publish("staking_tip_modal", "open");
    }

    confirmClicked(e) {
        ZfApi.publish("staking_tip_modal", "close");
    }

    render() {
        return (
          <Modal id="staking_tip_modal" overlay={true} ref="staking_tip_modal">
            <Trigger close="staking_tip_modal">
              <a href="#" className="close-button">
                &times;
              </a>
            </Trigger>
            <div className="grid-block vertical no-overflow">
              <br />
              <br />
              <Translate
                component="p"
                content="staking_program.max_staking_count"
              />
              <br />

              <div
                className="button-group no-overflow"
                style={{ paddingTop: 0 }}>
                <Trigger close="staking_tip_modal">
                  <div onClick={this.confirmClicked} className="button">
                    <Translate content="staking_program.i_know" />
                  </div>
                </Trigger>
              </div>
            </div>
          </Modal>
        );
    }
               }
