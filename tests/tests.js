// Check calling the configure method without an option
test("Configure Method (Without Options)", function() {
    var result = wpAjax.configure();
    deepEqual(typeof(result), "object");
});

// Test setting an option and checking the value was saved
test("Configure Method (With Option)", function() {
    wpAjax.configure({debug:true, testMode:true});
    var result      = wpAjax.getConfiguration();
    ok(result.debug);
    wpAjax.configure({debug:false});
});

// Test getting the request status
test("Request Status", function() {
    var result = wpAjax.requestStatus();
    deepEqual(result, false);
});

test("Get Current URL", function() {
    var result      = wpAjax.getCurrentUrl();
    var expected = window.location.href;
    equal(result, expected);
});

// Page title is an asynchronous function
asyncTest("Fetch Page Title", function() {
    expect(1);

    wpAjax.getTitle("ajax-test.html", function(response) {
        var expected = "Valid Response";
        equal(response, expected);
        start();
    });
});

asyncTest("Page Load via the doRequest method", function() {
    expect(1); // Expect one assetion test

    var callbacks = {
        success: function(data, textStatus) {
            ok(true, "AJAX page load successful. Text status: "+textStatus);
            start();
        },
        error: function(jqXHR, textStatus, errorThrown) {
            ok(false, "AJAX page load error: "+errorThrown);
        }
    };

    wpAjax.doRequest("ajax-page-content-test.html", callbacks.success, callbacks.error);
});
