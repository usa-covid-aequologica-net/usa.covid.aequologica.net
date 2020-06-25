'use strict';

import { domain } from './model/domain.js';


    
if (domain === 'world') {
    $('span#'+domain).show();
    $('span#usa').hide();
    
    $('button#location').show();
    $('.flag').show();
    
    function showLocation(location) {
        $("header #location").attr('title', "redirect to " + location.country);
        $("header #location").data("country-code", location.countryCode);
        $("header #location div").addClass("fflag-" + location.countryCode);
    }
    const location = Cookies.get('location');
    if (location) {
        showLocation(JSON.parse(location));
    } else {
        $.ajax({
            url: "https://ipecho.net/plain",
            type: "GET",
            dataType: "text",
            crossDomain: true,
            success: function (response) {
                $.ajax({
                    url: "https://immense-ridge-70449.herokuapp.com/proxy?scheme=http&host=ip-api.com&port=80&path=/json/" + response + "?fields=country,countryCode&proxyType=Internet",
                    type: "GET",
                    dataType: "json",
                    crossDomain: true,
                    success: function (response) {
                        Cookies.set('location', response, { expires: 10 });
                        showLocation(response);
                    },
                    error: function (xhr, errorType, exception) {
                        console.log("Error fetching location data from ipstack.com", xhr, errorType, exception);
                        $("header #location").remove();
                    }
                });
            },
            error: function (xhr, errorType, exception) {
                console.log("Error fetching location data from ipstack.com", xhr, errorType, exception);
                $("header #location").remove();
            }
        });
    }
} else {
    $('span#'+domain).show();
    $('span#world').hide();

    $('button#location').hide();
    $('.flag').hide();
}