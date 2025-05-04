const { Web3 } = require('web3');
const config = require('./config');
const BOTControllerABI = require('./Abi');

const web3 = new Web3(`https://mantle-mainnet.infura.io/v3/${config.infuraProjectId}`);

const _from = "0xDf4023c082F6E1562fb228D7b961D97aF8708d4c";
const privateKey = `${config.privateKey}`;

// Define the bot addresses (Controller - not actual SC)
const WETHMETH = "0xABc52832315E6cFbD2a8fC2A491dd830858A1190";
const WMNTMETH = "0xa92daeD32FFB7D93b85f8B689ab540CcC2148D95";
//0xa92daeD32FFB7D93b85f8B689ab540CcC2148D95 - autocompound - custom percent
//0x0ceCe3b3008C877D5351713fBa395674f5F5C590 - Sends to admin
const WMNTUSDT = "0xc90Bd913122bD8b2E9bEaf1628CC7d73c7CD79b4";
//0xc90Bd913122bD8b2E9bEaf1628CC7d73c7CD79b4 - autocompound 50% send 50% to admin
const JOEWMNT = "0x97A0701A44e5311f5A5D781e04036987A9D93e72";
//0x97A0701A44e5311f5A5D781e04036987A9D93e72 - autocompound - custom percent
const AUSDWMNT = "0x8062F0c0Ebe5C28321C03440A83ef4107c2686B4";
//0x8062F0c0Ebe5C28321C03440A83ef4107c2686B4 - autocompound - custom percent - w CIRCUIT BREAKER
//0xCcCfCfCDF1d5CBd1efba3729e5cCcCf150281Dc1 - autocompound - custom percent
const INTXUSDT = "0x7167F93c317F693d0AaE98D0F80ABA215e5267a7";
//0x7167F93c317F693d0AaE98D0F80ABA215e5267a7 - autocompound - custom percent
const COOKWMNT = "0x45581E4097a9Be0BAc2CDFB1de286f97b00e6211";
//0x45581E4097a9Be0BAc2CDFB1de286f97b00e6211 - autocompound - custom percent

// Create an array of bot addresses
const BOTAddress = [WMNTMETH, AUSDWMNT];

let isRunning = false;  // Flag to track if the function is currently running
const delay = ms => new Promise(res => setTimeout(res, ms));

// Function to check farm status and rebalance if necessary
async function checkFarmStatus() {
    if (isRunning) return;  // If the function is still running, skip execution

    isRunning = true;  // Set the flag to indicate the function is running

    for (let i = 0; i < BOTAddress.length; i++) {
        console.log("Checking Farm " + i);

        // Initialize the contract instance for each bot address
        let BOT = new web3.eth.Contract(BOTControllerABI, BOTAddress[i]);

        try {
            // Call the checkFarm method to get the farm status
            let inRange = await BOT.methods.checkFarm().call();
            console.log(`Farm ${i} in range status: `, inRange);

            // If the farm is not in range, we proceed with the rebalance transaction
            if (inRange == false) {
                const tx = {
                    from: _from,
                    to: BOTAddress[i],
                    gas: '11848960664',  // Use the estimated gas here
                    data: BOT.methods.rebalance().encodeABI(),
                    maxPriorityFeePerGas: '20000000',
                    maxFeePerGas: '20000000'
                };

                // Sign the transaction
                const signature = await web3.eth.accounts.signTransaction(tx, privateKey);
                console.log('Transaction signed:', signature);

                // Send the signed transaction
                const receipt = await web3.eth.sendSignedTransaction(signature.rawTransaction);
                console.log('Rebalance transaction successful. Receipt:', receipt);

          
              
            }
        }catch (error) {
            console.error('Error occurred during transaction:', error.message);
            if (error.message.includes('execution reverted')) {
                console.error('Transaction reverted. It could be due to contract logic or state conditions.');
            }

        }
    }
    isRunning = false;
};

checkFarmStatus();


// Set an interval to call checkFarmStatus every X milliseconds (e.g., 30 seconds)
setInterval(() => {
    checkFarmStatus();
}, 5000);

const express = require('express');
const app = express();
const port = 8080; // Change to your preferred port

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Healthy');
});

// Your existing routes and logic
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
