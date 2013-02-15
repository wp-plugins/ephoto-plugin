<?php
/*
Plugin Name: ePhoto
Plugin URI: http://www.ephoto.fr/
Description: Add ePhoto connector in the TinyMCE Rich Visual Editor
Version: 2.0.3
Author: Einden Studio
Author URI: http://www.einden.com/

Copyright (C)2013 Einden Studio

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
*/

// Détermine l'emplacement du plugin
$ePhotoPluginPath = WP_CONTENT_URL.'/plugins/'.plugin_basename(dirname(__FILE__)).'/';

$ePhotoDefaultValues = array('http://masociete.ephoto.fr/',
							 '320',
							 '640',
							 '640',
							 '640',
							 '320');

// Initialise la langue
function ePhoto_init_locale()
{
	//load_plugin_textdomain('ePhoto', false, 'i18n');
	$currentLocale = get_locale();
	
	if(!empty($currentLocale)) {
	   $moFile = dirname(__FILE__).'/i18n/ePhoto-'.$currentLocale.'.mo';
	   if(@file_exists($moFile) && is_readable($moFile)) load_textdomain('ePhoto', $moFile);
	}	
}

// Prépare le chargement du plugin si richtext présent
function ePhoto_addbuttons()
{
  // Don't bother doing this stuff if the current user lacks permissions
  if ( ! current_user_can('edit_posts') && ! current_user_can('edit_pages') )
     return;
 
  if ( get_user_option('rich_editing') == 'true') {
     add_filter("mce_external_plugins", "add_ePhoto_tinymce_plugin");
     add_filter('mce_buttons', 'register_ePhoto_button');
	 add_filter('tiny_mce_before_init', 'register_ePhoto_config');
  }
}

// Charge le plugin ePhoto
function add_ePhoto_tinymce_plugin($plugin_array)
{
  global $ePhotoPluginPath;
   
  $plugin_array['ePhoto'] = $ePhotoPluginPath.'/ePhoto/editor_plugin.js';
  return $plugin_array;
}

// Ajoute le bouton ePhoto dans TinyMCE
function register_ePhoto_button($buttons)
{
  array_push($buttons, "separator", "ePhoto");
  return $buttons;
}

// Ajoute la config ePhoto à TinyMCE
function register_ePhoto_config($init)
{	
  $init['ePhoto']="{'server':'".get_option('ePhoto_urlServer')."',".
				  "'buttons':{'image':[{'definition':'low','title':'".__("@Image moyenne", 'ePhoto')."','size':'".get_option('ePhoto_bouton1_taille')."'},".
									  "{'definition':'middle','title':'".__("@Grande image", 'ePhoto')."','size':'".get_option('ePhoto_bouton2_taille')."'}],".
						     "'movie':[{'definition':'middle','size':'".get_option('ePhoto_bouton3_taille')."'}],".
						     "'flash':[{'definition':'original','size':'".get_option('ePhoto_bouton4_taille')."'}],".
						    "'office':[{'definition':'middle','size':'".get_option('ePhoto_bouton5_taille')."'}]}}";					 

  return $init;
}

// Ajoute le lien vers le menu d'options
function ePhoto_menu()
{
  add_options_page('ePhoto', 'ePhoto', 8, 'ePhoto', 'ePhoto_options');
}

// Message d'information
function ePhoto_message($message)
{
  echo '<div id="message" class="updated fade"><p>'.$message."</p></div>\n";
}

// Charge les options par défaut
function ePhoto_load_config($force=false)
{
  global $ePhotoDefaultValues;
  
  if ($force || !get_option('ePhoto_urlServer'))      update_option('ePhoto_urlServer',      $ePhotoDefaultValues[0]);
  if ($force || !get_option('ePhoto_bouton1_taille')) update_option('ePhoto_bouton1_taille', $ePhotoDefaultValues[1]);  
  if ($force || !get_option('ePhoto_bouton2_taille')) update_option('ePhoto_bouton2_taille', $ePhotoDefaultValues[2]);
  if ($force || !get_option('ePhoto_bouton3_taille')) update_option('ePhoto_bouton3_taille', $ePhotoDefaultValues[3]);
  if ($force || !get_option('ePhoto_bouton4_taille')) update_option('ePhoto_bouton4_taille', $ePhotoDefaultValues[4]);
  if ($force || !get_option('ePhoto_bouton5_taille')) update_option('ePhoto_bouton5_taille', $ePhotoDefaultValues[5]);    
}

