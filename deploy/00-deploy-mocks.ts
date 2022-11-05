import { network } from "hardhat"
import { developmentChains } from "../helper-hardhat-config"

module.exports = async ({
    getNamedAccounts,
    deployments
}: {
    getNamedAccounts: any
    deployments: any
}) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    //const chainId: number = network.config.chainId!
    const DECIMALS = 8,
        INITAL_ANSWER = 200000000000
    // 31337
    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks")
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITAL_ANSWER]
        })
        log("Mocks deployed!")
        log("--------------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
