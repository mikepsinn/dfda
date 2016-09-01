angular.module('starter')
    // Measurement Service
    .factory('bugsnagService', function(utilsService, $rootScope) {
        
        // service methods
        var bugsnagService = {

            reportError : function(exception){
                var message = exception.toString();
                console.error('ERROR: ' + message);
                var stacktrace;
                if(typeof exception.stack !== 'undefined'){
                    stacktrace = exception.stack.toLocaleString();
                } else {
                    stacktrace = "No stack trace provided with exception";
                }

                if (typeof Bugsnag !== "undefined") {
                    Bugsnag.releaseStage = utilsService.getEnv();
                    //Bugsnag.apiKey = "REDACTED";
                    Bugsnag.notify("ERROR: " + message, "Stacktrace: " + stacktrace, {}, "error");
                }
            }
        };

        return bugsnagService;
    });