class WSOLAProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.speed = 1.0;

    this.port.onmessage = (event) => {
      const { type, value } = event.data;
      if (type === "speed") {
        this.speed = value;
      }
    };
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || input.length === 0) return true;

    // Giả sử có ít nhất 1 kênh
    const inputChannel = input[0];
    if (inputChannel) {
      this.buffer.push(...inputChannel);
    }

    const frameSize = 128;
    const hopIn = Math.floor(frameSize * this.speed);
    const outL = output[0]; // kênh trái
    const outR = output[1] || outL; // nếu có kênh phải

    for (let i = 0; i < outL.length; i++) {
      if (this.buffer.length >= hopIn) {
        const sample = this.buffer.shift() || 0;
        // ghi ra tất cả kênh
        for (let ch = 0; ch < output.length; ch++) {
          output[ch][i] = sample;
        }
      } else {
        for (let ch = 0; ch < output.length; ch++) {
          output[ch][i] = 0;
        }
      }
    }

    return true;
  }
}

registerProcessor("wsola-processor", WSOLAProcessor);
