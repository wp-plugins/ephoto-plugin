/**
 * $Id: editor_plugin.js 2010-01-01 $
 * Version modifié pour WordPress
 *
 * @author Einden Studio
 * @copyright Copyright © 2010, Einden Studio, All rights reserved.
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
				return /^(mceePhoto)$/.test(n.className);
			};			
			
            // Ajout de la commande "mceePhoto"
			ed.addCommand('mceePhoto', function() {					
			   tinymce.ePhoto.ed=ed;
			   tinymce.ePhoto.url=url;
			   
			   eval('var param={'+ed.getParam('ePhoto')+'};');   // <<< Modification spécifique à WordPress !
			   if(typeof param=='object') { tinymce.ePhoto.param=param; }
			   
			   tinymce.ePhoto.execute();
			});

			// Enregistre le bouton
			ed.addButton('ePhoto', {
				title : 'ePhoto.desc',
				cmd : 'mceePhoto',
				image : url + '/img/ePhoto.gif'
			});

			// Add a node change handler, selects the button in the UI when a image is selected
			ed.onNodeChange.add(function(ed, cm, n) {
				cm.setActive('ePhoto', n.nodeName == 'IMG' && isMediaElm(n));
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
				author : 'Einden Studio / Arnaud Bour',
				authorurl : 'http://www.ephoto.fr/',
				infourl : 'http://sourceforge.net/users/einden',
				version : "1.2"
			};
		}
	}); 

	// Register plugin
	tinymce.PluginManager.add('ePhoto', tinymce.plugins.ePhotoPlugin);

    // Coprs du plugin ePhoto
    tinymce.ePhoto = {
		
		// Instance de TinyMCE
		ed : null,
		
		// URL Absolu du plugin
		url : null,
		
		// ePhoto param
		param: null,
		
		// API Connector
		connect: null,
		
		// Initialize the Plugin / API ePhoto ////////////////
		execute : function()
        {
           if(!document.getElementsByTagName || !document.createElement) { alert(this.ed.getLang('ePhoto.error')+' (code 1).'); return; }

           if(typeof ephoto=='function') this.init();
           else {
              var ApiEphoto = document.createElement('script');
              ApiEphoto.setAttribute('type', 'text/javascript');
      
	          this.onload('ephoto', this.init.tinymce_ePhotoBind(this));

              ApiEphoto.setAttribute('src', this.param.urlServer+'api/apiJS.js');  
    
              DomBody = document.getElementsByTagName('HEAD')[0];
              if(DomBody) { DomBody.appendChild(ApiEphoto); }
              else        { alert(this.ed.getLang+' (code 2).'); return; }
	  
	          delete ApiEphoto;
		   }
	    },
		
        // Wait Load ///////////////////////////////////////
        onload : function(look_for, callback)
		{
		   var interval = setInterval(
	          function() {  if (eval("typeof " + look_for) != 'undefined') { clearInterval(interval); callback(); }  
           }, 50);
		},
		
		// Execute API ePhoto ///////////////////////////////
		init : function()
		{
           this.connect = new ephoto({ baseUrl:this.param.urlServer,
                                       onComplete:'tinymce.ePhoto.download' });

           this.connect.importImage(this.param.buttons);

           this.connect.execute(); 	
		},
		
		// Download a selected file ////////////////////////////////////
		download : function(fileID)
		{
           this.connect=null;

           this.sendAndLoad(this.url + '/' + this.param.serverScript,
					        'fileID='+fileID+
							'&urlServer='+encodeURIComponent(this.param.urlServer)+
							'&uploadDir='+encodeURIComponent(this.param.uploadDir),  // << Spécifique à WordPress
                            this.completed.tinymce_ePhotoBind(this),
					        'get', true, 'xml'); 	
		},
		
		// Verif and complete the download /////////////////////////////
		completed : function(resultat)
		{
           this.codeError=parseInt(this.nodeVal(resultat, 'codeError'), 10);
           this.urlFile=this.nodeVal(resultat, 'urlFile');
           this.baseName=this.nodeVal(resultat, 'baseName');
           this.title=this.nodeVal(resultat, 'title');
           this.alt=this.nodeVal(resultat, 'alt');
   
           switch(this.codeError)
           {
              case 13:   // No image selected 
		         alert(this.ed.getLang('ePhoto.noselected'));
		         break;

	          case 17:   // Selected image
                 this.oImageOriginal = document.createElement('IMG');
		         if(tinymce.isIE) { this.oImageOriginal.onreadystatechange = this.insert.tinymce_ePhotoBind(this); }
				 else { this.oImageOriginal.onload = this.insert.tinymce_ePhotoBind(this); }

		         this.oImageOriginal.src=this.urlFile;
		         break;
	
	          default:   // Other error code
                 alert(this.ed.getLang('ePhoto.error')+' ('+this.codeError+')');      
           }	
		},
		
		// Insert a downloaded file ////////////////////////////////////
		insert : function()
		{
		   var elmHtml='<img src="'+this.urlFile+'" '+
		               ' class="mceePhoto" '+
		               ' alt="'+this.alt+'" '+
					   ' title="'+this.title+'" '+
					   ' width="'+this.oImageOriginal.width+'" '+
					   ' height="'+this.oImageOriginal.height+'" />';

		   this.ed.execCommand('mceInsertContent', false, elmHtml);

           // Empty buffer
           delete oImageOriginal;    
           delete oImage;
		},
		
		// My AJAX Method ///////////////////////////////////////////////
		sendAndLoad : function(Url, datas, callBack, httpMode, asynchro, format)
		{
           var conn = false;
	
           if(!httpMode) { httpMode='get'; }
           if(asynchro==null) { asynchro=true; }
           if(!format)   { format='txt'; }
		
           try { conn = new XMLHttpRequest(); }
           catch (error) {
              try { conn = new ActiveXObject("Msxml2.XMLHTTP"); }
              catch (error1) {
		         try { conn = new ActiveXObject("Microsoft.XMLHTTP"); }
		         catch (error2) { conn = false; }
              }
           }
		
           if (!conn) return false;

           conn.onreadystatechange = function()
           {
              if (conn.readyState == 4 && conn.status == 200)
              {
		        // if(format=='xml') alert(conn.responseText);
		         callBack((format=='txt')?conn.responseText:conn.responseXML);
		         return;
              }
           };
		
           switch(httpMode)
           {
              case "get":
		         try {
			        Url = (datas.length > 0) ? Url + "?" + datas + '&' + new Date().getTime() : Url + "?" + new Date().getTime();
			        conn.open("GET", Url, asynchro);
			        conn.send(null);
		         }
		         catch(error3) { return false; }		
		         break;
				
              case "post":
		         try {
			        conn.open("POST", Url, asynchro); 
			        conn.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			        conn.send(datas);
		         }
		         catch(error4) { return false; }
		         break;
				
              default :
		         return false;
           }
		
           return true;	
		},
		
		// get XML node /////////////////////////////////////////////////
		nodeVal : function(xml, node)
		{
           if(xml==null) { alert(FCKLang.ePhotoError+' (code 3 - '+node+')'); return ''; }
  
           xml=xml.getElementsByTagName(node)[0];
           if(typeof xml!='object') { alert(FCKLang.ePhotoError+' (code 4 - '+node+')'); return ''; }
  
           var data=(xml.firstChild!=null)?xml.firstChild.nodeValue:xml.nodeValue;
  
           return data?data:'';
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