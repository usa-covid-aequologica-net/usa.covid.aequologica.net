{
    var audioCtx = new (window.AudioContext ||
      window.webkitAudioContext ||
      window.audioContext)();

    //All arguments are optional:

    //duration of the tone in milliseconds. Default is 500
    //frequency of the tone in hertz. default is 440
    //volume of the tone. Default is 1, off is 0.
    //type of tone. Possible values are sine, square, sawtooth, triangle, and custom. Default is sine.
    //callback to use on end of tone
    function beep(duration, frequency, volume, type, callback) {
      var oscillator = audioCtx.createOscillator();
      var gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (volume) {
        gainNode.gain.value = volume;
      }
      if (frequency) {
        oscillator.frequency.value = frequency;
      }
      if (type) {
        oscillator.type = type;
      }
      if (callback) {
        oscillator.onended = callback;
      }

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + (duration || 500) / 1000);
    }

    let sweepLength = 0.1;
    let attackTime = 0.01;
    let releaseTime = 0.01;
    let wave = audioCtx.createPeriodicWave(wavetable.real, wavetable.imag);
    function playSweep() {
      let osc = audioCtx.createOscillator();
      osc.setPeriodicWave(wave);
      osc.frequency.value = 440;

      let sweepEnv = audioCtx.createGain();
      sweepEnv.gain.cancelScheduledValues(audioCtx.currentTime);
      sweepEnv.gain.setValueAtTime(0, audioCtx.currentTime);
      // set our attack
      sweepEnv.gain.linearRampToValueAtTime(
        1,
        audioCtx.currentTime + attackTime
      );
      // set our release
      sweepEnv.gain.linearRampToValueAtTime(
        0,
        audioCtx.currentTime + sweepLength - releaseTime
      );

      osc.connect(sweepEnv).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + sweepLength);
    }
  }