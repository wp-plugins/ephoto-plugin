<?php
   // Verif param
   if(!$_GET['urlServer'] || !$_GET['fileID'] || !$_GET['uploadDir']) returnMessage(10);
   
   // Init Config
   $urlDecoup=parse_url($_GET['uploadDir']);
   
   $Config=array();
   $Config['UserFilesAbsolutePath']=$_SERVER['DOCUMENT_ROOT'].$urlDecoup['path'].'/';
   $Config['UserFilesPath']=$_GET['uploadDir'].'/'; 
   
   // Verif config
   if(!is_writable($Config['UserFilesAbsolutePath'])) returnMessage(11);   

   // Loading Image
   if(function_exists('file_get_contents')): // PHP 4.3 et sup.
	  $data=file_get_contents($_GET['urlServer'].'api/api.php?type=getData&fileID='.$_GET['fileID']); 
	   
   else:                                     // Avant PHP 4.3
      $handle = fopen($_GET['urlServer'].'api/api.php?type=getData&fileID='.$_GET['fileID'], 'rb');
      $data = '';
   
      while (!feof($handle)) { $data .= fread($handle, 8192); }
      fclose($handle);
   endif;
   
   // No image recovered
   if(!strlen($data) || $data=='fileDoesNotExist') returnMessage(13);
   
   // Loading XML DublinCore
   $file=$_GET['urlServer'].'api/api.php?type=getDCore&fileID='.$_GET['fileID'];
   
   if(function_exists('simplexml_load_file')):  // PHP 5 et sup.
      $itemDCore=simplexml_load_file($file,
							         'SimpleXMLElement', LIBXML_NOCDATA,
							         'http://www.w3.org/1999/02/22-rdf-syntax-ns#');

	  $item=(array) $itemDCore->Description->children('http://purl.org/dc/elements/1.1/');
  
   else:                                        // PHP 4.2 min.
      $xml=domxml_open_file($file);

      $root = $xml->document_element();
      $xmlNodes = $root->get_elements_by_tagname('Description'); 
      $dcNodes = $xmlNodes[0]->child_nodes();
  
      $item=array();
  
      foreach($dcNodes as $dcNode)
	    if($dcNode->node_name()!='#text')
	       $item[$dcNode->node_name()]=$dcNode->get_content();
   endif;

   // Prepare les données
   $file=tempnam($Config['UserFilesAbsolutePath'], 'ePhoto_');
   if(!strlen($file)) returnMessage(14);
   unlink($file);
   $file.='.'.$item['format'];

   // Saving the image
   if(file_exists($file)) if(!unlink($file)) returnMessage(15);

   $handle = fopen($file, 'w+');
   if($handle===false) returnMessage(16);
   
   fwrite($handle, $data);
   fclose($handle);
   
   $description_abstract=isset($item['description.abstract'])?$item['description.abstract']:NULL;
   $subject=isset($item['subject'])?$item['subject']:NULL;
   $title=isset($item['title'])?$item['title']:NULL;
   $title_alternative=isset($item['title.alternative'])?$item['title.alternative']:NULL;

   returnMessage(17, basename($file),
				 ($description_abstract?$description_abstract:($subject?$subject:$title)),
				 $title_alternative?$title_alternative:$title );

   // Return message generic
   function returnMessage($codeError, $baseName='', $alt='', $title='')
   {
	  global $Config;
	  
	  header('Content-Type: text/xml');
	  
	  exit('<?xml version="1.0" ?><data>'.
	       '<codeError>'.$codeError.'</codeError>'.
		   '<urlFile>'.$Config['UserFilesPath'].$baseName.'</urlFile>'.
		   '<baseName>'.$baseName.'</baseName>'.
		   '<title>'.$title.'</title>'.
		   '<alt>'.$alt.'</alt>'.
		   '</data>');
   }
?> 