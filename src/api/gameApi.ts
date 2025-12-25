import axios from 'axios';
import { Block, Jackpot, Paytable } from '../slot/SlotConfig';
import axiosInstance from './config/axios';

export class GameAPI {
    static async checkResume({ gamecode }: { gamecode: string }) {
        try {
            // Make a GET request to the Express server
            const response = await axiosInstance.get<{
                reels: number[][];
                resumeType: number;
                freeSpins?: number;
                bonus: number[];
                benefitMoney: number;
                bettingMoney: number;
            }>(`/game/check-resume?gamecode=${gamecode}`);
            return response.data;
        } catch (error: any) {
            // Handle axios errors
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.message || error.message || 'Resume fetch failed';
                throw new Error(message);
            }

            const message = error?.message || 'Resume fetch failed';
            throw new Error(message);
        }
    }

    static async getSettings({ gamecode }: { gamecode: string }) {
        try {
            // Make a GET request to the Express server
            const response = await axiosInstance.get<{
                language: string;
                currency: string;
                bettingLimit: {
                    MAX: string;
                    MIN: string;
                    MONEY_OPTION: number[];
                };
                settings: {
                    buyFeatureBetMultiplier: number;
                    scatterType: number;
                    scatterTriggers: number[];
                    scatterFreeSpins: number[];
                    extraScatterTriggers: number[];
                    extraScatterFreeSpins: number[];
                    jackpots: Jackpot[];
                    paytables: Paytable[];
                    blocks: Block[];
                };
            }>(`/game/settings?gamecode=${gamecode}`);

            return response.data;
        } catch (error: any) {
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
    static async spin({
        gamecode,
        bet,
        index,
        feature,
    }: {
        gamecode: string;
        bet: number;
        index: number;
        feature?: number;
    }) {
        try {
            const response = await axiosInstance.post<{ reels: number[][]; freeSpins?: number }>('/game/spin', {
                gamecode,
                bet,
                index,
                feature,
            });
            return response.data;
        } catch (error: any) {
            const message = error?.message || 'Bet normal spin failed';
            throw new Error(message);
        }
    }

    /** Collect win */
    static async collect({ gamecode }: { gamecode: string }) {
        try {
            // Make a GET request to the Express server
            const response = await axiosInstance.get<{ balance: number; index: number }>(
                `/game/collect?gamecode=${gamecode}`,
            );

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
