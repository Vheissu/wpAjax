<?php
/*
Plugin Name: wpAjax
Plugin URI: http://ilikekillnerds.com
Description: A plugin for adding AJAX functionality to your Wordpress themes with smart caching and a fully evented architecture.
Author: Dwayne Charrington
Author URI: http://ilikekillnerds.com
version: 1.0
*/

add_action('init', 'wpajax_init');

function wpajax_init() {
    wp_enqueue_script( "wpajax-imagesloaded-js", plugins_url('/js/vendor/jquery.imagesloaded.min.js', __FILE__), array('jquery'), null, true );
    wp_enqueue_script( "wpajax-history-js", plugins_url('/js/vendor/jquery.history.min.js', __FILE__), array('jquery'), null, true );
    wp_enqueue_script( "wpajax-main-js", plugins_url('/js/wpajax.js', __FILE__), array('jquery', 'wpajax-history-js', 'wpajax-imagesloaded-js'), null, true );
}
