'use strict';

export const pubSubKey = 'KEYBOARD';

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
        // console.log($focused);
        if (e.which == 38) {
            e.preventDefault();
            e.stopPropagation();

            window.ps.publish(pubSubKey, { event: 'UP' });

        } else if (e.which == 40) {
            e.preventDefault();
            e.stopPropagation();

            window.ps.publish(pubSubKey, { event: 'DOWN' });
        } else if (e.which == 32) {
            e.preventDefault();
            e.stopPropagation();

            window.ps.publish(pubSubKey, { event: 'SPACE' });
        }
    }

    $(document).on('keydown', onKeydown);

}); // $(document).ready
