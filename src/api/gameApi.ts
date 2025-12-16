import axios from 'axios';
import { Block, Jackpot, Paytable } from '../slot/SlotConfig';
import axiosInstance from './config/axios';

export class GameAPI {
    static async getSettings() {
        try {
            // Make a GET request to the Express server
            const response = await axiosInstance.get<{
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
            }>('/game/settings');

            return response.data;
        } catch (error: any) {
            // Log the original error for debugging
            console.error('Settings API failed:', error);

            // Handle axios errors
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.message || error.message || 'Settings fetch failed';
                throw new Error(message);
            }

            const message = error?.message || 'Settings fetch failed';
            throw new Error(message);
        }
    }

    /**
     * Calls the backend API to perform a spin operation.
     * @param type - The type of spin ('n' for new, 'r' for refill, 'f' for free).
     * @returns {Promise<{reels: number[][]}>} A promise that resolves with the reels data.
     */
    static async spin({ game, bet, feature }: { game: string; bet: number; feature?: number }) {
        try {
            const response = await axiosInstance.post<{ reels: number[][]; freeSpins?: number }>('/spin', {
                game,
                bet,
                feature,
            });
            return response.data;
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
            // Make a GET request to the Express server
            const response = await axiosInstance.get<{ balance: number }>('/game/collect');

            return response.data;
        } catch (error: any) {
            // Log the original error for debugging
            console.error('Bet API collect failed:', error);

            // Handle axios errors
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.message || error.message || 'Collect failed';
                throw new Error(message);
            }

            const message = error?.message || 'Collect failed';
            throw new Error(message);
        }
    }
}
