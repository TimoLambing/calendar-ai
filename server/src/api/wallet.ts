
export const getEtherWalletTransactions = async (walletAddress: string) => {
    try {
        const url = new URL('https://api.etherscan.io/v2/api');

        url.searchParams.append('chainid', '1');
        url.searchParams.append('module', 'account');
        url.searchParams.append('action', 'txlist'); // might need to make it a dynamic function to get balance or txlist
        url.searchParams.append('address', walletAddress);
        url.searchParams.append('tag', 'latest');
        url.searchParams.append('apikey', process.env.ETHERSCAN_API_KEY!);

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        return data;

    } catch (error) {
        console.log(error);
        return null;
    }
};

export const getMoralisTransactions = async (walletAddress: string) => {
    try {
        const url = new URL(`https://deep-index.moralis.io/api/v2.2/wallets/${walletAddress}/history`);

        url.searchParams.append('chain', 'eth');
        // url.searchParams.append('order', 'DESC');
        const requestOptions: RequestInit = {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'X-API-Key': process.env.MORALIS_API_KEY!,
            },
        };

        const response = await fetch(url.toString(), requestOptions);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Returns first 100 pages, needs paging logic to get more.
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        return null;
    }
};