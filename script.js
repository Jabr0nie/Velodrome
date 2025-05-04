

const web3 = new Web3(Web3.givenProvider || "https://optimism-mainnet.infura.io/v3/bbc374cd87354cf5ae4c9df855b61fe9");
const web3m = new Web3(window.ethereum);
const POSITION_MANAGER_ADDRESS = '0x416b433906b1B72FA758e166e239c43d68dC6F29';
// Connect to MetaMask
async function connectToMetaMask() {
    try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        console.log('Connected account:', account);

        document.getElementById('connectbutton').innerHTML = account;

        // Optional: Listen for account or chain changes
        window.ethereum.on('accountsChanged', (newAccounts) => {
            if (newAccounts.length === 0) {
                document.getElementById('connectbutton').innerHTML = 'Connect Wallet';
                console.log('Disconnected from MetaMask');
            } else {
                const newAccount = newAccounts[0];
                document.getElementById('connectbutton').innerHTML = newAccount;
                console.log('Switched account:', newAccount);
            }
        });

        window.ethereum.on('chainChanged', (chainId) => {
            console.log('Network changed to chain ID:', chainId);
            window.location.reload(); // Reload to handle new network
        });

        return account;
    } catch (error) {
        console.error('MetaMask connection error:', error);
        alert('Failed to connect to MetaMask. Please try again.');
        return null;
    }
}

// Event listener for connect button
document.getElementById('connectbutton').addEventListener('click', async () => {
        await connectToMetaMask();
});

/**
 * Deposits liquidity into a Velodrome Slipstream pool
 * @param {string} token0 - Address of the first token (e.g., WETH)
 * @param {string} token1 - Address of the second token (e.g., USDC)
 * @param {number} tickSpacing - Tick spacing for the pool (e.g., 50 for stable, 200 for volatile)
 * @param {string} amount0Desired - Desired amount of token0 (in wei)
 * @param {string} amount1Desired - Desired amount of token1 (in wei)
 * @param {number} tickLower - Lower tick of the price range
 * @param {number} tickUpper - Upper tick of the price range
 * @returns {Promise<object>} - Transaction receipt
 * 
 */

const token0 = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85";
const token1 = "0x9560e827aF36c94D2Ac33a39bCE1Fe78631088Db";
const tickSpacing = 200;
const LiquidityCalcAddress = "0xcF8F0BB8A2b2608c184455613e525D03C63DD3D4";
const USDCvelo = "0x7cfc2Da3ba598ef4De692905feDcA32565AB836E";
const Oracle = "0x9d0cffe335a077851aA3D3Fc37EC5f0605f0f649";
const V3SwapAddress = "0x44cccE81441A3cb00DC5d8fCd3A198Ce41282066"

const token0Contract = new web3m.eth.Contract(ERC20_ABI, token0);
const wtoken0Contract = new web3.eth.Contract(ERC20_ABI, token0);
const token1Contract = new web3m.eth.Contract(ERC20_ABI, token1);
const wtoken1Contract = new web3.eth.Contract(ERC20_ABI, token1);
const LiquidityCalc = new web3m.eth.Contract(LiquidityCalcABI, LiquidityCalcAddress);
const positionManager = new web3m.eth.Contract(SSPOSITION_MANAGER_ABI, POSITION_MANAGER_ADDRESS);
const oracleContract = new web3m.eth.Contract(oracleABI, Oracle);
const V3SwapContract = new web3m.eth.Contract(V3SwapABI, V3SwapAddress);
  // Approve token0
  async function approvetoken0() {
      let account = document.getElementById('connectbutton').innerText;
      const token0Contract = new web3m.eth.Contract(ERC20_ABI, token0);
      const approveaddress = '0x44cccE81441A3cb00DC5d8fCd3A198Ce41282066';
      const maxUint256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
      const receipt = await token0Contract.methods
        .approve(approveaddress, maxUint256)
        .send({ from: account });
      console.log('Token0 approved:', receipt);
     
  }
  document.getElementById('ApproveToken0').addEventListener('click', approvetoken0);

