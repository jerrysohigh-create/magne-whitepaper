// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Counter} from "../src/Counter.sol";
import {DemoToken} from "../src/DemoToken.sol";
contract ExamplesTest {
    function testCounter() public {
        Counter c = new Counter();
        require(c.number() == 0, "initial value");
        c.increment(); c.increment();
        require(c.number() == 2, "two increments");
    }
    function testDemoSupplyAndTransfer() public {
        DemoToken d = new DemoToken(address(this));
        uint256 supply = 1_000_000 * 10 ** d.decimals();
        require(d.totalSupply() == supply, "supply");
        require(d.balanceOf(address(this)) == supply, "recipient");
        d.transfer(address(0xBEEF), 100 ether);
        require(d.balanceOf(address(0xBEEF)) == 100 ether, "transfer");
        require(d.balanceOf(address(this)) == supply - 100 ether, "sender");
        require(d.totalSupply() == supply, "no extra issuance");
    }
}
