import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano, Tuple, TupleBuilder } from 'ton-core';
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

        const matrixAT: Tuple = {
            type: 'tuple',
            items: [
                {
                    type: 'tuple',
                    items: [
                        {
                            type: 'int',
                            value: 1n
                        },
                        {
                            type: 'int',
                            value: 2n
                        }
                    ]
                },
                {
                    type: 'tuple',
                    items: [
                        {
                            type: 'int',
                            value: 3n
                        },
                        {
                            type: 'int',
                            value: 4n
                        }
                    ]
                },
                {
                    type: 'tuple',
                    items: [
                        {
                            type: 'int',
                            value: 5n
                        },
                        {
                            type: 'int',
                            value: 6n
                        }
                    ]
                }
            ]
        }

        const matrixB = [
            [7, 8, 9],
            [10, 11, 12]
        ];

        const matrixBT: Tuple = {
            type: 'tuple',
            items: [
                {
                    type: 'tuple',
                    items: [
                        {
                            type: 'int',
                            value: 7n
                        },
                        {
                            type: 'int',
                            value: 8n
                        },
                        {
                            type: 'int',
                            value: 9n
                        }
                    ]
                },
                {
                    type: 'tuple',
                    items: [
                        {
                            type: 'int',
                            value: 10n
                        },
                        {
                            type: 'int',
                            value: 11n
                        },
                        {
                            type: 'int',
                            value: 12n
                        }
                    ]
                }
            ]
        }

        const resultMatrix = multiplyMatrices(matrixA, matrixB);
        console.log(resultMatrix);
        console.log(multiplyMatrixes(matrixA, matrixB));

        const matrix1 = [
            [1, 2, 3, 4, 5, 6, 7],
            [7, 6, 5, 4, 3, 2, 1]
        ];

        const matrix2 = [
            [1, 2, 3, 4, 5],
            [5, 4, 3, 2, 1],
            [1, 2, 3, 4, 5],
            [5, 4, 3, 2, 1],
            [1, 2, 3, 4, 5],
            [5, 4, 3, 2, 1],
            [1, 2, 3, 4, 5]
        ];

        const resultMatrix2 = multiplyMatrices(matrix1, matrix2);
        console.log(resultMatrix2);
        console.log(multiplyMatrixes(matrix1, matrix2));

        const { result } = await task2.sendMatrixMultiplier({
            matrixA: matrixAT,
            matrixB: matrixBT
        });
        console.log(`Gas used: ${result.gas}`);
        console.log(result.matrix);
    });
});

function multiplyMatrices(matrixA: number[][], matrixB: number[][]) {
    const numRowsA = matrixA.length;
    const numColsA = matrixA[0].length;
    const numColsB = matrixB[0].length;

    const resultMatrix: number[][] = [];
    for (let i = 0; i < numRowsA; i++) {
        resultMatrix.push([0]);
        for (let j = 0; j < numColsB; j++) {
            resultMatrix[i][j] = 0;
        }
    }

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


function multiplyMatrixes(matrixA: number[][], matrixB: number[][]) {
    const numRowsA = matrixA.length;
    const numColsA = matrixA[0].length;
    const numColsB = matrixB[0].length;

    const resultMatrix: number[][] = [];
    for (let i = 0; i < numRowsA; i++) {
        let subMatrix: number[] = [];
        for (let j = 0; j < numColsB; j++) {
            let sum = 0;
            for (let k = 0; k < numColsA; k++) {
                sum += matrixA[i][k] * matrixB[k][j];
            }
            subMatrix.push(sum);
        }
        resultMatrix.push(subMatrix)
    }
    return resultMatrix;
}
