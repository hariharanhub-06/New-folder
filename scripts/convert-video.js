
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');

console.log("Starting conversion...");
console.log("FFmpeg Path:", ffmpegPath);

if (!ffmpegPath) {
    console.error("FFmpeg binary not found!");
    process.exit(1);
}

ffmpeg.setFfmpegPath(ffmpegPath);

const inputPath = path.join(__dirname, '../public/presentation.webp');
const outputPath = path.join(__dirname, '../public/presentation.mp4');

console.log(`Input: ${inputPath}`);
console.log(`Output: ${outputPath}`);

ffmpeg(inputPath)
    .outputOptions([
        '-pix_fmt yuv420p', // Ensure compatibility with most players
        '-c:v libx264',     // Use H.264 codec
        '-crf 23',          // Good quality
        '-preset fast'
    ])
    .output(outputPath)
    .on('start', (commandLine) => {
        console.log('Spawned Ffmpeg with command: ' + commandLine);
    })
    .on('progress', (progress) => {
        console.log('Processing: ' + progress.percent + '% done');
    })
    .on('end', () => {
        console.log('Conversion finished successfully!');
        process.exit(0);
    })
    .on('error', (err) => {
        console.error('Error occurred: ' + err.message);
        process.exit(1);
    })
    .run();
