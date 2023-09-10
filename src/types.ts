export interface Alias {
    [k: string]: string
}

export type Extensions = string[]

export interface Imports {
    [k: string]: string
}

interface ExportObj {
    [k: string]: string | null | ExportObj
}
export interface Exports {
    [k: string]: ExportObj
}

export interface PackageJSON {
    dependencies?: {
        [packageName: string]: string
    };
    exports?: Exports;
    module?: string;
    main: string;
}

