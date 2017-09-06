import React from "react";
import Statistics from "./Statistics";
import BlockchainStore from "stores/BlockchainStore";
import AltContainer from "alt-container";

class StatisticsContainer extends React.Component {

    render() {
        return (
            <AltContainer
                stores={[BlockchainStore]}
                inject={{
                    latestBlocks: () => {
                        return BlockchainStore.getState().latestBlocks;
                    },
                    latestTransactions: () => {
                        return BlockchainStore.getState().latestTransactions;
                    }
                }}
            >
                <Statistics/>
            </AltContainer>
        );
    }
}

export default StatisticsContainer;
