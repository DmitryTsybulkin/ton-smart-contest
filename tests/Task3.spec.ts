import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { beginCell, BitBuilder, BitString, Builder, Cell, Slice, toNano, TupleBuilder, TupleReader } from 'ton-core';
import { Task3 } from '../wrappers/Task3';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import assert from 'assert';

describe('Task3', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Task3');
    });

    let blockchain: Blockchain;
    let task3: SandboxContract<Task3>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        task3 = blockchain.openContract(Task3.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await task3.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task3.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        getBitLength(parseInt('00100000', 2));
    });

    it('should check binary shift', async () => {
        const value: bigint = 0b0010000001100101011011100111010001101001011100100110010100100000n;
        const flag: bigint = 0b10100000n;
        const text: string = '01001000011001010110110001101100011011110010110000100000010101110110111101110010011011000110010000100001';

        let cell = beginCell();
        for (let i = 0; i < text.length; i++) {
            cell = cell.storeBit(text.charAt(i) === '1' ? 1 : 0);
            console.log(i);
        }

        // const { result } = await task3.sendFindAndReplace({
        //     flag: flag,
        //     value: value,
        //     list: cell.endCell()
        // });
        // console.log(`Gas used: ${result.gas}`);

        const result = findAndReplace(flag, value, cell.endCell());

        const actual: string = cellToString('', result);
        const expected: string = '0100100001100101011011000110110001101111001011000010000001100101011011100111010001101001011100100110010100100000010101110110111101110010011011000110010000100001';
        expect(actual).toEqual(expected);
    });

});

// function process_bits(slice: Slice, result: Builder, tempBits: bigint | null, flag: bigint, flagLength: number, value: bigint): Builder {
//     while (slice.remainingBits) {
//         const bit = slice.loadUint(1);
//         if (tempBits === null) {
//             tempBits = BigInt(bit);
//         }
//         if (getBitLength(tempBits) === flagLength) {
//             if (tempBits === flag) {
//                 result = result.storeStringTail(value.toString(2)); // can throw exception
//             } else {
//                 result = result.storeBit(bit);
//             }
//         } else {
//             tempBits += BigInt(bit);
//         }
//     }
//     if (slice.remainingRefs) {
//         return process_bits(slice.loadRef().beginParse(), result, tempBits, flag, flagLength, value);
//     }
//     return result;
// }

function collectBits(slice: Slice, result: bigint[]): bigint[] {
    while (slice.remainingBits) {
        const bit = slice.loadBit();
        result.push(BigInt(bit));
    }
    if (slice.remainingRefs) {
        return collectBits(slice.loadRef().beginParse(), result);
    }
    return result;
}

function findAndReplace(flag: bigint, value: bigint, linkedList: Cell): Cell {
    const flagArray: bigint[] = bitsToArray(flag);
    const valueArray: bigint[] = bitsToArray(value);
    const flagLength = flagArray.length;
    const result: bigint[] = collectBits(linkedList.beginParse(), []);

    let root: Builder = beginCell();

    let bitBuffer: bigint = 0n;
    let i = 0;
    while (i < flagLength) {
        const item = result.pop();
        if (item !== undefined) {
            bitBuffer += item;
        }
        i += 1;
    }

    while (result.length != 0) {
        console.log(result.length);
        if (bitBuffer === flag) {
            // cell can be end!!!
            valueArray.forEach(v => root.storeBit(Number(v)));
        } else {
            root.storeBit(Number(getKthBit(bitBuffer, BigInt(flagLength))));
            bitBuffer = unsetKthBit(bitBuffer, BigInt(flagLength));
            bitBuffer = BigInt(Number(bitBuffer) << 1);
            const bit = result.pop();
            if (bit !== undefined) {
                bitBuffer = bit === 1n ? setKthBit(bitBuffer, 0n) : unsetKthBit(bitBuffer, 0n);
            }
        }
        if (root.availableBits < valueArray.length) {
            root = beginCell().storeRef(root);
        }
    }

    return root.endCell();
}

// get K index bit of X from the end (отсчёт от 0!!!)
function getKthBit(x: bigint, k: bigint) {
    return (1n << k) | x;
}

// set K index bit of X from the end to 1 (отсчёт от 0!!!)
function setKthBit(x: bigint, k: bigint){
   return (1n << k) | x;
}

// set K index bit of X from the end to 0 (отсчёт от 0!!!)
function unsetKthBit(x: bigint, k: bigint){
    return (x & ~(1n << k));
}

function slice(start: number, end: number, arr: bigint[]) {
    let result = [];
    while (start < end) {
        result.push(arr[start]);
        start += 1;
    }
    return result;
}

function getBitLength(bits: bigint | number) {
    const binaryString = bits.toString(2); // Convert to binary string
    const bitsArray = binaryString.split('').map(Number); // Convert each character to number
    return bitsArray.length;
}

function bitsToArray(bits: bigint) {
    const binaryString = bits.toString(2);
    return binaryString.split('').map(BigInt);
}

function cellToString(txt: string, cell: Cell) : string {
    const slice = cell.beginParse();
    while (slice.remainingBits > 0) {
        txt += String.fromCharCode(slice.loadUint(8));
    }
    if (slice.remainingRefs > 0) {
        return cellToString(txt, slice.loadRef());
    }
    return txt;
}