// Menu d'options
function ePhoto_options()
{	
  global $ePhotoDefaultValues;
  
  if (isset($_REQUEST['restore']) && $_REQUEST['restore'])
  {
	 check_admin_referer('ePhoto-config');
	 ePhoto_load_config(true);
	 ePhoto_message(__('@Configuration par defaut restauree', 'ePhoto').'.');

  // Sauvegarde les options
  } else if (isset($_REQUEST['save']) && $_REQUEST['save']) {	
	 check_admin_referer('ePhoto-config');
	 
	 $urlServer=empty($_POST['urlServer'])?$ePhotoDefaultValues[0]:$_POST['urlServer'];
	 $bouton1_taille=empty($_POST['bouton1_taille'])?$ePhotoDefaultValues[1]:$_POST['bouton1_taille'];	 	 
	 $bouton2_taille=empty($_POST['bouton2_taille'])?$ePhotoDefaultValues[2]:$_POST['bouton2_taille'];
	 $bouton3_taille=empty($_POST['bouton3_taille'])?$ePhotoDefaultValues[3]:$_POST['bouton3_taille'];
	 $bouton4_taille=empty($_POST['bouton4_taille'])?$ePhotoDefaultValues[4]:$_POST['bouton4_taille'];
	 $bouton5_taille=empty($_POST['bouton5_taille'])?$ePhotoDefaultValues[5]:$_POST['bouton5_taille'];	 	 

	 update_option('ePhoto_urlServer', $urlServer);
	 update_option('ePhoto_bouton1_taille', $bouton1_taille);		 
	 update_option('ePhoto_bouton2_taille', $bouton2_taille);
	 update_option('ePhoto_bouton3_taille', $bouton3_taille);
	 update_option('ePhoto_bouton4_taille', $bouton4_taille);
	 update_option('ePhoto_bouton5_taille', $bouton5_taille);	 	 
	 
	 ePhoto_message(__('@Changement sauvegarde', 'ePhoto').'.');
  }

  echo '<form action="',attribute_escape($_SERVER['REQUEST_URI']),'" method="post">';
  
  if ( function_exists('wp_nonce_field') ) wp_nonce_field('ePhoto-config');
?>
<div class="wrap">
	<?php screen_icon(); ?>
	<h2><?php _e('@Options du module ePhoto', 'ePhoto'); ?></h2>
	<table class="form-table"><tr>
		<th scope="row" valign="top"><?php _e("@Adresse du serveur", 'ePhoto'); ?></th>
		<td><input size="80" type="text" name="urlServer" value="<?php echo attribute_escape(stripslashes(get_option('ePhoto_urlServer'))); ?>" /></td>
    </tr><tr>
		<th scope="row" valign="top"><?php _e("@Images", 'ePhoto'); ?></th>
		<td><?php _e('@Taille daffichage des images moyennes', 'ePhoto'); ?> : <input size="20" type="text" name="bouton1_taille" value="<?php echo attribute_escape(stripslashes(get_option('ePhoto_bouton1_taille'))); ?>" /> <i><?php _e('@ex : 200, x200, vide=taille originale', 'ePhoto') ?></i><br>
            <?php _e('@Taille daffichage des grandes images', 'ePhoto'); ?> : <input size="20" type="text" name="bouton2_taille" value="<?php echo attribute_escape(stripslashes(get_option('ePhoto_bouton2_taille'))); ?>" /></td>
    </tr><tr>
		<th scope="row" valign="top"><?php _e("@Videos", 'ePhoto'); ?></th>
		<td><?php _e('@Taille daffichage', 'ePhoto'); ?> : <input size="20" type="text" name="bouton3_taille" value="<?php echo attribute_escape(stripslashes(get_option('ePhoto_bouton3_taille'))); ?>" /></td>
    </tr><tr>
		<th scope="row" valign="top"><?php _e("@Fichiers Adobe Flash", 'ePhoto'); ?></th>
		<td><?php _e('@Taille daffichage', 'ePhoto'); ?> : <input size="20" type="text" name="bouton4_taille" value="<?php echo attribute_escape(stripslashes(get_option('ePhoto_bouton4_taille'))); ?>" /></td>
    </tr><tr>    
		<th scope="row" valign="top"><?php _e("@Documents bureautique", 'ePhoto'); ?></th>
		<td><?php _e('@Taille daffichage', 'ePhoto'); ?> : <input size="20" type="text" name="bouton5_taille" value="<?php echo attribute_escape(stripslashes(get_option('ePhoto_bouton5_taille'))); ?>" /></td>
    </tr><tr>                    
		<td>&nbsp;</td>
		<td>
          <span class="submit"><input name="save" value="<?php _e('@Enregistrer les changements', 'ePhoto'); ?>" type="submit" /></span>
          <span class="submit"><input name="restore" value="<?php _e('@Restaure la configuration par defaut', 'ePhoto'); ?>" type="submit"/></span>
        </td>
	</tr>    
</table>
</div>
</form>
<?php
}

// init process for button control
add_filter('init', 'ePhoto_init_locale');
add_action('init', 'ePhoto_addbuttons');
add_action('admin_menu', 'ePhoto_menu');
?>