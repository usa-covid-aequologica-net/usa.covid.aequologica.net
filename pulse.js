export default function (onStop, onResult) {
  let buffer = [];

  function isString(x) {
    return Object.prototype.toString.call(x) === "[object String]";
  }

  function console_log(text) {
    console.log(text);
    if (isString(text)) $("footer span#console").text(text);
  }

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
    sweepEnv.gain.linearRampToValueAtTime(1, audioCtx.currentTime + attackTime);
    // set our release
    sweepEnv.gain.linearRampToValueAtTime(
      0,
      audioCtx.currentTime + sweepLength - releaseTime
    );

    osc.connect(sweepEnv).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + sweepLength);
  }

  $(document).ready(function () {
    function showStart() {
      $(".pulseOutline").css({
        color: "blue",
        animation: "pulse 2s",
        "animation-timing-function": "ease-out",
        "animation-iteration-count": "infinite",
      });
      $("svg.mic-icon").css("fill", "darkred");
      $("h1").html("&hellip;");
    }

    function showStop(error) {
      $(".pulseOutline").css({
        color: "red",
        animation: "none",
      });
      $("svg.mic-icon").css("fill", "#1E2D70");
      if (error) $("h1").text(error);
    }

    var recognizing = false;

    function start() {
      buffer = [];
      recognition.start();
      showStart();
      console_log("Start ! Ready to receive a country command.");
    }

    function doStop(error) {
      if (error) console.error(error);
      recognition.stop();
    }

    // <!-- speech recognition : WORK IN PROGRESS -->
    var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
    var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
    var SpeechRecognitionEvent =
      SpeechRecognitionEvent || webkitSpeechRecognitionEvent;

    var grammar =
      "#JSGF V1.0; grammar countries;";

    var recognition = new SpeechRecognition();
    var speechRecognitionList = new SpeechGrammarList();
    speechRecognitionList.addFromString(grammar, 1);
    recognition.grammars = speechRecognitionList;
    recognition.continuous = true;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    //     recognition.lang = 'fr-FR';
    //     recognition.continuous = true;
    //     recognition.InterimResults = true;

    $("[role='button']#speechRecognition").on("click", function () {
      try {
        start();
      } catch (error) {
        console_log(error);
        doStop();
      }
    });

    recognition.onresult = function (event) {
      // The SpeechRecognitionEvent results property returns a SpeechRecognitionResultList object
      // The SpeechRecognitionResultList object contains SpeechRecognitionResult objects.
      // It has a getter so it can be accessed like an array
      // The first [0] returns the SpeechRecognitionResult at the last position.
      // Each SpeechRecognitionResult object contains SpeechRecognitionAlternative objects that contain individual results.
      // These also have getters so they can be accessed like arrays.
      // The second [0] returns the SpeechRecognitionAlternative at position 0.
      // We then return the transcript property of the SpeechRecognitionAlternative object
      $("h1").empty();
      for (var i = 0, l = event.results.length; i < l; i++) {}
      if (0 < event.results.length) {
        var i = event.results.length - 1;
        var result = event.results[i][0].transcript.trim();
        if (result.startsWith("stop")) {
          doStop();
        } else {
          buffer.push(result);
          if (onResult) onResult(result);
          // $("h1#lui").append($("<p>").text(result));
          // console_log(result);
          // console.log(
          //   result,
          //   "Confidence: " + event.results[i][0].confidence,
          //   event.results[i]
          // ); //
          playSweep();
        }
      }
    };

    recognition.onspeechend = function () {
      showStop();
      console_log("stopped");
      if (onStop) onStop(buffer);
    };

    recognition.onnomatch = function (event) {
      console_log("I didn't recognise that country.");
    };

    recognition.onerror = function (event) {
      console_log("Error occurred in recognition: " + event.error);
    };
  });
  return {};
}
