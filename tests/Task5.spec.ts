import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano, TupleItemInt, TupleReader } from 'ton-core';
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

    it.skip('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task5 are ready to use
    });

    // 0<=N<=370;   0<=N+K<=371;    0<=K<=255
    const tests = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
        [1, 2],
        [1, 3],
        [2, 1],
        [3, 1],
        [100, 0],
        [0, 100],
        [100, 100],
        [201, 4],
        [370, 255]
    ];

    for (let value of tests) {
        let n = value[0];
        let k = value[1];
        it(`main: should calculate with: ${n} : ${k}`, async () => {
            const testResult = jsFibonacci(n, k);

            // console.log(`JS result: ${testResult.length}`);
            let result = await task5.sendCalcFibonacciSequence({
                N: BigInt(n),
                K: BigInt(k)
            });
            console.log(`Gas used: ${result.result.gas}`);
            let arr = toJsArray(result.result.sequence);
            expect(arr).toEqual(testResult);
        });
    }

    // tests.forEach(async value => {
    //     let n = value[0], k = value[1];
    //     it(`should calc fibonacci no tuple with : ${n} : ${k}`, () => {
    //         let testA = jsFibonacci(n, k);
    //         let actual = jsFibonacciNoTuple(n, k);
    //         expect(actual).toEqual(testA);
    //     });
    // });

    function jsFibonacci(n: number, k: number) : bigint[] {
        let fibonacciSeq: bigint[] = [0n, 1n];
        for (let i = 2; i < n + k; i++) {
            let nextTerm = fibonacciSeq[i - 1] + fibonacciSeq[i - 2];
            fibonacciSeq.push(nextTerm);
        }
        return fibonacciSeq.slice(n, n+k);
    }

    function toJsArray(tuple: TupleReader) : bigint[] {
        let arr = [];
        while (tuple.remaining != 0) {
            const v = tuple.pop() as TupleItemInt;
            arr.push(v.value);
        }
        return arr;
    }

    function jsFibonacciNoTuple(n: number, k: number) {
        if (k === 0) {
            return [];
        }
        let preLast = 0n, last = 1n;
        let result: bigint[] = [];
        const sum = n + k;
        if (n == 0) {
            result.push(preLast);
            if (k > n) {
                if (k != 1) {
                    result.push(last);
                }
            }
        }
        if (n == 1) {
            result.push(last);
        }
        let i = 2;
        while (i < sum) {
            let nextTerm = last + preLast;
            if (i >= n) {
                result.push(nextTerm);
            }
            preLast = last;
            last = nextTerm;
            i += 1;
        }
        return result;
    }

    function jsFibonacciLimit(n: number, k: number) {

        const sum = k + n;
        let buffer: bigint[] = [];
        // if (sum > 255) {
        //     buffer = [];
        // }

        const shift = 255;
        let fibonacciSeq = [0n, 1n];
        let i = 2;
        while (i < sum) {
            let nextTerm: bigint = 0n;
            if (i < 256) {
                nextTerm = fibonacciSeq[i - 1] + fibonacciSeq[i - 2];
            }
            if (i == 257) {
                nextTerm = buffer[257 - 1 - 255] + fibonacciSeq[257 - 2];
            }


            if (fibonacciSeq.length < 256) {
                fibonacciSeq.push(nextTerm);
                console.log(fibonacciSeq.length);
            } else {
                buffer.push(nextTerm);
                console.log(buffer.length);
            }
            i += 1;
        }
    }
});
