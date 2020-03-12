import React, { useEffect, useState} from 'react';
import {Box, Button, Grommet, List, Text} from 'grommet';
import Subspace from '@embarklabs/subspace';
import Web3 from 'web3';
import {map, pipe} from "rxjs/operators";
import exchangeABI from './contract/exchange_abi.json'

const web3 = new Web3('https://mainnet.infura.io/v3/9eb527726b034638b37f37f66b0f80d7');
const subspace = new Subspace(web3.currentProvider);
var dai = new web3.eth.Contract(exchangeABI,'0x2a1530C4C41db0B0b2bB646CB5Eb1A67b7158667');
const daiContract = subspace.contract(dai);
subspace.init();

const theme = {
    global: {
        font: {
            family: 'Roboto',
            size: '18px',
            height: '20px'
        }
    }
};


function App() {

    const [trades, updateTrades] = useState({exchangeRate:1.0});
    const [txnObserver, setObservable] = useState();
    const [latestBlock, setBlock] = useState();
    function TradeDetails (tokensSold, ethBought) {
        this.tokensSold = web3.utils.fromWei(tokensSold);
        this.ethBought = web3.utils.fromWei(ethBought);
        this.exchangeRate = this.tokensSold/this.ethBought;
    }

    useEffect (() => {
        web3.eth.getBlockNumber().then((block) => setBlock(block));
        console.log(typeof latestBlock)
        if (typeof(latestBlock) != "number")
            return;
        const EthPurchased$ = daiContract.events.EthPurchase.track({fromBlock: latestBlock - 10});
        setObservable(EthPurchased$);
      },[setObservable, latestBlock])

    useEffect (() => {
        if((txnObserver === undefined) || (typeof latestBlock != "number")) {
            return;
        }
        else {
            txnObserver.subscribe((trade) => {
                console.log(trade);
                const txnDetails = new TradeDetails(trade.tokens_sold, trade.eth_bought);
                updateTrades(txnDetails);
        }
        )};
        return txnObserver.unsubscribe;
    },[txnObserver, latestBlock]);

    
    return (
        <Grommet theme={theme}>
            <AppBar>Hello Subspace!</AppBar>
            <Text>Exchange rate on most recent ETH/DAI trade = {trades.exchangeRate}</Text>
        </Grommet>
    );
}

const AppBar = (props) => (
    <Box tag='header' direction='row' align='center' justify='between' background='brand'
        pad={
            {
                left: 'medium',
                right: 'small',
                vertical: 'small'
            }
        }
        elevation='medium'
        style={
            {zIndex: '1'}
        }
        {...props}/>
);

const tradeList = () => (
    <Box tag='trades' direction='column' align='center'
        pad="medium">
            <List></List>
        </Box>
)

const trade = (tradeDetails) => (
    <Box direction='row' align='center'>
        <Text></Text>
    </Box>
)
export default App;
