export default function (onConsole, onStart, onResult, onStop) {

  $(document).ready(function () {
 
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

    var recognizing = false;

    function start() {
      if (!recognizing) {
        recognition.start();
        recognizing = true;
        showStart();
        if (onStart) onStart();
        if (onConsole) onConsole("Start ! Ready to receive a country command.");
      }
      return recognizing;
    }

    function doStop() {
      if (recognizing) {
        recognition.stop();
      }
      return recognizing;
    }

    // <!-- speech recognition : WORK IN PROGRESS -->
    var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
    var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
    var SpeechRecognitionEvent =
      SpeechRecognitionEvent || webkitSpeechRecognitionEvent;

    var grammar = "#JSGF V1.0; grammar countries;";

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
        if (recognizing) {
          doStop();
        } else {
          start();
        }
      } catch (error) {
        if (onConsole) onConsole(error);
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
      for (var i = 0, l = event.results.length; i < l; i++) {}
      if (0 < event.results.length) {
        var i = event.results.length - 1;
        var result = event.results[i][0].transcript.trim();
        if (result.startsWith("stop")) {
          doStop();
        } else {
          onConsole(
            result,
            "Confidence: " + event.results[i][0].confidence,
            event.results[i]
          );
          if (onResult) onResult(result);
        }
      }
    };

    recognition.onspeechend = function (event) {
      recognizing = false;
      showStop();
      if (onConsole) onConsole("Stopped", event);
      if (onStop) onStop();
    };

    recognition.onnomatch = function (event) {
      if (onConsole) onConsole("I didn't recognise that country.", event);
    };

    recognition.onerror = function (event) {
      recognizing = false;
      showStop();
      if (onConsole) onConsole("Stopped - Error occurred in recognition: ", event.error, event);
      if (onStop) onStop(event.error);
    };
  });
  return {};
}
