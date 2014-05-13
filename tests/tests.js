// Check calling the configure method without an option
test("Configure Method (Without Options)", function() {
    var result = wpAjax.configure();
    equal(typeof(result), "object");
});

// Test setting an option and checking the value was saved
test("Configure Method (With Option)", function() {
    var instance = wpAjax.configure({debug:true});
    var result      = instance.getConfiguration();
    equal(result.debug, true);
});

// Test getting the request status
test("Request Status", function() {
    var result = wpAjax.requestStatus();
    equal(result, false);
});
