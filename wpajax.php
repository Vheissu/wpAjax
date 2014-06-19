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
add_action('wp_enqueue_scripts', 'wpajax_init', 10);

function wpajax_init() {
    wp_enqueue_script( "wpajax-vendor-js", plugins_url('/js/wpajax-vendor.min.js', __FILE__), array('jquery'), null, true );
    wp_enqueue_script( "wpajax-main-js", plugins_url('/js/wpajax.min.js', __FILE__), array('jquery'), null, true );
}

/**
 * Adds custom classes to the array of body classes.
 */
function wpajax_body_classes( $classes )
{
    global $post;

    if (isset($post->post_name)) {
        $classes[] = 'wpajax-pagename-'.$post->post_name;
    }

    if (isset($post->ID)) {
        $classes[] = 'wpajax-pageid-'.$post->ID;
    }

    return $classes;
}
add_filter( 'body_class', 'wpajax_body_classes' );

// Adds in some page variables we can fetch via AJAX requests
function wpajax_header() {
    global $wp_query, $post;

    $pageid   = 0;
    $pagename = "";
    $max      = $wp_query->max_num_pages;
    $paged    = ( get_query_var('paged') > 1 ) ? get_query_var('paged') : 1;

    if (isset($post->ID)) {
        $pageid = $post->ID;
    }

    if (isset($post->post_name)) {
        $pagename = $post->post_name;
    }

    echo '<script type="text/javascript">var site_url = "'.site_url().'";</script>';
    echo '<script id="wpvars" type="text/javascript">var wpvars = { max: '.$max.', paged: '.$paged.', pageid: '.$pageid.', pagename: "'.$pagename.'", pagetemplate: "'.get_post_meta( $post->ID, '_wp_page_template', true ).'" };</script>';
    echo '<script>(function($) { $(document).trigger("wpAjax.pageload-"+wpvars.pagename);  })(jQuery);</script>';
}

add_action("wp_head", "wpajax_header", 99);
