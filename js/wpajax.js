;(function($, window, document, History, undefined) {

    // Events trigger

    // While loading: wpAjax.loading: (event, url)
    // If failed: wpAjax.failed: (event, url)
    // Content loaded: wpAjax.loaded: (event, data, url)
    // Content loaded and populated: wpAjax.complete: (event, contentEl)

    /*
        Example:

        // Call this from within a click event
        wpAjax.trigger("http://www.someurl.com");

        $(document).on("wpAjax.loaded", function(event, url) {

        });

        $(document).on("wpAjax.failed", function(event, url) {

        });

        // All data has loaded
        $(document).on("wpAjax.loaded", function(event, data, url) {

        });

        // All data has been populated the content element returned
        $(document).on("wpAjax.complete", function(event, contentEl) {

        });
    */

    // Are we already performing a request?
    var isLoading = false;

    // Main WP Ajax object
    var wpAjax = {};

    // Options
    var settings = {
            content: '#content',      // This is our container
            cacheRequests: true,  // Use HTML5 localStorage to cache pages?
            cacheExpiry: 1,          // Time in hours cached items should be cached for
            waitForImages: true,   // Wait for images to load before loading a page?
            debug: false               // Debug mode shows console messages if true
        },
        o = settings;

    // These two elements never disappear and are always consistent
    var $body    = $("body");
    var $content = $(o.content);

    // Statechange when the URL changes, we roll
    $(window).on("statechange", function() {
        var State = History.getState();

        log("HTML5 History statechange event trigger with URL: "+State.url);

        // Load the page if we're not already on it
        if (State.url !== wpAjax.getCurrentUrl()) {
            log("Calling the wpAjax.loadPage function with State.url as its parameter");
            wpAjax.loadPage(State.url);
        } else {
            log("AJAX request not performed as user is already on the requested page");
        }
    });

    // Allows us to configure wpAjax
    wpAjax.configure = function(options) {
        $.extend(settings, options);
        return this;
    };

    // Helper function for checking the current URL
    wpAjax.getCurrentUrl = function() {
        log("Method wpAjax.getCurrentUrl called");
        return window.location.href;
    };

    // Trigger a page load
    wpAjax.trigger = function(url) {
        log("Method wpAjax.trigger called which will call History.pushState and trigger a statechange");
        History.pushState({}, wpAjax.getTitle(), url);
    };

    // Load page function
    wpAjax.loadPage = function(url) {

        if (isLoading == false) {

            log("Method wpAjax.loadPage called and no other request taking place");

            // Apply a loading class to the body
            $body.addClass("loading-page");

            // Trigger loading event
            $(document).trigger("wpAjax.loading", [url]);

            // Before content is loaded in, fade out the old content
            wpAjax.fadeOutContent();

            // Perform our AJAX request
            wpAjax.doRequest(url, function() {
                wpAjax.processRequest(data, url);
            }, function() {
                isLoading = false;

                wpAjax.fadeInContent();

                // Trigger failed event
                $(document).trigger("wpAjax.failed", [url]);
            });

        } else {
            return false;
        }

    };

    // Fade out the content area
    wpAjax.fadeOutContent = function() {
        log("fadeOutContent method called");
        $content.animate({opacity:0}, 800);
    };

    // Fade in the content area
    wpAjax.fadeInContent = function() {
        log("fadeInContent method called");
        $content.animate({opacity:1}, 800);
    };

    // Performs an AJAX request to get the page title
    // Also has the advantage of pre-fetching the page
    // for us as well.
    wpAjax.getTitle = function(url) {
        var title = "";

        log("wpAjax.getTitle method called");

        wpAjax.doRequest(url, function(data) {
            title = $(data).filter("title").text();
        });

        return title;
    };

    // Handles performing the page load request
    // Leaves checking for other requests and validity to other functions
    wpAjax.doRequest = function(url, success, error) {

        // Do the fetching and stuff...
        $.ajax({
            url: url,
            localCache: o.cacheRequests,
            cacheTTL: o.cacheExpiry,
            type: 'GET',
            dataType: 'html',
            success: function(response) {
                log("AJAX request called and successful");
                success(response);
            },
            error: function() {
                log("AJAX request called and failed");
                if ($.isFunction(error)) {
                    error();
                }
            }
        });

    };

    // Once our AJAX request is done, this function is called
    // Which allows us to process the response
    wpAjax.processRequest = function(data, url) {
        var _html      = $(data);
        var _content = _html.find(o.content).html();

        // AJAX request is finished
        isLoading = false;

        log("Processing the data returned by the successful AJAX call");

        // Do we have content?
        if (_content && _content.length) {

             // AJAX load finished fire a loaded event with the data
             $(document).trigger("wpAjax.loaded", [data, url]);

            log("Content found from the AJAX request, determining what to do with it");

            // We want to wait for images to load before proceeding
            if (waitForImages) {

                // We have images to preload
                if ($(_content).find("img").length) {

                    log("Waiting for all images in the returned data to preload");

                    // Populate the content element
                    wpAjax.populateContent(_content, function(contentEl) {

                        log("Populated the content element");

                        // Wait for any newly populated images to load
                        contentEl.imagesLoaded().then(function() {

                            log("All images in AJAX loaded content have preloaded");

                            // Replace body classes with those of the loaded body classes
                            $body.attr("class", /body([^>]*)class=(["']+)([^"']*)(["']+)/gi.exec(data.substring(data.indexOf("<body"), data.indexOf("</body>") + 7))[3]);

                            // All content has been populated, assume we've succeeded
                            $(document).trigger("wpAjax.complete", [contentEl]);

                        });

                    });

                }

            } else {

                // Populate the content element
                wpAjax.populateContent(_content, function(contentEl) {

                    log("Requested AJAX content has been added to the content element and classes changed");

                    // Replace body classes with those of the loaded body classes
                    $body.attr("class", /body([^>]*)class=(["']+)([^"']*)(["']+)/gi.exec(data.substring(data.indexOf("<body"), data.indexOf("</body>") + 7))[3]);

                    // All content has been populated, assume we've succeeded
                    $(document).trigger("wpAjax.complete", [contentEl]);

                }
            }

            // Fade in the content DIV now we've done what we've wanted with it
            wpAjax.fadeInContent();

        } else {
            log("Returned AJAX content is empty. Could be a problem server-side.");
        }
    };

    // Populates the appropriate content DIV with our
    // load content from the AJAX request (if successful)
    wpAjax.populateContent = function(content, callback) {
        // Populate the content element
        $content.html(content);

        // If we have a callback function
        if ($.isFunction(callback)) {
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
    return wpAjax;

})(jQuery, window, document, window.History);

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
