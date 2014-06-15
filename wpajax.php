<?php
/*
Plugin Name: wpAjax
Plugin URI: http://ilikekillnerds.com
Description: A plugin for adding AJAX functionality to your Wordpress themes with smart caching and a fully evented architecture.
Licence: Licensed under MIT
Author: Dwayne Charrington
Author URI: http://ilikekillnerds.com
Version: 1.0
*/

// Execute scripts before WP scripts added in
add_action('wp_enqueue_scripts', 'wpajax_init', 15);

function wpajax_init() {
    wp_enqueue_script( "wpajax-imagesloaded-js", plugins_url('/js/vendor/jquery.imagesloaded.min.js', __FILE__), array('jquery'), null, true );
    wp_enqueue_script( "wpajax-history-js", plugins_url('/js/vendor/jquery.history.min.js', __FILE__), array('jquery'), null, true );
    wp_enqueue_script( "wpajax-main-js", plugins_url('/js/wpajax.js', __FILE__), array('jquery'), null, true );
}

add_action("wp_footer", "wpajax_footer", 99);

// Adds in some page variables we can fetch via AJAX requests
function wpajax_footer() {
    global $wp_query;
    $max    = $wp_query->max_num_pages;
    $paged = ( get_query_var('paged') > 1 ) ? get_query_var('paged') : 1;

    echo '<script type="text/javascript">var site_url = "'.site_url().'";</script>';
    echo '<script id="wpvars" type="text/javascript">var wpvars = { max: '.$max.', paged: '.$paged.'  };</script>';
}
