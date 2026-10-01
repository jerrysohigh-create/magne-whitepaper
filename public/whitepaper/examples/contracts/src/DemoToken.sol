// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract DemoToken is ERC20 {
    constructor(address recipient) ERC20("Demo Token", "DEMO") {
        _mint(recipient, 1_000_000 * 10 ** decimals());
    }
}
