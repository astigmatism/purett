<?php
class Real_Smartbar {

    public $db; //not how db connections should be use, but for demo purposes atm
    public $id;
    public $name;
    
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
        return $components;
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
                SELECT SQL_CALC_FOUND_ROWS idSmartbars, name
                FROM smartbars
                WHERE idSmartbars=".$id;
            $smartbar = $this->db->fetchRow($query);
            $this->name = $smartbar['name'];
            $this->id = $smartbar['idSmartbars'];
        }
    }
    
    public function setName($name) {
        if (@isset($name)) {
            $query = "
                SELECT SQL_CALC_FOUND_ROWS idSmartbars, name
                FROM smartbars
                WHERE name='".$name."'";
            $smartbar = $this->db->fetchRow($query);
            $this->name = $smartbar['name'];
            $this->id = $smartbar['idSmartbars'];
        }
    }
    
    public function duplicate() {
        if (@isset($this->id)) {
            $data = $this->getManifest();
            $newName = $this->name.'Copy';
            $this->createSmartbar();
            $this->setSmartbarName($newName);
            $this->insertSmartbarComponents($data);
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
    
    public function setSmartbarName($name) {
        if (@isset($this->id)) {
            $data = array(
                'name'      => $name
            );
            
            $this->db->update('Smartbars', $data, 'idsmartbars = '.$this->id);
        }
    }
    
    public function deleteSmartbar() {
        if (@isset($this->id)) {
            $where = array('idSmartbars = ?' => $_POST['id']);
            $this->db->delete('Smartbars', $where);
        }
    }
}
?>