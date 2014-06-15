/**
 * Copyright (c) 2014 and beyond Dwayne Charrington
 * Email: dwaynecharrington (at) gmail (dot) com
 * Twitter: abolitionof_
 * Licensed under MIT
 * @author Dwayne Charrington
 * @version 1.0
 */

;(function($, window, document, History, undefined) {

    // Events trigger

    // While loading: wpAjax.loading: (event, url)
    // If failed: wpAjax.failed: (event, url)
    // Content loaded: wpAjax.loaded: (event, data, url)
    // Content loaded and populated: wpAjax.complete: (event, contentEl)

    /*
        Example:

        //To configure wpAjax:
        wpAjax.configure({
            content: "#content" // Element with our content which will be AJAX''d out
        });

        // Call this from within a click event
        wpAjax.trigger("http://www.someurl.com");

        // Request is currently happening (with current URL and new URL)
        $(document).on("wpAjax.loading", function(event) {
            // Methods are;
            // event.previousUrl
            // event.url
        });

        // All data has loaded
        $(document).on("wpAjax.loaded", function(event) {
            // Methods are;
            // event.data
            // event.url
        });

        $(document).on("wpAjax.failed", function(event) {
            // Methods are;
            // event.url
        });

        // All data has been populated the content element returned
        $(document).on("wpAjax.complete", function(event) {
            // Methods are;
            // event.contentEl
        });
    */

    var currentRequest = null,
         previousUrl = "",
         requestCount = 0;

    // Main WP Ajax object
    var wpAjax = {};

    // Options
    var settings = {
            content: '#content',      // This is our container
            cacheRequests: true,  // Use HTML5 localStorage to cache pages?
            cacheExpiry: 1,          // Time in hours cached items should be cached for
            waitForImages: true,   // Wait for images to load before loading a page?
            debug: false,              // Debug mode shows console messages if true
            testMode: false           // Modifies certain methods so we can test them
        },
        o = settings;

    // These two elements never disappear and are always consistent
    var $body    = $("body");
    var $wpvars = $("wpvars");
    var $content = $(o.content);

    // Statechange when the URL changes, we roll
    $(window).off("statechange").on("statechange", function() {
        var State = History.getState();

        log("Event.statechange: HTML5 History statechange event trigger with URL: "+State.url);

        if (previousUrl !== State.url) {
            log("Event.statechange: Calling the wpAjax.loadPage function with State.url as its parameter");
            wpAjax.loadPage(State.url);
        } else {
            log("Event.statechange: User is already on the requested page to load. No request will be made.");
        }
    });

    // Allows us to configure wpAjax
    wpAjax.configure = function(options) {
        log("configure: Setting options for Wpajax");
        $.extend(settings, options);
        return this;
    };

    // Return the configuration object
    wpAjax.getConfiguration = function() {
        return settings;
    };

    // Helper function for checking the current URL
    wpAjax.getCurrentUrl = function() {
        log("getCurrentUrl: Getting the current browser address URL");
        return window.location.href;
    };

    // Trigger a page load
    wpAjax.trigger = function(url) {
        log("trigger: Calling History.pushState which will trigger a statechange");

        // Store current URL as the previous URL
        previousUrl = wpAjax.getCurrentUrl();

        wpAjax.getTitle(url, function(title) {
            History.pushState({}, title, url);
        });
    };

    // Have we reached our page limit
    wpAjax.pageLimitReached = function() {
        return (wpvars.max == wpvars.paged);
    }

    // What is the current page we are on
    wpAjax.getCurrentPageNumber = function() {
        return wpvars.paged;
    }

    // Get the maximum number of pages in our results
    wpAjax.getMaxPages = function() {
        return wpvars.max;
    }

    // Load page function
    wpAjax.loadPage = function(url) {

        log("loadPage: No other request is taking place, we are good to go");

        if (!o.testMode) {
            // Apply a loading class to the body
            $body.addClass("loading-page");

            var loadingEvent = jQuery.Event("wpAjax.loading", {
                previousUrl: previousUrl,
                url: url
            });

            // Trigger loading event
            $(document).trigger(loadingEvent);

            // Before content is loaded in, fade out the old content
            wpAjax.fadeOutContent();

            log("loadPage: Loading class applied to body, loading event fired and content element faded out");
        }

        // Perform our AJAX request
        wpAjax.doRequest(url, function(data) {
            wpAjax.processRequest(data, url);
        }, function() {

            if (!o.testMode) {
                wpAjax.fadeInContent();

                log("loadPage: Called doRequest and the request failed. Throwing a failed event on document");

                var failedEvent = jQuery.Event("wpAjax.failed", {
                    url: url
                });

                // Trigger failed event
                $(document).trigger(failedEvent);
            }
        });

    };

    // Fade out the content area
    wpAjax.fadeOutContent = function() {
        log("fadeOutContent: Animating content element out");
        $content.animate({opacity:0}, 800);
    };

    // Fade in the content area
    wpAjax.fadeInContent = function() {
        log("fadeInContent: Animating content element in");
        $content.animate({opacity:1}, 800);
    };

    // Performs an AJAX request to get the page title
    // Also has the advantage of pre-fetching the page
    // for us as well.
    wpAjax.getTitle = function(url, callback) {
        var title = "";

        log("getTitle: Calling wpAjax.doRequest now to get the title");

        wpAjax.doRequest(url, function(data) {
            title = $(data).filter("title").text();
            log("getTitle: doRequest AJAX call successful. Title returned: "+title+" ");

            if ($.isFunction(callback)) {
                callback(title);
            }
        }, function() {
            if ($.isFunction(callback)) {
                callback(title);
            }
        });
    };

    // Handles performing the page load request
    // Leaves checking for other requests and validity to other functions
    wpAjax.doRequest = function(url, success, error) {

        log("doRequest: About to perform an AJAX call");

        // Do the fetching and stuff...
        currentRequest = $.ajax({
            url: url,
            localCache: o.cacheRequests,
            cacheTTL: o.cacheExpiry,
            type: 'GET',
            dataType: 'html',
            requestCount: ++requestCount,
            beforeSend: function() {
                // Check if we have a promise and cancel any current requests
                if (currentRequest !== null) {
                    currentRequest.abort();
                }
            },
            success: function(response, textStatus, jqXHR) {
                log("doRequest: AJAX success callback");
                if (requestCount !== this.requestCount) return;
                success(response, textStatus, jqXHR);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                log("doRequest: AJAX error callback");
                if ($.isFunction(error)) {
                    error(jqXHR, textStatus, errorThrown);
                }
            }
        });

    };

    // Once our AJAX request is done, this function is called
    // Which allows us to process the response
    wpAjax.processRequest = function(data, url) {
        var _html = $(data);

        if (!o.testMode) {
            var _content = _html.find(o.content).html();
            var _wpvars = _html.find("#wpvars").html();
        } else {
            var _content = _html.find("body").html();
        }

        log("processRequest: Processing the data returned by a successful AJAX call");

        // Do we have content?
        if (_content && _content.length) {

            if (!o.testMode) {
                // Get latest version of WP Vars object
                $wpvars.html(_wpvars);
            }

            var loadedEvent = jQuery.Event("wpAjax.loaded", {
                data: data,
                url: url
            });

             // AJAX load finished fire a loaded event with the data
             $(document).trigger(loadedEvent);

            log("processRequest: Content found from the AJAX request, determining what to do with it");

            // We want to wait for images to load before proceeding
            if (o.waitForImages) {

                log("processRequest Wait for images option is enabled, finding images");

                // We have images to preload
                if ($(_content).find("img").length) {

                    log("processRequest: We found images. Waiting for all images in the returned data to preload");

                    // Populate the content element
                    wpAjax.populateContent(_content, function(contentEl) {

                        log("processRequest: Populated the content element with content, about to preload iamges");

                        // Wait for any newly populated images to load
                        contentEl.imagesLoaded().then(function() {

                            log("processRequest: All images in AJAX loaded content have preloaded");

                            // Replace body classes with those of the loaded body classes
                            $body.attr("class",_html.filter("body").attr("class"));

                            var completeEvent = jQuery.Event("wpAjax.complete", {
                                contentEl: contentEl
                            });

                            // All content has been populated, assume we've succeeded
                            $(document).trigger(completeEvent);

                        });

                    });

                } else {
                    // Populate the content element
                    wpAjax.populateContent(_content, function(contentEl) {

                        log("processRequest: Requested AJAX content has been added to the content element and classes changed");

                        // Replace body classes with those of the loaded body classes
                        $body.attr("class", _html.filter("body").attr("class"));

                            var completeEvent = jQuery.Event("wpAjax.complete", {
                                contentEl: contentEl
                            });

                            // All content has been populated, assume we've succeeded
                            $(document).trigger(completeEvent);

                    });
                }

            } else {
                // Populate the content element
                wpAjax.populateContent(_content, function(contentEl) {

                    log("processRequest: Requested AJAX content has been added to the content element and classes changed");

                    // Replace body classes with those of the loaded body classes
                    $body.attr("class",data.filter("body").attr("class"));

                            var completeEvent = jQuery.Event("wpAjax.complete", {
                                contentEl: contentEl
                            });

                            // All content has been populated, assume we've succeeded
                            $(document).trigger(completeEvent);
                });
            }

            // Fade in the content DIV now we've done what we've wanted with it
            wpAjax.fadeInContent();

        } else {
            log("processRequest: Returned AJAX content is empty. Could be a problem server-side.");
        }
    };

    // Populates the appropriate content DIV with our
    // load content from the AJAX request (if successful)
    wpAjax.populateContent = function(content, callback) {
        log("populateContent: About to populate the content element with returned HTML");

        if (!o.testMode) {
            // Populate the content element
            $content.html(content);
        }

        // If we have a callback function
        if ($.isFunction(callback)) {
            log("populateContent: We've added in the content, calling the callback function with the element as an argument");
            callback($content);
        }
    };

    // Console log wrapper checks if debugging is on
    function log(msg) {
        if (o.debug) {
            console.log(msg);
        }
    }

    // Expose our method to the world
    window.wpAjax = wpAjax;

})(jQuery, window, window.document, window.History);

