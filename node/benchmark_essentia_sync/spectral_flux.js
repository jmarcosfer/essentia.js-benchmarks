import Meyda from 'meyda'
import fs from 'fs'
import path from 'path';
import Benchmark from 'benchmark'

import Essentia from '../../dist/essentia/essentia.js-core.es.js';
// import essentia-wasm backend
import { EssentiaWASM } from '../../dist/essentia/essentia-wasm.module.js';
import wav from "node-wav";

let essentia = new Essentia(EssentiaWASM);
const __dirname = path.resolve();

const FRAME_SIZE = 2048;
const HOP_SIZE = 1024;
const audioFilePath = path.join(__dirname, '..', '..','audio', 'mozart_c_major_30sec.wav');
var options = {};
if (process.argv[2] !== undefined){
    options = {
        minSamples: process.argv[2],
        initCount: 1,
        minTime: -Infinity,
        maxTime: -Infinity,
    };
}

fs.readFile(audioFilePath, (err, data) => {
    if (err) throw err;
    let audioBuffer = data;
    let result = wav.decode(audioBuffer);
    const leftChannelData = result.channelData[0];
    const suite = new Benchmark.Suite('SpectralFlux');

    // add tests
    suite.add('Meyda#SpectralFlux', () => {
        for (let i = 0; i < leftChannelData.length/HOP_SIZE; i++) {
            Meyda.bufferSize = FRAME_SIZE;
            let frame = new Float32Array();
            frame = leftChannelData.slice(HOP_SIZE*i, HOP_SIZE*i + FRAME_SIZE);
            if(frame.length !== FRAME_SIZE){
                let bufferFrame = Buffer.from(frame);
                frame = new Float32Array(Buffer.concat([bufferFrame], FRAME_SIZE));

            }
            Meyda.extract(['spectralFlux'], frame);
        }
    }, options)
        .add('Essentia#SpectralFlux', () => {
            const frames = essentia.FrameGenerator(leftChannelData, FRAME_SIZE, HOP_SIZE);
            for (let i = 0; i < frames.size(); i++){
                let frameWindowed = essentia.Windowing(frames.get(i), true, FRAME_SIZE).frame;
                const spectrum = essentia.Spectrum(frameWindowed).spectrum;
                essentia.Flux(spectrum);
                frameWindowed.delete();
                spectrum.delete();
            }
            frames.delete();
        }, options)
        // add listeners
        .on('cycle', function(event) {
            console.log(String(event.target));
        })

        .on('complete', function() {
            //console.log(this);
            console.log('Fastest is ' + this.filter('fastest').map('name'));

            const resultsObj = {
                "meyda": {
                    "mean": this[0].stats.mean,
                    "moe": this[0].stats.moe,
                    "rme": this[0].stats.rme,
                    "sem": this[0].stats.sem,
                    "deviation": this[0].stats.deviation,
                    "variance": this[0].stats.variance,
                    "execution times": this[0].stats.sample,
                    "cycle": this[0].times.cycle,
                    "elapsed": this[0].times.elapsed,
                    "period": this[0].times.period,
                    "timeStamp": this[0].times.timeStamp,
                    "count": this[0].count,
                    "cycles": this[0].cycles,
                    "hz": this[0].hz
                },
                "essentia": {
                    "mean": this[1].stats.mean,
                    "moe": this[1].stats.moe,
                    "rme": this[1].stats.rme,
                    "sem": this[1].stats.sem,
                    "deviation": this[1].stats.deviation,
                    "variance": this[1].stats.variance,
                    "execution times": this[1].stats.sample,
                    "cycle": this[1].times.cycle,
                    "elapsed": this[1].times.elapsed,
                    "period": this[1].times.period,
                    "timeStamp": this[1].times.timeStamp,
                    "count": this[1].count,
                    "cycles": this[1].cycles,
                    "hz": this[1].hz
                }
            }

            var json = JSON.stringify(resultsObj);
            fs.writeFile('spectral_flux.json', json, 'utf8', function (err) {
                if (err) {
                    console.log("An error occured while writing Spectral Flux JSON Object to File.");
                    return console.log(err);
                }

                console.log("Spectral Flux JSON file has been saved.");
            });
        })
        // run async
        .run({ 'async': true });
});