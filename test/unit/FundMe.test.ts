import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { assert, expect } from "chai"
import { deployments, ethers, network } from "hardhat"
import { FundMe, MockV3Aggregator } from "../../typechain-types"
import { developmentChains } from "../../helper-hardhat-config"

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function() {
          let fundMe: FundMe
          let mockV3Aggredator: MockV3Aggregator
          let deployer: SignerWithAddress
          const sendValue = ethers.utils.parseEther("1")

          beforeEach(async function() {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              //deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe")
              mockV3Aggredator = await ethers.getContract("MockV3Aggregator")
          })

          describe("contstructor", function() {
              it("sets the aggregator address correctly", async function() {
                  const response = await fundMe.s_priceFeed()
                  assert.equal(response, mockV3Aggredator.address)
              })
          })

          describe("fund", () => {
              it("Fails if you don't send enough ETH", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
              })
              it("Updated the amount funded data structure", async () => {
                  //test --grep 'amount funded'
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.s_addressToAmountFunded(
                      deployer.address
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to array of funders", async () => {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.s_funders(0)
                  assert.equal(funder, deployer.address)
              })
          })

          describe("withdraw", async () => {
              beforeEach(async function() {
                  await fundMe.fund({ value: sendValue })
              })
              it("withdraw ETH from a single founder", async () => {
                  //Arrange - prepare
                  const startFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startDeployerBalance = await fundMe.provider.getBalance(
                      deployer.address
                  )
                  //Act
                  const transResponse = await fundMe.withdraw()
                  const transReciept = await transResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transReciept
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endDeployerBalance = await fundMe.provider.getBalance(
                      deployer.address
                  )
                  //gasCost
                  //Assert
                  assert.equal(endFundMeBalance.toString(), "0")
                  assert.equal(
                      endDeployerBalance.add(gasCost).toString(),
                      startFundMeBalance.add(startDeployerBalance).toString() //convert to string is better for comparing bigNumber
                  )
              })

              it("Allows us to withdraw from multiple funders", async () => {
                  //Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startDeployerBalance = await fundMe.provider.getBalance(
                      deployer.address
                  )
                  //Act
                  const transResponse = await fundMe.withdraw()
                  const transReciept = await transResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transReciept
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const endFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endDeployerBalance = await fundMe.provider.getBalance(
                      deployer.address
                  )
                  //Assert
                  assert.equal(endFundMeBalance.toString(), "0")
                  assert.equal(
                      endDeployerBalance.add(gasCost).toString(),
                      startFundMeBalance.add(startDeployerBalance).toString() //convert to string is better for comparing bigNumber
                  )
                  //Make sure funder array reset
                  await expect(fundMe.s_funders(0)).to.be.reverted
                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await (
                              await fundMe.s_addressToAmountFunded(
                                  accounts[i].address
                              )
                          ).toString(),
                          "0"
                      )
                  }
              })

              it("Cheaper withdraw ETH from a single founder ...", async () => {
                  //Arrange - prepare
                  const startFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startDeployerBalance = await fundMe.provider.getBalance(
                      deployer.address
                  )
                  //Act
                  const transResponse = await fundMe.cheaperWithdraw()
                  const transReciept = await transResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transReciept
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endDeployerBalance = await fundMe.provider.getBalance(
                      deployer.address
                  )
                  //gasCost
                  //Assert
                  assert.equal(endFundMeBalance.toString(), "0")
                  assert.equal(
                      endDeployerBalance.add(gasCost).toString(),
                      startFundMeBalance.add(startDeployerBalance).toString() //convert to string is better for comparing bigNumber
                  )
              })

              it("Cheaper withdraw testing ...", async () => {
                  //Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startDeployerBalance = await fundMe.provider.getBalance(
                      deployer.address
                  )
                  //Act
                  const transResponse = await fundMe.cheaperWithdraw()
                  const transReciept = await transResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transReciept
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const endFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endDeployerBalance = await fundMe.provider.getBalance(
                      deployer.address
                  )
                  //Assert
                  assert.equal(endFundMeBalance.toString(), "0")
                  assert.equal(
                      endDeployerBalance.add(gasCost).toString(),
                      startFundMeBalance.add(startDeployerBalance).toString() //convert to string is better for comparing bigNumber
                  )
                  //Make sure funder array reset
                  await expect(fundMe.s_funders(0)).to.be.reverted
                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await (
                              await fundMe.s_addressToAmountFunded(
                                  accounts[i].address
                              )
                          ).toString(),
                          "0"
                      )
                  }
              })

              it("Only allows the owner to withdraw", async () => {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[2]
                  const attackerConnctedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(attackerConnctedContract.withdraw()).to.be
                      .reverted
              })
          })
      })
