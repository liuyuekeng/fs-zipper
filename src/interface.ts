export interface MyFs {
    statSync: Function,
    readdirSync: Function,
    readFileSync: Function
}

export interface Archive {
    entry: Function,
    finalize: Function,
    on: Function,
    pipe: Function,
    unpipe: Function
}