import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
    const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router
    const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const TOKEN_HOLDER = "0x55FE002aefF02F77364de339a1292923A15844B8";

    await helpers.impersonateAccount(TOKEN_HOLDER);
    const impersonatedSigner = await ethers.getSigner(TOKEN_HOLDER);

    //The amounts of DAI and USDC i want to add to the liquidity pool
    const amountADesired = ethers.parseUnits("2", 18); // DAI amount
    const amountBDesired = ethers.parseUnits("2", 6); // USDC amount

    // Used to calculate the minimum amount of tokens i'm are willing to accept, allowing for slippage (price fluctuation)
    const slippageFactor = 95n; // 5% slippage
    const slippageDivisor = 100n;

//ensuring that the minimum amount is a positive number 
    const amountAMin = (amountADesired * slippageFactor) / slippageDivisor;
    const amountBMin = (amountBDesired * slippageFactor) / slippageDivisor;

   // Use Math.max to ensure minimum is 0.....unnecessary
    // const minAmountAMin = Number(amountAMin > 0n ? amountAMin : 0n);
    // const minAmountBMin = Number(amountBMin > 0n ? amountBMin : 0n);

    const to = impersonatedSigner.address; // Recipient address

//Creating instances of the ERC20 and Uniswap Router contracts so we can interact with it
    const USDC_Contract = await ethers.getContractAt("IERC20", USDC, impersonatedSigner);
    const DAI_Contract = await ethers.getContractAt("IERC20", DAI, impersonatedSigner);
    const ROUTER = await ethers.getContractAt("IUniswapV2Router", ROUTER_ADDRESS, impersonatedSigner);

    // Approve USDC and DAI spending
    await USDC_Contract.approve(ROUTER, amountBDesired);
    await DAI_Contract.approve(ROUTER, amountADesired);

    // Fetch token balances before swap
    const usdcBal = await USDC_Contract.balanceOf(impersonatedSigner.address);
    const daiBal = await DAI_Contract.balanceOf(impersonatedSigner.address);
    const deadline = Math.floor(Date.now() / 1000) + (60 * 10); // 10-minute deadline

    console.log("USDC balance before swap:", ethers.formatUnits(usdcBal, 6));
    console.log("DAI balance before swap:", ethers.formatUnits(daiBal, 18));

    // Adding liquidity to the pool
    await ROUTER.addLiquidity(
        DAI_Contract,
        USDC_Contract,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        to,
        deadline
    );

    // Fetch token balances after swap
    const usdcBalAfter = await USDC_Contract.balanceOf(impersonatedSigner.address);
    const daiBalAfter = await DAI_Contract.balanceOf(impersonatedSigner.address);

    console.log("=========================================================");
    console.log("USDC balance after swap:", ethers.formatUnits(usdcBalAfter, 6));
    console.log("DAI balance after swap:", ethers.formatUnits(daiBalAfter, 18));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
