// wsola-processor.js
class WSOLAProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.speed = 1.0;

    this.port.onmessage = (event) => {
      if (event.data.type === "speed") {
        this.speed = event.data.value;
      }
    };
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (input[0]) {
      // push input PCM vào buffer
      this.buffer.push(...input[0]);
    }

    // frame size ~30ms
    const frameSize = 128; // nhỏ để realtime
    const hopIn = Math.floor(frameSize * this.speed);
    const hopOut = frameSize;

    let outBuffer = output[0];

    for (let i = 0; i < outBuffer.length; i++) {
      if (this.buffer.length >= hopIn) {
        outBuffer[i] = this.buffer.shift();
      } else {
        outBuffer[i] = 0;
      }
    }

    return true; // keep processor alive
  }
}

registerProcessor("wsola-processor", WSOLAProcessor);
