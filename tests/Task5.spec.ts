import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano, TupleItemInt } from 'ton-core';
import { Task5 } from '../wrappers/Task5';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Task5', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Task5');
    });

    let blockchain: Blockchain;
    let task5: SandboxContract<Task5>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        task5 = blockchain.openContract(Task5.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await task5.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task5.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task5 are ready to use
    });

    it('should calculate fibonacci', async () => {
        const N = 201;
        const K = 4;

        let fibonacciSeq: bigint[] = [0n, 1n];
        for (let i = 2; i < N + K; i++) {
            let nextTerm = fibonacciSeq[i - 1] + fibonacciSeq[i - 2];
            fibonacciSeq.push(nextTerm);
        }
        const testResult: bigint[] = fibonacciSeq.slice(N, N+K);

        const { result } = await task5.sendCalcFibonacciSequence({
            N: BigInt(N),
            K: BigInt(K)
        });
        console.log(`Gas used: ${result.gas}`);

        let sequence = [];
        while (result.sequence.remaining != 0) {
            const v = result.sequence.pop() as TupleItemInt;
            sequence.push(v.value);
        }

        expect(sequence).toEqual(testResult);
        console.log("Fibonacci equals");
    });
});
