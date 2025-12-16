export const BASE_URL = 'http://192.168.68.123:3000';

export class BetAPI {
    /**
     * Calls the backend API to perform a spin operation.
     * @param type - The type of spin ('n' for new, 'r' for refill, 'f' for free).
     * @returns {Promise<{reels: number[][]}>} A promise that resolves with the reels data.
     */
    static async spin({
        game,
        bet,
        feature,
    }: {
        game: string;
        bet: number;
        feature?: number;
    }): Promise<{ reels: number[][]; freeSpins?: number }> {
        try {
            // Define the URL of your Express server endpoint
            const url = `${BASE_URL}/spin`;

            // Make a POST request to the Express server
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // You might add an authorization header here if needed:
                    // 'Authorization': 'Bearer your_token_here',
                },
                body: JSON.stringify({
                    game,
                    bet,
                    feature,
                }),
            });

            // Check if the network request was successful
            if (!response.ok) {
                // If the server responded with an error status (e.g., 404, 500)
                const errorData = await response.json();
                throw new Error(errorData.message || 'Server error occurred during spin');
            }

            // Parse the JSON response body
            const data: { reels: number[][] } = await response.json();

            return data;
        } catch (error: any) {
            // Log the original error for debugging
            console.error('Bet API spin failed:', error);

            const message = error?.message || 'Bet normal spin failed';
            throw new Error(message);
        }
    }

    /** Collect win */
    static async collect() {
        try {
            // Define the URL of your Express server endpoint
            const url = `${BASE_URL}/collect`;

            // Make a POST request to the Express server
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // You might add an authorization header here if needed:
                    // 'Authorization': 'Bearer your_token_here',
                },
            });

            // Check if the network request was successful
            if (!response.ok) {
                // If the server responded with an error status (e.g., 404, 500)
                const errorData = await response.json();
                throw new Error(errorData.message || 'Server error occurred during spin');
            }

            // Parse the JSON response body
            const data: { balance: number } = await response.json();

            return data;
        } catch (error: any) {
            // Log the original error for debugging
            console.error('Bet API collect failed:', error);

            const message = error?.message || 'Collect failed';
            throw new Error(message);
        }
    }
}
