<?php
class Real_Controller_Action extends Zend_Controller_Action {
    
    /**
     * init()
     *
     * This is the first method that gets invoked by the dispatch process.
     * Use this methods to set up instance variables that need to be shared
     * among all action methods.
     */
    public function init()
    {
        parent::init();
    }
    /**
     * _setLayout()
     *
     * Sets the layout path and name, and then loads the page specific css
     * link and js link, via HeadLink helper
     *
     * @param  $layoutName
     */
    protected function _setLayout($layoutName) {
        // First, let's find out about which script is running.
        $moduleName     = $this->_getParam('module');
        $controllerName = $this->_getParam('controller');
        $actionName     = $this->_getParam('action');
        $publicPath     = realpath(APPLICATION_PATH . '/../public');

        // Set the layout we will be using
        $this->_helper->layout->setLayout($layoutName);
        $layoutView = $this->_helper->layout->getView();
        
        // Dynamically specify css files. First, some base paths.
        $cssRoot    = "$publicPath/css";
        $cssWebRoot = "/css";
        
        // Dynamically load module-level css
        if (file_exists("$cssRoot/$moduleName.css")) {
            $layoutView->headLink()->appendStylesheet("$cssWebRoot/$moduleName.css");
        }

        // Dynamically load controller-level css
        if (file_exists("$cssRoot/$moduleName/$controllerName.css")) {
            $layoutView->headLink()->appendStylesheet("$cssWebRoot/$moduleName/$controllerName.css");
        }

        // Dynamically load action-level css
        if (file_exists("$cssRoot/$moduleName/$controllerName/$actionName.css")) {
            $layoutView->headLink()->appendStylesheet("$cssWebRoot/$moduleName/$controllerName/$actionName.css");
        }
        
        // Dynamically specify css files. First, some base paths.
        $jsRoot           = "$publicPath/js";
        $jsWebRoot        = "/js";

        // Dynamically load module-level js
        if (file_exists("$jsRoot/$moduleName.js")) {
            $layoutView->headScript()->appendFile("$jsWebRoot/$moduleName.js");
        }

        // Dynamically load controller-level js
        if (file_exists("$jsRoot/$moduleName/$controllerName.js")) {
            $layoutView->headScript()->appendFile("$jsWebRoot/$moduleName/$controllerName.js");
        }

        // Dynamically load action-level js
        if (file_exists("$jsRoot/$moduleName/$controllerName/$actionName.js")) {
            $layoutView->headScript()->appendFile("$jsWebRoot/$moduleName/$controllerName/$actionName.js");
        }
        
        //jQuery UI
        $theme = "smoothness";
        $layoutView->headLink()->appendStylesheet("$cssWebRoot/$theme/jquery-ui-1.8.7.custom.css");
    }
    
    /**
     * _jsonRespond()
     *
     * Disable layout, and finish the execution flow by simply echoing jsonized params.
     */
    protected function _jsonRespond($params) {
        $this->_helper->layout->disableLayout();
        echo json_encode($params);
        exit;
    }
}
?>