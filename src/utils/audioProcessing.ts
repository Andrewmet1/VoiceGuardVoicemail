import * as tf from '@tensorflow/tfjs';
// Enable GPU memory growth
tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
tf.env().set('WEBGL_VERSION', 2);
tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);

export interface AudioFeatures {
  lfcc: number[][];          // Linear Frequency Cepstral Coefficients
}

export class AudioProcessor {
  private readonly sampleRate: number = 16000;
  private readonly frameLength: number = 400; // 25ms at 16kHz
  private readonly frameStep: number = 160;   // 10ms at 16kHz
  private readonly fftSize: number = 512;     // Standard for LFCC
  private readonly numCoeffs: number = 20;    // Number of LFCC coefficients
  private batchSize: number = 32;             // Process multiple frames at once

  constructor() {
    // Try to use GPU if available
    if (tf.getBackend() !== 'webgl') {
      console.log('Attempting to set WebGL backend...');
      tf.setBackend('webgl').catch(console.error);
    }
  }

  public async extractFeatures(audioData: Float32Array): Promise<number[][]> {
    const signalTensor = tf.tensor1d(audioData);
    
    // Frame the signal
    const frames = this.frame(signalTensor);
    
    // Process frames in batches
    const numFrames = frames.shape[0];
    const lfccFeatures: tf.Tensor2D[] = [];
    
    for (let i = 0; i < numFrames; i += this.batchSize) {
      const batchSize = Math.min(this.batchSize, numFrames - i);
      const batch = frames.slice([i, 0], [batchSize, -1]);
      const batchLFCC = await this.computeLFCC(batch);
      lfccFeatures.push(batchLFCC);
      tf.dispose(batch);
    }
    
    // Concatenate all batches
    const lfcc = tf.concat(lfccFeatures, 0);
    const lfccArray = await lfcc.array() as number[][];
    
    // Cleanup
    signalTensor.dispose();
    frames.dispose();
    lfcc.dispose();
    lfccFeatures.forEach(t => t.dispose());
    
    return lfccArray;
  }

  private frame(signal: tf.Tensor1D): tf.Tensor2D {
    return tf.tidy(() => {
      const frames = [];
      let start = 0;
      
      while (start < signal.shape[0]) {
        let end = Math.min(start + this.frameLength, signal.shape[0]);
        let frame: tf.Tensor1D;
        
        if (end - start < this.frameLength) {
          // Pad the last frame if it's too short
          const currentFrame = signal.slice([start], [end - start]);
          const padding: Array<[number, number]> = [[0, this.frameLength - (end - start)]];
          frame = tf.pad(currentFrame, padding);
        } else {
          frame = signal.slice([start], [this.frameLength]);
        }
        
        frames.push(frame);
        start += this.frameStep;
      }
      
      return tf.stack(frames) as tf.Tensor2D;
    });
  }

  private async computeLFCC(frames: tf.Tensor2D): Promise<tf.Tensor2D> {
    return tf.tidy(() => {
      // Apply window function
      const hammingWindow = tf.signal.hammingWindow(this.frameLength);
      const windowedFrames = frames.mul(hammingWindow);
      
      // Compute power spectrum using GPU-optimized operations
      const fft = tf.spectral.rfft(windowedFrames);
      const powerSpectrum = fft.abs().square().div(this.fftSize);
      
      // Take log of the power spectrum
      const logPowerSpectrum = powerSpectrum.add(1e-6).log();
      
      // Apply DCT to get cepstral coefficients
      const dct = this.dct(logPowerSpectrum.reshape([logPowerSpectrum.shape[0], -1]) as tf.Tensor2D);
      
      // Keep only the first numCoeffs coefficients
      return dct.slice([0, 0], [-1, this.numCoeffs]) as tf.Tensor2D;
    });
  }

  private dct(x: tf.Tensor2D): tf.Tensor2D {
    return tf.tidy(() => {
      const numFrames = x.shape[0];
      const numBins = x.shape[1];
      
      // Create DCT matrix once and cache it
      const k = tf.range(0, numBins).expandDims(0);
      const n = tf.range(0, numBins).expandDims(1);
      
      // Optimize DCT computation for GPU
      const dctMatrix = tf.cos(
        k.mul(tf.scalar(2)).mul(n.add(tf.scalar(1))).mul(tf.scalar(Math.PI / (2 * numBins)))
      ).reshape([numBins, numBins]) as tf.Tensor2D;
      
      // Use batched matrix multiplication
      return tf.matMul(x, dctMatrix);
    }) as tf.Tensor2D;
  }
}
