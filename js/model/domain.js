'use strict';

// force domain 
export const domain = (window.location.hostname.startsWith("usa.") || window.location.port == 8002) ? "usa" : "world";
