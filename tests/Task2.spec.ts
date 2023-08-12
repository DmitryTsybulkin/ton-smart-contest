import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { Task2 } from '../wrappers/Task2';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Task2', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Task2');
    });

    let blockchain: Blockchain;
    let task2: SandboxContract<Task2>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        task2 = blockchain.openContract(Task2.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await task2.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task2.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task2 are ready to use
    });

    it('should multiply matrix', async () => {
        const matrixA = [
            [1, 2],
            [3, 4],
            [5, 6]
        ];
        const matrixB = [
            [7, 8, 9],
            [10, 11, 12]
        ];

        const resultMatrix = multiplyMatrices(matrixA, matrixB);



        const resultMatrix2 = multiplyMatrices([
            [1, 2, 3, 4, 5, 6, 7],
            [7, 6, 5, 4, 3, 2, 1]
        ], [
            [1, 2, 3, 4, 5],
            [5, 4, 3, 2, 1],
            [1, 2, 3, 4, 5],
            [5, 4, 3, 2, 1],
            [1, 2, 3, 4, 5],
            [5, 4, 3, 2, 1],
            [1, 2, 3, 4, 5]
        ]);

        for (const row of resultMatrix2) {
            console.log(row.join(" "));
        }
    });
});

function multiplyMatrices(matrixA: number[][], matrixB: number[][]) {
    const numRowsA = matrixA.length;
    const numColsA = matrixA[0].length;
    const numRowsB = matrixB.length;
    const numColsB = matrixB[0].length;

    if (numColsA !== numRowsB) {
        throw new Error("Invalid matrix dimensions for multiplication");
    }

    const resultMatrix = new Array(numRowsA)
        .fill(0)
        .map(() => new Array(numColsB).fill(0));
    for (let i = 0; i < numRowsA; i++) {
        for (let j = 0; j < numColsB; j++) {
            let sum = 0;
            for (let k = 0; k < numColsA; k++) {
                sum += matrixA[i][k] * matrixB[k][j];
            }
            resultMatrix[i][j] = sum;
        }
    }

    return resultMatrix;
}

