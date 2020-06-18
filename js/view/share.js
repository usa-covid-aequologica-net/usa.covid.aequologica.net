'use strict';

export function share(...args) {
    const [PRINT, properties, $objects, buildPermalink, printMarker] = args;

    // https://stackoverflow.com/a/9039885/1070215
    function iOS() {

        var iDevices = [
            'iPad Simulator',
            'iPhone Simulator',
            'iPod Simulator',
            'iPad',
            'iPhone',
            'iPod'
        ];

        if (navigator.platform) {
            while (iDevices.length) {
                if (navigator.platform === iDevices.pop()) { return true; }
            }
        }

        return false;
    }
    const isIPadIPhoneIPod = iOS();
    // https://stackoverflow.com/a/31732310/1070215
    const isSafari = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
        navigator.userAgent &&
        navigator.userAgent.indexOf('CriOS') == -1 &&
        navigator.userAgent.indexOf('FxiOS') == -1;

    if (isIPadIPhoneIPod || isSafari) {
        $(html2canvasButton).on('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            window.print();
        });

        return;
    }

    if (!PRINT) {

        // NORMAL

        const $iframe = $objects.$iframeWrapper.find('iframe');

        $objects.$printModal
            .on('show.bs.modal', function () {
                
                $objects.$sendButton.prop("disabled", true);
                $objects.$counter.show().text("0");
                $objects.$printModal.find("#removeMe").remove();
                const bodyHeight = $('body').height();
                const iframeHeight = Math.min((2 * bodyHeight) / 3, 630);
                $objects.$iframeWrapper.height(iframeHeight);

                const removePrintMarker = new RegExp(printMarker, 'g');

                buildPermalink(properties, printMarker).then((permalink) => {
                    $iframe.prop('src', permalink);
                    const pure = permalink.replace(removePrintMarker, "");
                    $objects.$printModal.find('.modal-header').prepend($('<div>').prop('id', "removeMe").append(
                        $('<a>')
                            .prop('href', pure)
                            .prop('target', "_blank")
                            .text("permalink"))
                    );
                    const countdown = setInterval(myTimer, 1000);
                    let onetwothree = 0;
                    function myTimer() {
                        // done ?
                        if (!$objects.$sendButton.prop("disabled")) {
                            $objects.$counter.hide();
                            clearInterval(countdown);
                        }
                        onetwothree = onetwothree + 1;
                        $objects.$counter.text(onetwothree);
                    }
                });

            }).on('hidden.bs.modal', function (e) {
                $iframe.contents().find("body").html("");
            });

        $objects.$sendButton.on("click", function () {
            const blob = $iframe.contents().find('body img').prop('src');

            const permalink = $iframe.prop('src');
            const file = permalink.replace(/^.*\&/, ""); // remove everything before '&' inclusive (the '&' of printMarker = "action=PRINT&")
            const file2 = file.replace(/,/g, "_");       // replace all commas with underscores
            const file3 = file2.replace(/__$/, "");      // remove trailing double underscore

            saveAs(blob, file3 + ".jpg");

            $objects.$printModal.modal('hide');
        });

    } else {
        // INSIDE IFRAME

        // cleaning and formatting
        $('noscript, .d-print-none').remove();
        $('.d-print-flex').removeClass("d-none");
        $("a").prop('src', "");
        $('button', '[type="button"]').each((b) => { b.disabled = true; });
        Handlebars.registerHelper('islargerThanOne', function (value) {
            return value > 1;
        });
        Handlebars.registerHelper('isDaily', function (value) {
            return value === 'day' || value === 'daily';
        });
        $('header #top2').html(printHeaderTemplate(properties.printHeaderTemplateObjects));
        $('footer #bottom').html(printFooterTemplate({}));

        // wait for end of loading 
        Pace.on('hide', () => {
            const body = document.body;
            html2canvas(body, {
                foreignObjectRendering: true,
                scale: 1,
            }).then((canvas) => {
                let blob = canvas.toDataURL();
                const start = "data:image/png;base64,";
                if (blob.startsWith(start)) {

                    const $img = $('<img>').prop('src', blob);
                    $('body').html($img);
                    const parent = $(window.parent);

                    if (parent.length > 0 && parent[0]["send"]) {
                        parent[0]["send"].removeAttribute("disabled");
                    }
                }
            });
        });
    }

    return {
    };
}