<?php
require_once 'Facebook/facebook.php';
class UninstallController extends Zend_Controller_Action
{
    /*
    
    NOTE: DEPRICATED! we keep user details for game replay's and purchases
    
    
    */
    //this controller is hit by facebook when a user deauth's the app. sends the userid as $_POST['signed_request']
    
    public function init()
    {
        parent::init();
    }

    public function indexAction()
    {
        if (@isset($_REQUEST['signed_request'])) {
            
            $config = new Zend_Config_Ini(APPLICATION_PATH.'/configs/game.ini');
            
            // Create our Application instance.
            $facebook = new Facebook(array(
                'appId' => $config->appId,
                'secret' => $config->apiSecret,
                'cookie' => true
            ));
            
            $db = new PureTripleTriad_Database();
            $sr = $facebook->getSignedRequest();
            $userid = $sr['user_id'];
            $game = $db->getGame($userid);
            if ($game) {
                $db->deleteGame($game['idgames']);
            }
            
            //delete user
            $db->removeUser($userid);
            
            //delete game history
            $this->deleteAll(GAMEHISTORY_PATH.'/'.$userid.'/');
            
            die();
        }
        die('signed_request not present');
    }
    
    private function deleteAll($dirname) {
        
        // Sanity check
        if (!file_exists($dirname)) {
        return false;
        }
        
        // Simple delete for a file
        if (is_file($dirname)) {
        return unlink($dirname);
        }
        
        // Loop through the folder
        $dir = dir($dirname);
        while (false !== $entry = $dir->read()) {
        // Skip pointers
        if ($entry == '.' || $entry == '..') {
        continue;
        }
        
        // Recurse
        $this->deleteAll("$dirname/$entry");
        }
        
        // Clean up
        $dir->close();
        return rmdir($dirname);
    }
}