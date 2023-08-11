import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { Task1 } from '../wrappers/Task1';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { randomInt } from 'crypto';

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
        const targetCell = new Cell().asBuilder().endCell();

        const targetHash = bufferToInt(targetCell.hash());
        const cell = new Cell().asBuilder()
            .storeRef(targetCell)
            .endCell();
        const { result } = await task1.sendBranchByHash({
            hash: targetHash,
            cell: cell
        });

        expect(result.hash()).toEqual(targetCell.hash());
    });

    function randomTree(depth: number, target: Cell) {
        const head = new Cell().asBuilder();
        for (let i = 0; i < depth; i++) {
            let rand = randomInt(1, 4);
            for (let j = 1; j < rand; j++) {
                const targetCell = new Cell().asBuilder().endCell();
            }

        }
        return head.endCell();
    }

    function bufferToInt(buffer: Buffer) : bigint {
        let hash = BigInt(0);
        for (let i = 0; i < buffer.length; i++) {
            hash = (hash << 8n) | BigInt(buffer[i]);
        }
        return hash;
    }
});
