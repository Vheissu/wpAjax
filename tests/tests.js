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

test("Fetch Page Title", function() {
    var result      = wpAjax.getTitle("ajax-test.html");
    var expected = "Valid Response";
    equal(result, expected);
});
