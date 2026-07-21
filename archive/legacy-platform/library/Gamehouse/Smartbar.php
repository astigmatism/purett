<?php
class Gamehouse_Smartbar {

    public $db; //not how db connections should be use, but for demo purposes atm
    public $id;
    public $name;
    public $length;
    
    function __construct() 
    {
        $config = array(
            'host'     => 'localhost',
            'username' => 'root',
            'password' => 'Arcade@8',
            'dbname'   => 'smartbars',
        );
        $this->db = Zend_Db::factory('PDO_MYSQL', $config);
        
        $a = func_get_args(); 
        $i = func_num_args(); 
        if (method_exists($this,$f='__construct'.$i)) { 
            call_user_func_array(array($this,$f),$a); 
        } 
    } 
    
    function __construct1($id) {
        
        if (is_numeric($id)) {
            $this->setId($id); 
        } else {
            $this->setName($id);
        }
    }
    
    public function getManifest() {
        
        $components = array();
        
        if (@isset($this->id)) {
            $sQuery = "
                SELECT SQL_CALC_FOUND_ROWS smartbarcomponents.idcomponents, components.width, components.type, smartbarcomponents.idsmartbarcomponents
                FROM smartbarcomponents
                INNER JOIN components ON components.idComponents = smartbarcomponents.idcomponents
                WHERE idsmartbars = ".$this->id;
                
            $components = $this->db->fetchAll($sQuery);
    
            //get attributes
            for($i = 0; $i < count($components); $i++) {
                $sQuery = "
                    SELECT componentattributes.idcomponentattributes, attributes.name, componentattributes.idattribute, componentattributes.value
                    FROM componentattributes
                    INNER JOIN attributes ON attributes.idattributes = componentattributes.idattribute
                    WHERE idsmartbarcomponent = ".$components[$i]['idsmartbarcomponents'];
                
                $attributes = $this->db->fetchAll($sQuery);
                $components[$i]['attributes'] = $attributes;
            }
        } else {
            return null;
        }
        return array(
            'id' => $this->id,
            'name' => $this->name,
            'length' => $this->length,
            'components' => $components
        );
    }
    
    public function getAllAttributes() {
        $query = "
            SELECT SQL_CALC_FOUND_ROWS idattributes, name, description
            FROM attributes";
        return $this->db->fetchAll($query);
    }
    
    public function setId($id) {
        if (@isset($id)) {
            $query = "
                SELECT SQL_CALC_FOUND_ROWS idSmartbars, name, length
                FROM smartbars
                WHERE idSmartbars=".$id;
            $smartbar = $this->db->fetchRow($query);
            $this->name = $smartbar['name'];
            $this->length = $smartbar['length'];
            $this->id = $smartbar['idSmartbars'];
        }
    }
    
    public function setName($name) {
        if (@isset($name)) {
            $query = "
                SELECT SQL_CALC_FOUND_ROWS idSmartbars, name, length
                FROM smartbars
                WHERE name='".$name."'";
            $smartbar = $this->db->fetchRow($query);
            $this->name = $smartbar['name'];
            $this->length = $smartbar['length'];
            $this->id = $smartbar['idSmartbars'];
        }
    }
    
    public function duplicate() {
        if (@isset($this->id)) {
            $data = $this->getManifest();
            $this->createSmartbar();
            $this->setSmartbar($data['name'].'Copy',$data['length']);
            $this->insertSmartbarComponents($data['components']);
        }
    }
    
    public function getSmartbars() {
        $query = "
            SELECT SQL_CALC_FOUND_ROWS idSmartbars, name
            FROM smartbars";
        $smartbars = $this->db->fetchAll($query);
        for($i = 0; $i < count($smartbars); $i++) {
            $this->setId($smartbars[$i]['idSmartbars']);
            $smartbars[$i]['components'] = $this->getManifest();
        }
        return $smartbars;
    }
    
