import gsap from 'gsap';
import CustomEase from 'gsap/CustomEase';
import { randomRange } from './random';

gsap.registerPlugin(CustomEase);

/** Unique identifiers for custom eases */
let customEaseUID = 1;

/**
 * Register a custom ease curve, wrapped this way basically to prevent override accross different files
 * @param curve The string representing the curve
 * @param name Optional name for the tween, otherwise it will create an unique id
 * @returns The ease function to be used in tweens
 */
export function registerCustomEase(curve: string, name?: string) {
    if (!name) name = 'customEase' + customEaseUID++;
    if (CustomEase.get(name)) throw new Error('Custom ease already registered: ' + name);
    return CustomEase.create(name, curve);
}

/**
 * Safely kill tweens without breaking their promises. It seems that in gsap,
 * if you kill a tween, its promises hangs forever, without either resolve or reject
 * @param targets The tween targets that must have related tweens killed
 */
export async function resolveAndKillTweens(targets: gsap.TweenTarget) {
    const tweens = gsap.getTweensOf(targets);
    for (const tween of tweens) {
        // Force resolve tween promise, if exists
        if ((tween as any)['_prom']) (tween as any)['_prom']();
    }
    gsap.killTweensOf(targets);
}

/**
 * Pause all tweens of a target
 * @param targets Targets with tweens that should be paused
 */
export function pauseTweens(targets: gsap.TweenTarget) {
    const tweens = gsap.getTweensOf(targets);
    for (const tween of tweens) tween.pause();
}

/**
 * Resume all tweens of a target
 * @param targets Targets with tweens that should be resumed
 */
export function resumeTweens(targets: gsap.TweenTarget) {
    const tweens = gsap.getTweensOf(targets);
    for (const tween of tweens) tween.resume();
}

/**
 * Reusable shake animation, usually for shokwave/earthquake effects
 * @param target The objact to 'shake' its x and y
 * @param power How strong/far is the random shake
 * @param duration For how long it will be shaking
 */
export async function earthquake(target: { x: number; y: number }, power = 8, duration = 0.5) {
    const shake = { power };
    await gsap.to(shake, {
        power: 0,
        duration,
        ease: 'linear',
        onUpdate: () => {
            if (!target) return;
            target.x = randomRange(-shake.power, shake.power);
            target.y = randomRange(-shake.power, shake.power);
        },
    });
}

/**
 * Cubic interpolation utility based on https://github.com/osuushi/Smooth.js
 * Used for creating smooth curves from discrete points
 */

/**
 * Clips the input index to valid array bounds
 * @param k - Index to clip
 * @param arr - Array to check bounds against
 * @returns Clamped index value
 */
function clipInput(k: number, arr: number[]): number {
    if (k < 0) k = 0;
    if (k > arr.length - 1) k = arr.length - 1;
    return arr[k];
}

/**
 * Calculates the tangent at a given point for smooth interpolation
 * @param k - Index in the array
 * @param factor - Tangent factor (affects curve smoothness)
 * @param array - Array of values
 * @returns Tangent value
 */
function getTangent(k: number, factor: number, array: number[]): number {
    return (factor * (clipInput(k + 1, array) - clipInput(k - 1, array))) / 2;
}

/**
 * Performs cubic interpolation on an array of values
 * @param array - Array of values to interpolate
 * @param t - Position to interpolate (can be fractional)
 * @param tangentFactor - Factor affecting curve smoothness (default: 1)
 * @returns Interpolated value at position t
 *
 * @example
 * const values = [0, 10, 20, 30];
 * const smoothValue = cubicInterpolation(values, 1.5); // Gets value between index 1 and 2
 */
export function cubicInterpolation(array: number[], t: number, tangentFactor: number = 1): number {
    const k = Math.floor(t);
    const m = [getTangent(k, tangentFactor, array), getTangent(k + 1, tangentFactor, array)];
    const p = [clipInput(k, array), clipInput(k + 1, array)];

    t -= k;
    const t2 = t * t;
    const t3 = t * t2;

    return (2 * t3 - 3 * t2 + 1) * p[0] + (t3 - 2 * t2 + t) * m[0] + (-2 * t3 + 3 * t2) * p[1] + (t3 - t2) * m[1];
}
