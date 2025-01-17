// import Meyda from 'meyda'
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
    const suite = new Benchmark.Suite('BEATS_ZAPATA');

    // add tests
    suite.add('Essentia#BEATS_ZAPATA', () => {
        const audioData = essentia.arrayToVector(leftChannelData);
        const rhythm = essentia.RhythmExtractor2013(audioData);
        audioData.delete();
        rhythm.ticks.delete();
        rhythm.estimates.delete();
        rhythm.bpmIntervals.delete();
    }, options)
    // add listeners
    .on('cycle', function(event) {
        console.log(String(event.target));
    })
    
    .on('complete', function() {
        // console.log(this);
        // console.log('Fastest is ' + this.filter('fastest').map('name'));

        const resultsObj = {
            "essentia": {
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
            }
        }
        var json = JSON.stringify(resultsObj);
        fs.writeFile('beats_zapata.json', json, 'utf8', function (err) {
            if (err) {
                console.log("An error occured while writing Beats Zapata Extractor JSON Object to File.");
                return console.log(err);
            }

            console.log("Beats Zapata Extractor JSON file has been saved.");
        });
    })
    // run async
    .run({ 'async': true });       
  });