'use strict';

export const pubSubKey = 'KEYBOARD';

/*
sample :
var mySubscriber = function (msg, data) {
    console.log( msg, data );
};

window.ps.subscribe(pubSubKey, mySubscriber);
*/

// let's go
$(document).ready(() => {

    function onKeydown(e) {
        /*
        left = 37
        up = 38
        right = 39
        down = 40 
        */
        var $focused = $(':focus');;
        console.log($focused);
        if (e.which == 38) {
            event.preventDefault();
            event.stopPropagation();

            window.ps.publish('KEYBOARD', { event: 'UP' });

            /*
            const $eventTarget = $(window.getSelection().anchorNode);
            const $td = $eventTarget.closest('td.name');
    
            if ($td.length > 0) {
                const $tr = $eventTarget.closest('tr');
                const $cb = $tr.find("input")
    
                $cb.prop('checked', !$cb.prop('checked'));
    
                const $truc = $tr.find("#trucAndAstuceForTableSorter");
                $truc.text(($cb.is(':checked') ? "checked" : "unchecked") + "_" + $cb.prop("name"));
    
                stopEventAndWriteCountries(event);
            }
        */
        } else if (e.which == 40) {
            event.preventDefault();
            event.stopPropagation();

            window.ps.publish(pubSubKey, { event: 'DOWN' });
        }
    }

    $(document).on('keydown', onKeydown);

}); // $(document).ready
