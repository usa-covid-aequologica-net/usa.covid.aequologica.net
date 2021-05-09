'use strict';

// force domain 
export const domain = (window.location.hostname.startsWith("usa.") || window.location.port == 4040) ? "usa" : "world";
