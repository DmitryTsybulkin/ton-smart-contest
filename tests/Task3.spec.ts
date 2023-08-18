import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { beginCell, BitBuilder, BitString, Cell, Slice, toNano, TupleBuilder, TupleReader } from 'ton-core';
import { Task3 } from '../wrappers/Task3';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

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
        getFlagLength(parseInt('00100000', 2));
    });

    it('should check binary shift', async () => {

        const value: bigint = 0b0010000001100101011011100111010001101001011100100110010100100000n;
        const flag: bigint = 0b00100000n;
        const text: string = 'Hello, World!';

        let cell = beginCell();
        for (let i = 0; i < text.length; i++) {
            cell = cell.storeUint(text.charCodeAt(i), 8);
        }

        // const { result } = await task3.sendFindAndReplace({
        //     flag: BigInt(parseInt(flag, 2)),
        //     value: BigInt(parseInt(value, 2)),
        //     list: cell.endCell()
        // });
        // console.log(`Gas used: ${result.gas}`);

        const result = findAndReplace(flag, value, cell.endCell());

        const actual: string = cellToString('', result);
        const expected: string = 'Hello, entire World!';
        expect(actual).toEqual(expected);
    });

});

function processBits(slice: Slice, bits: bigint | null, result: TupleBuilder, flag: bigint, value: bigint): TupleBuilder {
    while (slice.remainingBits) {
        let bit: number = slice.loadUint(1);
        if (bits === null) {
            bits = BigInt(bit);
        }

        // bits must be the same length as flag

        if (bits < flag) {

        }

        if (bits === flag) {
            result.writeNumber(value);
        } else {
            result.writeNumber(/* first bit */);
            bits = bits << 1n;
        }
    }

    if (slice.remainingRefs) {
        return processBits(slice.loadRef().beginParse(), bits, result, flag, value);
    }
    return result;
}

function findAndReplace(flag: bigint, value: bigint, linkedList: Cell): Cell {
    const result: TupleBuilder = processBits(linkedList.beginParse(), null, new TupleBuilder(), flag, value);
    return beginCell().endCell();
}

// get K index bit of X from the end
function getKthBit(x: bigint, k: bigint) {
    return (1n << k) | x;
}

// set K index bit of X from the end to 1
function setKthBit(x: bigint, k: bigint){
   return (1n << k) | x;
}

// set K index bit of X from the end to 0
function unsetKthBit(x: bigint, k: bigint){
    return (x & ~(1n << k));
}

function getFlagLength(flag: number) {
    const binaryString = flag.toString(2); // Convert to binary string
    const bitsArray = binaryString.split('').map(Number); // Convert each character to number

    // const bitBuilder = new BitBuilder(Number(flag));
    // console.log(bitBuilder.build().length);
    console.log(binaryString);
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