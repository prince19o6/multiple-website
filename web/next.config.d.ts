export let outputFileTracingRoot: any;
export namespace images {
    let remotePatterns: ({
        protocol: string;
        hostname: string;
        pathname: string;
        port?: undefined;
    } | {
        protocol: string;
        hostname: string;
        port: string;
        pathname: string;
    })[];
}
