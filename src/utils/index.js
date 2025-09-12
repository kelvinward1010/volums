async function init() {
  const audioCtx = new AudioContext();
  await audioCtx.audioWorklet.addModule("wsola-processor.js");

  // Nguồn audio (mic hoặc file)
  const response = await fetch("audio.mp3");
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;

  // Node xử lý WSOLA
  const wsolaNode = new AudioWorkletNode(audioCtx, "wsola-processor");

  // Kết nối pipeline
  source.connect(wsolaNode).connect(audioCtx.destination);

  source.start();

  // Thay đổi tốc độ
  document.getElementById("speed").addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    wsolaNode.port.postMessage({ type: "speed", value: val });
  });
}

init();
