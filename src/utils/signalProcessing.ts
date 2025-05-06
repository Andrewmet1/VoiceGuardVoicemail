/**
 * Signal processing utilities for audio analysis
 */

/**
 * Fast Fourier Transform (FFT) implementation
 * @param signal - Input signal (time domain)
 * @returns FFT result (frequency domain)
 */
export function FFT(signal: Float32Array): Float32Array {
  const n = signal.length;
  
  // Ensure n is a power of 2
  if ((n & (n - 1)) !== 0) {
    throw new Error('FFT length must be a power of 2');
  }
  
  // Base case
  if (n === 1) {
    return new Float32Array(signal);
  }
  
  // Split signal into even and odd indices
  const even = new Float32Array(n / 2);
  const odd = new Float32Array(n / 2);
  
  for (let i = 0; i < n / 2; i++) {
    even[i] = signal[i * 2];
    odd[i] = signal[i * 2 + 1];
  }
  
  // Recursive FFT on even and odd parts
  const evenFFT = FFT(even);
  const oddFFT = FFT(odd);
  
  // Combine results
  const result = new Float32Array(n * 2); // Complex output (real, imag pairs)
  
  for (let k = 0; k < n / 2; k++) {
    // twiddle factor
    const theta = -2 * Math.PI * k / n;
    const re = Math.cos(theta);
    const im = Math.sin(theta);
    
    // oddFFT[k] * exp(-2πi * k / n)
    const oddRe = oddFFT[k * 2];
    const oddIm = oddFFT[k * 2 + 1];
    
    const tRe = oddRe * re - oddIm * im;
    const tIm = oddRe * im + oddIm * re;
    
    // evenFFT[k] + twiddle * oddFFT[k]
    result[k * 2] = evenFFT[k * 2] + tRe;
    result[k * 2 + 1] = evenFFT[k * 2 + 1] + tIm;
    
    // evenFFT[k] - twiddle * oddFFT[k]
    result[(k + n / 2) * 2] = evenFFT[k * 2] - tRe;
    result[(k + n / 2) * 2 + 1] = evenFFT[k * 2 + 1] - tIm;
  }
  
  return result;
}

/**
 * Calculate the power spectrum of a signal
 * @param signal - Input signal (time domain)
 * @returns Power spectrum
 */
export function powerSpectrum(signal: Float32Array): Float32Array {
  const fft = FFT(signal);
  const n = signal.length;
  const power = new Float32Array(n / 2 + 1);
  
  // DC component
  power[0] = fft[0] * fft[0] + fft[1] * fft[1];
  
  // Other components
  for (let i = 1; i < n / 2; i++) {
    power[i] = fft[i * 2] * fft[i * 2] + fft[i * 2 + 1] * fft[i * 2 + 1];
  }
  
  // Nyquist frequency
  power[n / 2] = fft[1] * fft[1];
  
  return power;
}

/**
 * Apply a pre-emphasis filter to a signal
 * @param signal - Input signal
 * @param alpha - Pre-emphasis coefficient (typically 0.95-0.97)
 * @returns Filtered signal
 */
export function preEmphasis(signal: Float32Array, alpha: number = 0.97): Float32Array {
  const result = new Float32Array(signal.length);
  
  result[0] = signal[0];
  for (let i = 1; i < signal.length; i++) {
    result[i] = signal[i] - alpha * signal[i - 1];
  }
  
  return result;
}

/**
 * Calculate the energy of a signal
 * @param signal - Input signal
 * @returns Signal energy
 */
export function signalEnergy(signal: Float32Array): number {
  let energy = 0;
  
  for (let i = 0; i < signal.length; i++) {
    energy += signal[i] * signal[i];
  }
  
  return energy / signal.length;
}

/**
 * Calculate the zero-crossing rate of a signal
 * @param signal - Input signal
 * @returns Zero-crossing rate
 */
export function zeroCrossingRate(signal: Float32Array): number {
  let crossings = 0;
  
  for (let i = 1; i < signal.length; i++) {
    if ((signal[i] >= 0 && signal[i - 1] < 0) || 
        (signal[i] < 0 && signal[i - 1] >= 0)) {
      crossings++;
    }
  }
  
  return crossings / (signal.length - 1);
}

/**
 * Apply a low-pass filter to a signal
 * @param signal - Input signal
 * @param cutoffFreq - Cutoff frequency (normalized to [0, 0.5])
 * @returns Filtered signal
 */
export function lowPassFilter(signal: Float32Array, cutoffFreq: number): Float32Array {
  const n = signal.length;
  const fft = FFT(signal);
  
  // Apply filter in frequency domain
  for (let i = 0; i < n; i++) {
    const freq = i / n;
    
    // If frequency is above cutoff, attenuate
    if (freq > cutoffFreq && freq < 1 - cutoffFreq) {
      fft[i * 2] = 0;
      fft[i * 2 + 1] = 0;
    }
  }
  
  // Inverse FFT (use the same FFT function with a sign change)
  // This is a simplified approach; a proper IFFT would be more complex
  const result = FFT(fft);
  
  // Scale and return real part
  const filtered = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    filtered[i] = result[i * 2] / n;
  }
  
  return filtered;
}

/**
 * Apply a high-pass filter to a signal
 * @param signal - Input signal
 * @param cutoffFreq - Cutoff frequency (normalized to [0, 0.5])
 * @returns Filtered signal
 */
export function highPassFilter(signal: Float32Array, cutoffFreq: number): Float32Array {
  const n = signal.length;
  const fft = FFT(signal);
  
  // Apply filter in frequency domain
  for (let i = 0; i < n; i++) {
    const freq = i / n;
    
    // If frequency is below cutoff, attenuate
    if (freq < cutoffFreq || freq > 1 - cutoffFreq) {
      fft[i * 2] = 0;
      fft[i * 2 + 1] = 0;
    }
  }
  
  // Inverse FFT (simplified approach)
  const result = FFT(fft);
  
  // Scale and return real part
  const filtered = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    filtered[i] = result[i * 2] / n;
  }
  
  return filtered;
}

/**
 * Calculate the spectral centroid of a signal
 * @param signal - Input signal
 * @param sampleRate - Sample rate in Hz
 * @returns Spectral centroid in Hz
 */
export function spectralCentroid(signal: Float32Array, sampleRate: number): number {
  const power = powerSpectrum(signal);
  let weightedSum = 0;
  let totalPower = 0;
  
  for (let i = 0; i < power.length; i++) {
    const frequency = i * sampleRate / (2 * power.length);
    weightedSum += frequency * power[i];
    totalPower += power[i];
  }
  
  return totalPower > 0 ? weightedSum / totalPower : 0;
}

/**
 * Calculate the spectral flatness of a signal
 * @param signal - Input signal
 * @returns Spectral flatness (0-1, where 1 is flat/noisy)
 */
export function spectralFlatness(signal: Float32Array): number {
  const power = powerSpectrum(signal);
  let geometricMean = 0;
  let arithmeticMean = 0;
  
  // Avoid log(0) by adding a small value
  for (let i = 0; i < power.length; i++) {
    power[i] = Math.max(power[i], 1e-10);
  }
  
  // Calculate geometric mean
  for (let i = 0; i < power.length; i++) {
    geometricMean += Math.log(power[i]);
  }
  geometricMean = Math.exp(geometricMean / power.length);
  
  // Calculate arithmetic mean
  for (let i = 0; i < power.length; i++) {
    arithmeticMean += power[i];
  }
  arithmeticMean /= power.length;
  
  return arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
}
