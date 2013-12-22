/**
 * $Id: editor_plugin.js 2013-12-21 $
 *
 * @author Einden Studio
 * @copyright Copyright © 2013, Einden Studio, All rights reserved.
 */

(function() {
	// Charge le fichier langue
	tinymce.PluginManager.requireLangPack('ePhoto');
	
	tinymce.create('tinymce.plugins.ePhotoPlugin', {
		/**
		 * Initialise le plugin
		 *
		 * @param {tinymce.Editor} ed L'instance de l'éditor
		 * @param {string} url URL Absolu du plugin		 
		 */
		init : function(ed, url) {
			
			// Fonction pour filtrer l'élément de type "mceePhoto"
			function isMediaElm(n) {
			   return /^(mceItemEphoto)$/.test(n.className);
			};
			
			// Attrape un attribut HTML dans une chaine
			function getAttr(s, n) {
		       n = new RegExp(n + '=\"([^\"]+)\"', 'g').exec(s);

		       return n ? ed.dom.decode(n[1]) : '';
            };

            // Ajout de la commande "mceePhoto"
			ed.addCommand('mceePhoto', function() {					
			   tinymce.ePhoto.ed=ed;
			   tinymce.ePhoto.url=url;
			   tinymce.ePhoto.param=ed.getParam('ePhoto');
			   
			   tinymce.ePhoto.execute();
			});

			// Enregistre le bouton
			ed.addButton('ePhoto', {
				title : 'ePhoto.desc',
				cmd : 'mceePhoto',
				image : url + '/img/ePhoto.gif'
			});

			// Active le bouton sur certaine condition de sélection
			ed.onNodeChange.add(function(ed, cm, n) {
				cm.setActive('ePhoto', n.nodeName == 'IMG' && isMediaElm(n));
			});
			
			// Reconstruction juste avant l'édition
			ed.onBeforeSetContent.add(function(ed, o)
			{
				o.content = o.content.replace(/<(iframe|img)[^>]+>/gi, function(im)
				{
				   var cl = getAttr(im, 'class');
				   
				   if (/^(itemEphoto)$/.test(cl))
				   {
					  var src=getAttr(im, 'src')
					  var width=getAttr(im, 'width');
					  var height=getAttr(im, 'height');
					  var img=tinymce.ePhoto.isImgElm(im);
					   
				      im=tinymce.ePhoto.makeMceItemEphoto(url, src, width, height, img);
				   }
				   
				   return im;
				}); 
			});
			
			// Parsing à la validation
			ed.onPostProcess.add(function(ed, o)
			{
				o.content = o.content.replace(/<img[^>]+>/g, function(im)
				{						  
					var data = getAttr(im, 'data-mce-ephoto');

					//if (/^(mceItemEphoto)$/.test(cl))
					if(data.length)
					{
						var at = tinymce.util.JSON.parse( '{'+data+'}' );
					    at.width=getAttr(im, 'width');
					    at.height=getAttr(im, 'height');

						im = tinymce.ePhoto.makeItemEphoto(at.url, at.width, at.height, (at.image==='1'));																						
					}

					return im;
				});
			});									
		},	

		/**
		 * Inutilisé
		 */
		createControl : function(n, cm) {
			return null;
		},

		/**
		 * A propos du plugin
		 *
		 * @return {Object} Name/value array containing information about the plugin.
		 */
		getInfo : function() {
			return {
				longname : 'ePhoto plugin',
				author : 'Einden Studio',
				authorurl : 'http://www.ephoto.fr/',
				infourl : 'http://sourceforge.net/users/einden',
				version : '2.0.4'
			};
		}
	}); 

	// Register plugin
	tinymce.PluginManager.add('ePhoto', tinymce.plugins.ePhotoPlugin);

    // Corps du plugin ePhoto
    tinymce.ePhoto = {
		
		// Instance de TinyMCE
		ed : null,
		
		// URL Absolu du plugin
		url : null, 
		
		// ePhoto param
		param: null,
		
		// API Connector
		instance: null,
		
		// Initialize the Plugin / API ePhoto ////////////////
		execute : function() {
           if(!document.getElementsByTagName || !document.createElement) { alert(this.ed.getLang('ePhoto.error')+' (code 1).'); return; }

           if(typeof ePhoto=='function') this.init();
           else {
              var ApiEphoto = document.createElement('script');
              ApiEphoto.setAttribute('type', 'text/javascript');
      
	          this.onload('ePhoto', this.init.tinymce_ePhotoBind(this));

              ApiEphoto.setAttribute('src', this.param.server+'api/apiJS.js');  
    
              DomBody = document.getElementsByTagName('HEAD')[0];
              if(DomBody) { DomBody.appendChild(ApiEphoto); }
              else        { alert(this.ed.getLang('ePhoto.error')+' (code 2).'); return; }
	  
	          delete ApiEphoto;
		   }
	    },
		
        // Wait Load ///////////////////////////////////////
        onload : function(look_for, callback) {
		   var interval = setInterval(
	          function() {  if (eval("typeof " + look_for) !== 'undefined') { clearInterval(interval); callback(); }  
           }, 50);
		},
		
		// Execute API ePhoto ///////////////////////////////
		init : function() {
		   this.instance = new ePhoto({ server: this.param.server,
									    authID: this.getCookie('tinymce_ephoto_authid'),
									    onConnect: 'tinymce.ePhoto.connected',
										client: this.param.client?this.param.client:'0SpHxTT2' });

		   this.instance.connect();
		   
		   if(this.param.buttons.image)  { this.instance.File.setButtons( this.instance.IMAGE_FILES, this.param.buttons.image ); }
		   if(this.param.buttons.movie)  { this.instance.File.setButtons( this.instance.MOVIE_FILES, this.param.buttons.movie ); }
		   if(this.param.buttons.flash)  { this.instance.File.setButtons( this.instance.FLASH_FILES, this.param.buttons.flash ); }
		   if(this.param.buttons.office) { this.instance.File.setButtons( this.instance.DOCUMENT_FILES, this.param.buttons.office ); } 		   
		   
		   this.instance.File.get( {mode:'embed', onFileReceived:'tinymce.ePhoto.insertFile'} );
		},
		
		// Save authID //////////////////////////////////////////////
		connected: function() {
		   this.setCookie( 'tinymce_ephoto_authid', this.instance.getAuthID() );
		},
		
		// Insert file /////////////////////////////////////////////
		insertFile : function(result) {
           if(result==='failure') { return; }
		   if(result==='fileDoesNotExist') { alert(this.ed.getLang('ePhoto.noselected')); return; }

		   var src=this.getAttr(result, 'src');
		   var width=this.getAttr(result, 'width');
		   var height=this.getAttr(result, 'height'); 
		   var img=this.isImgElm(result);

		   var elmHtml=this.makeMceItemEphoto(this.url, src, width, height, img);
			
		   this.ed.execCommand('mceInsertContent', false, elmHtml);
		},
		
		// Construit le bloc HTML pour l'édition
		makeMceItemEphoto: function(url_plugin, url_file, width, height, img) {
			
		   var data="'url':'"+url_file+"','image':'"+(img?'1':'0')+"'";
		   	
		   return '<img src="'+(img?url_file+'" ':url_plugin+'/img/trans.gif" style="border:1px dotted #144156;background-position:center;background-repeat:no-repeat;background-color:#D2E5EE;background-image:url('+url_plugin+'/img/ePhoto.png)" ')+
		          'class="mceItemEphoto" '+
				  'data-mce-ephoto="'+data+'" '+					   
				  (width?'width="'+width+'" ':'')+
				  (height?'height="'+height+'" ':'')+'/>';
		},
		
		// Construit le bloc HTML pour la consultation
		makeItemEphoto: function(url_file, width, height, img) {

		   return (img?'<img src="'+url_file+'" ':'<iframe src="'+url_file+'" ')+
		          'class="itemEphoto" '+
				  (width?'width="'+width+'" ':'')+
				  (height?'height="'+height+'" ':'')+
				  (img?'>':'frameborder="0" scrolling="no"></iframe>');	
		},
		
		// Sauvegarde une variable dans le cookie  
		setCookie: function(name, value, expires, path, domain, secure) {
		   var curCookie=name + "=" + escape(value) +
				((expires) ? "; expires=" + expires.toGMTString() : "") +
				((path) ? "; path=" + path : "") +
				((domain) ? "; domain=" + domain : "") +
				((secure) ? "; secure" : "");
			
		   document.cookie= curCookie;	
		},
	  
		// Retourne la valeur d'un variale stocké dans le cookie 
		getCookie: function(name) {
		   var dc=document.cookie;
		   var prefix = name + "=";
		   var begin=dc.indexOf("; "+ prefix);
		   if(begin===-1)
		   {
			   begin=dc.indexOf(prefix);   
			   if(begin!==0) { return null; }
		   } else {
			   begin+=2;   
		   }
		   var end=document.cookie.indexOf(";", begin);
		   if(end===-1) { end=dc.length; }
		   var value=unescape(dc.substring(begin + prefix.length, end));
		 
		   return value;
		},
		
		// Attrape un attribut HTML dans une chaine
        getAttr: function(s, n) {
		   n = new RegExp(n + '=\"([^\"]+)\"', 'g').exec(s);

		   return n ? this.ed.dom.decode(n[1]) : '';
        },
		
		// S'agit il d'une image ?
		isImgElm: function(n) {
		   return /img/i.test(n);
		}				
	};
	
})();

// My Bind Method /////////////////////////////////////////
Function.prototype.tinymce_ePhotoBind = function()
{
   var m = this;
  
   var instance = Array.prototype.shift.call(arguments);
  
   return function() { return m.apply(instance, arguments); };
};