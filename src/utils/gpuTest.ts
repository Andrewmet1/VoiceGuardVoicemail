import * as tf from '@tensorflow/tfjs-node-gpu';

async function testGPU() {
    try {
        // Print TensorFlow.js version
        console.log('TensorFlow.js version:', tf.version.tfjs);
        
        // Check backend
        console.log('Backend:', tf.getBackend());

        // Test GPU computation with a simple matrix multiplication
        console.log('\nRunning GPU test...');
        const startTime = Date.now();

        // Create two large matrices
        const matrixSize = 2000;
        const a = tf.randomNormal([matrixSize, matrixSize]);
        const b = tf.randomNormal([matrixSize, matrixSize]);

        // Perform matrix multiplication
        const result = tf.matMul(a, b);
        
        // Force computation to complete
        await result.data();

        const endTime = Date.now();
        console.log(`Matrix multiplication (${matrixSize}x${matrixSize}) took ${endTime - startTime}ms`);

        // Check memory usage
        const memoryInfo = tf.memory();
        console.log('\nMemory status:', {
            numTensors: memoryInfo.numTensors,
            numDataBuffers: memoryInfo.numDataBuffers,
            numBytes: memoryInfo.numBytes,
            unreliable: memoryInfo.unreliable,
        });

        // Cleanup
        tf.dispose([a, b, result]);
        
        console.log('\nGPU test completed successfully! ✅');
    } catch (error) {
        console.error('Error during GPU test:', error);
        throw error;
    }
}

if (require.main === module) {
    testGPU().catch(console.error);
}
