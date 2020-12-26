export default function (countries, hooks) {
  const nullFunc = () => {};
  const onConsole = hooks ? hooks.onConsole || nullFunc : nullFunc;
  const onStart = hooks ? hooks.onStart || nullFunc : nullFunc;
  const onResult = hooks ? hooks.onResult || nullFunc : nullFunc;
  const onStop = hooks ? hooks.onStop || nullFunc : nullFunc;

  $(document).ready(function () {
    let recognizing = false;

    function showStart() {
      $(".pulseOutline").css({
        color: "blue",
        animation: "pulse 2s",
        "animation-timing-function": "ease-out",
        "animation-iteration-count": "infinite",
      });
      $("svg.mic-icon").css("fill", "darkred");
    }

    function showStop(error) {
      $(".pulseOutline").css({
        color: "red",
        animation: "none",
      });
      $("svg.mic-icon").css("fill", "#1E2D70");
    }

    function start() {
      if (!recognizing) {
        recognition.start();
        recognizing = true;
        showStart();
        onStart();
        onConsole("Ready to listen. Speak out!");
      }
    }

    function doStop() {
      if (recognizing) {
        recognition.stop();
      }
    }

    // <!-- speech recognition : WORK IN PROGRESS -->
    var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
    var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
    var SpeechRecognitionEvent =
      SpeechRecognitionEvent || webkitSpeechRecognitionEvent;

    let grammar;
    if (countries) {
      const formatCountries = countries.join(" | ");
      grammar = `#JSGF V1.0; grammar countries; public <countries> = add | all | minus | plus | remove | reset | select | set | ${formatCountries} ;`;
    } else {
      grammar = "#JSGF V1.0;";
    }
    console.log(grammar);
    var recognition = new SpeechRecognition();
    var speechRecognitionList = new SpeechGrammarList();
    speechRecognitionList.addFromString(grammar, 1);
    recognition.grammars = speechRecognitionList;
    recognition.continuous = true;
    recognition.lang = "en-GB";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    $("[role='button']#speechRecognition").on("click", function () {
      try {
        if (recognizing) {
          doStop();
        } else {
          start();
        }
      } catch (error) {
        onConsole(error);
        doStop();
      }
    });

    recognition.onresult = function (event) {
      if (0 < event.results.length) {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult && lastResult.length > 0) {
          const transcript = lastResult[0].transcript.trim();
          const confidence = lastResult[0].confidence;
          if (transcript.startsWith("stop")) {
            doStop();
          } else {
            if (lastResult.isFinal) {
              onResult(transcript);
            } else {
              onConsole(transcript, "Confidence: " + confidence, lastResult);
            }
          }
        }
      }
    };

    recognition.onspeechend = function (event) {
      recognizing = false;
      showStop();
      onConsole("Stopped.", event);
      onStop();
    };

    recognition.onnomatch = function (event) {
      onConsole("I didn't understand.", event);
    };

    recognition.onerror = function (event) {
      recognizing = false;
      showStop();
      onConsole(
        "Stopped - error occurred in recognition: '" + event.error + "'",
        event.error,
        event
      );
      onStop(event.error);
    };
  });
  return {};
}