    public function deleteSmartbarComponents() {
        if (@isset($this->id)) {
            $this->db->delete('smartbarcomponents', 'idsmartbars = '.$this->id);
        }
    }
    
    public function insertSmartbarComponents($data) {
        if (@isset($this->id)) {
            foreach($data as $d) {
                $this->db->insert('smartbarcomponents', array(
                    'idsmartbars'        => $this->id,
                    'idcomponents'         => $d['idcomponents']
                ));
                //attributes
                $newId = $this->db->fetchRow('SELECT MAX(idsmartbarcomponents) FROM smartbarcomponents');
                foreach($d['attributes'] as $attribute) {
                    $this->db->insert('componentattributes', array(
                        'idsmartbarcomponent'   => $newId['MAX(idsmartbarcomponents)'],
                        'idattribute'           => $attribute['idattribute'],
                        'value'                 => $attribute['value']
                    ));
                }
            }
        }
    }
    
    public function createSmartbar() {
        $this->db->insert('smartbars', array(
        ));
        $newId = $this->db->fetchRow('SELECT MAX(idsmartbars) FROM smartbars');
        $this->id = $newId['MAX(idsmartbars)'];
        return $this->id;
    }
    
    public function setSmartbar($name, $length) {
        if (@isset($this->id)) {
            if (!is_numeric($length)) {
                $length = 0;
            }
            $data = array(
                'name'      => $name,
                'length'    => $length
            );
            
            $this->db->update('Smartbars', $data, 'idsmartbars = '.$this->id);
        }
    }
    
    public function deleteSmartbar() {
        if (@isset($this->id)) {
            $where = array('idSmartbars = ?' => $this->id);
            $this->db->delete('Smartbars', $where);
        }
    }
    
    public function uploadComponent($files, $request) {
        
        $tempFile = $files['Filedata']['tmp_name'];
        $fileTypes  = str_replace('*.','',$request['fileext']);
        $fileTypes  = str_replace(';','|',$fileTypes);
        $typesArray = split('\|',$fileTypes);
        $fileParts  = pathinfo($files['Filedata']['name']);
        
        if (in_array($fileParts['extension'], $typesArray)) {
            // Uncomment the following line if you want to make the directory if it doesn't exist
            // mkdir(str_replace('//','/',$targetPath), 0755, true);
            
            list($width, $height) = getimagesize($tempFile);
            $filename = substr($fileParts['basename'], 0, strlen($fileParts['basename']) - strlen($fileParts['extension']) - 1);
            
            //db insert
            $data = array(
                'height'        => $height,
                'width'         => $width,
                'type'          => $fileParts['extension']
            );
            $this->db->insert('Components', $data);
            
            $newId = $this->db->fetchRow('SELECT MAX(idComponents) FROM Components');
            $newId = $newId["MAX(idComponents)"];
            
            $targetPath = $_SERVER['DOCUMENT_ROOT'] . $request['folder'] . '/';
            $targetFile =  str_replace('//','/',$targetPath) . $newId.'.'.$fileParts['extension'];
            
            move_uploaded_file($tempFile,$targetFile);
            echo str_replace($_SERVER['DOCUMENT_ROOT'],'',$targetFile);
        } else {
            echo 'Invalid file type.';
        }
    }
    
    public function deleteComponent($id) {
        
        //remove from db
        $where = array('idComponents = ?' => $id);
        $this->db->delete('Components', $where);

        //remove from file system
        //at the moments lets not remove from the file system since this would affect live smartbars. since all new components are saved with the incremented id old files will always be safe.
        /*
        if ($handle = opendir($_SERVER['DOCUMENT_ROOT'].'/images/smartbar')) {
        
            while (false !== ($file = readdir($handle))) {
                $fileParts  = pathinfo($file);
                $filename = substr($fileParts['basename'], 0, strlen($fileParts['basename']) - strlen($fileParts['extension']) - 1);
                if ($filename == $id) {
                    unlink($_SERVER['DOCUMENT_ROOT'].'/images/smartbar/'.$fileParts['basename']);
                }
            }
            closedir($handle);
        }
        */
    }
    