// Approve token1
async function approvetoken1() {

    let account = document.getElementById('connectbutton').innerText;

      const approveaddress = '0x44cccE81441A3cb00DC5d8fCd3A198Ce41282066';
      const token1Contract = new web3m.eth.Contract(ERC20_ABI, token1);
      const maxUint256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
  
      console.log(`Approving ${token1} for PositionManager...`);
      const receipt = await token1Contract.methods
      .approve(approveaddress, maxUint256)
      .send({ from: account });
      console.log('Token1 approved:', receipt);
  }

  document.getElementById('ApproveToken1').addEventListener('click', approvetoken1);

async function depositLiquidity() {
    let account = document.getElementById('connectbutton').innerText;

    let ticks = await LiquidityCalc.methods.getTicks(USDCvelo).call();
          // Use object destructuring for named outputs
    let { lowTick: tickLower, highTick: tickUpper } = ticks;
    let _token0bal = await wtoken0Contract.methods.balanceOf(account).call();
    let token0bal = typeof _token0bal === 'bigint' ? Number(_token0bal) : Number(_token0bal);
    token0bal = token0bal / (10 ** 6);
    //token0bal = balanceNumber / Math.pow(10, decimals);
    console.log(token0bal);
    let _token1bal = await wtoken1Contract.methods.balanceOf(account).call();
    let token1bal = typeof _token1bal === 'bigint' ? Number(_token1bal) : Number(_token1bal);
    token1bal = token1bal / (10 ** 18);
    console.log(token1bal);
    let _price = await oracleContract.methods.GetPrice(USDCvelo).call();
    let price = typeof _price === 'bigint' ? Number(_price) : Number(_price);
    price = price / (10 ** 6);
    console.log(price);
    let veloCost = token1bal * price;
    console.log(veloCost);
    let variance = token0bal - veloCost;
    console.log(variance);
    if (variance < 0) {
      let swap1Amount = (((-variance / 2) / price) * (10 ** 18));
      swap1Amount = Math.floor(swap1Amount).toString(); // Convert to integer string
      console.log(`Swapping ${swap1Amount} VELO for USDC...`);
      const receipt = await V3SwapContract.methods
        .Swap1for0(swap1Amount)
        .send({ from: account });
      console.log('Swap successful:', receipt);
    }
    if (variance > 0){
      let swap0Amount = (variance / 2) * 10 ** 6;
      swap0Amount = Math.floor(swap0Amount).toString(); // Convert to integer string
      console.log(`Swapping ${swap0Amount} VELO for USDC...`);
      const receipt = await V3SwapContract.methods
        .Swap0for1(swap0Amount)
        .send({ from: account });
      console.log('Swap successful:', receipt);
    }
    //.send({ from: account, gas: 1600 });

    let amount0Desired = await wtoken0Contract.methods.balanceOf(account).call();
    let amount1Desired = await wtoken1Contract.methods.balanceOf(account).call();
    // Use object destructuring for named outputs
    //let amountsdesired = await LiquidityCalc.methods.getAmountsforLiquidity(USDCvelo,'10000000000000').call();
              // Use object destructuring for named outputs
    //const { amount0: amount0Desired, amount1: amount1Desired } = amountsdesired;

      // Set deadline (e.g., 30 minutes from now)
      const deadline = Math.floor(Date.now() / 1000) + 30 *60;
  
      // Mint parameters
      const mintParams = {
        token0,
        token1,
        tickSpacing,
        tickLower,
        tickUpper,
        amount0Desired,
        amount1Desired,
        amount0Min: '0', // Minimum amount of token0 (set to 0 for simplicity; adjust for slippage protection)
        amount1Min: '0', // Minimum amount of token1
        recipient: account,
        deadline,
        sqrtPriceX96: '0',
      };
  
      // Estimate gas
      const gas = await positionManager.methods.mint(mintParams).estimateGas({ from: account });
  
      // Call mint to deposit liquidity
      console.log('Depositing liquidity...');
      const receipt = await positionManager.methods
        .mint(mintParams)
        .send({ from: account, gas });
  
      console.log('Liquidity deposited successfully:', receipt);
      return receipt;
    } 

  document.getElementById("Deposit").onclick = depositLiquidity;

