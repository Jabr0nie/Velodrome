const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Counter", function () {
  let Counter, counter;

  beforeEach(async function () {
    Counter = await ethers.getContractFactory("Counter");
    counter = await Counter.deploy();
    // Remove await counter.deployed(); since it's not needed
  });

  it("Should initialize count to 0", async function () {
    expect(await counter.getCount()).to.equal(0);
  });

  it("Should increment count correctly", async function () {
    await counter.increment();
    expect(await counter.getCount()).to.equal(1);
  });

  it("Should decrement count correctly", async function () {
    await counter.increment();
    await counter.decrement();
    expect(await counter.getCount()).to.equal(0);
  });

  it("Should revert decrement when count is 0", async function () {
    await expect(counter.decrement()).to.be.revertedWith("Counter cannot be negative");
  });
});