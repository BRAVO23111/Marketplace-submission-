// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ReuseToken is ERC20 {
    constructor() ERC20("Reuse Token", "REUSE") {
        _mint(msg.sender, 1000000 * 10 ** decimals()); // Mint 1 million REUSE tokens to deployer
    }
}