    public function login($username, $password) {

        $query = "
            SELECT SQL_CALC_FOUND_ROWS idusers, username, role
            FROM users
            WHERE username=\"".$username."\" AND password=\"".$this->hashPassword($password)."\"";
        $user = $this->db->fetchRow($query);
        //return $this->hashPassword($password); //cheat to see hashed pass
        if (isset($user)) {
            return $user;
        } else {
            return null;
        }
    }
    
    public function hashPassword($password) {
        $salt = md5($password."%*4!#$;\.k~'(_@"); 
        return md5("$salt$password$salt");
    }
    
    //datatables helpers:
    
    public function datatablesComponents($request) {
        
        function fnColumnToField($i)
        {
            if ( $i == 0 )
                return "idComponents";
            else if ( $i == 1 )
                return "height";
            else if ( $i == 2 )
                return "width";
            else if ( $i == 3 )
                return "type";
        }
        
        /* Paging */
        $sLimit = "";
        if (@isset( $request['iDisplayStart'] ) )
        {
            $sLimit = "LIMIT ".$request['iDisplayStart'].", ".$request['iDisplayLength'];
        }
        
        /* Ordering */
        if (@isset( $request['iSortCol_0'] ) )
        {
            $sOrder = "ORDER BY ";
            for ( $i=0 ; $i<$request['iSortingCols']; $i++ )
            {
                $sOrder .= fnColumnToField($request['iSortCol_'.$i])." ".$request['sSortDir_'.$i].", ";
            }
            $sOrder = substr_replace( $sOrder, "", -2 );
        }
        
        /* Filtering - NOTE this does not match the built-in DataTables filtering which does it
        * word by word on any field. It's possible to do here, but concerned about efficiency
        * on very large tables, and MySQL's regex functionality is very limited
        */
        $sWhere = "";
        if (@$request['sSearch'] != "" )
        {
            $sWhere = "WHERE type LIKE '%".$request['sSearch']."%' OR ".
            "idComponents LIKE '%".$request['sSearch']."%' OR ".
            "width LIKE '%".$request['sSearch']."%' OR ".
            "height LIKE '%".$request['sSearch']."%' OR ".
            "type LIKE '%".$request['sSearch']."%'";
        }
        
        $sQuery = "
            SELECT SQL_CALC_FOUND_ROWS idComponents, height, width, type
            FROM components
            $sWhere
            $sOrder
            $sLimit
            ";
            
        $rResult = $this->db->fetchAll($sQuery);
        //$rResult = mysql_query( $sQuery, $gaSql['link'] ) or die(mysql_error());
        
        $sQuery = "SELECT FOUND_ROWS()";
        
        $rResultFilterTotal = $this->db->fetchAll($sQuery);
        $iFilteredTotal = $rResultFilterTotal[0]["FOUND_ROWS()"];
        
        $sQuery = "
            SELECT COUNT(idComponents)
            FROM components
            ";
        $rResultTotal = $this->db->fetchAll($sQuery);
        $iTotal = $rResultTotal[0]["COUNT(idComponents)"];
        
        $sOutput = '{';
        $sOutput .= '"sEcho": '.intval($request['sEcho']).', ';
        $sOutput .= '"iTotalRecords": '.$iTotal.', ';
        $sOutput .= '"iTotalDisplayRecords": '.$iFilteredTotal.', ';
        $sOutput .= '"aaData": [ ';
        foreach($rResult as $result)
        {
            $sOutput .= "[";
            $sOutput .= ''.$result['idComponents'].',';
            $sOutput .= ''.$result['height'].',';
            $sOutput .= ''.$result['width'].',';
            $sOutput .= '"'.$result['type'].'",';
            $sOutput .= '""';
            $sOutput .= "],";
        }
        $sOutput = substr_replace( $sOutput, "", -1 );
        $sOutput .= "] }";
        
        return $sOutput;
    }
}
?>