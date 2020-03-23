import React, {useEffect, useState} from 'react';
import {
    Box,
    Grommet,
    DataTable,
    Text
} from 'grommet';
import { pipe } from 'rxjs';
import Subspace, {$latest} from '@embarklabs/subspace';
import Web3 from 'web3';
import exchangeABI from './contract/exchange_abi.json'

const web3 = new Web3('https://cloudflare-eth.com');
const subspace = new Subspace(web3.currentProvider);
var dai = new web3.eth.Contract(exchangeABI, '0x2a1530C4C41db0B0b2bB646CB5Eb1A67b7158667');
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

    const [txnObserver, setObservable] = useState();
    const [last5Observer, setLast5Observer] = useState();
    const [latestBlock, setBlock] = useState();
    const [last5, setLast5] = useState([]);

    //Trade details object for calculating exchange rate
    function TradeDetails(tokensSold, ethBought) {
        this.tokensSold = web3.utils.fromWei(tokensSold);
        this.ethBought = web3.utils.fromWei(ethBought);
        this.exchangeRate = this.tokensSold / this.ethBought;
    }

    //Effect hook to define subspace observables
    useEffect(() => {
        web3.eth.getBlockNumber().then((block) => setBlock(block));
        if (typeof(latestBlock) != "number") 
            return;

        const EthPurchased$ = daiContract.events.EthPurchase.track({
            fromBlock: latestBlock - 50
        });
        const last5$ = EthPurchased$.pipe($latest(5));
        setObservable(EthPurchased$);
        setLast5Observer(last5$)
    }, [setObservable, setLast5Observer, latestBlock])

    //Effect hook to set up subscription for Uniswap DAI Contract EthPurchase event
    useEffect(() => {
        if ((txnObserver === undefined) || (typeof latestBlock != "number")) {
            return;
        } else {
            txnObserver.subscribe((trade) => {
                console.log(trade);
            });
        }
        return txnObserver.unsubscribe;
    }, [txnObserver, latestBlock]);

    //Effect hook to source last 5 trades from EthPurchase observableyarn
    useEffect(() => {
        if (last5Observer === undefined) {
            return;
        } else {
            last5Observer.subscribe((fiveTrades) => {
                const prices = fiveTrades.map(trade => {
                    const txnDetails = new TradeDetails(trade.tokens_sold, trade.eth_bought);
                    return {'block': trade.blockNumber, 'rate': txnDetails.exchangeRate}
                });
                setLast5(prices);
            });
        }
        return last5Observer.unsubscribe;
    }, [last5Observer]);

    return (
        <Grommet theme={theme}>
            <AppBar>Subspace DeFi Dashboard Demo</AppBar>
            <Box align="center">
                <Text margin="medium" textAlign="center">Average Exchange Rate on 5 latest Uniswap DAI->ETH trades = {
                    (last5.reduce((a,b) => a + b.rate, 0) / last5.length).toFixed(6)
                }</Text>
            </Box>
            <Box align="center"><Text textAlign="center"> Last 5 DAI -> Eth Trades</Text></Box>
            <Tradelist last5={last5}/>  </Grommet>
    );
}

const AppBar = (props) => (
    <Box tag='header' direction='row' align='center' alignContent="center"  background='brand'
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

const Tradelist = (props) => (
    <Box direction='column' align='center' pad="medium">
        <DataTable columns={
                [
                    {
                        property: 'block',
                        header: <Text>Block</Text>,
                   
                    }, {
                        property: 'rate',
                        header: <Text>ETH/DAI</Text>,
                        primary: true
                    }
                ]
            }
            data={
                props.last5
            }/>
    </Box>
)

export default App;
