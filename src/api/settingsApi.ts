import { Block, Jackpot, Paytable } from '../slot/SlotConfig';
import { BASE_URL } from './betApi';

export class SettingsAPI {
    static async settings(): Promise<{
        language: 'ko';
        currency: 'KRW';
        bettingLimit: {
            MAX: string;
            MIN: string;
            MONEY_OPTION: number[];
        };
        config: {
            buyFeatureBetMultiplier: number;
            scatterType: number;
            scatterTriggers: number[];
            jackpots: Jackpot[];
            paytables: Paytable[];
            blocks: Block[];
        };
    }> {
        try {
            // Define the URL of your Express server endpoint
            const url = `${BASE_URL}/settings`;

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
            const data = await response.json();

            return data;
        } catch (error: any) {
            // Log the original error for debugging
            console.error('Bet API spin failed:', error);

            const message = error?.message || 'Bet normal spin failed';
            throw new Error(message);
        }
    }
}
