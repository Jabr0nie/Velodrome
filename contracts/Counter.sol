// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Counter {
    uint256 private count;

    // Constructor to initialize count to 0
    constructor() {
        count = 0;
    }

    // Function to increment the counter
    function increment() public {
        count += 1;
    }

    // Function to decrement the counter
    function decrement() public {
        require(count > 0, "Counter cannot be negative");
        count -= 1;
    }

    // Function to get the current count
    function getCount() public view returns (uint256) {
        return count;
    }
}