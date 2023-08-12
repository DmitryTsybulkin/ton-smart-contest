import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { beginCell, Cell, toNano } from 'ton-core';
import { Task1 } from '../wrappers/Task1';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Task1', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Task1');
    });

    let blockchain: Blockchain;
    let task1: SandboxContract<Task1>;
    let deployer: SandboxContract<TreasuryContract>

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        task1 = blockchain.openContract(Task1.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await task1.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task1.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task1 are ready to use
    });

    it("should find hash", async () => {
        const targetCell = beginCell()
            .storeBit(true)
            .endCell();
        const targetHash = bufferToInt(targetCell.hash());

        const tree = beginCell()
            .storeRef(beginCell()
                .storeRef(
                    beginCell().endCell()
                )
                .storeRef(
                    beginCell()
                        .storeRef(targetCell)
                        .endCell()
                )
                .storeRef(
                    beginCell().endCell()
                )
                .endCell()
            )
            .endCell();
        const { result } = await task1.sendBranchByHash({
            hash: targetHash,
            tree: tree
        });
        console.log(`Gas used: ${result.gas}`);
        expect(result.cell.hash()).toEqual(targetCell.hash());
    });

    function bufferToInt(buffer: Buffer) : bigint {
        let hash = BigInt(0);
        for (let i = 0; i < buffer.length; i++) {
            hash = (hash << 8n) | BigInt(buffer[i]);
        }
        return hash;
    }
});
