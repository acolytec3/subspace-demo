import React, {useEffect, useState} from 'react';
import {
    Box,
    Grommet,
    DataTable,
    Text
} from 'grommet';
import Subspace, {$latest} from '@embarklabs/subspace';
import Web3 from 'web3';
import exchangeABI from './contract/exchange_abi.json'

const web3 = new Web3('https://mainnet.infura.io/v3/9eb527726b034638b37f37f66b0f80d7');
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

    const [trades, updateTrades] = useState({exchangeRate: 0});
    const [txnObserver, setObservable] = useState();
    const [last5Observer, setLast5Observer] = useState();
    const [latestBlock, setBlock] = useState();
    const [last5, setLast5] = useState([]);

    function TradeDetails(tokensSold, ethBought) {
        this.tokensSold = web3.utils.fromWei(tokensSold);
        this.ethBought = web3.utils.fromWei(ethBought);
        this.exchangeRate = this.tokensSold / this.ethBought;
    }

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

    useEffect(() => {
        if ((txnObserver === undefined) || (typeof latestBlock != "number")) {
            return;
        } else {
            txnObserver.subscribe((trade) => {
                console.log(trade);
                const txnDetails = new TradeDetails(trade.tokens_sold, trade.eth_bought);
                updateTrades(txnDetails);
            });
        }
        return txnObserver.unsubscribe;
    }, [txnObserver, latestBlock]);

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
                        primary: true
                    }, {
                        property: 'rate',
                        header: <Text>ETH/DAI</Text>
                    }
                ]
            }
            data={
                props.last5
            }/>
    </Box>
)

export default App;
