import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    Tuple, TupleBuilder, TupleItem, TupleItemInt
} from 'ton-core';

export type Task2Config = {};

export function task2ConfigToCell(config: Task2Config): Cell {
    return beginCell().endCell();
}

export class Task2 implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Task2(address);
    }

    static createFromConfig(config: Task2Config, code: Cell, workchain = 0) {
        const data = task2ConfigToCell(config);
        const init = { code, data };
        return new Task2(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendMatrixMultiplier(provider: ContractProvider, opts: {
        matrixA: Tuple,
        matrixB: Tuple
    }) {
        const { stack, gasUsed } = await provider.get("matrix_multiplier", [
            opts.matrixA,
            opts.matrixB
        ]);
        return {
            matrix: stack.readTuple(),
            gas: gasUsed
        };
    }
}