;(function($, undefined) {

    // github.com/paulirish/jquery-ajax-localstorage-cache
    // dependent on Modernizr's localStorage test
    $.ajaxPrefilter( function( options, originalOptions, jqXHR ) {

      // Modernizr.localstorage, version 3 12/12/13
      function hasLocalStorage() {
        var mod = 'modernizr';
        try {
          localStorage.setItem(mod, mod);
          localStorage.removeItem(mod);
          return true;
        } catch(e) {
          return false;
        }
      }

      // Cache it ?
      if ( !hasLocalStorage() || !options.localCache ) return;

      var hourstl = options.cacheTTL || 5;

      var cacheKey = options.cacheKey ||
                     options.url.replace( /jQuery.*/,'' ) + options.type + (options.data || '');

      // isCacheValid is a function to validate cache
      if ( options.isCacheValid &&  ! options.isCacheValid() ){
        localStorage.removeItem( cacheKey );
      }
      // if there's a TTL that's expired, flush this item
      var ttl = localStorage.getItem(cacheKey + 'cachettl');
      if ( ttl && ttl < +new Date() ){
        localStorage.removeItem( cacheKey );
        localStorage.removeItem( cacheKey  + 'cachettl' );
        ttl = 'expired';
      }

      var value = localStorage.getItem( cacheKey );
      if ( value ){
        //In the cache? So get it, apply success callback & abort the XHR request
        // parse back to JSON if we can.
        if ( options.dataType.indexOf( 'json' ) === 0 ) value = JSON.parse( value );
        options.success( value );
        // Abort is broken on JQ 1.5 :(
        jqXHR.abort();
      } else {

        //If it not in the cache, we change the success callback, just put data on localstorage and after that apply the initial callback
        if ( options.success ) {
          options.realsuccess = options.success;
        }
        options.success = function( data ) {
          var strdata = data;
          if ( this.dataType.indexOf( 'json' ) === 0 ) strdata = JSON.stringify( data );

          // Save the data to localStorage catching exceptions (possibly QUOTA_EXCEEDED_ERR)
          try {
            localStorage.setItem( cacheKey, strdata );
          } catch (e) {
            // Remove any incomplete data that may have been saved before the exception was caught
            localStorage.removeItem( cacheKey );
            localStorage.removeItem( cacheKey + 'cachettl' );
            if ( options.cacheError ) options.cacheError( e, cacheKey, strdata );
          }

          if ( options.realsuccess ) options.realsuccess( data );
        };

        // store timestamp
        if ( ! ttl || ttl === 'expired' ) {
          localStorage.setItem( cacheKey  + 'cachettl', +new Date() + 1000 * 60 * 60 * hourstl );
        }

      }
    });

});