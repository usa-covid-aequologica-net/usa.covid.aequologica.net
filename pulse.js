export default function (onStop) {
  let buffer = [];

  function isString(x) {
    return Object.prototype.toString.call(x) === "[object String]";
  }

  function console_log(text) {
    console.log(text);
    if (isString(text)) $("footer div span").text(text);
  }

  $(document).ready(function () {
    function showStart() {
      $(".outline").css({
        color: "blue",
        animation: "pulse 2s",
        "animation-timing-function": "ease-out",
        "animation-iteration-count": "infinite",
      });
      $("svg.mic-icon").css("fill", "darkred");
      $("h1").html("&hellip;");
    }

    function showStop(error) {
      $(".outline").css({
        color: "red",
        animation: "none",
      });
      $("svg.mic-icon").css("fill", "#1E2D70");
      if (error) $("h1").text(error);
    }

    var recognizing = false;

    function start() {
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
      "#JSGF V1.0; grammar colors; public <country> = " +
      "France | Italy" +
      " ;";

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
      buffer = [];
      for (var i = 0, l = event.results.length; i < l; i++) {
        var result = event.results[i][0].transcript;
        if (result.trim().startsWith("stop")) {
          doStop();
        } else {
          buffer.push(result);
          $("h1#lui").append($("<p>").text(result));
          console_log(result);
          console.log(
            result,
            "Confidence: " + event.results[i][0].confidence,
            event.results[i]
          ); //
        }
      }
    };

    recognition.onspeechend = function () {
        showStop();
        console_log("stopped");
        onStop(buffer);
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
