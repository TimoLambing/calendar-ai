import Moralis from 'moralis';

export async function getWalletTokenBalanceSnapshots(
    address: string,
    chain: string,
    startDate: string,
    endDate: string
): Promise<any[]> {
    if (!Moralis.Core.isStarted) {
        await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });
    }

    const allTokens: any[] = [];
    let currentDate = new Date(startDate);
    const finalDate = new Date(endDate);

    while (currentDate <= finalDate) {
        try {
            // Convert date to block number
            const blockResponse = await Moralis.EvmApi.block.getDateToBlock({
                date: currentDate.toISOString(),
                chain,
            });
            const blockNumber = blockResponse.raw.block;

            // Initialize pagination variables
            let cursor: string | undefined = undefined;

            // Paginate through the token balances if needed
            do {
                const response = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
                    address,
                    chain,
                    toBlock: blockNumber,
                    cursor, // Pass the cursor for pagination
                });

                // Extract token balances from the response
                const jsonData = response.response.result;  // Use the 'response' property directly

                const snapshots = jsonData.map((token: any) => {
                    return {
                        walletId: address,
                        timestamp: currentDate.toISOString(),
                        name: token.name,
                        symbol: token.symbol,
                        totalValue: token.usdValue,
                        balanceFormatted: token.balanceFormatted,
                        logo: token.logo,
                        thumbnail: token.thumbnail,
                    };
                });

                // Push the fetched data into the allTokens array
                allTokens.push(...snapshots);

                // Check if there's a next page (cursor)
                cursor = response.response.cursor;  // Use 'cursor' from 'response' directly
            } while (cursor); // Continue fetching until no cursor is left

        } catch (error) {
            console.error(`Failed to fetch balances for ${currentDate.toISOString()}:`, error);
        }

        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
    }
    console.log('All tokens snapshots:', allTokens);
    return allTokens;
}
